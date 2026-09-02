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
//   G  calling mode — the paid owner wave is not bought
//   H  the Find-tab contact read — a plainly readable site costs ZERO
//      Firecrawl credits, all three ICP signals are measured, the owner and
//      the address come off pages nobody paid for
//   H2 the same read on a site that refuses a plain fetch — and ONLY then
//      does a credit move
//   H3 no website at all — every site-derived signal is null, never false
//   H4 the contact route refuses before it spends
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

const OWNER_LINE = () => (state.mode === 'nosettle' ? '' : ' Pete Barnes, Owner.');
const HOMEPAGE_MD = (b) => `# ${b.company}\n\nRoof repair and replacement for Dallas homeowners.${OWNER_LINE()}\n\nWe answer the phone ourselves and we stand behind our work.\n\nBook online any time from our booking page, or call us.\n\nOur crews photograph every stage of the job so you can see what we saw.\n\nContact: info@${b.host}\n`;
const HOMEPAGE_HTML = (b) => `<!doctype html><html><head><title>${b.company}</title><meta name="viewport" content="width=device-width"><meta name="description" content="Roofing in Dallas"></head><body><nav><a href="https://${b.host}/about">About</a> <a href="https://${b.host}/booking">Book online</a> <a href="https://${b.host}/contact">Contact</a></nav><h1>${b.company}</h1><p>Roof repair and replacement for Dallas homeowners.${OWNER_LINE()}</p><p>We answer the phone ourselves and we stand behind our work.</p><a href="https://${b.host}/booking" class="btn">Book online</a><form action="/contact"><input type="email" name="email"><input type="tel" name="phone"><textarea name="msg"></textarea></form><a href="tel:+12145550188">(214) 555-0188</a><a href="mailto:info@${b.host}">info@${b.host}</a><footer>&copy; 2026 ${b.company}</footer></body></html>`;

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
    // 'nosettle' is the ONLY state in which the calling-mode branch is
    // reachable: a name with no TITLE scores authority 30, which clears
    // neither the corroboration floor (75) nor the own-site floor (90), and
    // 'Barnes' is nowhere in the company name or the domain so the eponymous
    // settle cannot fire either. Without this the callOnly lead would settle at
    // stage 1 like the golden one and the scenario would report a clean pass
    // while exercising nothing - the vacuous-check trap.
    if (state.mode === 'nosettle') {
      return wrap({ name: null, title: null, evidence: '', confidence: 'low' });
    }
    return wrap({ name: 'Pete Barnes', title: 'Owner', evidence: 'Pete Barnes, Owner appears on the homepage', confidence: 'high' });
  }
  if (/PAGES:/.test(t)) {
    return wrap({ prices: [], services: ['roof repair', 'roof replacement'], booking: 'online_booking', hasCapture: false, ownerStory: null });
  }
  if (/WHAT WE KNOW ABOUT THE TARGET COMPANY/.test(t)) {
    if (state.mode === 'findstranger') return wrap({ match: 'no', confidence: 'high', reason: 'an unrelated widget supplier', trade: '' });
    return wrap({ match: 'yes', confidence: 'high', reason: 'name and trade on page', trade: 'roofer' });
  }
  return wrap({});
};

// ── THE FIND-TAB CONTACT SITE ───────────────────────────────────────────────
// A site carrying all three free ICP signals, so the read can be asserted in
// the POSITIVE direction as well as the negative one. A fixture that only ever
// exercises the "nothing found" shape proves nothing about the finding half.
const FIND_HOME_HTML = (b) => `<!doctype html><html><head><title>${b.company}</title>`
  + `<script async src="https://www.googleadservices.com/pagead/conversion_async.js"></script>`
  + `<meta name="viewport" content="width=device-width"></head><body>`
  + `<nav><a href="https://${b.host}/our-team">Our Team</a> <a href="https://${b.host}/contact">Contact</a>`
  + ` <a href="https://${b.host}/careers">Careers</a> <a href="https://facebook.com/x">Facebook</a></nav>`
  + `<h1>${b.company}</h1><p>Roof repair and replacement for Dallas homeowners, since 1998.</p>`
  + `<p>${'We answer the phone ourselves and we stand behind our work. '.repeat(12)}</p>`
  + `<footer>&copy; 2026 ${b.company}</footer></body></html>`;
const FIND_STRANGER_HTML = () => `<!doctype html><html><head><title>Zeta Widgets Supply</title></head><body><h1>Zeta Widgets Supply</h1>`
  + `<p>${'Industrial widgets, flanges and fittings for the trade, shipped same day from our Dallas warehouse. '.repeat(8)}</p>`
  + `<footer>&copy; 2026 Zeta Widgets Supply</footer></body></html>`;
