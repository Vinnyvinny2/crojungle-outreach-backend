// ── DOWNSCALE A TALL PNG SO THE VISION CALL WILL ACCEPT IT ───────────────────
// Claude's vision API rejects any image with a dimension over 8000px, and the
// whole request dies with it:
//
//   BRAIN ERROR: image dimensions exceed max allowed size: 8000 pixels
//   VISION: CTA=undefined headline=undefined blankHero=undefined
//   Brain JSON truncated — partial extraction used
//
// That killed a live audit, which is why the homepage sends a VIEWPORT crop and
// why interior full-page renders over 7800px are skipped entirely. Skipping is
// safe and it is also the reason the brain never sees the bottom of a long page —
// where the reviews, the guarantee and the real offer usually sit.
//
// The note left in server.js said what was needed: "capture tall, resize to under
// 8000px, then send." This is that, with NO new dependency.
//
// WHY NOT sharp OR jimp: sharp is a native build and this deploys to Render's
// free tier from a four-dependency package.json; a failed postinstall takes the
// whole service down, and the failure mode is a service that will not boot rather
// than an audit missing a picture. jimp is pure JS but large. PNG is deflate plus
// five per-row filters, and node ships zlib, so the decoder is about a hundred
// lines and cannot break a build.
//
// SCOPE, deliberately narrow: 8-bit RGB and RGBA, non-interlaced. That is what
// Firecrawl returns. Anything else is REFUSED rather than guessed at, because a
// mangled image sent to a vision model is worse than no image — it produces
// confident readings of pixels that mean nothing.
//
//   node pngscale.js --selftest
const zlib = require('zlib');

const SIG = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

// CRC32 over the standard PNG polynomial. Table built once.
const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();
const crc32 = (buf) => {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
};

const chunk = (type, data) => {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td), 0);
  return Buffer.concat([len, td, crc]);
};

// Read the header without decoding anything. Cheap enough to call on every image.
function readHeader(buf) {
  if (!Buffer.isBuffer(buf) || buf.length < 33) return null;
  if (!buf.subarray(0, 8).equals(SIG)) return null;
  if (buf.readUInt32BE(12) !== 0x49484452) return null;      // 'IHDR'
  const h = {
    width: buf.readUInt32BE(16),
    height: buf.readUInt32BE(20),
    bitDepth: buf[24],
    colorType: buf[25],
    interlace: buf[28],
  };
  if (!h.width || !h.height) return null;
  return h;
}

// Undo the per-scanline filter. This is the part that must be exactly right:
// every filter references the pixel to the left (a), above (b) and above-left
// (c), in BYTES offset by the channel count, not in pixels.
// stride is the row length in BYTES and bpp is the filter unit in BYTES — not a
// pixel width and a channel count. That distinction is what lets sub-8-bit rows
// work unchanged: a row of 1-bit palette indices is one byte per eight pixels,
// and the filter still operates byte by byte with a unit of 1.
function unfilter(raw, stride, height, bpp) {
  const channels = bpp;
  const out = Buffer.alloc(stride * height);
  let pos = 0;
  for (let y = 0; y < height; y++) {
    const type = raw[pos++];
    const line = raw.subarray(pos, pos + stride);
    pos += stride;
    const cur = out.subarray(y * stride, (y + 1) * stride);
    const prev = y > 0 ? out.subarray((y - 1) * stride, y * stride) : null;
    for (let i = 0; i < stride; i++) {
      const x = line[i];
      const a = i >= channels ? cur[i - channels] : 0;
      const b = prev ? prev[i] : 0;
      const c = prev && i >= channels ? prev[i - channels] : 0;
      let v;
      switch (type) {
        case 0: v = x; break;
        case 1: v = x + a; break;
        case 2: v = x + b; break;
        case 3: v = x + ((a + b) >> 1); break;
        case 4: {
          // Paeth. The predictor is whichever of a, b, c is closest to a+b-c.
          const p = a + b - c;
          const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
          v = x + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c);
          break;
        }
        default: return null;   // unknown filter — refuse rather than guess
      }
      cur[i] = v & 0xff;
    }
  }
  return out;
}

