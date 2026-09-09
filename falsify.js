// ═══════════════════════════════════════════════════════════════════════════
// FALSIFY — prove each fix's guard guards, by reverting that fix ALONE against a
// baseline proven green and demanding the guard go red on its OWN named line.
//
//   node falsify.js docs/history/round-128-reverts.js            every revert
//   node falsify.js docs/history/round-128-reverts.js NAME NAME  only these
//
// The reverts module exports a non-empty array; each entry is one of two shapes:
//   { name, path, old, new, prove }        a text edit: `old` must occur EXACTLY once
//                                          in the ORIGINAL file (zero or two = NO VERDICT)
//   { name, path: null, action, undo, prove }  a file-system action as two shell
//                                          commands (a stray file, a moved folder)
// `prove` names the proof that must go red once the revert is applied:
//   'boot'         node --max-old-space-size=256 server.js on a fresh port from 4920 (FALSIFY_PORT),
//                  judged by its BOOT VERDICT line (none printed = NO VERDICT, never a pass)
//   'build-check'  node build.js --check                    (exit code)
//   'build'        node build.js                            (exit code: the build itself refuses)
//   'static'       GATES=static bash ci-gates.sh            (exit code)
//   'clientcheck'  node clientcheck.js                      (exit code)
// `mustPrint` (a string or a RegExp, any proof kind) is the guard's OWN line: the colour
// still comes from the exit code / verdict, but a run that is red without printing this
// is reported as red for the WRONG reason and does not match — a mis-edited anchor that
// trips a sibling refusal, or a boot red on any of the 283 other checks, proves nothing about
// the guard the revert names (check-writing-traps §4, §6). For 'boot' the text searched
// is the boot log; for every other proof it is the command's stdout+stderr. Every revert
// should carry one. Optional: `rebuild: false` skips `node build.js` after applying an
// edit under src/ (for "edited src/ but forgot to rebuild"); `expect: 'GREEN'` for the
// rare revert whose proof is that a check is SKIPPED and says so (with mustPrint).
//
// What this file does mechanically, each rule earned by a live failure (skill `falsify`):
//   - a selection that names no revert (a mistyped NAME, an empty list) stops with exit 2
//     BEFORE the baseline and says no revert ran; "0 of 0 matched" was once a green exit
//   - the baseline is proven green first (boot, clientcheck, build-check when build.js
//     exists, and every proof the list uses), and it STOPS at the first kind that is not
//     green: a harness whose baseline is already red proves reds too cheaply — and a stale
//     or hand-edited server.js stops at build-check, which runs before 'build' (a proof
//     that WRITES server.js, so running it after a red build-check would overwrite the
//     evidence the red is about), never as a restore failure
//   - FALSIFY_LOG_DIR may not be the repo root or a folder containing it (exit 2 before
//     anything runs): the boot logs are filtered out of `git status` by their path
//     relative to the root, and a log dir at or above the root makes that path empty, so
//     every revert would report RESTORE FAILED on its own logs; a subfolder of the repo
//     stays allowed and is filtered as before
//   - every read and write is bytes (latin1 round-trips every byte), so server.js keeps
//     its CRLF and src/ keeps its LF; anchors are converted to the same encoding
//   - a revert under src/ rebuilds server.js after applying (the built file is what
//     boots) and again after restoring, then compares the restored server.js to the
//     snapshot byte for byte
//   - every file touched is restored in a `finally`, byte for byte, even when the proof
//     throws; NO VERDICT is reported as itself, never as RED
//   - the restore is VERIFIED, not trusted: a sha1 of server.js and of every file under
//     src/ (walked, sorted, streamed) plus `git status --porcelain` (when there is a git
//     tree) is taken once the baseline is green, and compared after every revert and at
//     the end; an undo that exits non-zero, a rebuild that refuses or differs, a changed,
//     missing or new path, or a changed git status prints RESTORE FAILED naming it, and
//     the run exits 1 whatever the verdicts were (an undo that "succeeded" once nested
//     src/ inside a leftover src.away/; only the bytes can tell)
//   - exit 1 unless every revert matched its expectation (RED, printing its line, unless
//     the list says otherwise) AND the tree is what it was; exit 2 for a usage error
// ═══════════════════════════════════════════════════════════════════════════
'use strict';
const fs = require('fs'), path = require('path'), os = require('os'), cp = require('child_process'), crypto = require('crypto');
const ROOT = __dirname;
const NODE = process.execPath;
const listPath = process.argv[2];
if (!listPath) { console.error('usage: node falsify.js <reverts.js> [NAME ...]'); process.exit(2); }
const REVERTS = require(path.resolve(listPath));
if (!Array.isArray(REVERTS) || !REVERTS.length) { console.error(`NO REVERT RAN: ${listPath} exports ${Array.isArray(REVERTS) ? 'an empty list' : 'no array'} — there is nothing to falsify, and nothing is not a pass`); process.exit(2); }
const ONLY = new Set(process.argv.slice(3));
const unknown = [...ONLY].filter(n => !REVERTS.some(r => r.name === n));
if (unknown.length) { console.error(`NO REVERT RAN: no revert named ${unknown.join(', ')} in ${listPath}. The names are: ${REVERTS.map(r => r.name).join(', ')}`); process.exit(2); }
const LOGDIR = process.env.FALSIFY_LOG_DIR ? path.resolve(process.env.FALSIFY_LOG_DIR) : fs.mkdtempSync(path.join(os.tmpdir(), 'falsify-'));
{ // the log dir may not be the repo root or contain it: the logs are filtered out of git status by their path relative to ROOT, which is '' or '..'-led for either
  const rel = path.relative(ROOT, LOGDIR);
  if (rel === '' || (rel.startsWith('..') && !path.relative(LOGDIR, ROOT).startsWith('..'))) { console.error(`FALSIFY_LOG_DIR=${LOGDIR} is the repo root or a folder containing it — the boot logs would land in the tree the restore is measured against and every revert would report RESTORE FAILED on its own logs. Use a folder outside the repo, or a subfolder of it`); process.exit(2); }
}
fs.mkdirSync(LOGDIR, { recursive: true });
let port = Number(process.env.FALSIFY_PORT) || 4920;                        // boots take port+1, port+2, ...; FALSIFY_PORT moves the base off a busy range
const abs = p => path.isAbsolute(p) ? p : path.join(ROOT, p);
const readB = p => fs.readFileSync(abs(p)).toString('latin1');           // bytes, untouched
const writeB = (p, s) => fs.writeFileSync(abs(p), Buffer.from(s, 'latin1'));
const toBytes = s => Buffer.from(s, 'utf8').toString('latin1');           // an anchor written in UTF-8 → the file's byte view
const underSrc = p => p && /^src[\\/]/.test(path.relative(ROOT, abs(p)));
const clip = s => String(s || '').replace(/\s+/g, ' ').trim().slice(0, 160);
const show = n => n instanceof RegExp ? String(n) : JSON.stringify(n);

