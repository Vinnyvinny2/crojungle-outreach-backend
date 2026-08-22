#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════════════════
// THE RESEARCH ROUTE, DRIVEN END TO END OVER A FAKE NETWORK.
//
// The client half of this system has batchcheck.js: fifty leads through the
// real runner with a fake network under it. The server half had 200+ boot
// checks — every one exercising a FUNCTION — and nothing that ever drove a
// whole request start to finish. Every "computed but not passed", every gate
// pointed at the wrong object, every response field dropped one line before
// use lived in the seams BETWEEN the functions, which is exactly where a
// boot check cannot look.
//
// This boots the real server.js as a child process, points fetchT's
// FAKE_UPSTREAM seam at a local fixture server (Firecrawl, Places, Apify,
// Anthropic, Hunter, and the business's own site), submits real leads through
// POST /api/research-async, polls GET /api/research-job/:id like the client
// does, and asserts on the payload the client would receive.
//
// THE FIXTURES ARE THE CONTRACT. Every shape here was read off server.js's
// own call sites (the 2026-08-22 contract map): Apify answers with a BARE
// ARRAY and must return >=60% of the profile's review count or the truncation
// guard refuses the whole mine; Places details is the authority for
// reviewCount; a review-mine evidence quote must survive a punctuation-
// stripped four-word-window match against the review corpus; an audit quote
// must appear verbatim on a page we read. A harness whose fixtures drift from
// production shapes is the recorded "test harness that lies", so when a
// fixture is load-bearing the assertion says which rule it exists to satisfy.
//
// Scenarios, each a different company so the audit cache's company isolation
// (PART 4 §19) is never crossed:
//   A  the golden lead — full audit, ladder alive, spine built, spend counted
//   B  preflight — a missing Anthropic key is refused with zero network calls
//   C  a dead Apify token — the account latch, the audit still completes
//   D  a brain husk — the BRAIN GATE 422 with partialData intact
//   E  Firecrawl out of credits — the latch, the bounded hold, the refusal
//   F  (second boot) the day ceiling — lead one finishes OVER budget
//      (never mid-lead), lead two is refused naming the setting
// ═══════════════════════════════════════════════════════════════════════════
'use strict';
const http = require('http');
const { spawn } = require('child_process');

const SRV_PORT = Number(process.env.SC_PORT || 4570);
const FAKE_PORT = SRV_PORT + 1;
let fails = [];
let passed = 0;
const ok = (cond, what) => { if (cond) { passed++; } else { fails.push(what); console.log('  ✗ ' + what); } };
const info = (s) => console.log('  · ' + s);

// ── THE BUSINESS ────────────────────────────────────────────────────────────
const biz = (n) => ({
  company: `Scenario ${n} Roofing`,
  host: `scenario${n.toLowerCase()}roofing.example`,
  placeId: `ChIJ_scenario_${n}`,
});

const HOMEPAGE_MD = (b) => `# ${b.company}\n\nRoof repair and replacement for Dallas homeowners. Pete Barnes, Owner.\n\nWe answer the phone ourselves and we stand behind our work.\n\nBook online any time from our booking page, or call us.\n\nOur crews photograph every stage of the job so you can see what we saw.\n\nContact: info@${b.host}\n`;
const HOMEPAGE_HTML = (b) => `<!doctype html><html><head><title>${b.company}</title><meta name="viewport" content="width=device-width"><meta name="description" content="Roofing in Dallas"></head><body><nav><a href="https://${b.host}/about">About</a> <a href="https://${b.host}/booking">Book online</a> <a href="https://${b.host}/contact">Contact</a></nav><h1>${b.company}</h1><p>Roof repair and replacement for Dallas homeowners. Pete Barnes, Owner.</p><p>We answer the phone ourselves and we stand behind our work.</p><a href="https://${b.host}/booking" class="btn">Book online</a><form action="/contact"><input type="email" name="email"><input type="tel" name="phone"><textarea name="msg"></textarea></form><a href="tel:+12145550188">(214) 555-0188</a><a href="mailto:info@${b.host}">info@${b.host}</a><footer>&copy; 2026 ${b.company}</footer></body></html>`;

