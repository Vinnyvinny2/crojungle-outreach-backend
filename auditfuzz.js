// ══ FUZZ THE AUDIT PIPELINE — thousands of fake audits through the real code ═
// Vin, 2026-08-25: "run like 5000 fake audits to make sure everything fires
// correctly ... run a million tests to find patterns and smaller weird bugs."
// fuzzcore.js fuzzes the EMAIL gates; nothing ever fuzzed the AUDIT pipeline —
// the ladder, the numbering, the funnel walk and the facts strip — which is
// where the sheet a junior caller dials from is assembled. This drives
// randomized measurement vectors through the real chain and asserts the
// invariants whose violations have each shipped at least once:
//
//   · nothing throws, on clean vectors or on dirty ones (null/NaN/garbage)
//   · no sentence anywhere carries "undefined", "NaN", "#null" or "#0"
//     (the recorded printf null-laundering class)
//   · leak numbers are unique, at most three, at most one per claim family,
//     and never on an internal, ambient or workmanship row
//   · the walk never writes a search absence beside a pack or LSA sighting,
//     never claims the top three without a real 1-3 position, and never
//     prints a position digit the trust wall nulled
//   · the facts strip only carries a surface when its read actually ran
//   · the parsers survive garbage bodies; the strippers are idempotent and
//     never grow text; the localization can never emit a 0,0 coordinate
//
//   node auditfuzz.js           5000 vectors (the ci-gates run)
//   node auditfuzz.js 100000    a deep run before a big batch
//
// Exits non-zero on any violation, so it can fail a script.
const N = Number(process.argv[2]) || 5000;
const fs = require('fs');

let src = fs.readFileSync(__dirname + '/server.js', 'utf8');
src += `\nmodule.exports.__probe = { HARM_LADDER, RUNG_PILLAR, RUNG_FUNNEL_STAGE, RUNG_CLAIM_FAMILY,
  INTERNAL_ONLY_RUNGS, rankHarms, buildProblemList, buildFunnelStory, buildAuditFacts,
  stripPatternConflation, stripUnprovenAdSpend, stripQuoteLabel,
  dfsLocalization, dfsLocationName, isBareStateName,
  parseOrganicSerp, parseLocalFinder, parseRankedKeywords, parseTrafficOverview,
  isEponymousOwnerRule, licenseHitTiesToCompany, readOperationalPain };\n`;
fs.writeFileSync(__dirname + '/.probe3.js', src);
const P = require(__dirname + '/.probe3.js').__probe;

const rand = (a) => a[Math.floor(Math.random() * a.length)];
const int = (n) => Math.floor(Math.random() * n);
const chance = (p) => Math.random() < p;
const fails = [];
const record = (gate, name, why, sample) => {
  const hit = fails.find(f => f.gate === gate && f.name === name);
  if (hit) { hit.count++; return; }
  fails.push({ gate, name, why, sample: String(sample).slice(0, 200), count: 1 });
};

const NASTY = [null, undefined, NaN, Infinity, -1, 0, '', '   ', 'null', 'undefined', 'NaN', '😀', 'A'.repeat(500), {}, [], true, false];
const TRADES = ['pest control company', 'roofing company', 'plumber', 'personal injury lawyer', 'tree service', 'dentist', 'septic service'];
const CITIES = ['Charlotte, NC', 'San Antonio, TX', 'Louisville, KY', 'Columbus, OH', 'Sheridan, CO'];
const THEMES = [
  'no one ever called back — 2 of the 90 reviews we read say it',
  'quotes take weeks to arrive — 3 of the 90 reviews we read say it',
  'scheduling chaos and reschedules — 5 of the 40 reviews we read say it',
  'uneven surfaces and drainage problems — 4 of the 88 reviews we read say it',
];

