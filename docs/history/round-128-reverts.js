// ═══════════════════════════════════════════════════════════════════════════
// ROUND 128 — the falsifications, as reverts for `node falsify.js docs/history/round-128-reverts.js`.
//
// Each entry undoes ONE guard's premise against a baseline proven green and names the
// proof that must go red. The shapes falsify.js reads (its header is the contract):
//   { name, path, old, new, prove }               a text edit; `old` must occur exactly once
//                                                  in the ORIGINAL file, or the run says NO VERDICT
//   { name, path: null, action, undo, prove }     a file-system action (a stray file, a moved
//                                                  folder) as two shell commands, run from the root
//   rebuild: false    the source edit is NOT rebuilt into server.js (that omission is the defect)
//   expect: 'GREEN'   the proof is expected green — used only where the guard's honest answer
//   mustPrint: '…'    is "I could not look, and I said so": the printed line is the proof
// Anchors are written in UTF-8 here; falsify.js converts them to the file's bytes and
// keeps CRLF (server.js) and LF (src/) exactly. Every file is restored byte for byte.
//
// Source-side reverts anchor on src/all.js (the one source file until Round 129 cuts it);
// the hand-edit revert anchors on server.js, the generated file. Proofs:
//   'build'        node build.js refuses (exit 1)      'build-check'  node build.js --check red
//   'boot'         BOOT VERDICT: RED, or GREEN + a line   'static' / 'clientcheck'  by exit code
//
// Run by hand, not expressible as a revert: falsification 8b — with the header lint
// bypassed, a `✓ FAKE CHECK` in a source header must turn `node docs/lint-skills.js
// --check-refs` red (gen-refs counts it as a check name and the committed map disagrees).
// ═══════════════════════════════════════════════════════════════════════════
const HEAD = "require('dotenv').config();";
module.exports = [
  // (1) a hand edit of ONE line of server.js: --check red naming server.js:LINE (src/all.js:L), and ⛔ BUILD CHECK at boot
  { name: '1a-hand-edit-server-js', path: 'server.js', prove: 'build-check',
    old: HEAD + '\r\n', new: HEAD + ' // edited by hand in server.js\r\n' },
  { name: '1b-hand-edit-server-js-boot', path: 'server.js', prove: 'boot',
    old: HEAD + '\r\n', new: HEAD + ' // edited by hand in server.js\r\n' },
  // (2) src/all.js edited and never rebuilt: the same two reds
  { name: '2a-src-edit-not-rebuilt', path: 'src/all.js', prove: 'build-check', rebuild: false,
    old: HEAD + '\n', new: HEAD + ' // edited in src/, never rebuilt\n' },
  { name: '2b-src-edit-not-rebuilt-boot', path: 'src/all.js', prove: 'boot', rebuild: false,
    old: HEAD + '\n', new: HEAD + ' // edited in src/, never rebuilt\n' },
  // (3) a CR byte in a source file: the build refuses, naming file:line
  { name: '3-cr-byte-in-source', path: 'src/all.js', prove: 'build',
    old: HEAD + '\n', new: HEAD + '\r\n' },
  // (4) the final newline stripped: the build refuses
  { name: '4-final-newline-stripped', path: 'src/all.js', prove: 'build',
    old: '  res.json(results);\n});\n', new: '  res.json(results);\n});' },
  // (5) a source file the manifest does not list: the build refuses it as unlisted
  { name: '5-stray-source-file', path: null, prove: 'build',
    action: "printf '// stray\\n' > src/stray.js", undo: 'rm -f src/stray.js' },
  // (6) a file without a Goal line: the build refuses
  { name: '6-no-goal-line', path: 'src/all.js', prove: 'build',
    old: '// Goal: after reading this file, Claude can find any mechanism of the server, because until the cut this is the whole program in one piece.\n',
    new: '// Aim: after reading this file, Claude can find any mechanism of the server, because until the cut this is the whole program in one piece.\n' },
  // (7) src/ moved away: the boot says ⚠ BUILD CHECK SKIPPED and the verdict is unchanged (GREEN); --check is red
  { name: '7a-src-moved-away-boot', path: null, prove: 'boot', expect: 'GREEN', mustPrint: '⚠ BUILD CHECK SKIPPED',
    action: 'mv src src.away', undo: 'mv src.away src' },
  { name: '7b-src-moved-away-check', path: null, prove: 'build-check',
    action: 'mv src src.away', undo: 'mv src.away src' },
  // (8a) a check glyph in a source header: the header lint inside the build refuses (8b is by hand, see above)
  { name: '8a-fake-check-in-header', path: 'src/all.js', prove: 'build',
    old: '// Owns: everything. Defines for others: everything. Guarded by: every check.\n',
    new: '// Owns: everything. Defines for others: everything. Guarded by: every check. ✓ FAKE CHECK\n' },
  // (9) a second readFileSync(__filename inside BUILD CHECK: ⛔ BOOT HEAP CHECK (one read, memoised, is the rule)
  { name: '9-second-self-read-in-build-check', path: 'src/all.js', prove: 'boot',
    old: "      const _r = require(_p.join(__dirname, 'build.js')).verify(__dirname, selfSource());\n",
    new: "      const _r = require(_p.join(__dirname, 'build.js')).verify(__dirname, require('fs').readFileSync(__filename, 'utf8'));\n" },
];
