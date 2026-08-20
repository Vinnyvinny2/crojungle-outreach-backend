// ══ THE ONE HELPER EVERY OUTBOUND CALL GOES THROUGH ══════════════════════════
// fetchT wraps all 60 outbound call sites — Anthropic, Google Places, Firecrawl,
// Apify, Hunter, the email verifier. A defect here is a defect in every one of
// them at once, and it shows up as "that API is flaky" rather than as a bug.
//
// It had two: it never cancelled a request it had given up on (so every timeout
// leaked a socket) and never cleared its timer on success (so a call answering
// in 200ms still pinned a 30s timer). The socket leak is self-amplifying — a
// filling pool makes later calls slower, which makes more of them time out —
// which is the only mechanism that explains "raising the cap 12s → 30s changed
// nothing". If the cap were the constraint, more of it would have helped.
//
// Fixing it introduced a SECOND bug that this file caught before it shipped:
// ac.abort() rejects the fetch synchronously, so aborting before rejecting let
// an AbortError win the race and silently changed the error message that call
// sites all over server.js branch on. Order is load-bearing. That is exactly the
// kind of thing that is invisible in review and obvious in a test.
//
//   node fetchtest.js
//
// It lifts the REAL fetchT text out of server.js rather than retyping it, so it
// cannot pass against a copy that has drifted from what ships.
const fs = require('fs'), http = require('http');
require('node-fetch'); // resolve check: fetchT closes over the module-level fetch

const src = fs.readFileSync(__dirname + '/server.js', 'utf8');
const OPEN = 'const fetchT = (url, opts={}, ms=10000) => {';
const start = src.indexOf(OPEN);
if (start < 0) {
  console.log('✗ could not find fetchT in server.js — it was renamed or reshaped.');
  console.log('  This test is now lying by omission, which is worse than not running it.');
  process.exit(1);
}
const end = src.indexOf('\n};', start) + 3;
const fetch = require('node-fetch');
// ══ THE HARNESS MUST CARRY WHAT THE REAL FUNCTION CLOSES OVER ═══════════════
// fetchT now records how long each call took, per service, so a research run
// can say where its seconds went. That is a free binding in the lifted source,
// and eval'ing it without one threw ReferenceError on the FIRST assertion —
// which read as "fetchT no longer rejects with 'timeout'". A harness missing a
// dependency reports a fault in the code under test; this file's own header
// says a test that lies is worse than no test.
//
// So the note is stubbed AND recorded, and the recording is asserted below:
// timing that silently stops firing would leave every future run unable to
// answer the only question that matters for a fifty-lead batch.
const noted = [];
const netNote = (url, ms, ok2) => { noted.push({ url, ms, ok: ok2 }); };
const fetchT = eval('(' + src.slice(start, end).replace(/^const fetchT = /, '').replace(/;\s*$/, '') + ')');

let accepted = 0, closed = 0;
const hang = http.createServer((req) => { accepted++; req.socket.on('close', () => closed++); });
const fast = http.createServer((req, res) => res.end('ok'));

(async () => {
  await new Promise(r => hang.listen(0, '127.0.0.1', r));
  await new Promise(r => fast.listen(0, '127.0.0.1', r));
  const hangUrl = `http://127.0.0.1:${hang.address().port}/`;
  const fastUrl = `http://127.0.0.1:${fast.address().port}/`;

  let pass = 0, fail = 0;
  const ok = (name, cond, detail, why) => {
    if (cond) { pass++; console.log(`  ✓ ${name}`); return; }
    fail++; console.log(`  ✗ ${name} — ${detail}`);
    if (why) console.log(`     ${why}`);
  };

  const t0 = Date.now();
  let err = null;
  try { await fetchT(hangUrl, {}, 400); } catch (e) { err = e; }
  const ms = Date.now() - t0;

  ok("rejects with Error('timeout'), message byte-for-byte unchanged",
     err && err.message === 'timeout', `got "${err && err.message}"`,
     'call sites across server.js branch on this exact word. If an abort wins the race they all stop matching, and a timeout starts reading as an unexpected error.');

  ok('rejects at the cap rather than hanging past it', ms >= 350 && ms < 1500, `${ms}ms`);

  await new Promise(r => setTimeout(r, 250));
  ok('the abandoned request is actually cancelled', closed >= 1,
     `server accepted ${accepted} connection(s) and saw ${closed} close`,
     'an abandoned socket stays open until the OS reaps it. Sixty call sites leaking one per timeout is what turns a slow dependency into a dead one.');

  const r = await fetchT(fastUrl, {}, 10000);
  const body = await r.text();
  ok('a successful response is still returned intact', r.status === 200 && body === 'ok', `status ${r.status}, body "${body}"`);

  ok('a timed-out call is recorded as a FAILED call, not a fast one',
     noted.some(n => n.url === hangUrl && n.ok === false && n.ms >= 350),
     `recorded ${JSON.stringify(noted.filter(n => n.url === hangUrl))}`,
     'the per-lead timing report is how "where did 589 seconds go" gets answered. A timeout charged as a success would make a dead dependency look fast.');
  ok('a successful call is recorded with its real duration',
     noted.some(n => n.url === fastUrl && n.ok === true && n.ms >= 0),
     `recorded ${JSON.stringify(noted.filter(n => n.url === fastUrl))}`);

  hang.close(); fast.close();
  const timers = process.getActiveResourcesInfo().filter(h => h === 'Timeout').length;
  ok('no timer left pinned after a fast success', timers === 0, `${timers} Timeout handle(s) still active`,
     'a 10s cap on a call that answered in 5ms used to hold a timer for the remaining 9.995s, on every call.');

  console.log(`\n  ${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();
