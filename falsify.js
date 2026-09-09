// ═══════════════════════════════════════════════════════════════════════════
// FALSIFY — prove each fix's guard guards, by reverting that fix ALONE against a
// baseline proven green and demanding the guard go red on its own named line.
//
//   node falsify.js docs/history/round-128-reverts.js            every revert
//   node falsify.js docs/history/round-128-reverts.js NAME NAME  only these
//
// The reverts module exports an array; each entry is one of two shapes:
//   { name, path, old, new, prove }        a text edit: `old` must occur EXACTLY once
//                                          in the ORIGINAL file (zero or two = NO VERDICT)
//   { name, path: null, action, undo, prove }  a file-system action as two shell
//                                          commands (a stray file, a moved folder)
// `prove` names the proof that must go red once the revert is applied:
//   'boot'         node --max-old-space-size=256 server.js on a fresh port from 4920,
//                  judged by its BOOT VERDICT line (none printed = NO VERDICT, never a pass)
//   'build-check'  node build.js --check                    (exit code)
//   'build'        node build.js                            (exit code: the build itself refuses)
//   'static'       GATES=static bash ci-gates.sh            (exit code)
//   'clientcheck'  node clientcheck.js                      (exit code)
// Optional fields: `rebuild: false` skips `node build.js` after applying an edit under
// src/ (for "edited src/ but forgot to rebuild"); `expect: 'GREEN'` with `mustPrint`
// for the rare revert whose proof is that a check is SKIPPED and says so.
//
// What this file does mechanically, each rule earned by a live failure (skill `falsify`):
//   - the baseline is proven green first (boot, clientcheck, and every proof the list
//     uses); a harness whose baseline is already red proves reds too cheaply
//   - every read and write is bytes (latin1 round-trips every byte), so server.js keeps
//     its CRLF and src/ keeps its LF; anchors are converted to the same encoding
//   - a revert under src/ rebuilds server.js after applying (the built file is what
//     boots) and again after restoring, then compares the restored server.js to the
//     snapshot byte for byte
//   - every file touched is restored in a `finally`, byte for byte, even when the proof
//     throws; NO VERDICT is reported as itself, never as RED
//   - exit 1 unless every revert matched its expectation (RED by default)
// ═══════════════════════════════════════════════════════════════════════════
'use strict';
const fs = require('fs'), path = require('path'), os = require('os'), cp = require('child_process');
const ROOT = __dirname;
const NODE = process.execPath;
const listPath = process.argv[2];
if (!listPath) { console.error('usage: node falsify.js <reverts.js> [NAME ...]'); process.exit(2); }
const REVERTS = require(path.resolve(listPath));
const ONLY = new Set(process.argv.slice(3));
const LOGDIR = process.env.FALSIFY_LOG_DIR ? path.resolve(process.env.FALSIFY_LOG_DIR) : fs.mkdtempSync(path.join(os.tmpdir(), 'falsify-'));
fs.mkdirSync(LOGDIR, { recursive: true });
let port = 4920;
const abs = p => path.isAbsolute(p) ? p : path.join(ROOT, p);
const readB = p => fs.readFileSync(abs(p)).toString('latin1');           // bytes, untouched
const writeB = (p, s) => fs.writeFileSync(abs(p), Buffer.from(s, 'latin1'));
const toBytes = s => Buffer.from(s, 'utf8').toString('latin1');           // an anchor written in UTF-8 → the file's byte view
const underSrc = p => p && /^src[\\/]/.test(path.relative(ROOT, abs(p)));
const clip = s => String(s || '').replace(/\s+/g, ' ').trim().slice(0, 160);

// ── the proofs: each returns { verdict: 'RED'|'GREEN'|'NO VERDICT', why } ──
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
  if (code === null) return { verdict: 'NO VERDICT', why: `${cmd} ${args.join(' ')} did not exit` };
  return { verdict: code === 0 ? 'GREEN' : 'RED', why: code === 0 ? '' : clip(firstBad(out)) };
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