// ── the proofs: each returns { verdict: 'RED'|'GREEN'|'NO VERDICT', why, text } ──
function sh(cmd, args, extraEnv) {
  const r = cp.spawnSync(cmd, args, { cwd: ROOT, encoding: 'utf8', env: { ...process.env, ...(extraEnv || {}) }, maxBuffer: 1 << 26 });
  return { code: r.status, out: (r.stdout || '') + (r.stderr || '') };
}
function firstBad(out) {
  const lines = out.split('\n').map(l => l.trim()).filter(Boolean);
  return lines.find(l => /^(✗|⛔|✗✗)/.test(l) && !/MODEL DECLINED \[selftest\]/.test(l)) || lines.find(l => /GATE FAILED|refus|differ|mismatch|does not|not found|missing/i.test(l)) || lines[lines.length - 1] || '';
}
function byExit(cmd, args, extraEnv) {
  const { code, out } = sh(cmd, args, extraEnv);
  if (code === null) return { verdict: 'NO VERDICT', why: `${cmd} ${args.join(' ')} did not exit`, text: out };
  return { verdict: code === 0 ? 'GREEN' : 'RED', why: code === 0 ? '' : clip(firstBad(out)), text: out };   // text: what mustPrint searches
}
function boot(tag) {
  port += 1;
  const log = path.join(LOGDIR, `boot-${port}-${tag}.log`);
  const fd = fs.openSync(log, 'w');
  const child = cp.spawn(NODE, ['--max-old-space-size=256', 'server.js'], { cwd: ROOT, env: { ...process.env, PORT: String(port) }, stdio: ['ignore', fd, fd] });
  return new Promise(resolve => {
    const started = Date.now(); let done = false;
    const finish = res => { if (done) return; done = true; clearInterval(t); try { child.kill(); } catch (e) {} fs.closeSync(fd); resolve({ ...res, log }); };
    child.on('exit', () => setTimeout(() => finish(judge()), 300));
    const judge = () => {
      let txt = ''; try { txt = fs.readFileSync(log, 'utf8'); } catch (e) {}
      const line = txt.split('\n').find(l => l.startsWith('BOOT VERDICT'));
      if (!line) return { verdict: 'NO VERDICT', why: 'no BOOT VERDICT line was printed (the process died or hung): ' + clip(txt.trim().split('\n').slice(-1)[0]), text: txt };
      const red = txt.split('\n').find(l => l.startsWith('⛔') && !/MODEL DECLINED \[selftest\]/.test(l));
      const first = /First failure: (.*)$/.exec(line);
      return { verdict: /^BOOT VERDICT: GREEN/.test(line) ? 'GREEN' : 'RED', why: clip(red || (first && first[1]) || ''), text: txt };
    };
    const t = setInterval(() => { const r = judge(); if (r.verdict !== 'NO VERDICT') finish(r); else if (Date.now() - started > 300000) finish(r); }, 1000);
  });
}
const PROOFS = {
  boot: tag => boot(tag),
  'build-check': () => byExit(NODE, ['build.js', '--check']),
  build: () => byExit(NODE, ['build.js']),
  static: () => byExit('bash', ['ci-gates.sh'], { GATES: 'static' }),
  clientcheck: () => byExit(NODE, ['clientcheck.js']),
};

