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

  hang.close(); fast.close();
  const timers = process.getActiveResourcesInfo().filter(h => h === 'Timeout').length;
  ok('no timer left pinned after a fast success', timers === 0, `${timers} Timeout handle(s) still active`,
     'a 10s cap on a call that answered in 5ms used to hold a timer for the remaining 9.995s, on every call.');

  console.log(`\n  ${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();
