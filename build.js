#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════════════════
// build.js — server.js is GENERATED from src/. This is the only thing that writes it.
//
// Round 128 (2026-09-09). The program lives in src/ as small files, one job each,
// filed by department (a folder per department, a Goal line at the top of every
// file). src/manifest.js lists them in load order. This script joins them into
// server.js, and the join is a byte rule, not a text rule:
//
//   each source file is LF, no BOM, non-empty, valid UTF-8, ends with exactly
//   one "\n"; every "\n" becomes "\r\n" (server.js has been CRLF for its whole
//   life, three boot checks pin literal CRLF sequences and gen-refs reads it as
//   CRLF); the files are concatenated with NO separator — a file's final
//   newline is the CRLF that ended that line in the original, so the built file
//   is one module scope in manifest order and nothing is injected between pieces.
//
// The shape of every source file: header, ONE blank line, body. The header is
// the leading run of "//" comment lines and ENDS at the first blank line or the
// first non-comment line (the cutter puts exactly one blank line after its last
// line, "Guarded by:"); a comment that follows that blank line is the program's
// own and is not scanned as a header line. The blank line after the header is
// the monolith's own blank line when the statement boundary had one, and an
// inserted line otherwise. A file never ENDS on a blank line: when a boundary
// falls on a blank line, that line belongs to the top of the NEXT file, just
// after its header — it is a line of server.js and is moved, never deleted.
//
// The banner at the top of server.js is the first comment lines of the first
// source file. Nothing is injected, so the built file is exactly the sum of
// its sources and `--check` can compare bytes without a special case; the
// first source file must open with the exact GENERATED line (BANNER below) so
// server.js line 1 always says what it is.
//
// What it refuses (naming src/file:line):
//   a CR byte, a UTF-8 BOM, an empty file, a last byte that is not "\n", a
//   file that ends on a blank line (a doubled final newline — the refusal says
//   where that line goes), a line that is not valid UTF-8, a literal U+FFFD
//   (write the escape \uFFFD — see verify() for why), a manifest that does not
//   load (named with the line Node reports), a manifest entry that is not a
//   plain src-relative path (a backslash, a leading "/" or "./", a ".." or empty
//   segment) or is the manifest itself, an entry that does not exist or is not
//   a regular file (a directory), a duplicate entry, any src/**/*.js on disk
//   the manifest does not list, a
//   symbolic link anywhere under src/, a file over MAX_LINES (only once the
//   manifest lists more than one file — see below), a header without a Goal
//   line, a first source file that does not open with the GENERATED banner
//   line, and a header comment line carrying a string the counting boot checks
//   or gen-refs scan for (a "✓" in a header would be a check that never ran;
//   "process.env." in one would be a setting the env table documents and the
//   code never reads).
//
// Commands:
//   node build.js            assemble; report the first line a hand edit of
//                            server.js would lose; write; assert CRLF on every
//                            written line.
//   node build.js --check    assemble in memory and compare with server.js byte
//                            for byte; exit 1 naming server.js:LINE (src/file:L)
//                            at the first differing byte; on success also
//                            round-trips every 1000th built line back to its
//                            source line and prints a one-line summary.
//   node build.js --where N  map built line N (or "server.js:N") to src/file:L.
//
// require('./build.js') exports { layout, assemble, verify, whereLine } for BUILD CHECK
// (the boot's copy of --check: each source file is read once as one off-heap
// Buffer — 5.9MB for src/all.js today — and only one line of it is decoded at
// a time, compared with the running source at a moving offset; so nothing
// lands on the V8 heap BOOT HEAP CHECK measures beyond one line, and heapUsed
// moves by under 2MB, measured +1.7MB)
// and for docs/gen-refs.js, whose every server-side row names the source file
// through layout() and whereLine(rows, n) — one copy of the line arithmetic.
// Plain Node, fs and path only, no dependencies.
// ═══════════════════════════════════════════════════════════════════════════
'use strict';
const fs = require('fs');
const path = require('path');

