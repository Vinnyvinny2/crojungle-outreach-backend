// ═══════════════════════════════════════════════════════════════════════════
// ROUND 128 — the falsifications, as reverts for `node falsify.js docs/history/round-128-reverts.js`.
//
// Each entry undoes ONE guard's premise against a baseline proven green and names the
// proof that must go red ON THAT GUARD'S OWN LINE. The shapes falsify.js reads (its header
// is the contract):
//   { name, path, old, new, prove }               a text edit; `old` must occur exactly once
//                                                  in the ORIGINAL file, or the run says NO VERDICT
//   { name, path: null, action, undo, prove }     a file-system action (a stray file, a moved
//                                                  folder) as two shell commands, run from the root
//   mustPrint: '…' | /…/   the guard's own line. The colour comes from the exit code or the
//                          BOOT VERDICT; this says WHICH guard went red. A run that is red
//                          without printing it (a sibling refusal, one of the 283 other checks)
//                          is reported as red for the wrong reason and does not match. Every
//                          entry here carries one, anchored on the file:line the spec promises
//                          and the words that name the fault, not on a whole sentence.
//   rebuild: false    the source edit is NOT rebuilt into server.js (that omission is the defect)
//   expect: 'GREEN'   the proof is expected green — used only where the guard's honest answer
//                     is "I could not look, and I said so": mustPrint is then the whole proof
// Anchors are written in UTF-8 here; falsify.js converts them to the file's bytes and
// keeps CRLF (server.js) and LF (src/) exactly. Every file is restored byte for byte, and
// the restore is verified (a sha1 of server.js and src/**, git status) after every entry.
//
// Source-side reverts anchor on src/all.js (the one source file until Round 129 cuts it);
// the hand-edit revert anchors on server.js, the generated file. Proofs:
//   'build'        node build.js refuses (exit 1)      'build-check'  node build.js --check red
//   'boot'         BOOT VERDICT: RED, or GREEN + a line   'static' / 'clientcheck'  by exit code
//
// Run by hand, not expressible as a revert: falsification 8b — with the header lint
// bypassed, a `✓ FAKE CHECK` in a source header must turn `node docs/lint-skills.js
// --check-refs` red (gen-refs counts it as a check name and the committed map disagrees).
// Also by hand: the Edit|Write hook (.claude/hooks/build-check.sh) — see round-128.md.
//
// The literal strings below ('process.env.', 'readFileSync(', a ⛔, a ✓) are scanned by
// nothing: gen-refs reads server.js and index.html, lint-skills reads the skills and
// round-NNN.md, verify-split reads *.md. This file is read only by falsify.js.
// ═══════════════════════════════════════════════════════════════════════════
const HEAD = "require('dotenv').config();";                                            // src/all.js:7 = server.js:7
const GOAL = '// Goal: after reading this file, Claude can find any mechanism of the server, because until the cut this is the whole program in one piece.';   // line 5
const OWNS = '// Owns: everything. Defines for others: everything. Guarded by: every check.';  // line 6, the last header line
const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
// (8c-8h) one entry per remaining HEADER_FORBIDDEN string in build.js: planted at the end of
// the last header line, the build refuses naming src/all.js:6, the word "header" and the
// string itself in build.js's JSON form (so "process.env." is demanded as "process.env.").
const inHeader = (name, bad) => ({ name, path: 'src/all.js', prove: 'build',
  old: OWNS + '\n', new: OWNS + ' ' + bad + '\n',
  mustPrint: new RegExp('src/all\\.js:6:.*header.*' + esc(JSON.stringify(bad))) });

