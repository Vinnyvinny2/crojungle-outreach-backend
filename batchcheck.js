// ══ THE BULK AUDIT, RUN FOR REAL ════════════════════════════════════════════
// index.html deploys to Netlify by hand and cannot be executed by any gate in
// this repo, so every client change until now shipped on a read-through. That is
// how nine duplicate-key collisions, seventeen disagreeing request fields and
// eleven dropped server measurements all reached live at once.
//
// This lifts the bulk-audit runner out of index.html with everything it calls,
// puts a fake network and a fake localStorage under it, and runs fifty leads
// through it. It is an integration test of the client, not a source scan.
//
// What it proves, each because the opposite has actually happened here:
//
//   1. the runner uses the SHARED request builder and the SHARED merge — a
//      second copy of either is the failure this file has recorded three times
//   2. "audits only" costs ZERO compose calls. Mike asked for audits; a batch
//      that quietly writes fifty emails spends Anthropic tokens nobody asked for
//   3. "also write the email" produces a lead that is actually sendable —
//      subject, body and an A/B arm — not a status change with nothing behind it
//   4. a fact-check REFUSAL is reported and leaves NO draft standing. A blocked
//      email that silently keeps the previous draft is how a false claim gets
//      approved as current
//   5. concurrency is bounded. Fifty simultaneous poll loops is a browser tab
//      that stops responding, and fifty job ids whose only record is that tab
//   6. Stop actually stops, and everything finished before it is saved
//   7. every finished lead is written with a RE-READ of storage, so fifty runs
//      landing at different times cannot erase each other
//
//   node batchcheck.js            exits non-zero on failure
const acorn = require('acorn'), fs = require('fs'), path = require('path');
const root = path.dirname(require.main.filename);
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const src = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]).join('\n;\n');
const ast = acorn.parse(src, { ecmaVersion: 2022, sourceType: 'script', locations: true, ranges: true });
const fails = [];

const walk = (n, fn) => {
  if (!n || typeof n !== 'object') return;
  fn(n);
  for (const k of Object.keys(n)) {
    const v = n[k];
    if (Array.isArray(v)) v.forEach(c => walk(c, fn));
    else if (v && typeof v === 'object' && v.type) walk(v, fn);
  }
};

// The functions the batch actually needs, in dependency order. Named
// explicitly: pulling "everything that looks like a helper" would drag React
// components in and the harness would start lying about what it ran.
// RESEARCH_TRIGGERS first: researchViaQueue REFUSES to submit without a named
// user gesture, so a harness that does not lift it measures a run that never
// spends anything. That refusal is the point — it is what stops a stray useEffect
// starting fifty audits nobody asked for.
const NEED = ['RESEARCH_TRIGGERS', 'measuredFieldsFrom', 'finalLeadScore', 'predictReach', 'buildResearchBody',
  'INFLIGHT_LIVE_MS', 'inflightIsLive',
  'applyResearchResult', 'buildComposeBody', 'readComposeResponse', 'applyGeneratedEmail',
  'pollResearchJob', 'researchViaQueue', 'runBatchAudit', 'batchCandidates',
  // The progress panel's own reducer. It lives at module scope precisely so it
  // can be run here: a name added on start and never removed on done is
  // invisible on three leads and puts fifty names on the screen on fifty.
  'batchProgressReduce'];
const found = new Map();
for (const node of ast.body) {
  if (node.type !== 'VariableDeclaration') continue;
  for (const d of node.declarations) {
    if (!d.id || !d.id.name || !NEED.includes(d.id.name) || !d.init) continue;
    if (found.has(d.id.name)) { fails.push(`${d.id.name} is declared twice at module scope — two copies of one function is the defect this whole extraction exists to prevent`); continue; }
    found.set(d.id.name, 'const ' + d.id.name + ' = ' + src.slice(d.init.start, d.init.end) + ';');
  }
}
for (const n of NEED) if (!found.has(n)) fails.push(`${n} is not a module-scope function any more, so the bulk audit cannot be executed and nothing below is being checked`);