// The size cap. A file an agent can hold whole. Applied only once the manifest
// lists more than one file: Round 128 ships the whole program as the single
// entry src/all.js (84,000 lines) so the loader can be proven byte-for-byte
// before anything is cut; Round 129 cuts it, and the moment the manifest lists
// a second file, EVERY file — the first included — must fit under this.
const MAX_LINES = 800;
const GOAL_PREFIX = '// Goal: after reading this file, Claude can';
// The exact first line of the first source file, and so of server.js. Pinned
// whole so that a later cut cannot quietly drop the one line that tells a
// reader (or an agent about to hand-edit) that the file is generated.
const BANNER = '// GENERATED by build.js from src/ — do not edit server.js. Edit src/, run node build.js.';
// Strings a header comment may not carry. Each is something a boot check counts
// across the whole built file or gen-refs scans for, so a header that mentioned
// it would be counted as an occurrence of the thing itself.
const HEADER_FORBIDDEN = ['✓', '⛔', 'process.env.', 'req.query.', 'readFileSync(', '__filename', 'Hold();'];

const CR = 0x0D, LF = 0x0A;
// U+FFFD, the replacement character, as UTF-8 bytes.
const FFFD = Buffer.from([0xEF, 0xBF, 0xBD]);

// path.resolve, not join: a relative root ('.') joined gives the bare specifier
// "src/manifest.js", which require.resolve treats as a package name and
// refuses with "Cannot find module" one line after existsSync said it exists.
function srcDir(root) { return path.resolve(root, 'src'); }

// The manifest, read fresh every time (no require cache): BUILD CHECK, --check
// and a falsification harness may all run in one process after editing it.
// Entries are plain src-relative forward-slash paths: no backslash, no leading
// "/" or "./", no ".." and no empty segment, and never the manifest itself —
// so the same spelling is what filesOnDisk() produces and the stray refusal
// below can only fire for a file that is genuinely unlisted.
function readManifest(root) {
  const mf = path.join(srcDir(root), 'manifest.js');
  if (!fs.existsSync(mf)) throw new Error(`src/manifest.js is missing (looked at ${mf})`);
  const resolved = require.resolve(mf);
  delete require.cache[resolved];
  let list;
  try { list = require(resolved); } catch (e) {
    // Node puts the file and line only in the stack: "…/src/manifest.js:3" for
    // a parse error, "(…/src/manifest.js:2:15)" for a throw while loading.
    const m = /manifest\.js:(\d+)/.exec((e && e.stack) || '');
    throw new Error(`src/manifest.js:${m ? m[1] : 1}: cannot be loaded — ${(e && e.message) || e}`);
  }
  if (!Array.isArray(list) || !list.length) throw new Error('src/manifest.js must export a non-empty array of file paths relative to src/');
  const seen = new Set();
  for (const f of list) {
    if (typeof f !== 'string' || !f.endsWith('.js')) throw new Error(`src/manifest.js: entry ${JSON.stringify(f)} is not a .js path`);
    const seg = f.split('/');
    if (f.includes('\\') || seg.some((s) => s === '' || s === '.' || s === '..')) throw new Error(`src/manifest.js: entry ${JSON.stringify(f)} is not a plain src-relative path — forward slashes only, no leading "/" or "./", no ".." and no empty segment`);
    if (f === 'manifest.js') throw new Error('src/manifest.js: entry "manifest.js" — the manifest may not list itself; it is the load order, not a source file');
    if (seen.has(f)) throw new Error(`src/manifest.js lists src/${f} twice`);
    seen.add(f);
  }
  return list;
}