// ── the tree, fingerprinted: server.js + src/** by sha1 (streamed, sorted) + git status ──
function hashFile(p) {
  const h = crypto.createHash('sha1'), fd = fs.openSync(p, 'r'), buf = Buffer.allocUnsafe(1 << 20);
  try { let n; while ((n = fs.readSync(fd, buf, 0, buf.length, null)) > 0) h.update(buf.subarray(0, n)); } finally { fs.closeSync(fd); }
  return h.digest('hex');
}
function treeSnapshot() {
  const files = {};
  const walk = (dir, rel) => {
    if (!fs.existsSync(dir)) return;
    for (const e of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const r = rel + '/' + e.name;
      if (e.isDirectory()) walk(path.join(dir, e.name), r);
      else if (e.isFile()) files[r] = hashFile(path.join(dir, e.name));
    }
  };
  if (fs.existsSync(abs('server.js'))) files['server.js'] = hashFile(abs('server.js'));
  walk(abs('src'), 'src');
  const g = sh('git', ['status', '--porcelain']);                       // no git here (a scratch copy) → null: the hashes alone are the proof
  const logRel = path.relative(ROOT, LOGDIR);
  const git = g.code === 0 ? g.out.split('\n').filter(l => l && !(logRel && !logRel.startsWith('..') && l.slice(3).startsWith(logRel))).sort() : null;
  return { files, git };
}
function treeDiff(before, after) {                                       // '' when identical, else the first difference, named
  for (const p of Object.keys(before.files)) if (!(p in after.files)) return `${p} is missing`;
  for (const p of Object.keys(after.files)) if (!(p in before.files)) return `${p} is new (not there before)`;
  for (const p of Object.keys(before.files)) if (before.files[p] !== after.files[p]) return `${p} changed (sha1 differs)`;
  if (before.git && after.git) {
    const b = new Set(before.git), a = new Set(after.git);
    const gone = before.git.find(l => !a.has(l)), came = after.git.find(l => !b.has(l));
    if (gone || came) return `git status changed: ${came ? '"' + came + '" appeared' : '"' + gone + '" is gone'}`;
  }
  return '';
}