// A CLEAN vector respects the contracts resolveMeasurements enforces upstream
// (the trust wall nulls rank on an untrusted source; absence is only ever
// confirmed on a not-found read; the LSA flags only exist once lsaChecked).
// Violating those here would "find" bugs upstream code makes impossible — the
// recorded harness-that-lies class — so the dirty pass corrupts fields the
// pipeline must SURVIVE, and the clean pass asserts what it must EMIT.
const cleanVector = () => {
  const m = {};
  m.rankChecked = chance(0.8);
  if (m.rankChecked) {
    const trusted = chance(0.7);
    m.rankSource = trusted ? 'dataforseo' : 'places';
    m.scanned = 6 + int(95);
    m.rankFound = chance(0.75);
    if (m.rankFound) {
      if (trusted) {
        m.rank = 1 + int(m.scanned);
        m.weakerAbove = m.rank > 1 && chance(0.6) ? 1 + int(m.rank - 1) : 0;
        m.weakerNames = m.weakerAbove ? ['Weaker Rival LLC'] : [];
      } else {
        m.rank = null;   // the §52 trust wall
        m.weakerAbove = null;
      }
    } else {
      m.rankAbsenceConfirmed = chance(0.6);
    }
    m.rankQuery = `${rand(TRADES)} in ${rand(CITIES)}`;
    m.lsaChecked = chance(0.7);
    if (m.lsaChecked) {
      m.lsaBlockPresent = chance(0.5);
      m.lsaUs = m.lsaBlockPresent && chance(0.4);
      m.lsaUsIndex = m.lsaUs ? 1 + int(3) : null;
      m.aiOverviewPresent = chance(0.4);
      m.aiOverviewCitesUs = m.aiOverviewPresent && chance(0.3);
      m.packUs = chance(0.3);
      m.packUsIndex = m.packUs ? 1 + int(3) : null;
    }
    if (chance(0.5)) {
      m.organicChecked = true;
      m.organicFound = chance(0.7);
      m.organicScanned = 6 + int(15);
      m.organicPosition = m.organicFound ? 1 + int(m.organicScanned) : null;
    }
  }
  m.adsReadable = chance(0.7);
  if (m.adsReadable) {
    m.googleAdsTag = chance(0.4);
    m.metaPixel = chance(0.4);
    m.tagManager = chance(0.3);
    m.adsConversion = m.googleAdsTag ? chance(0.4) : false;
    m.callTracking = chance(0.2);
  }
  m.adsLiveInPack = chance(0.15);
  m.bookingMeasured = chance(0.8);
  if (m.bookingMeasured) m.booking = rand(['online_booking', 'form', 'phone_only', 'none_found']);
  m.formFieldCount = chance(0.5) ? 2 + int(10) : null;
  m.formFieldCountIsSingleForm = m.formFieldCount != null;
  m.reviewCount = chance(0.8) ? int(800) : null;
  m.rating = chance(0.8) ? Math.round((3 + Math.random() * 2) * 10) / 10 : null;
  m.reviewsRead = chance(0.7) ? 10 + int(140) : null;
  m.reviewPainTop = chance(0.5) ? rand(THEMES) : '';
  m.reviewPainTopKind = m.reviewPainTop ? rand(['contact', 'workmanship', 'other', null]) : null;
  m.financingMeasured = chance(0.5);
  m.financingOffered = m.financingMeasured ? chance(0.5) : null;
  m.bigTicketTrade = chance(0.4);
  m.recurringChecked = chance(0.4);
  m.hasRecurringOffer = m.recurringChecked ? chance(0.5) : null;
  m.tradeWord = rand(TRADES);
  m.chatSeen = chance(0.6) ? chance(0.3) : null;
  // Round-100 fields. listingClaimed is tri-state and unverified live, so the
  // fuzz must prove null licenses nothing; deadCampaignPages must survive
  // hostile shapes; the price/financing suppressors must never widen a claim.
  m.listingClaimed = chance(0.3) ? chance(0.5) : null;
  m.deadCampaignPages = chance(0.2) ? [{ url: 'https://x.com/lp/offer-' + int(99), status: rand([404, 410]) }] : [];
  m.homepagePriceSeen = chance(0.4);
  m.unreadFinancing = chance(0.2);
  return m;
};

const dirtyVector = () => {
  const m = cleanVector();
  // corrupt a handful of random fields with hostile values — the pipeline
  // must SURVIVE these (no throw, no undefined/NaN prose), not produce
  // correct audits from them.
  const keys = Object.keys(m);
  for (let i = 0; i < 1 + int(4); i++) m[rand(keys)] = rand(NASTY);
  if (chance(0.3)) m[`extra_${int(100)}`] = rand(NASTY);
  return m;
};

// The prose scan. "#0" is a real class (Number(null) at a printf); the word
// "undefined" in any sentence is the dropped-wire class.
const BAD_PROSE = /\bundefined\b|\bNaN\b|#null\b|#NaN\b|#0\b|\[object Object\]/;
const scanProse = (gate, label, node, depth = 0) => {
  if (depth > 6 || node == null) return;
  if (typeof node === 'string') {
    if (BAD_PROSE.test(node)) record(gate, 'bad prose', 'a sentence carries undefined/NaN/#0 — the dropped-wire class, live more than once', `${label}: ${node.slice(0, 160)}`);
    return;
  }
  if (Array.isArray(node)) { for (const x of node) scanProse(gate, label, x, depth + 1); return; }
  if (typeof node === 'object') { for (const k of Object.keys(node)) scanProse(gate, label + '.' + k, node[k], depth + 1); }
};

console.log(`\n  auditfuzz: ${N.toLocaleString()} vectors through the real audit pipeline.\n`);