// Every .js under src/ (recursive), as src-relative forward-slash paths, minus
// the manifest itself. A symbolic link anywhere under src/ is refused by name:
// Dirent answers from lstat, so a link is neither a file nor a directory here
// and would otherwise be silently invisible to the stray refusal — a linked
// file would be neither built nor refused, a linked directory never walked.
function filesOnDisk(root) {
  const out = [];
  const walk = (dir, rel) => {
    for (const ent of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const r = rel ? rel + '/' + ent.name : ent.name;
      if (ent.isSymbolicLink()) throw new Error(`src/${r}:1: is a symbolic link — src/ holds real files only, each listed exactly once; copy the code in or list the real file`);
      if (ent.isDirectory()) walk(path.join(dir, ent.name), r);
      else if (ent.isFile() && ent.name.endsWith('.js') && r !== 'manifest.js') out.push(r);
    }
  };
  walk(srcDir(root), '');
  return out;
}

function countLF(buf) {
  let n = 0;
  for (let i = 0; i < buf.length; i++) if (buf[i] === LF) n++;
  return n;
}

// Why every source line must be valid UTF-8 and free of a literal U+FFFD:
// BUILD CHECK compares the running server.js DECODED (selfSource() holds it as a
// string, the boot's one read of the file) with each source line decoded. Node
// decodes with replacement, so every invalid byte sequence in server.js becomes
// U+FFFD. If sources can never produce a U+FFFD, then decoded equality means the
// running file decoded without one, so it was valid UTF-8, and valid UTF-8 has
// exactly one byte encoding: decoded equality is byte equality. A line is
// decoded and tested only when it carries a byte >= 0x80 (an ASCII line is
// valid by construction). The test is the decode itself: a decoded line holds
// U+FFFD if and only if the bytes were invalid or spelled U+FFFD literally.
function checkUtf8Line(name, buf, a, b, line) {
  const s = buf.toString('utf8', a, b);
  if (s.indexOf('\uFFFD') === -1) return;
  const at = buf.indexOf(FFFD, a);
  if (at !== -1 && at < b) throw new Error(`${name}:${line}: literal U+FFFD (the replacement character) — write it as the escape \\uFFFD. BUILD CHECK compares the running file decoded, and an invalid byte in server.js decodes to that same character, so a literal one could hide a corrupt byte`);
  throw new Error(`${name}:${line}: not valid UTF-8 — source files are UTF-8 without exception, so that the decoded compare BUILD CHECK runs at boot is a byte compare`);
}

// Reads one source file as a Buffer and applies every per-file refusal. The
// returned buffer is LF; callers convert. `multi` says whether the size cap
// applies (see MAX_LINES); `first` says this is the first manifest entry, whose
// first line must be the BANNER.
function readSource(root, rel, multi, first) {
  const abs = path.join(srcDir(root), rel);
  const name = 'src/' + rel;
  if (!fs.existsSync(abs)) throw new Error(`${name}:1: listed in src/manifest.js but not on disk`);
  if (!fs.statSync(abs).isFile()) throw new Error(`${name}:1: is not a regular file — a manifest entry names a file under src/`);
  const buf = fs.readFileSync(abs);
  if (buf.length === 0) throw new Error(`${name}:1: empty file`);
  if (buf.length >= 3 && buf[0] === 0xEF && buf[1] === 0xBB && buf[2] === 0xBF) throw new Error(`${name}:1: UTF-8 BOM — source files are plain UTF-8, no BOM`);
  // One walk over the bytes: the CR refusal, the line count, and the UTF-8
  // rule on each line that carries a byte >= 0x80 — one line decoded at a
  // time, never the file.
  let line = 1, start = 0, high = false;
  for (let i = 0; i < buf.length; i++) {
    const b = buf[i];
    if (b === CR) throw new Error(`${name}:${line}: CR byte (0x0D) — source files are LF only; build.js adds the CR`);
    if (b >= 0x80) high = true;
    else if (b === LF) {
      if (high) { checkUtf8Line(name, buf, start, i, line); high = false; }
      start = i + 1;
      line++;
    }
  }
  const lines = line - 1;
  if (buf[buf.length - 1] !== LF) throw new Error(`${name}:${lines + 1}: last byte is not a newline — every source file ends with exactly one "\\n"`);
  if (buf.length >= 2 && buf[buf.length - 2] === LF) throw new Error(`${name}:${lines}: ends on a blank line — every source file ends with exactly one "\\n"; that blank line is a line of server.js, so move it to the top of the NEXT file, just after its header (never delete it)`);
  if (multi && lines > MAX_LINES) throw new Error(`${name}:${MAX_LINES + 1}: ${lines} lines is over the ${MAX_LINES}-line cap — one job per file; cut it`);
  checkHeader(name, buf, first);
  return buf;
}

