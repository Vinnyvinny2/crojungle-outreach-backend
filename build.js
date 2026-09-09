#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════════════════
// build.js — server.js is GENERATED from src/. This is the only thing that writes it.
//
// Round 128 (2026-09-09). The program lives in src/ as small files, one job each,
// filed by department (a folder per department, a Goal line at the top of every
// file). src/manifest.js lists them in load order. This script joins them into
// server.js, and the join is a byte rule, not a text rule:
//
//   each source file is LF, no BOM, non-empty, ends with exactly one "\n";
//   every "\n" becomes "\r\n" (server.js has been CRLF for its whole life, three
//   boot checks pin literal CRLF sequences and gen-refs reads it as CRLF);
//   the files are concatenated with NO separator — a file's final newline is
//   the CRLF that ended that line in the original, so the built file is one
//   module scope in manifest order and nothing is injected between pieces.
//
// The banner at the top of server.js is the first comment lines of the first
// source file. Nothing is injected, so the built file is exactly the sum of
// its sources and `--check` can compare bytes without a special case.
//
// What it refuses (naming src/file:line):
//   a CR byte, a UTF-8 BOM, an empty file, a last byte that is not "\n", a
//   doubled final newline, a manifest entry that does not exist, a duplicate
//   entry, any src/**/*.js on disk the manifest does not list, a file over
//   MAX_LINES (only once the manifest lists more than one file — see below), a
//   header without a Goal line, and a header comment line carrying a string the
//   counting boot checks or gen-refs scan for (a "✓" in a header would be a
//   check that never ran; "process.env." in one would be a setting the env
//   table documents and the code never reads).
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
// require('./build.js') exports { layout, assemble, verify } for BUILD CHECK
// (the boot's copy of --check, walking the manifest against the running
// source one file at a time so no second full copy of the program is built)
// and for docs/gen-refs.js, whose every server-side row names the source file.
// Plain Node, fs and path only, no dependencies.
// ═══════════════════════════════════════════════════════════════════════════
'use strict';
const fs = require('fs');
const path = require('path');

// The size cap. A file an agent can hold whole. Applied only once the manifest
// lists more than one file: Round 128 ships the whole program as the single
// entry src/all.js (84,000 lines) so the loader can be proven byte-for-byte
// before anything is cut; Round 129 cuts it, and from the second manifest entry
// on, every file must fit under this.
const MAX_LINES = 800;
const GOAL_PREFIX = '// Goal: after reading this file, Claude can';
// Strings a header comment may not carry. Each is something a boot check counts
// across the whole built file or gen-refs scans for, so a header that mentioned
// it would be counted as an occurrence of the thing itself.
const HEADER_FORBIDDEN = ['✓', '⛔', 'process.env.', 'req.query.', 'readFileSync(', '__filename', 'Hold();'];

const CR = 0x0D, LF = 0x0A;

function srcDir(root) { return path.join(root, 'src'); }

// The manifest, read fresh every time (no require cache): BUILD CHECK, --check
// and a falsification harness may all run in one process after editing it.
function readManifest(root) {
  const mf = path.join(srcDir(root), 'manifest.js');
  if (!fs.existsSync(mf)) throw new Error(`src/manifest.js is missing (looked at ${mf})`);
  const resolved = require.resolve(mf);
  delete require.cache[resolved];
  const list = require(resolved);
  if (!Array.isArray(list) || !list.length) throw new Error('src/manifest.js must export a non-empty array of file paths relative to src/');
  const seen = new Set();
  for (const f of list) {
    if (typeof f !== 'string' || !f.endsWith('.js')) throw new Error(`src/manifest.js: entry ${JSON.stringify(f)} is not a .js path`);
    const norm = f.split(path.sep).join('/');
    if (seen.has(norm)) throw new Error(`src/manifest.js lists src/${norm} twice`);
    seen.add(norm);
  }
  return list.map((f) => f.split(path.sep).join('/'));
}