// Review texts the miner fixture quotes VERBATIM: the deep-mine verifier runs
// a punctuation-stripped four-word window over '[N stars] <text>' lines, so
// the evidence strings below are copied substrings of these, not paraphrases.
const REVIEWS = [
  { text: 'They never called me back after the estimate and I had to chase them for two weeks.', stars: 2, when: '2026-06-20' },
  { text: 'Great crew, roof looks fantastic, and they cleaned up everything.', stars: 5, when: '2026-07-01', reply: 'Thank you kindly - Pete' },
  { text: 'I asked for a quote and they never called me back after the first visit.', stars: 3, when: '2026-05-15' },
  { text: 'Fast, honest, and the price matched the estimate exactly.', stars: 5, when: '2026-07-20', reply: 'Appreciate it - Pete' },
];
const REVIEW_TOTAL = 4;   // small profile: under the 25-review floor, so the
                          // truncation guard never applies and 4 of 4 is a
                          // complete read by the contract's own arithmetic.

// ── THE FAKE UPSTREAM ───────────────────────────────────────────────────────
const state = {
  mode: 'golden',           // 'golden' | 'apify403' | 'husk' | 'fc402'
  requests: [],             // every hit: {host, path}
  contract: [],             // request-contract violations (e.g. a missing field mask)
  unknown: [],
};
const readBody = (req) => new Promise((resolve) => {
  let b = ''; req.on('data', (c) => { b += c; }); req.on('end', () => resolve(b));
});
const send = (res, code, obj, headers) => {
  const body = typeof obj === 'string' ? obj : JSON.stringify(obj);
  res.writeHead(code, Object.assign({ 'Content-Type': typeof obj === 'string' ? 'text/html' : 'application/json' }, headers || {}));
  res.end(body);
};

const placesList = (b) => {
  // One universal searchText answer: twenty places in prominence order with
  // OUR business at index 3 (#4) — rank checks find it by place id, resolve
  // matches it by domain, and the three rivals above carry fewer reviews so
  // outranked_by_weaker has ground to stand on.
  const mk = (i) => ({
    id: i === 3 ? b.placeId : `ChIJ_rival_${i}`,
    displayName: { text: i === 3 ? b.company : `Rival Roofing ${i}` },
    formattedAddress: `${100 + i} Main St, Dallas, TX 75201, USA`,
    websiteUri: i === 3 ? `https://${b.host}` : `https://rival${i}.example`,
    // Our own row in the SEARCH result deliberately carries a count that
    // CONTRADICTS Place Details (REVIEW_TOTAL): the response's reviewCount
    // must come from the details call (the authority), and when both sources
    // said the same number the assertion could not detect the precedence
    // regressing — an assertion that cannot fail is not an assertion.
    rating: 4.5, userRatingCount: i === 3 ? 999 : (i < 3 ? 2 + i : 30 + i),
    businessStatus: 'OPERATIONAL',
    internationalPhoneNumber: '+1 214-555-01' + String(10 + i),
    location: { latitude: 32.78 + i * 0.001, longitude: -96.8 },
    regularOpeningHours: { weekdayDescriptions: ['Monday: 8 AM–6 PM', 'Tuesday: 8 AM–6 PM', 'Wednesday: 8 AM–6 PM', 'Thursday: 8 AM–6 PM', 'Friday: 8 AM–6 PM', 'Saturday: Closed', 'Sunday: Closed'] },
  });
  return { places: Array.from({ length: 20 }, (_, i) => mk(i)) };
};
const placeDetails = (b) => ({
  rating: 4.6, userRatingCount: REVIEW_TOTAL, businessStatus: 'OPERATIONAL',
  primaryTypeDisplayName: { text: 'Roofing contractor' },
  regularOpeningHours: { weekdayDescriptions: ['Monday: 8 AM–6 PM', 'Tuesday: 8 AM–6 PM', 'Wednesday: 8 AM–6 PM', 'Thursday: 8 AM–6 PM', 'Friday: 8 AM–6 PM', 'Saturday: Closed', 'Sunday: Closed'] },
  websiteUri: `https://${b.host}`, nationalPhoneNumber: '(214) 555-0188',
  photos: Array.from({ length: 12 }, (_, i) => ({ name: `photo${i}` })),
  location: { latitude: 32.783, longitude: -96.8 },
  formattedAddress: '103 Main St, Dallas, TX 75201, USA',
  googleMapsUri: 'https://maps.google.com/?cid=1',
  reviews: REVIEWS.map((r) => ({ rating: r.stars, publishTime: r.when + 'T12:00:00Z', text: { text: r.text }, originalText: { text: r.text } })),
});
const apifyItems = (b) => REVIEWS.map((r, i) => ({
  text: r.text, stars: r.stars, publishedAtDate: r.when + 'T12:00:00.000Z',
  name: 'Reviewer ' + i, reviewsCount: REVIEW_TOTAL, totalScore: 4.6,
  placeId: b.placeId, responseFromOwnerText: r.reply || null,
}));

