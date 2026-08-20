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
const NEED = ['measuredFieldsFrom', 'finalLeadScore', 'predictReach', 'buildResearchBody',
  'applyResearchResult', 'buildComposeBody', 'readComposeResponse', 'applyGeneratedEmail',
  'pollResearchJob', 'researchViaQueue', 'runBatchAudit', 'batchCandidates'];
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
    __W.calls.poll++;
    const id = String(url).split('/').pop();
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
return { runBatchAudit, batchCandidates, __store: () => __store };
`;

const seed = (n) => Array.from({ length: n }, (_, i) => ({
  id: 'L' + i, name: 'Lead ' + i, website: 'https://lead' + i + '.com',
  status: 'new', icpScore: 100 - i, industry: 'Roofing', location: 'Denver, CO',
}));

const RESEARCH_OK = {
  reachability: 70, researchBonus: 3, flaws: ['x'], brainAudit: { factualSpine: 's', problemList: [] },
  email: 'a@b.com', founderName: 'Ann', richData: {}, signals: {},
};
const COMPOSED = { composed: { variantA: { subject: 'S-A', body: 'Body A that is long enough.' }, variantB: { subject: 'S-B', body: 'Body B that is long enough.' } } };
const BLOCKED = { reason: 'critical-fact-check', criticalFlags: ['your site is down'] };

// The runner reads storage for the CURRENT row, so storage has to be primed
// through saveLeads. Build a tiny primer inside the sandbox.
const runBatch = async (opts) => {
  const W = {
    calls: { research: 0, poll: 0, compose: 0 }, live: 0, peak: 0, jobIds: new Set(),
    writes: 0, reReads: 0, bodies: [], composeBodies: [], saveWithoutChanged: false,
    console: { log: () => {}, warn: () => {}, error: () => {} },
    researchResult: () => (opts.researchResult || RESEARCH_OK),
    composeAnswer: () => (opts.composeAnswer || COMPOSED),
  };
  const body = makeWorld().replace(
    'return { runBatchAudit, batchCandidates, __store: () => __store };',
    'return { runBatchAudit, batchCandidates, prime: (rows) => { __store = rows.map(x => ({ ...x })); }, store: () => __store };'
  );
  const api = new Function('__W', body)(W);
  api.prime(opts.leads);
  const out = await api.runBatchAudit({
    leads: opts.leads, settings: { apiKey: 'k' }, withEmail: !!opts.withEmail,
    concurrency: opts.concurrency, shouldStop: opts.shouldStop,
    onProgress: opts.onProgress,
  });
  return { out, W, store: api.store() };
};

(async () => {
  // 1 + 2 + 5 + 7 — fifty leads, audits only.
  {
    const leads = seed(50);
    const { out, W, store } = await runBatch({ leads });
    if (W.calls.research !== 50) fails.push(`fifty leads produced ${W.calls.research} research submissions`);
    if (W.calls.compose !== 0) fails.push(`"audits only" still made ${W.calls.compose} compose call(s) — Mike asked for audits, and a batch that quietly writes fifty emails spends tokens nobody asked for`);
    if (W.peak > 8) fails.push(`${W.peak} leads were in flight at once — the pool is not bounding anything, which is fifty poll loops and fifty job ids in one tab`);
    if (W.peak < 2) fails.push(`only ${W.peak} lead ran at a time, so the pool is serial and fifty audits take fifty times one audit`);
    if (W.jobIds.size !== 50) fails.push(`${W.jobIds.size} of 50 job ids were written to disk — the rest cannot be resumed if the tab closes, and the work is already paid for`);
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
    const body = makeWorld().replace('return { runBatchAudit, batchCandidates, __store: () => __store };', 'return { batchCandidates };');
    const api = new Function('__W', body)({ console: { log() {}, warn() {}, error() {} } });
    const got = api.batchCandidates(mixed, { limit: 50 }).map(x => x.id).join(',');
    if (got !== 'e,a') fails.push(`the batch would take [${got}] — it must skip the lead with no website (nothing to audit), the one already researched (a re-audit costs a full cycle) and the one already refused, and take the rest highest score first`);
    const withDone = api.batchCandidates(mixed, { limit: 50, includeResearched: true }).map(x => x.id).join(',');
    if (withDone !== 'c,e,a') fails.push(`"include re-runs" produced [${withDone}] instead of putting the researched lead back in`);
    const capped = api.batchCandidates(mixed, { limit: 1 }).map(x => x.id).join(',');
    if (capped !== 'e') fails.push(`the size limit produced [${capped}] instead of the single highest-scoring candidate`);
  }

  if (fails.length) {
    console.log(`\n✗ index.html: ${fails.length} bulk-audit defect(s)`);
    fails.forEach(f => console.log('  ' + f));
    process.exit(1);
  }
  console.log('\n✓ index.html: the bulk audit was RUN, not read — 50 leads through the real runner with a fake network under it. It goes through the shared request builder and the shared merge, "audits only" makes zero compose calls, emails on produces a sendable subject+body+arm, a fact-check refusal is reported AND clears the stale draft rather than leaving it standing as current, no more than 8 leads are ever in flight, every job id is written to disk so a closed tab does not lose paid-for work, storage is re-read before every write, and Stop keeps what finished.');
})();