async function main() {
  const wanted = REVERTS.filter(r => !ONLY.size || ONLY.has(r.name));
  for (const r of wanted) if (!PROOFS[r.prove]) { console.log(`${r.name}: unknown proof '${r.prove}'`); process.exit(2); }
  const hasBuild = fs.existsSync(path.join(ROOT, 'build.js'));

  console.log(`== baseline, proved before anything is reverted (logs: ${LOGDIR}) ==`);
  const kinds = [...new Set(['boot', 'clientcheck', ...wanted.map(r => r.prove)])].filter(k => hasBuild || !/^build/.test(k));
  let baseRed = false;
  for (const k of kinds) {
    const res = await PROOFS[k]('baseline');
    console.log(`  ${k.padEnd(12)} ${res.verdict}${res.why ? '  ' + res.why : ''}`);
    if (res.verdict !== 'GREEN') baseRed = true;
  }
  if (baseRed) { console.log('BASELINE NOT GREEN — a harness whose baseline is already red proves reds too cheaply. Stopping.'); process.exit(1); }

  let ok = 0;
  for (const r of wanted) {
    const expect = r.expect || 'RED';
    const snap = {};                                                    // path → original bytes, restored in finally
    const serverSnap = readB('server.js');
    let res = { verdict: 'NO VERDICT', why: '' };
    try {
      if (r.path) {
        const src = readB(r.path), old = toBytes(r.old), neu = toBytes(r.new);
        const n = src.split(old).length - 1;
        if (n !== 1) { console.log(`${r.name.padEnd(28)} NO VERDICT  the revert anchor matched ${n} times in ${r.path}, so it did not apply`); continue; }
        snap[r.path] = src;
        writeB(r.path, src.replace(old, () => neu));
      } else {
        if (!r.action || !r.undo) { console.log(`${r.name.padEnd(28)} NO VERDICT  path is null but action/undo are not both given`); continue; }
        snap.__undo = r.undo;
        const a = sh('bash', ['-c', r.action]);
        if (a.code !== 0) { console.log(`${r.name.padEnd(28)} NO VERDICT  the action failed: ${clip(a.out)}`); continue; }
      }
      // the built file is what boots: a source edit is rebuilt unless the list says not to,
      // and when the proof is the build itself the rebuild IS the proof
      if (r.prove === 'build') res = PROOFS.build();
      else {
        if (underSrc(r.path) && r.rebuild !== false && hasBuild) {
          const b = byExit(NODE, ['build.js']);
          if (b.verdict !== 'GREEN') { res = { verdict: 'NO VERDICT', why: 'the rebuild after applying refused, so there was no built file to prove: ' + b.why }; throw null; }
        }
        res = await PROOFS[r.prove](r.name.replace(/[^A-Za-z0-9-]/g, '_'));
      }
      if (r.mustPrint && res.verdict !== 'NO VERDICT') {
        const text = res.text || '';
        if (!text.includes(r.mustPrint)) res = { verdict: res.verdict, why: `the proof did not print "${r.mustPrint}"`, missed: true };
      }
    } catch (e) {
      if (e) res = { verdict: 'NO VERDICT', why: 'the harness threw: ' + clip(e && e.message) };
    } finally {
      for (const p of Object.keys(snap)) if (p !== '__undo') writeB(p, snap[p]);
      if (snap.__undo) sh('bash', ['-c', snap.__undo]);
      writeB('server.js', serverSnap);
      if (hasBuild && (underSrc(r.path) || !r.path)) {
        const b = byExit(NODE, ['build.js']);
        if (b.verdict !== 'GREEN' || readB('server.js') !== serverSnap) { writeB('server.js', serverSnap); console.log(`  !! restore: rebuilt server.js differed from the snapshot or the build refused (${b.why}); server.js restored from the snapshot — check the tree`); }
      }
    }
    const matched = res.verdict === expect && !res.missed;
    if (matched) ok += 1;
    console.log(`${r.name.padEnd(28)} ${res.verdict.padEnd(11)} ${expect !== 'RED' ? `(expected ${expect}${r.mustPrint ? ' + "' + r.mustPrint + '"' : ''}: ${matched ? 'as expected' : 'NOT as expected'}) ` : ''}${res.why || ''}`);
  }
  // the tree must be exactly what it was
  const dirty = sh('git', ['status', '--porcelain', '--', 'server.js', 'src']).out.trim();
  console.log(`\n${ok} of ${wanted.length} matched expectation (RED alone unless the list says otherwise).${dirty ? '\n!! git status shows changes under server.js/src after restore:\n' + dirty : ''}`);
  process.exit(ok === wanted.length ? 0 : 1);
}
main().catch(e => { console.error('falsify.js failed: ' + (e && e.stack || e)); process.exit(2); });