const FIND_TEAM_HTML = (b) => `<!doctype html><html><body><h1>Our Team</h1>`
  + `<div><h3>Pete Barnes</h3><p>Owner</p></div>`
  + `<div><h3>Dana Willis</h3><p>Operations Manager</p></div>`
  + `<div><h3>Ray Alonzo</h3><p>Lead Estimator</p></div>`
  + `<p>${'The crew has worked together for years and it shows on every roof. '.repeat(10)}</p>`
  + `</body></html>`;
const FIND_CONTACT_HTML = (b) => `<!doctype html><html><body><h1>Contact</h1>`
  + `<p>Call (214) 555-0188 or email <a href="mailto:pete@${b.host}">pete@${b.host}</a>.</p>`
  + `<p>${'We answer every message the same day, and we mean it. '.repeat(12)}</p>`
  + `</body></html>`;
const FIND_CAREERS_HTML = (b) => `<!doctype html><html><body><h1>Careers</h1><p>We are hiring.</p>`
  + `<script type="application/ld+json">{"@context":"https://schema.org","@type":"JobPosting",`
  + `"title":"Marketing Manager","datePosted":"${new Date(Date.now() - 21 * 864e5).toISOString().slice(0, 10)}"}</script>`
  + `<p>${'Join a crew that turns up on time and finishes what it starts. '.repeat(12)}</p>`
  + `</body></html>`;

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

  // ── THE FREE NAME-TO-DOMAIN SLATE (round 105) ─────────────────────────────
  // 'findtwin' hands back two different hosts under one name, which is the
  // ambiguity the resolver must refuse; every other mode names the fixture host.
  if (host === 'autocomplete.clearbit.com') {
    if (state.mode === 'findnoresolve') return send(res, 200, []);
    if (state.mode === 'findtwin') return send(res, 200, [{ name: b.company, domain: b.host }, { name: b.company, domain: b.host.replace('roofing.example', 'roofingco.example') }]);
    return send(res, 200, [{ name: b.company, domain: b.host }]);
  }
  if (host === 'api.thecompaniesapi.com') {
    if (/by-name/.test(path)) return send(res, 200, { companies: (state.mode === 'findtwin' || state.mode === 'findnoresolve') ? [] : [{ about: { name: b.company }, domain: { domain: b.host } }] });
    return send(res, 404, {});
  }

  if (host === b.host || /\.example$/.test(host)) {
    // findblocked: the site refuses a plain fetch outright, which is the ONLY
    // case in which the contact read is allowed to spend a Firecrawl credit.
    if (state.mode === 'findblocked') return send(res, 403, '<html><body>Access Denied. You have been blocked.</body></html>');
    // A resolved domain serving SOMEBODY ELSE'S site: never names the business.
    if (state.mode === 'findstranger') return send(res, 200, FIND_STRANGER_HTML());
    if (state.mode === 'findrich') {
      if (/our-team/.test(path)) return send(res, 200, FIND_TEAM_HTML(b));
      if (/contact/.test(path)) return send(res, 200, FIND_CONTACT_HTML(b));
      if (/careers/.test(path)) return send(res, 200, FIND_CAREERS_HTML(b));
      return send(res, 200, FIND_HOME_HTML(b));
    }
    return send(res, 200, HOMEPAGE_HTML(b));
  }

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
      // The one free name-to-domain source with a real match standard.
      COMPANIES_API_KEY: 'capi_servercheck',
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
    // The model-call count on a COMPLETE lead. Scenario D compares against this
    // rather than against a number written here, so the comparison stays true
    // as the pipeline grows or shrinks.
    const anthCalls = () => state.requests.filter(q => q.host === 'api.anthropic.com').length;
    const a0 = anthCalls();
    const A = await runLead(state.biz);
    const goldenModelCalls = anthCalls() - a0;
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
    // Exactly the fixture's length, not merely non-zero. reviewsRead is the
    // number of reviews the MODEL was shown, and the pull now fits its own
    // corpus before counting anything — so this is the live proof that the
    // corpus wire is intact end to end. `>= 1` would pass on a build where the
    // corpus arrived truncated and the count was taken over the whole scrape,
    // which is the exact defect the corpus builder replaces.
    ok(R.reviewsRead === REVIEWS.length, `reviewsRead is ${R.reviewsRead}, not the ${REVIEWS.length} reviews the fake returned — the number reported as read has come apart from the number the model was shown`);
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
    const d0 = anthCalls();
    const D = await runLead(state.biz);
    const huskModelCalls = anthCalls() - d0;
    ok(D.httpStatus === 422, `an empty audit did not 422 (got ${D.httpStatus}) — the husk ships as a real audit`);
    // AND IT MUST STOP SPENDING. The refusal is unchanged; what changed is that
    // a lead already destined for the 422 no longer buys the strategic read and
    // the fact-check first, whose answers are discarded with it. Compared
    // against the golden lead on this same boot, so the assertion cannot rot
    // into a hardcoded number.
    ok(/BRAIN GATE \(early\)/.test(srv.log()), 'the husk never hit the early gate — it is still paying for the strategic read and the fact-check before being refused ~2,000 lines later');
    ok(huskModelCalls < goldenModelCalls, `a husk lead made ${huskModelCalls} model call(s) against the golden lead's ${goldenModelCalls} — it is buying as much as a lead that ships`);
    ok(goldenModelCalls > 0, 'the golden lead made no model calls at all, so the husk comparison above proves nothing');

    // ── G: CALLING MODE ──────────────────────────────────
    // Driven end to end, in BOTH directions, on a lead that deliberately cannot
    // settle at stage 1 - a name with no title, on a business it is not named
    // after. That state is the only one in which the branch is reachable, and
    // without it this scenario would report a clean pass having exercised
    // nothing, which is the vacuous-check trap.
    //
    // The control runs FIRST so the comparison is against this build, not
    // against a remembered number.
    console.log('── scenario G: calling mode — the paid owner wave is not bought');
    const fcSearches = () => state.requests.filter(q => q.host === 'api.firecrawl.dev' && /\/v1\/search/.test(q.path)).length;
    state.mode = 'nosettle'; state.biz = biz('G');
    const g0 = fcSearches();
    const Gctl = await runLead(state.biz);
    const ctlSearches = fcSearches() - g0;
    ok(Gctl.httpStatus === 200, `the control lead for calling mode did not complete (got ${Gctl.httpStatus})`);
    ok(ctlSearches > 0, 'the control lead bought ZERO owner searches, so this fixture settles at stage 1 and the calling-mode comparison below proves nothing');

    state.biz = biz('G2');
    const g1 = fcSearches();
    const Gcall = await runLead(state.biz, { callOnly: true });
    const callSearches = fcSearches() - g1;
    ok(Gcall.httpStatus === 200, `a calling-mode lead did not complete (got ${Gcall.httpStatus}) — the flag must change what is BOUGHT, never whether the audit ships`);
    ok(callSearches === 0, `calling mode still bought ${callSearches} owner search(es) against the control's ${ctlSearches} — the flag is not reaching findDecisionMaker`);
    ok(/CALL MODE/.test(srv.log()), 'the calling-mode branch never printed its own name, so the run has no record of why the owner lookups were skipped');
    // The audit itself must be UNCHANGED: this cuts a name lookup, not evidence.
    // Compared against the control on the SAME fixture rather than asserted
    // absolutely - the no-owner fixture is deliberately thin, so an absolute
    // assertion here would be testing the fixture instead of the flag, and would
    // pass or fail for reasons that have nothing to do with calling mode.
    const _pl = (x) => (((x || {}).result || {}).brainAudit || {}).problemList;
    const ctlFindings = Array.isArray(_pl(Gctl)) ? _pl(Gctl).length : -1;
    const callFindings = Array.isArray(_pl(Gcall)) ? _pl(Gcall).length : -1;
    info(`calling mode: ${ctlSearches} owner search(es) on the control and ${callSearches} in calling mode; ${ctlFindings} finding(s) either side`);
    ok(callFindings === ctlFindings,
      `calling mode changed the AUDIT: ${callFindings} finding(s) against the control's ${ctlFindings}. It must change what is BOUGHT, never what is measured.`);
    // The finding count can legitimately be zero on this deliberately thin
    // fixture, so the evidence GATHERED is asserted separately: the same pages
    // must be read either way. This is the half that would catch a flag which
    // had quietly reached the page budget instead of the owner ladder.
    const _chars = (x) => (((x || {}).result || {}).corpusRead || {}).homepageChars;
    // Not equality: the two fixtures carry their own company name and host, and
    // those appear in the page, so the counts differ by exactly that much. What
    // must hold is that BOTH read the whole page.
    ok(_chars(Gcall) > 200 && Math.abs(_chars(Gcall) - _chars(Gctl)) < 20,
      `calling mode read ${_chars(Gcall)} characters of their homepage against the control's ${_chars(Gctl)} - it has reached the evidence, not just the owner lookups`);

    // ── H: THE FIND-TAB CONTACT READ, DRIVEN ────────────────────────────
    // The standing goal is fifty leads a day with an owner, an address, a
    // number and a score, and this route is where that is decided. Every
    // assertion below is about the SEAM, which is where every recorded
    // computed-but-not-passed has lived: the fixtures already prove the
    // predicates at boot, and a route that never delivers them would still
    // boot green.
    console.log('── scenario H: the Find contact read — free pages, three signals, a score');
    const fcCalls = () => state.requests.filter(q => q.host === 'api.firecrawl.dev').length;
    state.mode = 'findrich'; state.biz = biz('H');
    const hBiz = state.biz;
    const h0 = fcCalls();
    // Scoped to THIS lead's window. state.requests accumulates across every
    // scenario and the golden lead legitimately buys a review pull, so an
    // absolute count here measures somebody else's spend - a harness that
    // reports the wrong scenario's numbers is worse than no assertion.
    const apifyCalls = () => state.requests.filter(q => q.host === 'api.apify.com').length;
    const hAp0 = apifyCalls();
    const H1 = await httpPost(`http://127.0.0.1:${SRV_PORT}/api/find-contact`, {
      company: { name: hBiz.company, website: `https://${hBiz.host}`, phone: '(214) 555-0188',
                 location: 'Dallas, TX', industry: 'roofer', reviewCount: 180, rating: 4.6 },
      keys: { anthropicKey: 'k-test', firecrawlKey: 'fc-test', verifierKey: '' },
    });
    const hFc = fcCalls() - h0;
    const hApify = apifyCalls() - hAp0;
    const HJ = H1.json || {};
    ok(H1.code === 200, `the contact read answered ${H1.code}: ${String(HJ.error || '').slice(0, 160)}`);
    // THE HEADLINE. The whole cost case rests on this one number: a site that
    // answers a plain HTTP GET must cost NOTHING. If this ever goes above zero
    // the read has quietly gone back to buying pages it could have had free,
    // and the "under $100 a month" arithmetic goes with it.
    ok(hFc === 0, `the contact read made ${hFc} Firecrawl call(s) on a site that answers a plain fetch — the free read is not the door any more`);
    ok((HJ.spend || {}).firecrawl === 0, `the contact read reports ${(HJ.spend || {}).firecrawl} Firecrawl credit(s) on a plainly readable site`);
    ok(/plain fetch/.test(String(HJ.readVia || '')), `readVia says "${HJ.readVia}" rather than naming the free read`);
    // Their own navigation, not a paid sitemap: the team, contact and careers
    // pages must all have been found from the homepage's own links.
    const hPaths = (HJ.pagesRead || []).map(p => String(p.url).split('/').pop()).join(',');
    ok((HJ.pagesRead || []).length >= 3, `only ${(HJ.pagesRead || []).length} page(s) were read (${hPaths}) — the navigation harvest is not reaching the picker`);
    // THE THREE SIGNALS, in the positive direction.
    const HS = HJ.signals || {};
    ok(HS.adsCode === true, `the Google ad tag on their homepage did not read as ad spend (adsCode=${JSON.stringify(HS.adsCode)})`);
    ok(HS.teamCount === 3, `the three-person team page read as ${JSON.stringify(HS.teamCount)} — the headcount is the closest free thing to the revenue band the ICP is defined by`);
    ok(HS.hiringMarketing === true, `the dated Marketing Manager posting did not read as hiring for marketing (${JSON.stringify(HS.hiringTitles)})`);
    // THE SCORE, delivered and complete.
    ok(HJ.icp && typeof HJ.icp.score === 'number', `no ICP score arrived: ${JSON.stringify(HJ.icp)}`);
    ok(HJ.icp && HJ.icp.of >= 7 && HJ.icp.measured === HJ.icp.of, `the score was measured on ${HJ.icp && HJ.icp.measured} of ${HJ.icp && HJ.icp.of} signals on a lead carrying every one`);
    // THE TWO TERMS THAT ONLY EXIST AFTER THE LOOKUPS RUN. This is the whole of
    // section 98's score fix and no boot fixture can see it: findIcpScore used
    // to be called ~370 lines ABOVE the owner and address lookups, so a lead
    // where we found both scored identically to one where we found neither.
    ok(HJ.icp && (HJ.icp.terms || []).some(t => t.id === 'reach' && t.measured),
      'the reach term is not measured on a lead that produced a named owner and a published address, so the score is being computed before the lookups again');
    ok(HJ.icp && (HJ.icp.terms || []).some(t => t.id === 'afford' && t.measured),
      'the affordability band is not reaching the contact score, so the Find card, the CSV and contactRankFor are back to three verdicts about one business');
    ok(HJ.icp && HJ.icp.score >= 80, `a business with ad spend, a crew, a marketing hire, 180 reviews and 4.6 stars scored ${HJ.icp && HJ.icp.score}/100`);
    // THE OWNER, from the shared resolver, off pages nobody paid for.
    ok(HJ.owner && /Pete Barnes/.test(String(HJ.owner.name || '')), `the owner named on their own team page was not resolved: ${JSON.stringify(HJ.owner)}`);
    // THE ADDRESS, off the free contact page.
    ok(HJ.email && /pete@/.test(String(HJ.email.address || '')), `the address published on their contact page was not found: ${JSON.stringify(HJ.email)}`);
    ok(HJ.phone === '(214) 555-0188', `the phone from the listing did not survive: ${JSON.stringify(HJ.phone)}`);
    // HOW SURE WE ARE, which the card and the CSV both read. A row that cannot
    // tell a corroborated name from one the buying floor held back is the
    // defect this round exists to close, and no boot fixture sees the wire.
    ok(HJ.owner && HJ.owner.grade, `the owner arrived with no evidence grade: ${JSON.stringify(HJ.owner)}`);
    ok(HJ.owner && /Pete/.test(String(HJ.owner.askAs || '')),
      `the row carries no instruction for the rep about this name: ${JSON.stringify(HJ.owner && HJ.owner.askAs)}`);
    ok(HJ.email && HJ.email.grade === 'published_personal',
      `an address published on their own contact page graded "${HJ.email && HJ.email.grade}"`);
    // THE FREE OWNER SOURCE MUST NOT FIRE WHEN THE FREE READ ALREADY SETTLED.
    // H settles at stage 1 off their own team page, so the review pull is money
    // we must not spend - the owner's rule was "only when free fails".
    ok(hApify === 0,
      `a lead that settled its owner for free bought ${hApify} review pull(s), so the review-reply source is billing every lead rather than only the ones the free read could not settle`);
    // A site we READ must not be reported as unmeasured independence.
    ok(HJ.chain && HJ.chain.measured === true,
      `a lead whose pages we read reports its chain evidence as unmeasured: ${JSON.stringify(HJ.chain)}`);

    // ── H2: THE SITE REFUSES A PLAIN FETCH ──────────────────────────────
    // The ONLY case a credit may be spent, and the case in which every absence
    // must go silent rather than become a claim about their business.
    console.log('── scenario H2: a site that refuses a plain fetch falls back, and only then');
    state.mode = 'findblocked'; state.biz = biz('H2');
    const h2 = fcCalls();
    const H2 = await httpPost(`http://127.0.0.1:${SRV_PORT}/api/find-contact`, {
      company: { name: state.biz.company, website: `https://${state.biz.host}`, phone: '', reviewCount: 40, rating: 4.4 },
      keys: { anthropicKey: 'k-test', firecrawlKey: 'fc-test' },
    });
    const h2Fc = fcCalls() - h2;
    const H2J = H2.json || {};
    ok(H2.code === 200, `the blocked-site contact read answered ${H2.code}: ${String(H2J.error || '').slice(0, 140)}`);
    ok(h2Fc > 0, 'a site that refused a plain fetch did NOT fall back to Firecrawl, so the lead is lost rather than costing a credit');
    ok(/Firecrawl/.test(String(H2J.readVia || '')), `readVia says "${H2J.readVia}" on a lead that fell back`);
    // Two of the five terms still measure (reviews, rating), so the score is
    // out of what could be read and SAYS so - it is not a low score.
    ok(H2J.icp && H2J.icp.measured >= 2, `a lead read only through the fallback measured ${H2J.icp && H2J.icp.measured} signal(s)`);

    // ── H3: NOTHING READ IS NOT A BAD BUSINESS ──────────────────────────
    // No website at all. Every site-derived signal must be null, the score must
    // rest only on what Find already knew, and nothing may report a definite no.
    console.log('── scenario H3: no website — every site signal is null, never false');
    // 'findnoresolve': the free slate finds NOTHING for this name, so the lead
    // stays website-less. Round 105 made a name-only lead resolvable, and in
    // 'findrich' this fixture resolved, read the site and correctly reported
    // ads, a team and hiring - which is the feature working, not this scenario.
    state.mode = 'findnoresolve'; state.biz = biz('H3');
    const h3 = fcCalls();
    const H3 = await httpPost(`http://127.0.0.1:${SRV_PORT}/api/find-contact`, {
      company: { name: state.biz.company, website: '', phone: '(214) 555-0199', reviewCount: 90, rating: 4.5 },
      keys: { anthropicKey: 'k-test', firecrawlKey: 'fc-test' },
    });
    const H3J = H3.json || {};
    ok(H3.code === 200, `a lead with no website answered ${H3.code} instead of a phone-only row`);
    ok(fcCalls() - h3 === 0, 'a lead with no website still spent Firecrawl credits');
    const S3 = H3J.signals || {};
    ok(S3.adsCode === null && S3.teamCount === null && S3.hiringAny === null,
      `a business whose site we never opened reports definite answers: ${JSON.stringify({ ads: S3.adsCode, team: S3.teamCount, hiring: S3.hiringAny })} — that is the unmeasured-as-zero failure aimed at a claim about their money`);
    // The review count, the rating, and the fact that the lookups RAN and
    // found nothing. Nothing site-derived, and NOT the affordability band -
    // this fixture carries no industry, so the trade tier and the capacity
    // class have nothing to read and the band correctly declines to speak.
    // (It measures on scenario H, where an industry is present: measured===7.)
    ok(H3J.icp && H3J.icp.measured === 3, `the no-website lead scored on ${H3J.icp && H3J.icp.measured} signals; only the review count, the rating and the empty result of the lookups were measurable`);
    ok(H3J.icp && (H3J.icp.terms || []).some(t => t.id === 'reach' && t.measured),
      'the lookups ran on a lead with no website and the reach term still says unmeasured');
    ok(H3J.icp && !(H3J.icp.terms || []).some(t => (t.id === 'size' || t.id === 'ads' || t.id === 'hiring') && t.measured),
      'a business whose site we never opened is being scored on its site');
    ok(H3J.phone === '(214) 555-0199', 'the phone from the listing was lost on a lead with no website, which is the only field that lead has');

    // ── H4: THE ADMISSION GATES ─────────────────────────────────────────
    console.log('── scenario H4: the contact route refuses before it spends');
    const h4 = state.requests.length;
    const H4a = await httpPost(`http://127.0.0.1:${SRV_PORT}/api/find-contact`, {
      company: { name: 'No Key Co', website: 'https://x.example' }, keys: {},
    });
    ok(H4a.code === 422 && /Anthropic/.test(String((H4a.json || {}).error || '')),
      `a contact read with no Anthropic key was not refused by name (got ${H4a.code})`);
    const H4b = await httpPost(`http://127.0.0.1:${SRV_PORT}/api/find-contact`, {
      company: { name: 'Bad URL Co', website: 'not a url at all' }, keys: { anthropicKey: 'k-test' },
    });
    ok(H4b.code === 422 && /usable website/.test(String((H4b.json || {}).error || '')),
      `a website that cannot be a URL was not refused before spending (got ${H4b.code}: ${String((H4b.json || {}).error || '').slice(0, 120)})`);
    ok(state.requests.length === h4, `the two refusals still made ${state.requests.length - h4} network call(s) — "nothing was spent" is false`);

    // == I: THE FIND RUN OUTLIVES ITS REQUEST =============================
    // The whole point of the change, driven rather than read. A full-grid Find
    // is 102-120 seconds of work and something between the browser and Render
    // cuts a request at 60, so on 2026-08-28 three presses each completed and
    // each had its answer dropped with the connection. A boot fixture cannot
    // see any of this: what is new is a ROUTE and the store behind it.
    // ── J: A NATIONAL BRAND IS REFUSED BEFORE A BYTE MOVES ───────────────
    // Mike's brief, 2026-08-31: "we just need to focus on getting good quality
    // leads in our ICP." The live run before it read Truly Nolen, Window Nation
    // and Ram Jack at full price, and every franchise filter this file owns was
    // unreachable from this route - they were declared inside the discovery
    // handler. A fixture cannot see that; only driving the route can.
    console.log('── scenario J: the contact route refuses a national brand with zero network calls');
    {
      const _beforeJ = state.requests.length;
      const J1 = await httpPost(`http://127.0.0.1:${SRV_PORT}/api/find-contact`, {
        company: { name: 'Ram Jack, by American Leveling', website: 'https://example.com', placeId: 'p1' },
        keys: { anthropicKey: 'sk-test' },
      });
      ok(J1.code === 422 && J1.json && J1.json.notIcp === true,
        `a national franchise was not refused by the contact route (got ${J1.code}: ${String((J1.json && J1.json.error) || '').slice(0, 140)})`);
      ok(state.requests.length === _beforeJ,
        `the franchise refusal still made ${state.requests.length - _beforeJ} network call(s) - "nothing was read and nothing was spent" is false`);
      // 2026-09-02: a ministry bought a paid owner wave. Institutions are the
      // same door as franchises: refused by name, nothing read, nothing spent.
      const _beforeJm = state.requests.length;
      const Jm = await httpPost(`http://127.0.0.1:${SRV_PORT}/api/find-contact`, {
        company: { name: 'Synergy Ministry', website: 'https://example.com', placeId: 'p1m' },
        keys: { anthropicKey: 'sk-test' },
      });
      ok(Jm.code === 422 && Jm.json && Jm.json.notIcp === true,
        `a ministry was not refused by the contact route (got ${Jm.code}) - it reads, scores and buys a paid owner wave for an owner that does not exist`);
      ok(state.requests.length === _beforeJm,
        `the ministry refusal still made ${state.requests.length - _beforeJm} network call(s)`);
      // And the guard must not have been tightened until it eats the ICP. An
      // owner-operated name has to reach the read, which is section 14's
      // guard-too-tight failure and the expensive one.
      const J2 = await httpPost(`http://127.0.0.1:${SRV_PORT}/api/find-contact`, {
        company: { name: 'Aqua Blue Pools', website: 'https://example.com', placeId: 'p2' },
        keys: { anthropicKey: 'sk-test' },
      });
      ok(!(J2.code === 422 && J2.json && J2.json.notIcp === true),
        `an owner-operated pool company was refused as out of ICP - the name gate has been widened until it deletes the leads this pipeline exists to find`);
    }

    console.log('── scenario K: a name-only lead resolves a website, or is refused before a slot is taken');
    {
      const kCalls = () => state.requests.length;
      // K1: no website, no listing, no distinctive word -> refused, zero calls, NOT retired.
      const k1c = kCalls();
      const K1 = await httpPost(`http://127.0.0.1:${SRV_PORT}/api/find-contact`, { company: { name: 'Premier Solutions' }, keys: { anthropicKey: 'k-test' } });
      ok(K1.code === 422 && K1.json && K1.json.unreadable === true && K1.json.notIcp !== true,
        `a name-only lead with no distinctive word was not refused as nothing-to-read (got ${K1.code}: ${String((K1.json && K1.json.error) || '').slice(0, 120)})`);
      ok(kCalls() === k1c, `the nothing-to-read refusal still made ${kCalls() - k1c} network call(s)`);
      // K2: the free slate resolves, both sources corroborate, the page confirms,
      // the read continues as a weak-confidence domain and the listing is recovered.
      state.mode = 'findrich'; state.biz = biz('K');
      const kb = state.biz;
      const k2c = kCalls();
      const K2 = await httpPost(`http://127.0.0.1:${SRV_PORT}/api/find-contact`, { company: { name: kb.company, location: 'Dallas, TX' }, keys: { anthropicKey: 'k-test', firecrawlKey: 'fc-test' } });
      const KJ = K2.json || {};
      ok(K2.code === 200, `the name-only read answered ${K2.code}: ${String(KJ.error || '').slice(0, 160)}`);
      ok(KJ.websiteResolved === true && KJ.website === 'https://' + kb.host, `the free slate did not resolve ${kb.host} (website=${JSON.stringify(KJ.website)}, proof=${JSON.stringify(KJ.websiteProof)})`);
      ok(KJ.websiteProof && KJ.websiteProof.confirmedByPages === true, `their own pages did not confirm the resolved domain: ${JSON.stringify(KJ.websiteProof)}`);
      ok(KJ.websiteProof && KJ.websiteProof.corroboration >= 2, `only ${KJ.websiteProof && KJ.websiteProof.corroboration} source(s) corroborated - the Companies API by-name source is not reaching the slate`);
      const kReq = state.requests.slice(k2c);
      ok(kReq.some(q => q.host === 'autocomplete.clearbit.com') && kReq.some(q => q.host === 'api.thecompaniesapi.com'), 'the free slate did not ask both free sources');
      ok((KJ.pagesRead || []).length >= 1, 'a resolved and confirmed domain was not read');
      ok(KJ.owner && KJ.owner.name === 'Pete Barnes', `the owner was not read off the resolved site (${JSON.stringify(KJ.owner && KJ.owner.name)})`);
      ok(/found by us/.test(String((KJ.owner && KJ.owner.gradeWhy) || '')), 'the owner how-sure cell does not say the domain was found by us');
      ok(KJ.listingRecovered === true && KJ.listingFromResolvedDomain === true, `the confirmed domain did not recover the listing (recovered=${KJ.listingRecovered}, fromResolved=${KJ.listingFromResolvedDomain})`);
      ok(KJ.websiteConfidence === 'weak', 'a resolved domain does not carry the weak confidence mark');
      // K3: the page never names the business -> un-stamped, nothing site-derived
      // survives, the listing is NOT recovered, and the lead is NOT retired.
      state.mode = 'findstranger'; state.biz = biz('L');
      const lb = state.biz;
      const k3c = kCalls();
      const K3 = await httpPost(`http://127.0.0.1:${SRV_PORT}/api/find-contact`, { company: { name: lb.company, location: 'Dallas, TX' }, keys: { anthropicKey: 'k-test', firecrawlKey: 'fc-test' } });
      const LJ = K3.json || {};
      ok(K3.code === 200, `the stranger read answered ${K3.code}: ${String(LJ.error || '').slice(0, 120)}`);
      ok(LJ.websiteResolved === true && LJ.websiteProof && LJ.websiteProof.confirmedByPages === false, `a page that never names the business was not un-stamped: ${JSON.stringify(LJ.websiteProof)}`);
      ok(LJ.website === '' && LJ.owner === null && LJ.email === null && (LJ.pagesRead || []).length === 0,
        `site-derived facts survived the un-stamp (website=${JSON.stringify(LJ.website)}, owner=${JSON.stringify(LJ.owner && LJ.owner.name)}, pages=${(LJ.pagesRead || []).length})`);
      ok(!state.requests.slice(k3c).some(q => q.host === 'places.googleapis.com'), "the listing recovery ran on a domain the page contradicted - a stranger's rating, hours and phone can reach the row");
      ok(LJ.notIcp !== true, 'an un-stamped lead was retired as not-ICP, which deletes a lead that only needs a URL');
      // K4: two accepted hosts with equal corroboration -> resolve nothing, read nothing.
      state.mode = 'findtwin'; state.biz = biz('M');
      const mb = state.biz;
      const k4c = kCalls();
      const K4 = await httpPost(`http://127.0.0.1:${SRV_PORT}/api/find-contact`, { company: { name: mb.company, location: 'Dallas, TX' }, keys: { anthropicKey: 'k-test', firecrawlKey: 'fc-test' } });
      const MJ = K4.json || {};
      ok(K4.code === 200 && MJ.websiteResolved === false && MJ.website === '', `two plausible domains were not refused as ambiguous (resolved=${MJ.websiteResolved}, website=${JSON.stringify(MJ.website)})`);
      ok(!state.requests.slice(k4c).some(q => q.host === mb.host || /roofingco\.example$/.test(q.host)), 'an ambiguous resolution still read one of the two candidate sites');
      state.mode = '';
    }

    console.log('── scenario I: the Find run outlives the request that started it');
    {
      const _t0 = Date.now();
      const I = await httpPost(`http://127.0.0.1:${SRV_PORT}/api/discover-async`, {
        keywords: ['roofing'], filters: { niches: ['roofer'], cities: ['Dallas, TX'] }, keys: {},
      });
      const _submitMs = Date.now() - _t0;
      ok(I.code === 200 && I.json && I.json.jobId,
        `the Find submit answered ${I.code} with ${JSON.stringify(I.json).slice(0, 160)} — the async door is not wired to runDiscovery`);
      // The number that matters. If the submit itself takes a minute we have
      // moved the wall rather than removed it.
      ok(_submitMs < 10000, `the Find submit took ${_submitMs}ms — it is still holding the run open, which is the whole defect`);

      if (I.json && I.json.jobId) {
        // A second press must NOT buy the grid again. Roughly a hundred Places
        // searches per press, and the 60-second cut produced exactly this.
        const I2 = await httpPost(`http://127.0.0.1:${SRV_PORT}/api/discover-async`, { keywords: ['roofing'], keys: {} });
        if (I2.json && I2.json.jobId === I.json.jobId) {
          ok(I2.json.deduped === true, 'a second Find press returned the running job without saying it was deduped');
        } else {
          // Only acceptable if the first run had already finished by then.
          const _st = await httpGet(`http://127.0.0.1:${SRV_PORT}/api/discover-job/${I.json.jobId}`);
          ok(_st.json && _st.json.status !== 'running',
            'a second Find press started a SECOND full grid while the first was still running');
        }

        // And the answer is collected by polling, which is what a cut
        // connection can no longer destroy.
        let done = null;
        const _p0 = Date.now();
        for (;;) {
          const st = await httpGet(`http://127.0.0.1:${SRV_PORT}/api/discover-job/${I.json.jobId}`);
          if (st.json && st.json.status !== 'running') { done = st.json; break; }
          if (Date.now() - _p0 > 120000) break;
          await sleep(1000);
        }
        ok(done && done.status === 'done',
          `the Find job never reported done: ${JSON.stringify(done && { s: done.status, e: done.error }).slice(0, 200)}`);
        ok(done && done.result && Array.isArray(done.result.companies),
          'the finished Find job carries no companies array, so the answer the run paid for is not being handed back');
      }

      // An id this server has never heard of is a real ending, said plainly,
      // rather than a poll that never resolves.
      const IGone = await httpGet(`http://127.0.0.1:${SRV_PORT}/api/discover-job/find_nope`);
      ok(IGone.code === 404 && IGone.json && IGone.json.status === 'gone',
        `polling an unknown Find id answered ${IGone.code} instead of a plain 'gone'`);

      // And a RESEARCH job must not be readable at the Find door: the Find tab
      // would try to read an audit as a lead list. Both kinds share one store.
      const IWrong = await httpPost(`http://127.0.0.1:${SRV_PORT}/api/research-async`, leadBody(biz('I')));
      if (IWrong.json && IWrong.json.jobId) {
        const _x = await httpGet(`http://127.0.0.1:${SRV_PORT}/api/discover-job/${IWrong.json.jobId}`);
        ok(_x.code === 404, 'a research job can be polled through the Find door, so one tab can be handed the other tab\'s payload');
      }
    }
    // ── E: FIRECRAWL OUT OF CREDITS ─────────────────────
    // LAST on this boot: the 402 latch is process state by design, so every
    // scenario that needs to SPEND has to run above this line.
    console.log('── scenario E: Firecrawl 402 — the latch and the bounded hold');
    state.mode = 'fc402'; state.biz = biz('E');
    const _logBeforeE = srv.log().length;
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
    // A search that comes back 402 is not a paid call. On 2026-09-02 the
    // search door noted its spend at dispatch, so every doomed probe printed
    // FC PAID, counted a credit and re-opened every other door.
    ok(!/FC PAID \[search/.test(srv.log().slice(_logBeforeE)),
      'a search refused with 402 was logged as FC PAID - the meter counts a credit that was never spent and the latch is cleared by a call that failed');

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