async function main() {
  const wanted = REVERTS.filter(r => !ONLY.size || ONLY.has(r.name));
  if (!wanted.length) { console.error(`NO REVERT RAN: the selection matched nothing in ${listPath}`); process.exit(2); }
  for (const r of wanted) if (!PROOFS[r.prove]) { console.log(`${r.name}: unknown proof '${r.prove}'`); process.exit(2); }
  for (const r of wanted) if (r.mustPrint !== undefined && typeof r.mustPrint !== 'string' && !(r.mustPrint instanceof RegExp)) { console.log(`${r.name}: mustPrint must be a string or a RegExp`); process.exit(2); }
  const hasBuild = fs.existsSync(path.join(ROOT, 'build.js'));

  console.log(`== baseline, proved before anything is reverted (logs: ${LOGDIR}) ==`);
  const kinds = [...new Set(['boot', 'clientcheck', ...(hasBuild ? ['build-check'] : []), ...wanted.map(r => r.prove)])].filter(k => hasBuild || !/^build/.test(k));
  // 'build-check' sits before 'build' in `kinds` (the fixed prefix above puts it there, and
  // wanted.map only appends), and the loop stops at the FIRST kind that is not green: 'build'
  // WRITES server.js, so a hand-edited or stale server.js that build-check reported red must
  // not be overwritten by the next kind before "Stopping" — that file is the evidence.
  let baseRed = false;
  for (const k of kinds) {
    const res = await PROOFS[k]('baseline');
    console.log(`  ${k.padEnd(12)} ${res.verdict}${res.why ? '  ' + res.why : ''}`);
    if (res.verdict !== 'GREEN') { baseRed = true; break; }
  }
  if (baseRed) { console.log('BASELINE NOT GREEN — a harness whose baseline is already red proves reds too cheaply. Stopping here, before any later proof runs (a build would overwrite server.js, the evidence).'); process.exit(1); }
  const base = treeSnapshot();                                           // what every restore is measured against
  console.log(`  tree         ${Object.keys(base.files).length} file(s) fingerprinted${base.git ? `, git status ${base.git.length} line(s)` : ', no git here (hashes alone)'}`);

  let ok = 0, restoreFailed = false;
  for (const r of wanted) {
    const expect = r.expect || 'RED';
    const snap = {};                                                    // path → original bytes, restored in finally
    const serverSnap = readB('server.js');
    let res = { verdict: 'NO VERDICT', why: '' };
    let actionRan = false, actionOk = false;
    try {
      if (r.path) {
        const src = readB(r.path), old = toBytes(r.old), neu = toBytes(r.new);
        const n = src.split(old).length - 1;
        if (n !== 1) { console.log(`${r.name.padEnd(28)} NO VERDICT  the revert anchor matched ${n} times in ${r.path}, so it did not apply`); continue; }
        snap[r.path] = src;
        writeB(r.path, src.replace(old, () => neu));
      } else {
        if (!r.action || !r.undo) { console.log(`${r.name.padEnd(28)} NO VERDICT  path is null but action/undo are not both given`); continue; }
        actionRan = true;
        const a = sh('bash', ['-c', r.action]);
        if (a.code !== 0) { console.log(`${r.name.padEnd(28)} NO VERDICT  the action failed: ${clip(a.out)}`); continue; }
        actionOk = true;
      }
      // the built file is what boots: a source edit is rebuilt unless the list says not to,
      // and when the proof is the build itself the rebuild IS the proof
      if (r.prove === 'build') res = PROOFS.build();
      else {
        if (underSrc(r.path) && r.rebuild !== false && hasBuild) {
          const b = byExit(NODE, ['build.js']);
          if (b.verdict !== 'GREEN') res = { verdict: 'NO VERDICT', why: 'the rebuild after applying refused, so there was no built file to prove: ' + b.why, skip: true };
        }
        if (!res.skip) res = await PROOFS[r.prove](r.name.replace(/[^A-Za-z0-9-]/g, '_'));
      }
      // the guard's OWN line: red for another reason is not this guard's red
      if (r.mustPrint !== undefined && res.verdict !== 'NO VERDICT') {
        const text = res.text || '';
        const hit = r.mustPrint instanceof RegExp ? new RegExp(r.mustPrint.source, r.mustPrint.flags.replace('g', '')).test(text) : text.includes(r.mustPrint);
        if (!hit) res = { ...res, why: `${res.verdict} but NOT on the guard's own line — the run did not print ${show(r.mustPrint)}; it printed: ${res.why || clip(firstBad(text)) || '(nothing)'}`, missed: true };
      }
    } catch (e) {
      res = { verdict: 'NO VERDICT', why: 'the harness threw: ' + clip(e && e.message) };
    } finally {
      const problems = [];
      for (const p of Object.keys(snap)) writeB(p, snap[p]);
      if (actionRan) {                                                  // undo runs even when the action failed half-way; its exit only counts when the action had succeeded
        const u = sh('bash', ['-c', r.undo]);
        if (u.code !== 0 && actionOk) problems.push(`the undo "${r.undo}" exited ${u.code}: ${clip(u.out)}`);
      }
      writeB('server.js', serverSnap);
      if (hasBuild && (underSrc(r.path) || !r.path)) {
        const b = byExit(NODE, ['build.js']);
        if (b.verdict !== 'GREEN' || readB('server.js') !== serverSnap) { writeB('server.js', serverSnap); problems.push(b.verdict !== 'GREEN' ? `the rebuild after the restore refused (${b.why}), so src/ is not what it was` : 'the rebuild after the restore did not reproduce the snapshot server.js, so src/ is not what it was'); }
      }
      const d = treeDiff(base, treeSnapshot());
      if (d) problems.push(d);
      if (problems.length) { restoreFailed = true; console.log(`RESTORE FAILED after ${r.name}: ${problems.join(' | ')} — the tree is NOT what it was before this run; put it right by hand (git status, git checkout) before trusting any line below or above`); }
    }
    const matched = res.verdict === expect && !res.missed;
    if (matched) ok += 1;
    const demand = expect !== 'RED' || r.mustPrint !== undefined ? `(expected ${expect}${r.mustPrint !== undefined ? ' printing ' + show(r.mustPrint) : ''}: ${matched ? 'as expected' : 'NOT as expected'}) ` : '';
    console.log(`${r.name.padEnd(28)} ${res.verdict.padEnd(11)} ${demand}${res.why || ''}`);
  }
  // the tree must be exactly what it was
  const finalDiff = treeDiff(base, treeSnapshot());
  if (finalDiff) { restoreFailed = true; console.log(`RESTORE FAILED at the end: ${finalDiff}`); }
  console.log(`\n${ok} of ${wanted.length} matched expectation (RED on its own line unless the list says otherwise).${restoreFailed ? '\n!! RESTORE FAILED — exit 1 regardless of the verdicts above; the tree must be put right by hand' : ' Tree restored: verified byte for byte.'}`);
  process.exit(ok === wanted.length && !restoreFailed ? 0 : 1);
}
main().catch(e => { console.error('falsify.js failed: ' + (e && e.stack || e)); process.exit(2); });