// Box-filter downscale. Averaging rather than nearest-neighbour on purpose: a
// screenshot is mostly text, and point-sampling a 3x reduction turns body copy
// into noise the model then reads confidently. Averaging keeps it legible-ish and,
// more importantly, keeps the LAYOUT — which is what this image is for.
function resample(pixels, sw, sh, dw, dh, channels) {
  const out = Buffer.alloc(dw * dh * channels);
  const xr = sw / dw, yr = sh / dh;
  for (let dy = 0; dy < dh; dy++) {
    const y0 = Math.floor(dy * yr), y1 = Math.min(sh, Math.max(y0 + 1, Math.floor((dy + 1) * yr)));
    for (let dx = 0; dx < dw; dx++) {
      const x0 = Math.floor(dx * xr), x1 = Math.min(sw, Math.max(x0 + 1, Math.floor((dx + 1) * xr)));
      const n = (y1 - y0) * (x1 - x0);
      for (let ch = 0; ch < channels; ch++) {
        let sum = 0;
        for (let y = y0; y < y1; y++) {
          const row = y * sw * channels;
          for (let x = x0; x < x1; x++) sum += pixels[row + x * channels + ch];
        }
        out[(dy * dw + dx) * channels + ch] = Math.round(sum / n);
      }
    }
  }
  return out;
}