// Every .js under src/ (recursive), as src-relative forward-slash paths, minus
// the manifest itself.
function filesOnDisk(root) {
  const out = [];
  const walk = (dir, rel) => {
    for (const ent of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const r = rel ? rel + '/' + ent.name : ent.name;
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

// Reads one source file as a Buffer and applies every per-file refusal. The
// returned buffer is LF; callers convert. `multi` says whether the size cap
// applies (see MAX_LINES).
function readSource(root, rel, multi) {
  const abs = path.join(srcDir(root), rel);
  const name = 'src/' + rel;
  if (!fs.existsSync(abs)) throw new Error(`${name}:1: listed in src/manifest.js but not on disk`);
  const buf = fs.readFileSync(abs);
  if (buf.length === 0) throw new Error(`${name}:1: empty file`);
  if (buf.length >= 3 && buf[0] === 0xEF && buf[1] === 0xBB && buf[2] === 0xBF) throw new Error(`${name}:1: UTF-8 BOM — source files are plain UTF-8, no BOM`);
  for (let i = 0, line = 1; i < buf.length; i++) {
    if (buf[i] === CR) throw new Error(`${name}:${line}: CR byte (0x0D) — source files are LF only; build.js adds the CR`);
    if (buf[i] === LF) line++;
  }
  const lines = countLF(buf);
  if (buf[buf.length - 1] !== LF) throw new Error(`${name}:${lines + 1}: last byte is not a newline — every source file ends with exactly one "\\n"`);
  if (buf.length >= 2 && buf[buf.length - 2] === LF) throw new Error(`${name}:${lines}: doubled final newline — every source file ends with exactly one "\\n"`);
  if (multi && lines > MAX_LINES) throw new Error(`${name}:${MAX_LINES + 1}: ${lines} lines is over the ${MAX_LINES}-line cap — one job per file; cut it`);
  checkHeader(name, buf);
  return buf;
}

// The header: the leading run of "//" lines. It must carry a Goal line and may
// not carry a forbidden string.
function checkHeader(name, buf) {
  const text = buf.toString('utf8');
  const header = [];
  let pos = 0;
  while (pos < text.length) {
    const nl = text.indexOf('\n', pos);
    const line = text.slice(pos, nl === -1 ? text.length : nl);
    if (!line.startsWith('//')) break;
    header.push(line);
    if (nl === -1) break;
    pos = nl + 1;
  }
  if (!header.length) throw new Error(`${name}:1: no header — the file must open with comment lines, one of them starting "${GOAL_PREFIX}"`);
  if (!header.some((l) => l.startsWith(GOAL_PREFIX))) throw new Error(`${name}:1: header has no Goal line — one header line must start "${GOAL_PREFIX}"`);
  header.forEach((l, i) => {
    for (const bad of HEADER_FORBIDDEN) {
      if (l.includes(bad)) throw new Error(`${name}:${i + 1}: header line contains ${JSON.stringify(bad)} — the counting checks and gen-refs scan the whole file for that string, so a header may not carry it`);
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

// The whole-manifest refusals (existence, duplicates, strays) plus every
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
  for (const rel of list) {
    const lines = countLF(readSource(root, rel, multi));
    rows.push({ file: 'src/' + rel, start, end: start + lines - 1, lines });
    start += lines;
  }
  return rows;
}

// The built program as a Buffer (CRLF, no separator between files).
function assemble(root) {
  const list = validate(root);
  const multi = list.length > 1;
  return Buffer.concat(list.map((rel) => toCRLF(readSource(root, rel, multi))));
}

// Walks the manifest one file at a time against `text` (the decoded running
// source, as selfSource() holds it), never building a second full copy.
// Returns { ok, why, line, file, fileLine, files, lines }.
function verify(root, text) {
  const list = validate(root);
  const multi = list.length > 1;
  let offset = 0, builtLine = 1;
  const done = (ok, why, line, file, fileLine) => ({ ok, why, line, file, fileLine, files: list.length, lines: builtLine - 1 });
  for (const rel of list) {
    const chunk = toCRLF(readSource(root, rel, multi)).toString('utf8');
    const file = 'src/' + rel;
    if (!text.startsWith(chunk, offset)) {
      // Find the first differing character so the report names a line.
      const max = Math.min(chunk.length, text.length - offset);
      let i = 0;
      while (i < max && chunk.charCodeAt(i) === text.charCodeAt(offset + i)) i++;
      let fileLine = 1;
      for (let k = 0; k < i; k++) if (chunk.charCodeAt(k) === LF) fileLine++;
      const line = builtLine + fileLine - 1;
      const why = i >= max && text.length - offset < chunk.length
        ? `the running file ends at line ${line} but ${file} continues`
        : `the running file differs from ${file} at line ${line}`;
      return done(false, why, line, file, fileLine);
    }
    offset += chunk.length;
    let n = 0;
    for (let k = 0; k < chunk.length; k++) if (chunk.charCodeAt(k) === LF) n++;
    builtLine += n;
  }
  if (offset !== text.length) {
    // Extra content past the last source file.
    let extra = 0;
    for (let k = offset; k < text.length; k++) if (text.charCodeAt(k) === LF) extra++;
    const last = list[list.length - 1];
    return done(false, `the running file has ${extra} line(s) past the end of the last source file`, builtLine, 'src/' + last, null);
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

module.exports = { layout, assemble, verify };

if (require.main === module) {
  try {
    process.exitCode = main(process.argv.slice(2));
  } catch (e) {
    console.error(`✗ build refused: ${(e && e.message) || e}`);
    process.exitCode = 1;
  }
}