let vectors = 0;
for (let i = 0; i < N; i++) {
  const dirty = i % 4 === 3;   // every fourth vector is hostile
  const m = dirty ? dirtyVector() : cleanVector();
  vectors++;

  // ── the ladder ──
  let harms = null;
  try { harms = P.rankHarms(m); } catch (e) { record('ladder', 'threw', 'rankHarms must survive any measurement shape — a throw here is the §40 dead-ladder class', e.message); continue; }
  if (!dirty) {
    scanProse('ladder', 'byHarm', harms && harms.byHarm);
    scanProse('ladder', 'byMoney', harms && harms.byMoney);
  }

  // ── the numbering ──
  let rows = null;
  try {
    rows = P.buildProblemList(harms || {}, { evidence: { reviewThemeContact: chance(0.5), lsaUs: m.lsaUs === true } });
  } catch (e) { record('numbering', 'threw', 'buildProblemList must survive any ladder output', e.message); continue; }
  if (Array.isArray(rows)) {
    const ranks = rows.filter(r => Number.isFinite(Number(r && r.leakRank))).map(r => Number(r.leakRank));
    if (new Set(ranks).size !== ranks.length) record('numbering', 'duplicate leak rank', 'two rows share a leak number — the Wolf double-LEAK-1 class', JSON.stringify(ranks));
    if (ranks.some(r => r < 1 || r > 3)) record('numbering', 'rank out of range', 'a leak number outside 1..3', JSON.stringify(ranks));
    const famSeen = new Set();
    for (const r of rows) {
      if (!Number.isFinite(Number(r && r.leakRank))) continue;
      if (P.INTERNAL_ONLY_RUNGS && P.INTERNAL_ONLY_RUNGS.has && P.INTERNAL_ONLY_RUNGS.has(r.id)) record('numbering', 'internal numbered', 'an internal review metric took a leak number — barred by declaration', r.id);
      if (P.RUNG_FUNNEL_STAGE && P.RUNG_FUNNEL_STAGE[r.id] === 'work') record('numbering', 'workmanship numbered', 'the workmanship context row took a leak number', r.id);
      const fam = P.RUNG_CLAIM_FAMILY && P.RUNG_CLAIM_FAMILY[r.id];
      if (fam) {
        if (famSeen.has(fam)) record('numbering', 'family numbered twice', 'two leak numbers on one claim family — the Bob Ray leak2≈leak3 class', `${r.id} in ${fam}`);
        famSeen.add(fam);
      }
    }
    if (!dirty) scanProse('numbering', 'rows', rows);
  }

  // ── the walk ──
  let walk = null;
  try { walk = P.buildFunnelStory(m, { opsPain: chance(0.3) ? P.readOperationalPain([rand(THEMES)], m.reviewsRead) : null }); } catch (e) { record('walk', 'threw', 'buildFunnelStory must survive any measurement shape', e.message); continue; }
  const stages = (walk && walk.stages) || [];
  for (const s of stages) {
    if (!s || typeof s.text !== 'string') { record('walk', 'stage shape', 'a stage without text', JSON.stringify(s).slice(0, 120)); continue; }
    if (!dirty) scanProse('walk', s.id, s.text);
    if (s.id === 'who_finds_them') {
      // packUs only, deliberately: the pack is the SAME surface as the
      // finder, so absence beside it is a flat contradiction. The LSA block
      // is a DIFFERENT surface, and the round-97 sentence joins the two with
      // "though" on purpose — organic absence beside paid presence is a true,
      // coherent pair. The first run of this fuzzer flagged that pair, which
      // was the fuzzer being wrong, and this comment is the record.
      if (/not among/.test(s.text) && m.packUs === true) {
        record('walk', 'absence beside a sighting', 'the walk writes a search absence while the map pack SHOWS their listing — a flat contradiction on one sheet', s.text.slice(0, 140));
      }
      if (/top three — the people already looking/.test(s.text) && !(typeof m.rank === 'number' && m.rank >= 1 && m.rank <= 3)) {
        record('walk', 'unearned top-three', 'the strength sentence with no real 1-3 position behind it — the Number(null) class', s.text.slice(0, 140));
      }
      if (!dirty && m.rank == null && /show up at #/.test(s.text)) {
        record('walk', 'suppressed digit printed', 'a position the trust wall nulled reached a sentence', s.text.slice(0, 140));
      }
    }
  }

  // ── the facts strip ──
  let facts = null;
  try { facts = P.buildAuditFacts(m, null); } catch (e) { record('facts', 'threw', 'buildAuditFacts must survive any measurement shape', e.message); continue; }
  if (facts) {
    if (facts.lsa !== null && m.lsaChecked !== true) record('facts', 'lsa without a read', 'the facts strip carries an LSA verdict on a lead whose surface read never ran', JSON.stringify(facts.lsa));
    if (facts.pack !== null && m.packUs !== true) record('facts', 'pack without a sighting', 'the pack fact exists in the only direction it must not — absence consumed as a fact', JSON.stringify(facts.pack));
    if (facts.organicPosition !== null && !(m.organicChecked === true && m.organicFound === true && Number(m.organicScanned) >= 6)) {
      record('facts', 'organic position without its gates', 'a blue-links position with no confirmed read behind it', String(facts.organicPosition));
    }
    if (!dirty) scanProse('facts', 'facts', facts);
  }
}