module.exports = [
  // (1) a hand edit of ONE line of server.js: --check red naming server.js:LINE (src/all.js:L), and ⛔ BUILD CHECK at boot on that same location
  { name: '1a-hand-edit-server-js', path: 'server.js', prove: 'build-check',
    old: HEAD + '\r\n', new: HEAD + ' // edited by hand in server.js\r\n',
    mustPrint: 'server.js:7 (src/all.js:7)' },
  { name: '1b-hand-edit-server-js-boot', path: 'server.js', prove: 'boot',
    old: HEAD + '\r\n', new: HEAD + ' // edited by hand in server.js\r\n',
    mustPrint: /^⛔ BUILD CHECK: .*server\.js:7 \(src\/all\.js:7\)/m },
  // (2) src/all.js edited and never rebuilt: the same two reds, the same location
  { name: '2a-src-edit-not-rebuilt', path: 'src/all.js', prove: 'build-check', rebuild: false,
    old: HEAD + '\n', new: HEAD + ' // edited in src/, never rebuilt\n',
    mustPrint: 'server.js:7 (src/all.js:7)' },
  { name: '2b-src-edit-not-rebuilt-boot', path: 'src/all.js', prove: 'boot', rebuild: false,
    old: HEAD + '\n', new: HEAD + ' // edited in src/, never rebuilt\n',
    mustPrint: /^⛔ BUILD CHECK: .*server\.js:7 \(src\/all\.js:7\)/m },
  // (3) a CR byte in a source file: the build refuses, naming file:line and the byte
  { name: '3-cr-byte-in-source', path: 'src/all.js', prove: 'build',
    old: HEAD + '\n', new: HEAD + '\r\n',
    mustPrint: /src\/all\.js:7: .*CR/ },
  // (4) the final newline stripped: the build refuses (the line is the file's last, so it is not pinned — it moves with every edit above it)
  { name: '4-final-newline-stripped', path: 'src/all.js', prove: 'build',
    old: '  res.json(results);\n});\n', new: '  res.json(results);\n});',
    mustPrint: /src\/all\.js:\d+: last byte.*newline/ },
  // (5) a source file the manifest does not list: the build refuses it as unlisted, by name
  { name: '5-stray-source-file', path: null, prove: 'build',
    action: "printf '// stray\\n' > src/stray.js", undo: 'rm -f src/stray.js',
    mustPrint: /src\/stray\.js:1: .*manifest\.js/ },
  // (6) a file without a Goal line: the build refuses, naming the file and the Goal
  { name: '6-no-goal-line', path: 'src/all.js', prove: 'build',
    old: GOAL + '\n', new: GOAL.replace('// Goal:', '// Aim:') + '\n',
    mustPrint: /src\/all\.js:1: header has no Goal line/ },   // the Goal guard's own words: "src/all.js:1: .*Goal" also matched the no-header refusal, which names the Goal prefix too
  // (7) src/ moved away: the boot says ⚠ BUILD CHECK SKIPPED and the verdict is unchanged (GREEN); --check is red because the manifest is gone
  { name: '7a-src-moved-away-boot', path: null, prove: 'boot', expect: 'GREEN', mustPrint: '⚠ BUILD CHECK SKIPPED',
    action: 'mv src src.away', undo: 'mv src.away src' },
  { name: '7b-src-moved-away-check', path: null, prove: 'build-check',
    action: 'mv src src.away', undo: 'mv src.away src',
    mustPrint: /src\/manifest\.js.*missing/ },
  // (8a) a check glyph in a source header: the header lint inside the build refuses (8b is by hand, see above)
  { name: '8a-fake-check-in-header', path: 'src/all.js', prove: 'build',
    old: OWNS + '\n', new: OWNS + ' ✓ FAKE CHECK\n',
    mustPrint: /src\/all\.js:6:.*header.*"✓"/ },
  // (8c-8h) the six other strings a header may not carry, one revert each — a list that lost an entry, or a loop that stops after the first, goes green here
  inHeader('8c-stop-glyph-in-header', '⛔'),
  inHeader('8d-process-env-in-header', 'process.env.'),
  inHeader('8e-req-query-in-header', 'req.query.'),
  inHeader('8f-readfilesync-in-header', 'readFileSync('),
  inHeader('8g-filename-in-header', '__filename'),
  inHeader('8h-hold-in-header', 'Hold();'),
  // (9) a second readFileSync(__filename inside BUILD CHECK: ⛔ BOOT HEAP CHECK counts two reads (one read, memoised, is the rule)
  { name: '9-second-self-read-in-build-check', path: 'src/all.js', prove: 'boot',
    old: "      const _r = require('./build.js').verify(__dirname, selfSource());\n",      // the live verify call, verbatim (BOOT HEAP CHECK counts the exact text of a read)
    new: "      const _r = require('./build.js').verify(__dirname, require('fs').readFileSync(__filename, 'utf8'));\n",
    mustPrint: /^⛔ BOOT HEAP CHECK: 2 .*reads/m },
  // (9b) the same second read through an ALIAS (the spelling BOOT HEAP CHECK's exact-text count
  // cannot see): BUILD CHECK scans its own block's text out of selfSource() and goes red itself
  { name: '9b-aliased-self-read-in-build-check', path: 'src/all.js', prove: 'boot',
    old: "      const _r = require('./build.js').verify(__dirname, selfSource());\n",
    new: "      const _fs = require('fs'); const _r = require('./build.js').verify(__dirname, _fs.readFileSync(__filename, 'utf8'));\n",
    mustPrint: /^⛔ BUILD CHECK: .*second read of this file/m },
  // (9c) the spelling the scan once let through — the fs module called through .call on a path
  // built from __dirname — planted inside the block: the scan bars the fs require and the
  // read-file word themselves now, and the block's own reads go through readBeside above it
  { name: '9c-dot-call-self-read-in-build-check', path: 'src/all.js', prove: 'boot',
    old: "    const _own = selfSource();\n",
    new: "    const _own = selfSource(); const _again = require('fs').readFileSync.call(require('fs'), require('path').join(__dirname, 'server.js'), 'utf8'); globalThis._keep = _again;\n",
    mustPrint: /^⛔ BUILD CHECK: .*second read of this file/m },
  // (9d) the scan window's edge repeated elsewhere in the file: the block it scans would be
  // undefined, so the boot says the phrase occurs twice instead of reporting a read that is not there
  { name: '9d-banner-phrase-repeated', path: 'src/all.js', prove: 'boot',
    old: HEAD + '\n', new: HEAD + ' // see THE FILE EVERY CHECK READS below for why this file is generated\n',
    mustPrint: /^⛔ BUILD CHECK: .*banner phrase occurs 2 time/m },
  // (10) the call-site pin (check-writing-traps §2): BUILD CHECK reads ci-gates.sh and demands
  // that the FIRST uncommented gate line be the byte proof — comment that line out and the
  // boot names the gate CI would run instead; move the file away and the boot says so in a
  // ⚠ line, stays GREEN, and the ✓ line says the pin went unchecked (never a silent pass)
  { name: '10a-ci-gates-proof-commented-out', path: 'ci-gates.sh', prove: 'boot',
    old: '  run node build.js --check\n', new: '  # run node build.js --check\n',
    mustPrint: /^⛔ BUILD CHECK: the first uncommented gate in ci-gates\.sh is "run node --check server\.js", not "run node build\.js --check"/m },
  { name: '10b-ci-gates-moved-away', path: null, prove: 'boot', expect: 'GREEN', mustPrint: '⚠ BUILD CHECK PIN SKIPPED',
    action: 'mv ci-gates.sh ci-gates.sh.away', undo: 'mv ci-gates.sh.away ci-gates.sh' },
  // (11) the refusals the review added to build.js, one revert each, so a refusal that is
  // dropped from the list goes green here: a symbolic link under src/; a byte that is not
  // UTF-8 (planted by bytes — an anchor in this file is UTF-8, so it cannot carry one);
  // a literal U+FFFD; a first file whose banner is not the exact GENERATED line; a manifest
  // entry that climbs out of src/; a manifest that lists itself
  { name: '11a-symlink-under-src', path: null, prove: 'build',
    action: 'ln -s all.js src/link.js', undo: 'rm -f src/link.js',
    mustPrint: /src\/link\.js:1: is a symbolic link/ },
  { name: '11b-byte-not-utf8-in-source', path: null, prove: 'build',
    // appends " // " + 0xFF to line 7 of src/all.js (the 7th LF is its end); the undo strips exactly those five bytes or exits 9
    action: `node -e "const fs=require('fs'),b=fs.readFileSync('src/all.js');let i=-1;for(let k=0;k<7;k++)i=b.indexOf(10,i+1);fs.writeFileSync('src/all.js',Buffer.concat([b.subarray(0,i),Buffer.from([32,47,47,32,255]),b.subarray(i)]))"`,
    undo: `node -e "const fs=require('fs'),b=fs.readFileSync('src/all.js');let i=-1;for(let k=0;k<7;k++)i=b.indexOf(10,i+1);if(!b.subarray(i-5,i).equals(Buffer.from([32,47,47,32,255])))process.exit(9);fs.writeFileSync('src/all.js',Buffer.concat([b.subarray(0,i-5),b.subarray(i)]))"`,
    mustPrint: /src\/all\.js:7: not valid UTF-8/ },
  { name: '11c-literal-replacement-char-in-source', path: 'src/all.js', prove: 'build',
    old: HEAD + '\n', new: HEAD + ' // �\n',
    mustPrint: /src\/all\.js:7: literal U\+FFFD/ },
  { name: '11d-banner-not-exact', path: 'src/all.js', prove: 'build',
    old: '// GENERATED by build.js from src/ — do not edit server.js. Edit src/, run node build.js.\n',
    new: '// Generated by build.js from src/ — do not edit server.js. Edit src/, run node build.js.\n',
    mustPrint: /src\/all\.js:1: the first source file must open with the GENERATED banner line/ },
  { name: '11e-manifest-entry-climbs-out', path: 'src/manifest.js', prove: 'build',
    old: "module.exports = ['all.js'];\n", new: "module.exports = ['../all.js'];\n",
    mustPrint: /src\/manifest\.js: entry "\.\.\/all\.js" is not a plain src-relative path/ },
  { name: '11f-manifest-lists-itself', path: 'src/manifest.js', prove: 'build',
    old: "module.exports = ['all.js'];\n", new: "module.exports = ['all.js', 'manifest.js'];\n",
    mustPrint: /src\/manifest\.js: entry "manifest\.js" — the manifest may not list itself/ },
  // (12) two shapes Round 129's cut can produce: a file that ends on a blank line (the refusal
  // says to MOVE that line to the top of the next file, never delete it — it is a line of
  // server.js), and a manifest entry that names a directory (refused by name, not Node's bare
  // EISDIR). The directory is listed FIRST: layout() reads the manifest in order and a second
  // entry makes the 800-line cap live, so listed second it would be all.js's cap refusal that
  // fires (naming src/all.js:801), never the line this revert is about
  { name: '12a-file-ends-on-a-blank-line', path: 'src/all.js', prove: 'build',
    old: '  res.json(results);\n});\n', new: '  res.json(results);\n});\n\n',
    mustPrint: /src\/all\.js:\d+: ends on a blank line/ },
  { name: '12b-manifest-entry-is-a-directory', path: null, prove: 'build',
    action: "mkdir src/d.js && sed -i \"s/\\['all.js'\\]/['d.js', 'all.js']/\" src/manifest.js",
    undo: "rmdir src/d.js; sed -i \"s/\\['d.js', 'all.js'\\]/['all.js']/\" src/manifest.js",
    mustPrint: /src\/d\.js:1: is not a regular file/ },
];