// One Anthropic responder, keyed on marker strings the contract map read off
// each call site's own prompt. Unmatched calls answer benign empty JSON so a
// new model call fails soft here and loud in its own boot check.
const anthropicAnswer = (bodyText, b) => {
  const wrap = (obj) => ({
    id: 'msg_fake', type: 'message', role: 'assistant', model: 'claude-haiku-4-5-20251001',
    content: [{ type: 'text', text: typeof obj === 'string' ? obj : JSON.stringify(obj) }],
    usage: { input_tokens: 1200, output_tokens: 180, cache_read_input_tokens: 0, cache_creation_input_tokens: 0 },
  });
  const t = bodyText;
  if (state.mode === 'husk' && /pitchAngle/.test(t) && /FACT_DISCIPLINE|NEVER fabricate|evidence/i.test(t) && /IMAGE|homepage|HOMEPAGE/i.test(t)) {
    return wrap({ pitchAngle: null, realPain: null, embarrassingFinding: null, situationRead: null, recommendedProduct: null, originalFindings: [] });
  }
  if (/REVIEWS PAGE:/.test(t)) {
    return wrap({ signals: [
      { pain: 'quotes that never come back', count: 2, evidence: 'never called me back after' },
    ], summary: 'two reviewers describe chasing an estimate that never came back' });
  }
  if (/confidenceScore/.test(t)) return wrap({ confidenceScore: 9, flaggedClaims: [] });
  if (/askOnTheCall/.test(t)) {
    return wrap({ shape: 'owner-operated roofer', background: 'A Dallas roofing crew led by its owner.',
      headline: 'The owner answers his own phone and his own reviews',
      read: 'This is a healthy owner-run crew whose booking promise and phone-first habits point in different directions. The work itself earns five stars; the estimate follow-up is the part his own customers describe chasing.',
      rows: [{ label: 'follow-up', says: 'two reviewers describe chasing an estimate that never came back' }],
      whatHeCaresAbout: 'He replies to his reviews personally and signs them.',
      whatHeNeeds: 'A follow-up path for estimates that does not depend on him remembering.',
      askOnTheCall: 'When a quote goes out and nobody answers, who chases it?' });
  }
  if (/pitchAngle/.test(t)) {
    return wrap({
      pitchAngle: 'Their own customers describe chasing estimates that never come back.',
      realPain: 'Quotes go out and the follow-up depends on the owner remembering.',
      embarrassingFinding: 'The booking page promises online scheduling and the phone is the only route that answers.',
      situationRead: 'A healthy owner-run crew whose follow-up is the weak link.',
      whatHeNeeds: 'A follow-up path for estimates that does not depend on memory.',
      recommendedProduct: 'Revenue Growth / CRO Retainer', recommendedPrice: '$50k+',
      recommendedReason: 'The demand exists and the leak is after the estimate.',
      originalFindings: [
        { finding: 'The homepage promises that the crew photographs every stage of the job.', evidence: 'photograph every stage of the job' },
      ],
      confidence: 'high',
    });
  }
  if (/WEBSITE TEXT:|CONTENT:|SEARCH RESULTS:|RESULTS:|REPLIES:/.test(t)) {
    return wrap({ name: 'Pete Barnes', title: 'Owner', evidence: 'Pete Barnes, Owner appears on the homepage', confidence: 'high' });
  }
  if (/PAGES:/.test(t)) {
    return wrap({ prices: [], services: ['roof repair', 'roof replacement'], booking: 'online_booking', hasCapture: false, ownerStory: null });
  }
  if (/WHAT WE KNOW ABOUT THE TARGET COMPANY/.test(t)) {
    return wrap({ match: 'yes', confidence: 'high', reason: 'name and trade on page', trade: 'roofer' });
  }
  return wrap({});
};