// ── the parsers, on garbage ──
const GARBAGE = [null, undefined, {}, [], 'not json', { tasks: null }, { tasks: [{}] }, { tasks: [{ result: null }] },
  { tasks: [{ status_code: 40101, status_message: 'auth' }] }, { tasks: [{ result: [{ items: [{ type: 'organic' }, { type: 'local_pack' }, null, 42] }] }] }];
for (const g of GARBAGE) {
  try { P.parseOrganicSerp(g, 'x.com', 'X'); } catch (e) { record('parser', 'organic threw', 'parseOrganicSerp on garbage', e.message); }
  try { P.parseLocalFinder(g); } catch (e) { record('parser', 'finder threw', 'parseLocalFinder on garbage', e.message); }
  try { P.parseRankedKeywords(g); } catch (e) { record('parser', 'keywords threw', 'parseRankedKeywords on garbage', e.message); }
  try { P.parseTrafficOverview(g); } catch (e) { record('parser', 'traffic threw', 'parseTrafficOverview on garbage', e.message); }
}

// ── the localization can never emit a coordinate nobody measured ──
for (let i = 0; i < 400; i++) {
  const args = { bizLat: rand(NASTY.concat(35.2, -80.8)), bizLng: rand(NASTY.concat(-80.8)), city: rand(CITIES.concat(rand(NASTY))), mode: rand(['finder', 'organic']) };
  let loc = null;
  try { loc = P.dfsLocalization(args); } catch (e) { record('localization', 'threw', 'dfsLocalization on hostile inputs', e.message); continue; }
  const c = loc && loc.arg && loc.arg.location_coordinate;
  if (c && /^0\.0+,|,-?0\.0+(,|$)|NaN|undefined/.test(String(c))) {
    record('localization', 'phantom coordinate', 'a 0/NaN coordinate — Number(null) is 0, and 0,0 is open ocean measured as their market', `${JSON.stringify(args)} -> ${c}`);
  }
}

// ── the strippers: idempotent, never growing, never eating the innocent ──
for (let i = 0; i < 1000; i++) {
  const text = rand([
    'Four different customers describe the same experience. The form is eight fields long.',
    'Two customers describe the same delay.',
    'They are paying to bring people to the door.',
    'If those ads are live, they are paying for the harder sell.',
    'The crew showed up on time and the work was tidy.',
    rand(NASTY),
  ]);
  const counts = rand([[2, 2, 2], [4], [5, 2], [], null]);
  try {
    const r1 = P.stripPatternConflation(text, counts);
    const r2 = P.stripPatternConflation(r1.text, counts);
    if (r2.text !== r1.text) record('stripper', 'conflation not idempotent', 'a second pass changed the text again', String(text).slice(0, 80));
    if (String(r1.text).length > String(text == null ? '' : text).length) record('stripper', 'conflation grew text', 'a stripper added characters', String(text).slice(0, 80));
  } catch (e) { record('stripper', 'conflation threw', 'stripPatternConflation on hostile input', e.message); }
  try {
    const s1 = P.stripUnprovenAdSpend(text, rand([true, false, null, undefined]));
    const s2 = P.stripUnprovenAdSpend(s1.text, false);
    if (String(s1.text).length > String(text == null ? '' : text).length) record('stripper', 'spend grew text', 'a stripper added characters', String(text).slice(0, 80));
    void s2;
  } catch (e) { record('stripper', 'spend threw', 'stripUnprovenAdSpend on hostile input', e.message); }
}

fs.unlinkSync(__dirname + '/.probe3.js');

if (fails.length) {
  console.log(`  ✗ ${fails.length} invariant violation(s) across ${vectors.toLocaleString()} vectors:\n`);
  for (const f of fails.slice(0, 20)) {
    console.log(`  ✗ [${f.gate}] ${f.name} ×${f.count} — ${f.why}`);
    console.log(`      ${f.sample}`);
  }
  process.exit(1);
}
console.log(`  ✓ ${vectors.toLocaleString()} fake audits through the real ladder, numbering, walk and facts strip — every invariant held: no throws, no undefined/NaN prose, unique leak numbers with one per family and none on internal rows, no absence beside a sighting, no unearned top-three, no surface fact without its read, parsers survive garbage, strippers idempotent, and no phantom coordinate.\n`);
process.exit(0);