// Also assert the CONSTANTS the panel reads, so a rename cannot leave the
// button running a different size from the one it printed.
const consts = {};
for (const node of ast.body) {
  if (node.type !== 'VariableDeclaration') continue;
  for (const d of node.declarations) {
    if (d.id && (d.id.name === 'BATCH_DEFAULT_SIZE' || d.id.name === 'BATCH_CONCURRENCY') && d.init && d.init.type === 'Literal') consts[d.id.name] = d.init.value;
  }
}
if (consts.BATCH_DEFAULT_SIZE !== 50) fails.push(`the default batch size is ${consts.BATCH_DEFAULT_SIZE}, and the ask was fifty audits a day`);
if (!(consts.BATCH_CONCURRENCY >= 1 && consts.BATCH_CONCURRENCY <= 8)) fails.push(`the batch concurrency is ${consts.BATCH_CONCURRENCY}, which is either pointless or a browser tab that stops responding`);

if (fails.length) { fails.forEach(f => console.log('  ' + f)); console.log('\n✗ batchcheck: could not run'); process.exit(1); }

// ── THE FAKE WORLD ─────────────────────────────────────────────────────────
const makeWorld = () => `
const BATCH_DEFAULT_SIZE = ${consts.BATCH_DEFAULT_SIZE};
const BATCH_CONCURRENCY = ${consts.BATCH_CONCURRENCY};
// ── A FAKE CLOCK ───────────────────────────────────────────────────────────
// The poller sleeps three seconds between polls, so a real-timer harness spends
// a minute on fifty leads and could never reach the ten-minute give-up at all.
// setTimeout fires immediately and ADVANCES the clock by what it was asked to
// wait, so elapsed time is exact and the whole gate runs in milliseconds.
const setTimeout = (fn, ms) => { __W.clock += (Number(ms) || 0); return __W.tick(fn); };
const Date = __W.Date;
let __store = [];
const getLeads = () => { __W.reReads++; return __store.map(x => ({ ...x })); };
const saveLeads = (l, changed) => { __W.writes++; __store = l.map(x => ({ ...x })); if (!changed) __W.saveWithoutChanged = true; };
const setInflightJob = (id, jid) => { __W.jobIds.add(jid); };
const clearInflightJob = (id) => {};
const BACKEND = 'http://fake';
const console = __W.console;
const fetch = async (url, init) => {
  if (String(url).indexOf('/api/research-async') >= 0) {
    const __n = ++__W.calls.research;   // captured NOW: json() runs later, by which
    __W.live++; __W.peak = Math.max(__W.peak, __W.live);   // time other leads have advanced the counter
    __W.bodies.push(JSON.parse(init.body));
    return { ok: true, status: 200, json: async () => ({ jobId: 'job' + __n }) };
  }
  if (String(url).indexOf('/api/research-job/') >= 0) {
    const n = ++__W.calls.poll;
    const id = String(url).split('/').pop();
    if (__W.pollAnswer) return { ok: true, status: 200, json: async () => __W.pollAnswer(n) };
    __W.live--;
    return { ok: true, status: 200, json: async () => ({ status: 'done', httpStatus: 200, result: __W.researchResult(id) }) };
  }
  if (String(url).indexOf('/api/compose-email') >= 0) {
    __W.calls.compose++;
    __W.composeBodies.push(JSON.parse(init.body));
    return { ok: true, status: 200, json: async () => __W.composeAnswer() };
  }
  throw new Error('the batch called an endpoint this harness does not know about: ' + url);
};
${[...NEED].map(n => found.get(n)).join('\n')}
return { runBatchAudit, batchCandidates, pollResearchJob, batchProgressReduce, inflightIsLive, INFLIGHT_LIVE_MS, clock: () => __W.clock, __store: () => __store };
`;