// The header: the leading run of "//" lines, ending at the first blank line or
// the first non-comment line (the cutter puts exactly one blank line after
// "Guarded by:", so a comment the program carries just below its header is not
// a header line and is not scanned). It must carry a Goal line and may not
// carry a forbidden string; in the first source file its first line is the
// BANNER. Only the header bytes are decoded: a line is a header line while its
// first two bytes are 0x2F 0x2F, and the cut always sits just after an LF, so
// no multi-byte character is split and the file itself is never decoded whole.
function checkHeader(name, buf, first) {
  let p = 0;
  while (p + 1 < buf.length && buf[p] === 0x2F && buf[p + 1] === 0x2F) {
    const nl = buf.indexOf(LF, p);
    p = nl === -1 ? buf.length : nl + 1;
  }
  const header = p ? buf.toString('utf8', 0, p).split('\n') : [];
  if (header.length && header[header.length - 1] === '') header.pop();
  if (!header.length) throw new Error(`${name}:1: no header — the file must open with comment lines, one of them starting "${GOAL_PREFIX}"`);
  if (first && header[0] !== BANNER) throw new Error(`${name}:1: the first source file must open with the GENERATED banner line, exactly "${BANNER}" — it becomes server.js line 1`);
  if (!header.some((l) => l.startsWith(GOAL_PREFIX))) throw new Error(`${name}:1: header has no Goal line — one header line must start "${GOAL_PREFIX}"`);
  header.forEach((l, i) => {
    for (const bad of HEADER_FORBIDDEN) {
      if (l.includes(bad)) throw new Error(`${name}:${i + 1}: header line contains ${JSON.stringify(bad)} — the counting checks and gen-refs scan the whole file for that string, so a header may not carry it — if this line is the program's own comment rather than the header, put one blank line after the header's last line`);
    }
  });
}

function toCRLF(buf) {
  const out = Buffer.allocUnsafe(buf.length + countLF(buf));
  let j = 0;
  for (let i = 0; i < buf.length; i++) {
    const b = buf[i];
    if (b === LF) { out[j++] = CR; out[j++] = LF; } else out[j++] = b;
  }
  return out;
}

// The whole-manifest refusals (existence, duplicates, strays, links) plus every
// per-file refusal, returning the validated list. Every entry point runs this.
function validate(root) {
  const list = readManifest(root);
  const onDisk = filesOnDisk(root);
  const listed = new Set(list);
  const stray = onDisk.filter((f) => !listed.has(f));
  if (stray.length) throw new Error(`src/${stray[0]}:1: on disk but not in src/manifest.js — every src/**/*.js must be listed exactly once (${stray.length} unlisted: ${stray.join(', ')})`);
  return list;
}

// Built line numbers, 1-based, cumulative in manifest order.
function layout(root) {
  const list = validate(root);
  const multi = list.length > 1;
  const rows = [];
  let start = 1;
  list.forEach((rel, idx) => {
    const lines = countLF(readSource(root, rel, multi, idx === 0));
    rows.push({ file: 'src/' + rel, start, end: start + lines - 1, lines });
    start += lines;
  });
  return rows;
}

// The built program as a Buffer (CRLF, no separator between files).
function assemble(root) {
  const list = validate(root);
  const multi = list.length > 1;
  return Buffer.concat(list.map((rel, idx) => toCRLF(readSource(root, rel, multi, idx === 0))));
}