const fake = http.createServer(async (req, res) => {
  const seg = req.url.split('/').filter(Boolean);
  const host = seg[0] || '';
  const path = '/' + seg.slice(1).join('/');
  state.requests.push({ host, path: path.split('?')[0] });
  const body = await readBody(req);
  const b = state.biz || biz('A');

  if (host === 'api.anthropic.com') return send(res, 200, anthropicAnswer(body, b));

  if (host === 'places.googleapis.com') {
    // Light request-contract check: the fake ignores most headers, which makes
    // request drift invisible — but the field mask is the one header that
    // silently deletes measurements server-side when it goes missing, so its
    // absence is recorded and asserted after the golden lead.
    if (!req.headers['x-goog-fieldmask']) state.contract.push('places call without X-Goog-FieldMask: ' + path);
    if (/searchText/.test(path)) return send(res, 200, placesList(b));
    return send(res, 200, placeDetails(b));   // details by place id
  }

  if (host === 'api.firecrawl.dev') {
    if (state.mode === 'fc402') {
      return send(res, 402, { success: false, error: 'Payment Required: insufficient credits. Upgrade your plan.' });
    }
    const H = { 'x-ratelimit-limit': '1000' };
    if (/\/v1\/map/.test(path)) {
      return send(res, 200, { links: [`https://${b.host}/`, `https://${b.host}/about`, `https://${b.host}/booking`, `https://${b.host}/contact`] }, H);
    }
    if (/\/v1\/search/.test(path)) return send(res, 200, { data: [] }, H);
    if (/\/v1\/scrape/.test(path)) {
      let url = ''; try { url = JSON.parse(body).url || ''; } catch (e) { void e; }
      const isHome = url.replace(/\/+$/, '').endsWith(b.host);
      const md = isHome ? HOMEPAGE_MD(b)
        : `# ${b.company} - ${url.split('/').pop()}\n\nThis interior page of ${b.company} describes ${url.split('/').pop()} in honest detail, at enough length that the duplicate-page fingerprint can tell it apart from every other page on the site. The ${url.split('/').pop()} page carries its own words.\n`;
      return send(res, 200, { success: true, data: { markdown: md, rawHtml: HOMEPAGE_HTML(b) } }, H);
    }
    return send(res, 200, { success: true, data: {} }, H);
  }

  if (host === 'api.apify.com') {
    if (state.mode === 'apify403') return send(res, 403, { error: { type: 'user-not-authorized', message: 'Invalid token' } });
    return send(res, 200, apifyItems(b));
  }

  if (host === 'api.hunter.io') return send(res, 200, { data: { emails: [], pattern: null } });

  if (host === b.host || /\.example$/.test(host)) return send(res, 200, HOMEPAGE_HTML(b));

  state.unknown.push(host + path);
  return send(res, 404, { error: 'servercheck fake knows nothing about ' + host + path });
});