// The clock and the immediate-timer, shared by every scenario.
const EXPORTS = "return { runBatchAudit, batchCandidates, pollResearchJob, batchProgressReduce, inflightIsLive, INFLIGHT_LIVE_MS, clock: () => __W.clock, __store: () => __store };";
const RealDate = Date;
const makeW = (opts) => {
  const W = {
    calls: { research: 0, poll: 0, compose: 0 }, live: 0, peak: 0, jobIds: new Set(),
    writes: 0, reReads: 0, bodies: [], composeBodies: [], saveWithoutChanged: false,
    console: { log: () => {}, warn: () => {}, error: () => {} },
    clock: 1755600000000,
    researchResult: () => ((opts && opts.researchResult) || RESEARCH_OK),
    composeAnswer: () => ((opts && opts.composeAnswer) || COMPOSED),
    pollAnswer: (opts && opts.pollAnswer) || null,
  };
  W.tick = (fn) => { process.nextTick(fn); return 0; };
  const FakeDate = function (...a) { return a.length ? new RealDate(...a) : new RealDate(W.clock); };
  FakeDate.now = () => W.clock;
  FakeDate.parse = RealDate.parse;
  FakeDate.UTC = RealDate.UTC;
  W.Date = FakeDate;
  return W;
};

const seed = (n) => Array.from({ length: n }, (_, i) => ({
  id: 'L' + i, name: 'Lead ' + i, website: 'https://lead' + i + '.com',
  status: 'new', icpScore: 100 - i, industry: 'Roofing', location: 'Denver, CO',
}));

const RESEARCH_OK = {
  reachability: 70, researchBonus: 3, flaws: ['x'], brainAudit: { factualSpine: 's', problemList: [] },
  email: 'a@b.com', founderName: 'Ann', richData: {}, signals: {},
  // The server's per-request ledger, riding the response. The reducer sums it
  // and the bar renders the sum; the assertion below multiplies this by fifty.
  leadSpend: { fcCredits: 16, fcOps: 12, fcSaved: 2, places: 4, anthropicUsd: 0.1, apify: 1 },
};
const COMPOSED = { composed: { variantA: { subject: 'S-A', body: 'Body A that is long enough.' }, variantB: { subject: 'S-B', body: 'Body B that is long enough.' } } };
const BLOCKED = { reason: 'critical-fact-check', criticalFlags: ['your site is down'] };

// The runner reads storage for the CURRENT row, so storage has to be primed
// through saveLeads. Build a tiny primer inside the sandbox.
const runBatch = async (opts) => {
  const W = makeW(opts);
  const body = makeWorld().replace(
    EXPORTS,
    EXPORTS.replace('__store: () => __store', 'prime: (rows) => { __store = rows.map(x => ({ ...x })); }, store: () => __store')
  );
  const api = new Function('__W', body)(W);
  api.prime(opts.leads);
  // The panel's state, driven by the runner's own events through the REAL
  // reducer — not a copy of it written here, which would be the second
  // implementation this whole harness exists to prevent.
  let panel = { finished: 0, total: 0, running: [], queued: [], done: [] };
  let peakRunning = 0;
  // ── THE THREE STATES MUST ALWAYS ADD UP TO THE TOTAL ────────────────────
  // Vin pressed Audit on five leads and read "2 of 2 waiting will run" above a
  // button saying "Stop — 0 of 5 done". The missing idea was QUEUED: with three
  // running at a time, two leads are picked and not started for most of a
  // five-lead run, and nothing on the screen had a word for them. Checked at
  // EVERY event rather than at the end, because a panel that is only right when
  // the run is over is exactly the one nobody can read while it matters.
  const panelDrift = [];
  let sawRoster = 0;
  const out = await api.runBatchAudit({
    leads: opts.leads, settings: { apiKey: 'k' }, withEmail: !!opts.withEmail,
    concurrency: opts.concurrency, shouldStop: opts.shouldStop,
    onProgress: (ev) => {
      panel = api.batchProgressReduce(panel, ev);
      peakRunning = Math.max(peakRunning, panel.running.length);
      if (ev.phase === 'roster') {
        sawRoster++;
        if ((panel.queued || []).length !== panel.total) {
          panelDrift.push(`the roster event left ${(panel.queued || []).length} queued of ${panel.total}`);
        }
      }
      {
        const sum = (panel.running || []).length + (panel.queued || []).length + (panel.finished || 0);
        if (sum !== panel.total) panelDrift.push(`after "${ev.phase}" the panel showed ${(panel.running || []).length} running + ${(panel.queued || []).length} queued + ${panel.finished} done = ${sum}, not ${panel.total}`);
      }
      if (opts.onProgress) opts.onProgress(ev);
    },
  });
  return { out, W, store: api.store(), panel, peakRunning, panelDrift, sawRoster };
};