// The boot's proof. Walks the manifest one file at a time and each file ONE
// LINE at a time against `text` (the decoded running source, as selfSource()
// holds it): each source line is decoded on its own, must sit at the moving
// offset, and must be followed by CRLF. What this costs, measured: each source
// file is read once as one off-heap Buffer (5.9MB for src/all.js today, held
// for the walk of that file) and only one line of it is decoded at a time, so
// nothing lands on the V8 heap BOOT HEAP CHECK measures beyond one line —
// heapUsed moves by under 2MB (+1.7MB measured), whatever the manifest lists
// (one 84,000-line file in Round 128, small files after the cut). The running
// file is never read here at all: BOOT HEAP CHECK's one-read rule stands.
// Decoded equality is byte equality by the rule readSource enforces (see
// checkUtf8Line): a running file that decoded with a U+FFFD in it can match no
// source line, so a green here means server.js is valid UTF-8 and byte for
// byte the sources' CRLF join.
// Returns { ok, why, line, file, fileLine, files, lines }.
function verify(root, text) {
  const list = validate(root);
  const multi = list.length > 1;
  let offset = 0, builtLine = 1;
  const done = (ok, why, line, file, fileLine) => ({ ok, why, line, file, fileLine, files: list.length, lines: builtLine - 1 });
  for (let idx = 0; idx < list.length; idx++) {
    const rel = list[idx], file = 'src/' + rel;
    const buf = readSource(root, rel, multi, idx === 0);
    let start = 0, fileLine = 1;
    for (let i = 0; i < buf.length; i++) {
      if (buf[i] !== LF) continue;
      const s = buf.toString('utf8', start, i);
      const end = offset + s.length;
      if (!text.startsWith(s, offset) || text.charCodeAt(end) !== CR || text.charCodeAt(end + 1) !== LF) {
        const line = builtLine + fileLine - 1;
        const rest = text.slice(offset);
        const why = rest.length < s.length + 2 && (s + '\r\n').startsWith(rest)
          ? `the running file ends at line ${line} but ${file} continues`
          : `the running file differs from ${file} at line ${line}`;
        return done(false, why, line, file, fileLine);
      }
      offset = end + 2;
      start = i + 1;
      fileLine++;
    }
    builtLine += fileLine - 1;
  }
  if (offset !== text.length) {
    // Extra content past the last source file.
    let extra = 0;
    for (let k = offset; k < text.length; k++) if (text.charCodeAt(k) === LF) extra++;
    const last = list[list.length - 1];
    const why = extra > 0
      ? `the running file has ${extra} line(s) past the end of the last source file`
      : `the running file has ${text.length - offset} byte(s) with no newline past the end of the last source file`;
    return done(false, why, builtLine, 'src/' + last, null);
  }
  return done(true, null, null, null, null);
}

// ── helpers for the CLI ──────────────────────────────────────────────────────

function whereLine(rows, n) {
  for (const r of rows) if (n >= r.start && n <= r.end) return { file: r.file, line: n - r.start + 1 };
  return null;
}

// Line number (1-based) of byte index `i` in a CRLF buffer.
function lineOfByte(buf, i) {
  let n = 1;
  const end = Math.min(i, buf.length);
  for (let k = 0; k < end; k++) if (buf[k] === LF) n++;
  return n;
}

function firstDiff(a, b) {
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) if (a[i] !== b[i]) return i;
  return a.length === b.length ? -1 : n;
}

function lineText(buf, line) {
  const s = buf.toString('utf8').split('\n');
  const t = s[line - 1];
  return t === undefined ? '(no such line)' : t.replace(/\r$/, '');
}

function describeDiff(root, built, existing) {
  const i = firstDiff(built, existing);
  if (i < 0) return null;
  const line = lineOfByte(built, i);
  const rows = layout(root);
  const w = whereLine(rows, line);
  const src = w ? `${w.file}:${w.line}` : 'past the last source line';
  return { index: i, line, where: `server.js:${line} (${src})`, lost: lineText(existing, line) };
}

// ── CLI ──────────────────────────────────────────────────────────────────────