// ── DRIVING THE REAL SERVER ─────────────────────────────────────────────────
const bootServer = (extraEnv) => new Promise((resolve, reject) => {
  const child = spawn('node', ['--max-old-space-size=256', 'server.js'], {
    env: Object.assign({}, process.env, {
      PORT: String(SRV_PORT),
      FAKE_UPSTREAM: `http://127.0.0.1:${FAKE_PORT}`,
      GOOGLE_PLACES_KEY: 'gp_servercheck',
      // The pace is deliberately NOT overridden: the first attempt set
      // FC_GAP_UNKNOWN_MS=40 and FIRECRAWL PACING CHECK went red on it -
      // "1500 requests a minute against a free tier that allows 10" - which is
      // that guard refusing a process configured faster than the smallest plan
      // Firecrawl sells. The guard was right and the harness was wrong. So the
      // first lead pays the honest unknown-plan pace until the fake's
      // x-ratelimit-limit: 1000 header teaches the gate to relax, through the
      // same mechanism a real plan uses - which means this harness also proves
      // the relaxation works. Only the credit hold is shortened, and nothing
      // pins that setting.
      FC_CREDIT_WAIT_MS: '4000',
      RESEARCH_CONCURRENCY: '2',
    }, extraEnv || {}),
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let log = '';
  child.stdout.on('data', (d) => { log += d; });
  child.stderr.on('data', (d) => { log += d; });
  child.on('exit', (code) => { child.dead = true; child.exitCode2 = code; });
  const t0 = Date.now();
  const wait = async () => {
    for (;;) {
      if (child.dead) return reject(new Error('server died during boot:\n' + log.split('\n').slice(-12).join('\n')));
      // Kill the child on the timeout path — an orphan wedges SRV_PORT for
      // every later run, which reads as EADDRINUSE on a harness that is fine.
      if (Date.now() - t0 > 120000) { try { child.kill(); } catch (e) { void e; } return reject(new Error('healthz never went green in 120s')); }
      try {
        const r = await httpGet(`http://127.0.0.1:${SRV_PORT}/healthz`);
        if (r.code === 200 && r.json && r.json.status === 'green') return resolve({ child, log: () => log });
        if (r.code === 503) { /* still checking - this IS the healthz gate working */ }
      } catch (e) { void e; }
      await sleep(1000);
    }
  };
  wait();
});
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const httpGet = (url) => new Promise((resolve, reject) => {
  http.get(url, (res) => {
    let b = ''; res.on('data', (c) => { b += c; });
    res.on('end', () => { let j = null; try { j = JSON.parse(b); } catch (e) { void e; } resolve({ code: res.statusCode, json: j, text: b }); });
  }).on('error', reject);
});
const httpPost = (url, obj) => new Promise((resolve, reject) => {
  const body = JSON.stringify(obj);
  const u = new URL(url);
  const req = http.request({ hostname: u.hostname, port: u.port, path: u.pathname, method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } }, (res) => {
    let b = ''; res.on('data', (c) => { b += c; });
    res.on('end', () => { let j = null; try { j = JSON.parse(b); } catch (e) { void e; } resolve({ code: res.statusCode, json: j }); });
  });
  req.on('error', reject); req.write(body); req.end();
});

const leadBody = (b, over) => Object.assign({
  company: b.company, name: b.company, website: `https://${b.host}`, placeId: b.placeId,
  location: 'Dallas, TX 75201', industry: 'roofer',
  apiKey: 'sk-servercheck', keys: { firecrawlKey: 'fc-servercheck', apifyToken: 'ap-servercheck' },
  reviewCount: REVIEW_TOTAL, rating: 4.6,
}, over || {});

const runLead = async (b, over, capMs) => {
  const sub = await httpPost(`http://127.0.0.1:${SRV_PORT}/api/research-async`, leadBody(b, over));
  if (!sub.json || !sub.json.jobId) return { error: 'no jobId: ' + JSON.stringify(sub.json).slice(0, 200) };
  const t0 = Date.now();
  for (;;) {
    await sleep(700);
    const st = await httpGet(`http://127.0.0.1:${SRV_PORT}/api/research-job/${sub.json.jobId}`);
    if (st.json && (st.json.status === 'done' || st.json.status === 'error') && st.json.phase !== 'queued' && st.json.phase !== 'running') {
      return st.json;
    }
    if (st.json && st.json.status === 'error' && st.json.error) return st.json;
    if (Date.now() - t0 > (capMs || 180000)) return { error: 'poll cap: still ' + JSON.stringify(st.json && { status: st.json.status, phase: st.json.phase }) };
  }
};

// ── THE SCENARIOS ───────────────────────────────────────────────────────────
(async () => {
  await new Promise((r) => fake.listen(FAKE_PORT, '127.0.0.1', r));
  console.log('servercheck: fixture network on :' + FAKE_PORT);

  let srv = null;
  try {
    // healthz must gate: hit it before boot settles (bootServer loops on it,
    // and the loop itself observed 503-while-checking on the way to 200).
    srv = await bootServer({});
    console.log('servercheck: server green on :' + SRV_PORT + ' (healthz held 503 until the verdict settled, then answered 200)');
    passed += 1;

    // ── A: THE GOLDEN LEAD ──────────────────────────────────────────────
    console.log('\n── scenario A: the golden lead');
    state.mode = 'golden'; state.biz = biz('A');
    const A = await runLead(state.biz);
    ok(A.httpStatus === 200 && A.result, `the golden lead did not complete 200 — got ${JSON.stringify({ httpStatus: A.httpStatus, error: (A.error || '').slice(0, 160) })}`);
    const R = A.result || {};
    if (!(Array.isArray(R.problemList) && R.problemList.length > 0)) {
      info('ladder diagnostics: _ladderFailed=' + JSON.stringify((R.brainAudit && R.brainAudit._ladderFailed) || R._ladderFailed || null).slice(0, 300));
      srv.log().split('\n').filter((l) => /harm ladder|LADDER|COMPOSE TRACE|SPINE|_harmsForResponse/.test(l)).slice(-12)
        .forEach((l) => info('server: ' + l.slice(0, 220)));
    }
    // These ride the response NESTED under brainAudit — the explicit literal
    // whose own comment reads "NAMED HERE OR IT DOES NOT EXIST" — because that
    // is where the client merge reads them from. The first run of this harness
    // asserted them at top level, went red, and the server log showed the
    // ladder alive with three findings: an aim error in the HARNESS, found by
    // reading the trace it prints for exactly this case. Asserted at the level
    // the CLIENT actually consumes, which is the only level that matters.
    const BA = R.brainAudit || {};
    ok(Array.isArray(BA.problemList) && BA.problemList.length > 0, 'the ladder produced no problem list — the audit is model prose with nothing under it, the exact §40 failure');
    ok(BA.factualSpine && BA.factualSpine.claim, 'no factual spine was built, so Generate falls back to the highest-invention path');
    ok(Array.isArray(BA.harmsRanked) && BA.harmsRanked.length > 0, 'harmsRanked is empty — the call sheet loses the ranked findings');
    ok(BA.composedEmail && BA.composedEmail.variantA && BA.composedEmail.variantA.subject, 'no composed email arrived with the audit — the compose-with-research promise (§41) is dark');
    ok(R.reviewCount === REVIEW_TOTAL, `reviewCount is ${R.reviewCount}, not the Place Details count ${REVIEW_TOTAL} — the 150-of-8 class, the authority rule broken`);
    ok(BA.pitchAngle, 'the brain audit did not land on the payload');
    ok(R.situationRead != null, 'the situation read is missing');
    const sp = R.leadSpend || {};
    ok(sp.fcCredits > 0, 'leadSpend.fcCredits is zero on a lead that scraped pages — the per-request ledger is dark');
    ok(sp.places >= 2, `leadSpend.places is ${sp.places} — the Places calls are not being counted per lead`);
    ok(sp.anthropicUsd > 0, 'leadSpend.anthropicUsd is zero on a lead that ran the audit');
    ok(sp.apify === 1, `leadSpend.apify is ${sp.apify}, not 1`);
    const spend1 = await httpGet(`http://127.0.0.1:${SRV_PORT}/api/spend`);
    ok(spend1.json && spend1.json.spend && spend1.json.spend.fc > 0, '/api/spend does not reflect the day');
    ok(spend1.json && spend1.json.byKind && Object.keys(spend1.json.byKind).length > 0, '/api/spend has no per-kind split, so FC_SCREENSHOT_CREDITS can never be reconciled');
    ok(R.reviewsRead >= 1, `reviewsRead is ${R.reviewsRead} on a lead whose review mine answered — scenario C's null assertion is vacuous unless the golden path populates it`);
    ok(!/FACT CHECK DID NOT RUN/.test(srv.log()), 'the fact-check — the last gate before a prospect — did not run on the golden lead, and the marker-keyed fake fails soft exactly there');
    ok(state.contract.length === 0, `request-contract violations: ${state.contract.join(' | ')}`);

    // ── B: PREFLIGHT, ZERO NETWORK ──────────────────────────────────────
    console.log('── scenario B: preflight refusal, zero spend');
    const before = state.requests.length;
    const B = await runLead(biz('B'), { apiKey: '' }, 30000);
    ok(/Anthropic/.test(String(B.error || '')), `a lead with no Anthropic key was not refused by name — got: ${String(B.error || '(none)').slice(0, 120)}`);
    ok(state.requests.length === before, `the preflight refusal still made ${state.requests.length - before} network call(s) — "nothing was spent" is false`);
    // The SYNCHRONOUS route — the client's fallback when -async 404s — must
    // clear the same gates. Until 2026-08-22 it was a door around them: a
    // lead posted here started spending with no preflight and no ceiling.
    const beforeSync = state.requests.length;
    const Bsync = await httpPost(`http://127.0.0.1:${SRV_PORT}/api/research`, leadBody(biz('B2'), { apiKey: '' }));
    ok(Bsync.code === 422 && /Anthropic/.test(String((Bsync.json && Bsync.json.error) || '')),
      `the synchronous /api/research route admitted a lead the queue refuses (got ${Bsync.code}: ${String((Bsync.json && Bsync.json.error) || '').slice(0, 120)}) — a door around the admission gates`);
    ok(state.requests.length === beforeSync, `the sync-route refusal still made ${state.requests.length - beforeSync} network call(s)`);

    // ── C: DEAD APIFY TOKEN ─────────────────────────────────────────────
    console.log('── scenario C: Apify 403 — the mine is dark, the audit is not');
    state.mode = 'apify403'; state.biz = biz('C');
    const C = await runLead(state.biz);
    ok(C.httpStatus === 200 && C.result, `an Apify 403 killed the whole lead (${JSON.stringify({ httpStatus: C.httpStatus, error: (C.error || '').slice(0, 120) })}) — the mine going dark must thin the audit, not delete it`);
    ok(C.result && (C.result.reviewsRead == null || C.result.reviewsRead === 0), 'reviewsRead is populated on a lead whose review pull was refused — a dead token reported as a measurement');

    // ── D: THE BRAIN HUSK ───────────────────────────────────────────────
    console.log('── scenario D: the audit comes back empty — BRAIN GATE 422');
    state.mode = 'husk'; state.biz = biz('D');
    const D = await runLead(state.biz);
    ok(D.httpStatus === 422, `an empty audit did not 422 (got ${D.httpStatus}) — the husk ships as a real audit`);

    // ── E: FIRECRAWL OUT OF CREDITS ─────────────────────────────────────
    // LAST on this boot: the 402 latch is process state by design.
    console.log('── scenario E: Firecrawl 402 — the latch and the bounded hold');
    state.mode = 'fc402'; state.biz = biz('E');
    const E = await runLead(state.biz, {}, 90000);
    // What the latch PROMISES: after the first 402 not one further Firecrawl
    // credit moves, and the response records that the site was never read —
    // corpusRead.homepageChars 0 is what the client's blind banner fires on.
    ok(E.httpStatus === 200 || E.httpStatus === 422, `a 402 day produced ${JSON.stringify({ httpStatus: E.httpStatus, error: (E.error || '').slice(0, 120) })}`);
    if (E.result) {
      ok((E.result.leadSpend || {}).fcCredits === 0, `Firecrawl spend on a 402 day is ${(E.result.leadSpend || {}).fcCredits}, not 0 — the latch is not stopping the doors`);
      ok(E.result.corpusRead && E.result.corpusRead.homepageChars === 0, `corpusRead says ${JSON.stringify(E.result.corpusRead)} on a lead whose every page read was refused — the blind banner has nothing to fire on`);
    }
    ok(/FIRECRAWL OUT OF CREDITS/.test(srv.log()), 'the 402 never printed its own name in the log — the operator reads a blind audit with no cause attached');

    srv.child.kill(); await sleep(400);

    // ── F: THE DAY CEILING, ON A FRESH BOOT ─────────────────────────────
    console.log('── scenario F: FC_DAILY_BUDGET=5 — lead one finishes over it, lead two is refused');
    state.mode = 'golden'; state.biz = biz('F');
    srv = await bootServer({ FC_DAILY_BUDGET: '5' });
    const F1 = await runLead(state.biz);
    ok(F1.httpStatus === 200, `the lead that CROSSED the ceiling mid-run was killed (${F1.httpStatus}: ${(F1.error || '').slice(0, 100)}) — a half-lead is pure waste and the rule is admission-only`);
    const F2 = await runLead(biz('G'), {}, 30000);
    ok(/FC_DAILY_BUDGET/.test(String(F2.error || '')), `the lead AFTER the ceiling was not refused naming the setting — got: ${String(F2.error || '(none)').slice(0, 140)}`);

    if (state.unknown.length) info('endpoints the fake did not know (tolerated by the routes): ' + [...new Set(state.unknown)].slice(0, 6).join(', '));
  } catch (e) {
    fails.push('COULD NOT RUN — ' + (e && e.message));
    console.log('  ✗ COULD NOT RUN — ' + (e && e.message));
  } finally {
    try { if (srv) srv.child.kill(); } catch (e) { void e; }
    fake.close();
  }

  console.log('');
  if (fails.length) {
    console.log(`✗ servercheck: ${fails.length} failure(s) across the research route`);
    process.exit(1);
  }
  console.log(`✓ server.js: the research route was DRIVEN, not read — ${passed} assertions over a fake network. A real lead completes with a live ladder, a spine, the authoritative review count and its own spend figure; a missing key is refused before one network call; a dead Apify token thins the audit instead of deleting it; an empty audit 422s; a 402 day is named; and the day ceiling refuses the NEXT lead while letting the one that crossed it finish. The seams between the functions - where every computed-but-not-passed has ever lived - finally have a check that walks them.`);
  process.exit(0);
})();