(async () => {
  // 0. The follow-along detail, through the REAL reducer: set by lead-status,
  //    gone the moment the lead finishes, cleared by a new roster — a done
  //    chip claiming "writing the audit" is a stale claim about ended work.
  {
    const W0 = makeW({ leads: [] });
    const api0 = new Function('__W', makeWorld())(W0);
    const R = api0.batchProgressReduce;
    let p = R(undefined, { phase: 'roster', total: 2, names: ['A', 'B'] });
    p = R(p, { phase: 'start', lead: { name: 'A' } });
    p = R(p, { phase: 'lead-status', lead: { name: 'A' }, leadPhase: 'reading their pages', workedMs: 61000 });
    if (!p.detail || !p.detail.A || p.detail.A.phase !== 'reading their pages' || p.detail.A.workedMs !== 61000) {
      fails.push('a lead-status event does not reach the panel detail — the batch bar cannot say what a running lead is doing');
    }
    const sum0 = (p.running || []).length + (p.queued || []).length + (p.finished || 0);
    if (sum0 !== p.total) fails.push('a lead-status event broke the three-state sum');
    p = R(p, { phase: 'done', lead: { name: 'A' }, finished: 1, total: 2 });
    if (p.detail && p.detail.A) fails.push('a finished lead still shows a phase — stale follow-along on a done lead');
    p = R(p, { phase: 'roster', total: 1, names: ['C'] });
    if (p.detail && Object.keys(p.detail).length) fails.push('a new roster does not clear the previous run detail');
  }

  // 1 + 2 + 5 + 7 — fifty leads, audits only.
  {
    const leads = seed(50);
    const { out, W, store, panel, peakRunning, panelDrift, sawRoster } = await runBatch({ leads });
    if (sawRoster !== 1) fails.push(`the runner emitted the run's roster ${sawRoster} time(s) — without it the panel has to infer what is waiting by subtracting from a filter that deliberately hides leads that are running`);
    if (panelDrift.length) fails.push(`the progress panel does not add up during the run: ${panelDrift.slice(0, 3).join(' | ')}${panelDrift.length > 3 ? ` (+${panelDrift.length - 3} more)` : ''}`);
    if ((panel.queued || []).length !== 0) fails.push(`the run ended with ${(panel.queued || []).length} lead(s) still shown as queued`);
    if (W.calls.research !== 50) fails.push(`fifty leads produced ${W.calls.research} research submissions`);
    if (W.calls.compose !== 0) fails.push(`"audits only" still made ${W.calls.compose} compose call(s) — Mike asked for audits, and a batch that quietly writes fifty emails spends tokens nobody asked for`);
    if (W.peak > 8) fails.push(`${W.peak} leads were in flight at once — the pool is not bounding anything, which is fifty poll loops and fifty job ids in one tab`);
    if (W.peak < 2) fails.push(`only ${W.peak} lead ran at a time, so the pool is serial and fifty audits take fifty times one audit`);
    if (W.jobIds.size !== 50) fails.push(`${W.jobIds.size} of 50 job ids were written to disk — the rest cannot be resumed if the tab closes, and the work is already paid for`);
    // ══ THE BAR'S COST FIGURE IS THE SUM OF WHAT THE SERVER SAID ═══════════
    // Fifty leads at 16 credits / 4 Places calls / $0.10 each. Computed by the
    // same pure reducer the bar renders from, so the number on screen and the
    // number asserted here are one computation. Both directions: a sum of zero
    // means the spend never rode the events, which is exactly how a cost figure
    // goes quietly dark while the bar keeps rendering.
    {
      const sp = panel && panel.spend;
      if (!sp) fails.push('the panel carries no spend at all — the reducer dropped it and the bar has nothing to render');
      else {
        if (Math.round(sp.fcCredits) !== 800) fails.push(`the run's Firecrawl sum is ${sp.fcCredits}, not 50 x 16 = 800 — the bar under-reports what was spent`);
        if (sp.places !== 200) fails.push(`the run's Places sum is ${sp.places}, not 50 x 4 = 200`);
        if (Math.abs(sp.anthropicUsd - 5) > 0.01) fails.push(`the run's model sum is $${sp.anthropicUsd}, not 50 x $0.10 = $5.00`);
      }
    }
    if (out.length !== 50 || out.some(x => x.outcome !== 'researched')) fails.push(`the run reported ${out.filter(x => x.outcome === 'researched').length} of 50 audited`);
    if (store.length !== 50 || store.some(x => x.status !== 'researched')) fails.push('leads were not saved as researched, so a fifty-lead run left the pipeline unchanged');
    if (W.saveWithoutChanged) fails.push('a save was made without naming the row that changed, which pushes every row in the pipeline to Supabase instead of one');
    if (W.reReads < 50) fails.push(`storage was re-read ${W.reReads} times for 50 leads — a run that writes back a snapshot taken minutes ago erases whatever finished in between, and fifty in flight is exactly that case`);
    // The request must be the shared builder's, not a hand-written body.
    const b = W.bodies[0] || {};
    for (const k of ['company', 'website', 'keys', 'leadChannel', 'marketsSeen', 'reachPredict']) {
      if (!(k in b)) fails.push(`the batch's research request has no "${k}" — it is not going through buildResearchBody, which is how the two hand-written bodies came to disagree about seventeen fields`);
    }
    if (b.browserData !== null) fails.push('the batch is sending browser data — doing the browser-side Hunter lookup fifty times spends a whole month of a 50-credit plan in one press');
    // ── AND THE PROGRESS PANEL, DRIVEN BY THE SAME RUN ──────────────────────
    // Vin had to read the server log to know where a run was. What replaced that
    // is only worth having if it is right, so it is folded from the runner's own
    // events rather than trusted.
    if (panel.running.length !== 0) fails.push(`the progress panel finished the run still showing ${panel.running.length} lead(s) as in flight — "Working on:" leaks one name per lead and reads as a run that never ended`);
    if (panel.finished !== 50) fails.push(`the panel reported ${panel.finished} of 50 finished`);
    if (panel.total !== 50) fails.push(`the panel reported a total of ${panel.total}`);
    if (peakRunning > 8) fails.push(`the panel showed ${peakRunning} leads in flight at once against a pool of at most 8 — it is not tracking what is running, it is accumulating names`);
    if (peakRunning < 2) fails.push(`the panel never showed more than ${peakRunning} lead in flight, so the one thing it exists to show — three leads at once — is invisible`);
    // ── AND NOTHING MAY SPEND WITHOUT NAMING THE GESTURE ───────────────────
    // Vin: "i added 5 to pipeline most certiantly didnt hit run research and some
    // of the leads started running research". Three call sites can submit and any
    // future useEffect becomes a fourth, so the guard is on the SPEND, not on the
    // callers. Executed here, not read: the gate is only real if an unnamed call
    // actually refuses.
    {
      const W2 = makeW({});
      const api2 = new Function('__W', makeWorld().replace(EXPORTS, EXPORTS.replace('__store: () => __store', 'submitUnnamed: (b) => researchViaQueue(b, {}), submitNamed: (b) => researchViaQueue(b, { trigger: "bulk-audit" }), store: () => __store')))(W2);
      let refused = false;
      try { await api2.submitUnnamed({ company: 'x', website: 'https://x.com' }); }
      catch (e) { refused = /no user action was named/i.test(String(e && e.message)); }
      if (!refused) fails.push('research can be submitted with no user gesture behind it — the exact shape of "some of the leads started running research" on a run nobody asked for, and it spends Firecrawl, Apify, Places and Anthropic on every one');
      if (W2.calls.research !== 0) fails.push(`an unnamed submit still reached the network ${W2.calls.research} time(s), so the refusal happens after the money is spent`);
      // And a NAMED one must still go through, or the guard has simply broken research.
      try { await api2.submitNamed({ company: 'x', website: 'https://x.com' }); } catch (e) { void e; }
      if (W2.calls.research !== 1) fails.push('a submit that DID name its gesture was refused too, so the guard broke the thing it was protecting');
    }
  }

  // 3 — with emails.
  {
    const leads = seed(6);
    const { out, W, store } = await runBatch({ leads, withEmail: true });
    if (W.calls.compose !== 6) fails.push(`six leads with emails on produced ${W.calls.compose} compose call(s)`);
    if (out.some(x => x.outcome !== 'generated')) fails.push(`with emails on, ${out.filter(x => x.outcome === 'generated').length} of 6 came back written`);
    const bad = store.filter(x => !(x.subject && x.pitch && (x.abVariant === 'A' || x.abVariant === 'B') && x.status === 'generated'));
    if (bad.length) fails.push(`${bad.length} lead(s) were marked generated with no sendable email behind it — the exact five faults that were queued behind "the panel renders nothing"`);
    const cb = W.composeBodies[0] || {};
    for (const k of ['company', 'founderName', 'brainAudit']) {
      if (!(k in cb)) fails.push(`the batch's compose request has no "${k}" — it is not going through buildComposeBody`);
    }
  }

  // 4 — the fact-checker refuses.
  {
    const leads = seed(3).map(l => ({ ...l, generatedResult: { variantA: { subject: 'OLD', pitch: 'the old draft' } }, subject: 'OLD', pitch: 'the old draft' }));
    const { out, store } = await runBatch({ leads, withEmail: true, composeAnswer: BLOCKED });
    if (out.some(x => x.outcome !== 'email_blocked')) fails.push('a refused compose was not reported as blocked, so it reads as a lead that simply has no email yet');
    if (!out.every(x => /contradict/.test(x.note || ''))) fails.push('the block was reported without saying what it contradicts, which is the sentence the operator needs');
    const stale = store.filter(x => x.subject === 'OLD' || (x.generatedResult && x.generatedResult.variantA && x.generatedResult.variantA.subject === 'OLD'));
    if (stale.length) fails.push(`${stale.length} blocked lead(s) still carry their PREVIOUS draft — the audit was re-measured and refused, so the old email describes a diagnosis nobody now stands behind, and it would be approved as current`);
  }

  // 6 — Stop.
  {
    const leads = seed(30);
    let stop = false;
    const { out } = await runBatch({ leads, shouldStop: () => stop, onProgress: (ev) => { if (ev.phase === 'done' && ev.finished >= 4) stop = true; } });
    if (out.length >= 30) fails.push('Stop did not stop the run');
    if (out.length < 4) fails.push(`Stop threw away work that had already finished (${out.length} results kept) — every lead that completed was paid for`);
  }

  // And the candidate rule.
  {
    const mixed = [
      { id: 'a', name: 'a', website: 'https://a.com', status: 'new', icpScore: 10 },
      { id: 'b', name: 'b', website: '', status: 'new', icpScore: 90 },
      { id: 'c', name: 'c', website: 'https://c.com', status: 'researched', icpScore: 80 },
      { id: 'd', name: 'd', website: 'https://d.com', status: 'new', notAFit: true, icpScore: 95 },
      { id: 'e', name: 'e', website: 'https://e.com', status: 'new', icpScore: 50 },
    ];
    const body = makeWorld();
    const api = new Function('__W', body)({ console: { log() {}, warn() {}, error() {} } });
    const got = api.batchCandidates(mixed, { limit: 50 }).map(x => x.id).join(',');
    if (got !== 'e,a') fails.push(`the batch would take [${got}] — it must skip the lead with no website (nothing to audit), the one already researched (a re-audit costs a full cycle) and the one already refused, and take the rest highest score first`);
    const withDone = api.batchCandidates(mixed, { limit: 50, includeResearched: true }).map(x => x.id).join(',');
    if (withDone !== 'c,e,a') fails.push(`"include re-runs" produced [${withDone}] instead of putting the researched lead back in`);
    const capped = api.batchCandidates(mixed, { limit: 1 }).map(x => x.id).join(',');
    if (capped !== 'e') fails.push(`the size limit produced [${capped}] instead of the single highest-scoring candidate`);

    // ══ THE OPERATOR'S OWN TICKS REPLACE THE TOP-N ════════════════════════
    // Live 2026-08-25: "it forces me to audit the leads like i cant select
    // which leads to run the 50 audits on it pre chooses." A ticked set IS
    // the batch. Round 96 made a ticked AUDITED lead also need the re-audit
    // box, and the owner's next live session hit exactly that wall: "when i
    // rerun a lead it only lets me do one not multiple leads to rerun." A
    // tick is the operator's own hand on a specific lead, so ticking an
    // audited lead now IS the re-run intent — while a no-website tick is
    // still refused, because there is nothing to audit at any intent.
    const picked = api.batchCandidates(mixed, { limit: 50, pickedIds: new Set(['a']) }).map(x => x.id).join(',');
    if (picked !== 'a') fails.push(`a hand-picked lead produced [${picked}] — the tick must replace the top-N pick entirely`);
    const pickedBad = api.batchCandidates(mixed, { limit: 50, pickedIds: new Set(['b', 'c', 'a']) }).map(x => x.id).join(',');
    if (pickedBad !== 'c,a') fails.push(`ticking a no-website lead plus an audited lead produced [${pickedBad}] — the audited tick must RE-RUN (the operator's hand is the intent) and the no-website tick must still be refused`);
    const pickedDone = api.batchCandidates(mixed, { limit: 50, includeResearched: true, pickedIds: new Set(['c']) }).map(x => x.id).join(',');
    if (pickedDone !== 'c') fails.push(`a ticked already-audited lead with re-audit ON produced [${pickedDone}] — the tick plus the box is exactly how a chosen re-run is supposed to happen`);
    const noPick = api.batchCandidates(mixed, { limit: 50, pickedIds: new Set() }).map(x => x.id).join(',');
    if (noPick !== 'e,a') fails.push(`an empty tick set changed the default pick to [${noPick}] — no ticks must mean the old top-scores behaviour exactly`);

    // ══ AND A JOB RECORD FROM A DEAD TAB MUST NOT STRAND A LEAD ═══════════
    // This filter had no age check at all. A tab closed mid-run leaves up to
    // three in-flight records behind, and the resume path deliberately collects
    // only records from its OWN tab — so those leads were refused by every
    // future batch forever, and nothing on screen said why. Both directions:
    // a lead genuinely running must still be skipped, or an interrupted run
    // pays twice for the same audit.
    {
      const now = 1_800_000_000_000;
      const live = { e: { jobId: 'j1', at: now - 60_000 } };
      const dead = { e: { jobId: 'j1', at: now - (api.INFLIGHT_LIVE_MS + 60_000) } };
      const withLive = api.batchCandidates(mixed, { limit: 50, inflight: live, now }).map(x => x.id).join(',');
      if (withLive !== 'a') fails.push(`a lead whose research is running right now was taken again [${withLive}] — that is a second full paid audit of a business we are already auditing`);
      const withDead = api.batchCandidates(mixed, { limit: 50, inflight: dead, now }).map(x => x.id).join(',');
      if (withDead !== 'e,a') fails.push(`a job record older than the poller's own give-up point still excludes the lead [${withDead}] — a tab closed mid-run strands up to three leads outside every future batch, permanently and silently`);
      if (api.inflightIsLive(null, now)) fails.push('a missing job record reads as a running job');
      if (api.inflightIsLive({ at: now }, now)) fails.push('a record with no job id reads as a running job');
      if (api.INFLIGHT_LIVE_MS < 30 * 60 * 1000) {
        fails.push(`the live window is ${Math.round(api.INFLIGHT_LIVE_MS / 60000)} minutes — shorter than a lead can legitimately spend queued behind a fifty-lead run, so a running lead would be picked a second time`);
      }
    }
  }

  // ══ THE POLLER'S CLOCK MUST MEASURE WORK, NOT QUEUE TIME ═════════════════
  // It gave up ten minutes after SUBMITTING. The server's clock starts when the
  // WORK starts — deliberately, because a job that waited six minutes for a slot
  // used to have two minutes left to do five minutes of work and was killed with
  // the credits already spent. So a lead that queued five minutes and then worked
  // five was abandoned by the BROWSER at the moment the server was about to
  // answer, reported as "did not finish within 10 minutes", and the audit that
  // was paid for was thrown away. One lead at a time nothing ever queued and this
  // was invisible. Fifty at a time it is the normal case.
  //
  // The fake clock advances by whatever each sleep asked for, so half an hour of
  // queueing takes no real time at all and the boundary is exact.
  {
    const mk = (opts) => {
      const W = makeW(opts);
      return { api: new Function('__W', makeWorld())(W), W };
    };
    // Queued for half an hour, then answers. The result must come back.
    {
      const { api } = mk({ pollAnswer: (n) => (n < 600
        ? { status: 'running', phase: 'queued', elapsedMs: n * 3000, workedMs: 0 }
        : { status: 'done', httpStatus: 200, result: { brainAudit: { factualSpine: 's' } } }) });
      const res = await api.pollResearchJob('job1', {});
      const body = await res.json();
      if (!res.ok || body.brainFailed) {
        fails.push('a lead that waited half an hour in the queue and then finished was abandoned by the browser — the audit was paid for and thrown away, and it reports as a slow lead rather than as a queue');
      }
    }
    // Working, and never finishing. This one MUST give up, or a wedged job holds
    // a pool slot forever and the batch stops after three leads.
    {
      const { api } = mk({ pollAnswer: (n) => ({ status: 'running', phase: 'running', elapsedMs: n * 3000, workedMs: n * 3000 }) });
      const res = await api.pollResearchJob('job1', {});
      const body = await res.json();
      if (res.ok || !body.brainFailed) {
        fails.push('a job that works forever is never given up on, so it holds a slot in the pool and a fifty-lead batch stops after three leads');
      }
      // Names the WORK clock, not a number. The number now comes from the
      // server on every poll (workBudgetMs), because the browser holding its
      // own copy is how the two clocks disagreed on 2026-08-22.
      if (!/worked on this lead/.test(body.reason || '')) {
        fails.push(`the give-up message does not say which clock ran out: "${body.reason}"`);
      }
    }
    // ══ AND THE BROWSER TAKES ITS BUDGET FROM THE SERVER ══════════════════
    // The server's budget learned to exclude the lead's wait in our own
    // Firecrawl gate; the browser's did not, and four leads of five died at
    // that boundary with every credit already spent. Two hand-kept copies of
    // one rule, on different machines. So: a server that says its budget is
    // twenty minutes must be believed past the browser's own fallback of ten.
    {
      const { api } = mk({ pollAnswer: (n) => (n * 3000 < 15 * 60 * 1000
        ? { status: 'running', phase: 'running', elapsedMs: n * 3000, workedMs: n * 3000, workBudgetMs: 20 * 60 * 1000 }
        : { status: 'done', httpStatus: 200, result: { brainAudit: { factualSpine: 's' } } }) });
      const res = await api.pollResearchJob('job1', {});
      const body = await res.json();
      if (!res.ok || body.brainFailed) {
        fails.push('a lead the SERVER said it was still within budget on was abandoned by the browser at its own fallback of ten minutes - the two clocks disagree again and the paid audit is thrown away');
      }
    }
    // And the fallback still holds against a server too old to send one.
    {
      const { api } = mk({ pollAnswer: (n) => ({ status: 'running', phase: 'running', elapsedMs: n * 3000, workedMs: n * 3000 }) });
      const res = await api.pollResearchJob('job1', {});
      const body = await res.json();
      if (res.ok || !body.brainFailed) {
        fails.push('with no budget sent by the server the browser now waits forever - the fallback was deleted rather than kept');
      }
    }
  }

  if (fails.length) {
    console.log(`\n✗ index.html: ${fails.length} bulk-audit defect(s)`);
    fails.forEach(f => console.log('  ' + f));
    process.exit(1);
  }
  console.log('\n✓ index.html: the bulk audit was RUN, not read — 50 leads through the real runner with a fake network under it. It goes through the shared request builder and the shared merge, "audits only" makes zero compose calls, emails on produces a sendable subject+body+arm, a fact-check refusal is reported AND clears the stale draft rather than leaving it standing as current, no more than 8 leads are ever in flight, every job id is written to disk so a closed tab does not lose paid-for work, storage is re-read before every write, and Stop keeps what finished.');
})();