function main(argv) {
  const root = __dirname;
  const out = path.join(root, 'server.js');
  const cmd = argv[0];

  if (cmd === '--where') {
    const arg = String(argv[1] || '').replace(/^server\.js:/, '');
    const n = Number(arg);
    if (!Number.isInteger(n) || n < 1) { console.error('usage: node build.js --where N   (or server.js:N)'); return 2; }
    const w = whereLine(layout(root), n);
    if (!w) { console.error(`server.js:${n} is past the last built line`); return 1; }
    console.log(`${w.file}:${w.line} (server.js:${n})`);
    return 0;
  }

  if (cmd === '--check') {
    const built = assemble(root);
    if (!fs.existsSync(out)) { console.error('✗ build: server.js is missing — run node build.js'); return 1; }
    const existing = fs.readFileSync(out);
    if (Buffer.compare(built, existing) !== 0) {
      const d = describeDiff(root, built, existing);
      console.error(`✗ build: server.js is not what src/ builds — first difference at ${d.where}. server.js is generated: edit src/ and run node build.js.`);
      console.error(`  server.js has: ${d.lost}`);
      return 1;
    }
    // Round trip: every 1000th built line must be the mapped source line.
    const rows = layout(root);
    const builtLines = built.toString('utf8').split('\r\n');
    const cache = new Map();
    const srcLines = (file) => {
      if (!cache.has(file)) cache.set(file, fs.readFileSync(path.join(root, file), 'utf8').split('\n'));
      return cache.get(file);
    };
    const total = rows.length ? rows[rows.length - 1].end : 0;
    for (let n = 1; n <= total; n += 1000) {
      const w = whereLine(rows, n);
      if (!w) { console.error(`✗ build: --where cannot map server.js:${n}`); return 1; }
      const a = builtLines[n - 1], b = srcLines(w.file)[w.line - 1];
      if (a !== b) { console.error(`✗ build: round trip failed — server.js:${n} is not ${w.file}:${w.line}\n  built:  ${a}\n  source: ${b}`); return 1; }
    }
    console.log(`✓ build: server.js is byte for byte what src/manifest.js builds — ${rows.length} source file(s), ${total} lines, CRLF; every 1000th line maps back to its source line.`);
    return 0;
  }

  if (cmd && cmd !== '--write') { console.error(`unknown option ${cmd}. usage: node build.js [--check | --where N]`); return 2; }

  const built = assemble(root);
  if (fs.existsSync(out)) {
    const existing = fs.readFileSync(out);
    const d = describeDiff(root, built, existing);
    if (d) {
      console.log(`build: server.js differs from src/ — first at ${d.where}; the line server.js has there, which this write replaces:`);
      console.log(`  ${d.lost}`);
    } else {
      console.log('build: server.js already matches src/ — rewriting the same bytes.');
    }
  }
  fs.writeFileSync(out, built);
  const back = fs.readFileSync(out);
  if (Buffer.compare(back, built) !== 0) throw new Error('server.js read back differs from what was written');
  // Every written line ends with CRLF: no bare LF, no bare CR.
  for (let i = 0, line = 1; i < back.length; i++) {
    if (back[i] === LF && (i === 0 || back[i - 1] !== CR)) throw new Error(`server.js:${line}: written line does not end with CRLF`);
    if (back[i] === CR && back[i + 1] !== LF) throw new Error(`server.js:${line}: bare CR written`);
    if (back[i] === LF) line++;
  }
  if (back[back.length - 1] !== LF) throw new Error('server.js: last line has no newline');
  const rows = layout(root);
  console.log(`build: wrote server.js — ${rows.length} source file(s), ${rows[rows.length - 1].end} lines, every line CRLF.`);
  return 0;
}

module.exports = { layout, assemble, verify, whereLine };

if (require.main === module) {
  try {
    process.exitCode = main(process.argv.slice(2));
  } catch (e) {
    console.error(`✗ build refused: ${(e && e.message) || e}`);
    process.exitCode = 1;
  }
}