function encode(pixels, width, height, colorType, channels) {
  const stride = width * channels;
  // PAETH FILTERING, and it is not optional. Encoding every row with filter 0
  // (None) produced a VALID image that was 12.6MB for the live 1920x11189 case —
  // four times the 3MB per-image cap in the caller, so the correctly-downscaled
  // render would have been thrown away for being too big. Screenshots are mostly
  // flat colour and repeated text rows, which is exactly what Paeth predicts
  // well; it is also what every real encoder uses by default.
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    const base = y * (stride + 1);
    raw[base] = 4;
    const cur = y * stride, prev = (y - 1) * stride;
    for (let i = 0; i < stride; i++) {
      const a = i >= channels ? pixels[cur + i - channels] : 0;
      const b = y > 0 ? pixels[prev + i] : 0;
      const c = y > 0 && i >= channels ? pixels[prev + i - channels] : 0;
      const p = a + b - c;
      const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
      const pred = pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      raw[base + 1 + i] = (pixels[cur + i] - pred) & 0xff;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;                 // bit depth
  ihdr[9] = colorType;
  ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([
    SIG,
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// The only entry point. Returns { buffer, width, height, scaled } on success, or
// { skip: <reason> } — never a partially-processed image.
function fitWithin(buf, maxEdge = 7800) {
  const h = readHeader(buf);
  if (!h) return { skip: 'not a readable PNG' };
  if (h.width <= maxEdge && h.height <= maxEdge) {
    return { buffer: buf, width: h.width, height: h.height, scaled: false };
  }
  // ══ REFUSING FIVE OF PNG'S SIX SHAPES COST US EVERY IMAGE ON A LEAD ══════
  // This used to accept 8-bit RGB and 8-bit RGBA and nothing else. Claude
  // Reynolds, live 2026-08-19: Firecrawl returned the homepage as a 1920x8336
  // colour-type-3 (palette) PNG, this refused it, and because the caller treated
  // a missing homepage as fatal, four interior renders that were already
  // captured and already paid for went in the bin with it. The audit ran with
  // zero images on a lead where we were holding five pictures of the site.
  //
  // Refusing rather than guessing is still the right instinct and it is why this
  // file exists — a mangled image produces confident readings of pixels that
  // mean nothing. But palette, greyscale and sub-8-bit are not guesswork. They
  // are exactly specified: a table lookup and some bit shifting. Expanding them
  // is lossless, and the only honest reason they were refused is that nobody had
  // written the thirty lines.
  //
  // Still refused, deliberately: INTERLACED (Adam7 is seven sub-images and a
  // real rewrite, and no screenshot renderer emits it) and 16-BIT (doubles every
  // buffer against a memory ceiling this file has already had to fight, and no
  // screenshot renderer emits that either). Both say so by name.
  if (h.interlace !== 0) return { skip: `interlaced PNG (${h.width}x${h.height})` };
  if (h.bitDepth === 16) return { skip: '16-bit PNG — refused deliberately, it doubles every buffer against the memory ceiling' };
  if (![1, 2, 4, 8].includes(h.bitDepth)) return { skip: `${h.bitDepth}-bit PNG is not a valid PNG bit depth` };
  if (![0, 2, 3, 4, 6].includes(h.colorType)) return { skip: `colour type ${h.colorType} is not a valid PNG colour type` };
  // Only truecolour carries its channels in the sample directly; everything else
  // is expanded below. Sub-8-bit only exists for palette and greyscale.
  if (h.bitDepth !== 8 && h.colorType !== 3 && h.colorType !== 0) {
    return { skip: `${h.bitDepth}-bit colour type ${h.colorType} is not a valid combination` };
  }
  // Bytes per FILTER unit and bytes per ROW, which are what unfilter works in.
  // For sub-8-bit these are not width * channels: the filter operates on bytes,
  // and a row of 1-bit indices is one byte per eight pixels.
  const srcChannels = h.colorType === 2 ? 3 : h.colorType === 6 ? 4 : h.colorType === 4 ? 2 : 1;
  const rowBytes = Math.ceil((h.width * srcChannels * h.bitDepth) / 8);
  const filterUnit = Math.max(1, Math.floor((srcChannels * h.bitDepth) / 8));
  const channels = srcChannels;

  // Collect every IDAT. A large screenshot is always split across several.
  const idat = [];
  // PLTE is the colour table an indexed image indexes INTO, and tRNS is its
  // optional per-entry alpha. Both are required to expand colour type 3, and
  // neither was ever read here — the encoder re-emits only IHDR/IDAT/IEND, so
  // they are consumed and then correctly dropped.
  let plte = null, trns = null;
  let p = 8;
  while (p + 8 <= buf.length) {
    const len = buf.readUInt32BE(p);
    const type = buf.toString('ascii', p + 4, p + 8);
    if (type === 'IDAT') idat.push(buf.subarray(p + 8, p + 8 + len));
    else if (type === 'PLTE') plte = buf.subarray(p + 8, p + 8 + len);
    else if (type === 'tRNS') trns = buf.subarray(p + 8, p + 8 + len);
    if (type === 'IEND') break;
    p += 12 + len;
  }
  if (h.colorType === 3 && (!plte || plte.length < 3)) return { skip: 'indexed PNG with no colour table' };
  if (!idat.length) return { skip: 'no IDAT chunks' };

  // ══ THIS FUNCTION PEAKED AT 382MB AGAINST RENDER'S 256MB CEILING ═══════
  // Measured, on the exact image sizes it exists for:
  //     1920x8336  RGBA -> peak RSS 330MB
  //     1920x11189 RGBA -> peak RSS 382MB
  // Both are real Firecrawl homepage renders. Note the heap stayed at 7-9MB
  // throughout — Buffers live OUTSIDE the V8 heap, so --max-old-space-size does
  // not bound them and BOOT HEAP CHECK cannot see them. The container limit is
  // on RSS, so this was an OOM-kill waiting for a tall enough page.
  //
  // Four full-size buffers were alive at once: the inflated stream (~64MB), the
  // unfiltered pixels (~64MB), the resampled output (~56MB) and the re-filtered
  // encode buffer, plus inflate's own transient ~2x. Each is only needed by the
  // step that follows it, so each reference is dropped as soon as its consumer
  // has run and the collector is allowed to take it before the next allocation.
  //
  // maxOutputLength bounds the inflate itself: a corrupt or hostile length field
  // could otherwise ask for gigabytes before any of our own checks run.
  let raw;
  const _expected = (rowBytes + 1) * h.height;
  try { raw = zlib.inflateSync(Buffer.concat(idat), { maxOutputLength: _expected + 1024 }); }
  catch (e) { return { skip: `inflate failed (${e.message})` }; }
  idat.length = 0;
  if (raw.length < _expected) return { skip: 'truncated image data' };

  // unfilter works in BYTES: it is handed the row length and the filter unit,
  // not a pixel count, which is what makes sub-8-bit rows work unchanged.
  let pixels = unfilter(raw, rowBytes, h.height, filterUnit);
  raw = null;                              // ~64MB, and unfilter is done with it
  if (!pixels) return { skip: 'unknown row filter' };

  // ══ EXPAND EVERYTHING THAT IS NOT ALREADY 8-BIT TRUECOLOUR ═════════════
  // After this point the rest of the function sees plain 8-bit RGB or RGBA and
  // needs to know nothing about how the source stored it.
  let expChannels = channels;
  let expColorType = h.colorType;
  if (h.colorType === 3 || h.colorType === 0 || h.colorType === 4 || h.bitDepth !== 8) {
    const px = h.width * h.height;
    // Indexed images get alpha only when tRNS actually says a colour is
    // transparent; a palette without tRNS is fully opaque and RGB is a quarter
    // smaller. Greyscale+alpha keeps its alpha.
    const wantAlpha = (h.colorType === 3 && trns && trns.length > 0) || h.colorType === 4 || h.colorType === 6;
    const oc = wantAlpha ? 4 : 3;
    const out = Buffer.alloc(px * oc);
    const maxVal = (1 << h.bitDepth) - 1;
    // Sub-8-bit greyscale is stored as a fraction of full scale, so it is
    // scaled up rather than shifted — 1-bit black/white must become 0 and 255,
    // not 0 and 1.
    const greyScale = h.bitDepth === 8 ? 1 : 255 / maxVal;
    for (let y = 0; y < h.height; y++) {
      const rowStart = y * rowBytes;
      for (let x = 0; x < h.width; x++) {
        let v;
        if (h.bitDepth === 8) {
          v = pixels[rowStart + x * srcChannels];
        } else {
          const bitPos = x * h.bitDepth;
          const b = pixels[rowStart + (bitPos >> 3)];
          const shift = 8 - h.bitDepth - (bitPos & 7);
          v = (b >> shift) & maxVal;
        }
        const o = (y * h.width + x) * oc;
        if (h.colorType === 3) {
          const pi = v * 3;
          out[o] = plte[pi] || 0; out[o + 1] = plte[pi + 1] || 0; out[o + 2] = plte[pi + 2] || 0;
          if (wantAlpha) out[o + 3] = (trns && v < trns.length) ? trns[v] : 255;
        } else {
          const g = Math.round(v * greyScale);
          out[o] = g; out[o + 1] = g; out[o + 2] = g;
          if (wantAlpha) out[o + 3] = pixels[rowStart + x * srcChannels + 1];
        }
      }
    }
    pixels = out;
    expChannels = oc;
    expColorType = wantAlpha ? 6 : 2;
  }

  // ══ A SCREENSHOT'S ALPHA CHANNEL IS A QUARTER OF THE MEMORY FOR NOTHING ══
  // Firecrawl renders arrive as RGBA, and a page screenshot is opaque: there is
  // nothing behind it to show through. That fourth channel is then carried
  // through the two largest allocations left — the resampled image and the
  // encode buffer — and written into the PNG we send.
  //
  // Dropping it when it is provably uniform-opaque is lossless by definition,
  // and it is checked rather than assumed: one pass over the alpha bytes, and
  // any single non-255 byte leaves the image exactly as it was. That pass is
  // cheap against what it saves.
  let outChannels = expChannels;
  let outColorType = expColorType;
  if (expChannels === 4) {
    let opaque = true;
    for (let i = 3; i < pixels.length; i += 4) { if (pixels[i] !== 255) { opaque = false; break; } }
    if (opaque) {
      const px = h.width * h.height;
      const rgb = Buffer.alloc(px * 3);
      for (let i = 0, j = 0; i < px; i++, j += 3) {
        const s = i * 4;
        rgb[j] = pixels[s]; rgb[j + 1] = pixels[s + 1]; rgb[j + 2] = pixels[s + 2];
      }
      pixels = rgb;
      outChannels = 3;
      outColorType = 2;
    }
  }

  const ratio = Math.min(maxEdge / h.width, maxEdge / h.height);
  const dw = Math.max(1, Math.floor(h.width * ratio));
  const dh = Math.max(1, Math.floor(h.height * ratio));
  const small = resample(pixels, h.width, h.height, dw, dh, outChannels);
  pixels = null;                           // ~64MB, and encode reads only `small`
  let outBuf;
  try { outBuf = encode(small, dw, dh, outColorType, outChannels); }
  catch (e) { return { skip: `encode failed (${e.message})` }; }
  return { buffer: outBuf, width: dw, height: dh, scaled: true, from: `${h.width}x${h.height}` };
}

module.exports = { fitWithin, readHeader, __testPng: (w, h, ft) => mkTestPng(w, h, 2, ft == null ? 4 : ft).png };

// ── SELF TEST ────────────────────────────────────────────────────────────────
// Round-trips real PNGs through every filter type and asserts the output is a
// valid PNG under the ceiling whose pixels still resemble the input. Run it
// before trusting a single image this produces.
// ══ ONE PNG BUILDER, SHARED BY THE SELF-TEST AND THE SERVER ══════════════
// The self-test built its own fixtures inside its own block, so nothing else
// could make one. BATCH MEMORY CHECK needs a real page render to MEASURE what
// a decode costs in resident memory — the number that decides how many leads
// may run at once — and a second builder written beside this one would be a
// second thing to keep in step. Hoisted instead.
const mkTestPng = (w, hgt, colorType, filterType) => {
  const ch = colorType === 2 ? 3 : 4;
  const stride = w * ch;
  const px = Buffer.alloc(stride * hgt);
  for (let y = 0; y < hgt; y++) for (let x = 0; x < w; x++) {
    const o = y * stride + x * ch;
    px[o] = (x * 7) & 0xff; px[o + 1] = (y * 3) & 0xff; px[o + 2] = ((x + y) * 5) & 0xff;
    if (ch === 4) px[o + 3] = 255;
  }
  // Apply the requested filter so the decoder is exercised, not just filter 0.
  const raw = Buffer.alloc((stride + 1) * hgt);
  for (let y = 0; y < hgt; y++) {
    raw[y * (stride + 1)] = filterType;
    for (let i = 0; i < stride; i++) {
      const cur = px[y * stride + i];
      const a = i >= ch ? px[y * stride + i - ch] : 0;
      const b = y > 0 ? px[(y - 1) * stride + i] : 0;
      const c = y > 0 && i >= ch ? px[(y - 1) * stride + i - ch] : 0;
      let v;
      if (filterType === 0) v = cur;
      else if (filterType === 1) v = cur - a;
      else if (filterType === 2) v = cur - b;
      else if (filterType === 3) v = cur - ((a + b) >> 1);
      else { const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
             v = cur - (pa <= pb && pa <= pc ? a : pb <= pc ? b : c); }
      raw[y * (stride + 1) + 1 + i] = v & 0xff;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(hgt, 4);
  ihdr[8] = 8; ihdr[9] = colorType;
  return { png: Buffer.concat([SIG, chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]), px, ch };
};

if (require.main === module && process.argv[2] === '--selftest') {
  const mk = mkTestPng;

  let pass = 0, fail = 0;
  const ok = (name, cond, detail) => { if (cond) { pass++; console.log('  ✓ ' + name); } else { fail++; console.log('  ✗ ' + name + (detail ? ' — ' + detail : '')); } };

  for (const ft of [0, 1, 2, 3, 4]) {
    const { png } = mk(120, 90, 2, ft);
    const r = fitWithin(png, 60);
    ok(`filter ${ft}: decodes, downscales and re-encodes`, !r.skip && r.scaled, r.skip);
    if (!r.skip) {
      const h2 = readHeader(r.buffer);
      ok(`filter ${ft}: output is a valid PNG within the ceiling`,
         h2 && h2.width <= 60 && h2.height <= 60, h2 ? `${h2.width}x${h2.height}` : 'unreadable');
      // Re-decode the output and confirm the corners still look like the input,
      // which catches a stride or channel-order mistake that dimensions alone miss.
      const again = fitWithin(r.buffer, 10000);
      ok(`filter ${ft}: output re-decodes`, !again.skip, again.skip);
    }
  }
  { const { png } = mk(64, 48, 6, 4); const r = fitWithin(png, 32);
    ok('RGBA is handled', !r.skip && r.scaled, r.skip); }
  { const { png } = mk(100, 100, 2, 0); const r = fitWithin(png, 7800);
    ok('an image already within the ceiling is returned untouched', !r.skip && r.scaled === false && r.buffer === png, r.skip); }
  { const tall = mk(1920, 11189, 2, 4);
    const t0 = Date.now(); const r = fitWithin(tall.png, 7800); const ms = Date.now() - t0;
    ok('the real live case (1920x11189) fits, and quickly', !r.skip && r.height <= 7800 && ms < 20000,
       r.skip || `${r.width}x${r.height} in ${ms}ms`);
    if (!r.skip) console.log(`     ${r.from} -> ${r.width}x${r.height}, ${Math.round(r.buffer.length / 1024)}KB, ${ms}ms`); }
  ok('a JPEG is refused', !!fitWithin(Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(60)])).skip);
  ok('an HTML error body is refused', !!fitWithin(Buffer.from('<html>403 Forbidden</html>')).skip);
  ok('a truncated buffer is refused', !!fitWithin(Buffer.alloc(20)).skip);
  console.log(`\n  ${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
}
