const ICP_REVENUE_BAND = { floor: 0.8e6, coreFrom: 1.2e6, upperFrom: 10e6, ceiling: 20e6 };
const ICP_CALL_REACH_CEILING = 50e6;   // owner within reach and measured under this: still a call (Vin, 2026-09-03, re-affirmed 2026-09-11)
const ICP_REVENUE_PER_EMPLOYEE = 200000;      // HVAC/plumbing/electrical $160-280k per head (MarginPlug, Tradesly, SubcontractorHub; Vertical IQ: 12 people ~= $2.9M), 2026-09-03
const ICP_REVENUE_PER_TRUCK = 300000;         // $250-400k per truck, home services (Service Autopilot), 2026-09-03
// Keyed by the CATEGORY_TIER label. A trade with no row uses the default; a
// row is DECLARED with its source and date or the boot refuses it.
const ICP_REVENUE_PER_EMPLOYEE_BY_TRADE = {
  'PI Law':       { per: 175000, source: 'LeanLaw $130-175k per employee; LawPay ~$530k per lawyer', at: '2026-09-03' },
  'Estate Law':   { per: 175000, source: 'LeanLaw $130-175k per employee; LawPay ~$530k per lawyer', at: '2026-09-03' },
  Accounting:     { per: 150000, source: 'AICPA / Big Four ~$130-156k per person', at: '2026-09-03' },
  'Tree Service': { per: 150000, source: 'Service Autopilot / NALP $120-180k per field employee', at: '2026-09-03' },
  Hardscaping:    { per: 150000, source: 'Service Autopilot / NALP $120-180k per field employee', at: '2026-09-03' },
  'Home Care':    { per: 70000,  source: 'home care agencies bill ~$50-80k per caregiver', at: '2026-09-03' },
  'Senior Care':  { per: 70000,  source: 'home care agencies bill ~$50-80k per caregiver', at: '2026-09-03' },
};
const revenuePerEmployeeFor = (label) => {
  const row = ICP_REVENUE_PER_EMPLOYEE_BY_TRADE[String(label || '').trim()];
  return (row && Number.isFinite(Number(row.per)) && Number(row.per) > 0) ? Number(row.per) : ICP_REVENUE_PER_EMPLOYEE;
};
// The head or truck count at which each tier starts - from the table and the
// benchmark, never typed. entry..core-1 is entry, core..upper is core,
// upper+1..ceiling is upper, above the ceiling is out.
const scaleCuts = (per) => ({
  entry: Math.round(ICP_REVENUE_BAND.floor / per), core: Math.round(ICP_REVENUE_BAND.coreFrom / per),
  upper: Math.round(ICP_REVENUE_BAND.upperFrom / per), ceiling: Math.round(ICP_REVENUE_BAND.ceiling / per),
});
const SCALE_TIERS = ['below_floor', 'entry', 'core', 'upper', 'over_ceiling'];
const tierFromCount = (n, cuts) => n < cuts.entry ? 'below_floor' : n < cuts.core ? 'entry' : n <= cuts.upper ? 'core' : n <= cuts.ceiling ? 'upper' : 'over_ceiling';
const tierFromRevenue = (usd) => usd < ICP_REVENUE_BAND.floor ? 'below_floor' : usd < ICP_REVENUE_BAND.coreFrom ? 'entry' : usd <= ICP_REVENUE_BAND.upperFrom ? 'core' : usd <= ICP_REVENUE_BAND.ceiling ? 'upper' : 'over_ceiling';
// The discovery employee gate, derived: warn where the upper tier starts, block past the ceiling.
const ICP_EMPLOYEE_WARN = scaleCuts(ICP_REVENUE_PER_EMPLOYEE).upper;
const ICP_EMPLOYEE_BLOCK = scaleCuts(ICP_REVENUE_PER_EMPLOYEE).ceiling;
const _usdShort = (n) => n >= 1e6 ? ('$' + (n / 1e6).toFixed(n % 1e6 ? 1 : 0) + 'M') : ('$' + Math.round(n / 1e3) + 'k');
const SCALE_BAND_SAY = {
  below_floor: `under ${_usdShort(ICP_REVENUE_BAND.floor)}`,
  entry: `${_usdShort(ICP_REVENUE_BAND.floor)}-${_usdShort(ICP_REVENUE_BAND.coreFrom)}`,
  core: `${_usdShort(ICP_REVENUE_BAND.coreFrom)}-${_usdShort(ICP_REVENUE_BAND.upperFrom)}`,
  upper: `${_usdShort(ICP_REVENUE_BAND.upperFrom)}-${_usdShort(ICP_REVENUE_BAND.ceiling)}`,
  over_ceiling: `over ${_usdShort(ICP_REVENUE_BAND.ceiling)}`,
};
// ══ THE SIZE LADDER THE REP READS - FOUR WORDS, AND A SECOND DIMENSION ═════
// Vin, 2026-09-12: "break catgeroize that pool into 4 teirs very small , small,
// meidum large ... size is the golden ticket because size kind of decides
// reachability wise and also decides which channel we use".
//
// WHY THIS IS NOT ICP_REVENUE_BAND RENAMED, which is what the round plan said.
// That band answers "what can they PAY?" and its cuts are prices, not sizes:
// coreFrom is $1.2M because a $10k/mo retainer is 10% of $1.2M, and a boot
// check proves it against the price list. Vin's cuts answer "how BIG are
// they?" and the two cross-cut - his very small, small and medium all sit
// inside the one affordability band, so no renaming could make them one
// ladder. Kept apart, both stay provable and the row can say "small - premium
// fit" against "very small - lower tier", which is the who-closes-it question.
//
// Only TWO numbers are typed here. The $10M line is the CHANNEL line and the
// $20M line is the top of the ICP, so both are READ from ICP_REVENUE_BAND
// rather than retyped - a number kept in two places is the defect Round 139
// exists for, and a boot check asserts these two derive.
const ICP_SIZE_TIERS = [
  { id: 'very_small', word: 'very small', to: 1.5e6 },
  { id: 'small',      word: 'small',      to: 4e6 },
  { id: 'medium',     word: 'medium',     to: ICP_REVENUE_BAND.upperFrom },
  { id: 'large',      word: 'large',      to: ICP_REVENUE_BAND.ceiling },
];
const SIZE_TIER_IDS = ICP_SIZE_TIERS.map(t => t.id);
// Over the top of the ICP is not a tier, it is a drop. Named so a reader of a
// log line or a row can tell "we measured them and they are too big" from "we
// never measured them", which are not the same fact about a business.
const SIZE_TIER_OVER = 'over_icp';
const SIZE_TIER_UNMEASURED = '';
const sizeTierFromRevenue = (usd) => {
  const n = Number(usd);
  if (!Number.isFinite(n) || n <= 0) return SIZE_TIER_UNMEASURED;
  const hit = ICP_SIZE_TIERS.find(t => n <= t.to);
  return hit ? hit.id : SIZE_TIER_OVER;
};
// SIZE_TIER_OVER carries its own word. Without it a business we MEASURED and
// found too big printed "not measured" on the row, which is the precise
// confusion the constant above was named to prevent - found in the first run.
const SIZE_TIER_WORD = Object.assign(
  Object.fromEntries(ICP_SIZE_TIERS.map(t => [t.id, t.word])),
  { [SIZE_TIER_OVER]: 'over the ICP' });
// The dollar range each word covers, derived from the cuts so the sheet and
// the ladder can never disagree.
const SIZE_TIER_SAY = Object.assign({ [SIZE_TIER_OVER]: 'over ' + _usdShort(ICP_REVENUE_BAND.ceiling) },
  Object.fromEntries(ICP_SIZE_TIERS.map((t, i) => [t.id,
  i === 0 ? `under ${_usdShort(t.to)}` : `${_usdShort(ICP_SIZE_TIERS[i - 1].to)}-${_usdShort(t.to)}`])));
// ══ AND THE CHANNEL FALLS OUT OF THE SIZE, WHICH IS THE WHOLE POINT ═══════
// Vin, 2026-09-12: "the smaller side we're gonna use cold calling and then
// there's a point where cold calling won't work because the businesses are too
// big so we need to establish what revenue point that is". Researched rather
// than picked, and the answer is NOT about the phone being answered - four
// trades-specific staffing sources give one ladder:
//
//   under $1.5M  the owner answers his own phone (1-2 techs, booking calls
//                between estimates)
//   ~$1.5M       first full-time CSR or dispatcher - the "unlock hire"
//   $3M          CSR and dispatcher split out, office manager added
//   $5-10M       2-3 CSRs, a dispatcher, an ops manager - the owner is
//                insulated but STILL DECIDES MARKETING
//   $10-20M      3-5 CSRs, a GM, and a Sales/Marketing Manager appears
//
// The ratio holds across all four sources: one office person per 3-4
// technicians, at $250-350k of revenue per technician. So the line is where
// SOMEBODY OTHER THAN THE OWNER OWNS MARKETING, and that is $10M - the same
// number as upperFrom, which is why the medium tier ends there. Above it the
// rule this file already carries applies: ask for the marketing
// decision-maker one rung down. Below it the owner decides and one or two
// people stand between him and the phone.
//
// NOT PROVEN: the staffing ladder is trades-specific. A ten-person law firm at
// $1.75M has a receptionist and a different shape, so this line is weakest on
// the professional-practice categories.
const SIZE_TIER_CHANNEL = { very_small: 'call', small: 'call', medium: 'call', large: 'email' };
// Points in the scale term: core first, then upper, then entry (Vin's sort).
const SCALE_BAND_POINTS = { below_floor: 3, entry: 12, core: 20, upper: 16, over_ceiling: 4 };
// The rep's words, pinned to the tiers. "low" is $800k-$1.2M on the sheet: a
// business measured under the floor is not on the rep's sheet at all.
const SIZE_WORD = { below_floor: 'low', entry: 'low', core: 'medium', upper: 'high', over_ceiling: 'high' };
// A revenue a directory STATES ("$5M", "$25,300,000") - an estimate somebody
// else made, read into a band and never into permittedFigures.
// Round 112: "<$5M" is a bucket, not a measurement of $5M (Landon Plastic
// Surgery read as medium off it); "$500K-$1M" is a range. A bound reads as
// the midpoint of what it could be and is flagged, so a lower bound never
// decides a band on its own.
const parseStatedRevenueBound = (s) => {
  const str = String(s || '').replace(/,/g, '');
  const one = (t) => {
    const m = String(t || '').match(/\$?\s*(\d+(?:\.\d+)?)\s*(m|million|k|thousand|b|billion)?\b/i);
    if (!m) return null;
    const n = parseFloat(m[1]), u = (m[2] || '').toLowerCase();
    const v = u.startsWith('b') ? n * 1e9 : u.startsWith('m') ? n * 1e6 : (u.startsWith('k') || u.startsWith('t')) ? n * 1e3 : n;
    return (Number.isFinite(v) && v >= 1e5 && v <= 1e10) ? v : null;
  };
  const range = str.match(/(\$?\s*\d+(?:\.\d+)?\s*(?:m|million|k|thousand|b|billion)?)\s*(?:-|–|to)\s*(\$?\s*\d+(?:\.\d+)?\s*(?:m|million|k|thousand|b|billion)?)/i);
  if (range) {
    const lo = one(range[1]), hi = one(range[2]);
    if (lo && hi && hi >= lo) return { usd: (lo + hi) / 2, bound: 'range', lo, hi };
  }
  const v = one(str);
  if (!v) return null;
  if (/^\s*(<|under|less than|up to|below)/i.test(str)) return { usd: v / 2, bound: 'below', lo: 0, hi: v };
  if (/^\s*(>|over|more than|above)|\+\s*$/i.test(str)) return { usd: v, bound: 'above', lo: v, hi: null };
  return { usd: v, bound: 'exact', lo: v, hi: v };
};
const parseStatedRevenue = (s) => { const b = parseStatedRevenueBound(s); return b ? b.usd : null; };
// What counts as a MEASURED size: a headcount, a fleet, a location count, a
// stated revenue, or a team page at least as long as the core cut. Tenure
// and reviews never count - a guess must not block the lookup (Round 112:
// five leads at 19-105 years never had their size bought).
const sizeMeasured = (s) => {
  const d = s || {};
  const pos = (k) => Number.isFinite(Number(d[k])) && Number(d[k]) > 0;
  if (pos('verifiedEmployees') || pos('directoryEmployees') || pos('staffProse') || pos('fleetProse')) return true;
  if (Number(d.locationsProse) >= 2) return true;
  if (parseStatedRevenue(d.revenueStated)) return true;
  if (Number(d.teamCount) >= scaleCuts(revenuePerEmployeeFor(d.tradeLabel)).core) return true;
  return false;
};
// ══ SETTLED SMALL: WEAKER THAN MEASURED, AND ENOUGH TO STOP SPENDING ═══════
// Round 129. sizeMeasured is the BAND's rule and stays exactly as it is: a
// four-name team page is not a headcount, and the rep's sheet must keep saying
// "guess" until something real measures the business. But the BUY gate was
// asking that same question, so a practice publishing three, four or five
// people on its own team page counted as "nothing measured" and bought a
// four-credit directory search that has no record of an owner-operated
// practice - 20 of the 30 Firecrawl credits on the 2026-09-09 run, nothing
// found on five of seven leads, and both hits came back "6 employees from the
// range 1-10", the tier the free guess already gave.
//
// This is the weaker question the SPEND should have been asking: has the lead
// already told us it is small? Three names is the floor the team-page reader
// itself uses (Round 116); one or two names is a page layout, not a
// measurement. Only 'solo' settles a trade by its capacity class - 'mixed'
// means one truck or twelve and holds Electrical, Plumbing and Dental, so
// vetoing on it would blind the size gate across half the ICP.
const sizeSettledSmall = (s) => {
  const d = s || {};
  const n = Number(d.teamCount);
  if (Number.isFinite(n) && n >= 3 && n < scaleCuts(revenuePerEmployeeFor(d.tradeLabel)).core) return true;
  if (capacityClassFor(d.tradeLabel, d.trade) === 'solo') return true;
  return false;
};
// ══ WHICH LANE A LEAD BELONGS TO (Round 111) ════════════════════════════════
// Vin, 2026-09-03: "keep what our ICP has been for cold calling and up it for
// email" - ONE ladder, TWO lanes drawn on it. The call lane is bounded by
// reachability (the owner within reach), the email lane by affordability
// (premium at the 10% rule) - every reply becomes Mike's call and Mike takes
// nothing below premium. Layered businesses and TheirStack leads are email
// only ("I don't think these should make the call sheet at all"). An
// owner-run business above both floors is in BOTH: the rep calls first.
// A tier nobody could measure falls back on the affordability band the Find
// press measured on every Places lead: "we did not look" never means "cannot
// pay", so an unmeasured lead is taken as entry, never dropped.
// Round 114: the email lane has NO ceiling - a big company is an email lead.
const LANE_TIERS = { call: ['entry', 'core', 'upper'], email: ['core', 'upper', 'over_ceiling'] };
// Round 112: ONE fallback. When nothing measured the tier, the lane reads the
// same guess the sheet prints (the review count: low / medium / high), so the
// sheet word and the lane can never disagree (Hayward Tree Service read "low"
// on the sheet and "core, call + email" in the lane). The Find-time
// affordability band is used only when there is no review count at all.
// And the call lane means a NAMED owner within reach: a read lead with a
// phone and nobody named is the "no name yet" bucket, off the rep's sheet.
const SIZE_WORD_TIER = { low: 'entry', medium: 'core', high: 'upper' };
const lanesFor = ({ tier, sizeTier, sizeWord, sizeConfidence, affordBand, layers, source, target, product, usd, network, peOwned, national, siteless, phone, siteMarketingHead } = {}) => {
  const why = [];
  let t = SCALE_TIERS.includes(tier) ? tier : null;
  let measured = !!t;
  if (!t && SIZE_WORD_TIER[sizeWord]) {
    t = SIZE_WORD_TIER[sizeWord];
    why.push(`size not measured - taken as ${t} from the review count (${sizeConfidence || 'guess'})`);
  }
  if (!t) {
    t = affordBand === 'premium' ? 'core' : affordBand === 'below_floor' ? 'below_floor' : 'entry';
    why.push(affordBand ? `size not measured and no review count; judged on the trade and the job count (${affordBand})` : 'size not measured and nothing else read, taken as entry');
  }
  // Round 114 (Vin, 2026-09-03): headroom on the floor. A business is benched
  // under it only when its size is likely or sure; a guess under the floor
  // stays on the sheet as low, because the guess is the thing most likely wrong.
  if (t === 'below_floor' && sizeConfidence !== 'likely' && sizeConfidence !== 'sure') {
    t = 'entry';
    why.push(`under the floor on a ${sizeConfidence || 'guess'} - kept as low`);
  }
  // ══ ROUND 139 (Vin, 2026-09-11): THE SAME HEADROOM AT THE TOP ══════════
  // Round 114 gave the FLOOR headroom and left the ceiling hard, so the two
  // ends of one ladder disagreed about what a guess is worth: a guess under
  // $800k stayed on the rep's sheet and a guess over the cap was taken off it.
  // A guess is the thing most likely wrong in both directions, and with the cap
  // down at $15M the top end is the one a review count now reaches. Only a
  // MEASURED size moves a business into the email-only lane.
  if (t === 'over_ceiling' && sizeConfidence !== 'likely' && sizeConfidence !== 'sure') {
    t = 'upper';
    why.push(`over the cap on a ${sizeConfidence || 'guess'} - kept as high and still callable; only a measured size comes off the call sheet`);
  }
  // Round 113 (Vin, 2026-09-03): a product company is kept, as an email lead.
  const layered = layers === 'layered', ts = source === 'theirstack', prod = product === true;
  // Round 114: a branch network, a PE-owned company and a national operator are
  // LARGE companies - marked and kept, layered by construction.
  const big = network === true ? 'a branch network' : peOwned === true ? 'PE-owned' : national === true ? 'a national operator' : '';
  const named = !!target && target !== 'none';
  // Round 114: an owner-run business over the call cap is still a call while its
  // measured size sits under the reach line (DMI Paving at $24M: the founder is
  // named with his own mailbox, and nothing about the cap changes that).
  const reach = t === 'over_ceiling' && layers === 'owner' && !big && Number(usd) > 0 && Number(usd) <= ICP_CALL_REACH_CEILING;
  // Round 114 (Vin: "it's better to never find out if we cut it"): a layered
  // business under the cap STAYS on the call sheet, ranked last and marked, and
  // the rep asks for the marketing head. Only a TheirStack lead (no phone) and
  // a product company (a sales line) are never on it.
  // ══ ROUND 139 (Vin, 2026-09-11): A NAMED MARKETING DIRECTOR IS NOT A CALL ══
  // Government arithmetic, not a hunch: BLS OEWS May 2023 counts about one
  // Marketing Manager for every 442 specialty-trade establishments in Census
  // CBP 2023. A trade business that publishes a Director of Marketing on its
  // own team page is therefore, on the numbers alone, far bigger and more
  // layered than the sheet the rep dials - receptionists, and the owner out of
  // office. It is NOT benched: it keeps the email lane and that director is
  // who the email goes to. It loses the call lane only.
  const siteHead = siteMarketingHead === true;
  // ══ THE CHANNEL COMES FROM THE MEASURED SIZE (Vin, 2026-09-12) ═══════════
  // "size is the golden ticket because size kind of decides reachability wise
  // and also decides which channel we use." It used to come from LANE_TIERS on
  // the AFFORDABILITY tier, whose call and email lists OVERLAP from core up -
  // so nearly every row read "call + email", and a field that says both on
  // every lead is not a decision. SIZE_TIER_CHANNEL is a partition: one word,
  // one channel.
  //
  // AN UNMEASURED SIZE GOES TO THE REP, and that is a judgement worth stating.
  // We do not know how big they are, the row says so in those words, and the
  // rep is the cheapest way to find out - he asks for the owner and learns the
  // shape in thirty seconds. The alternative, holding them back until a paid
  // read measures them, is how 1,048 leads came to sit banked behind ten reads
  // a day. Never both lanes, and never silently: sizeTierWhy carries it.
  const _sz = String(sizeTier || '');
  const _szMeasured = SIZE_TIER_IDS.includes(_sz) || _sz === SIZE_TIER_OVER;
  // AN EXCEPTION THAT TAKES A LEAD OFF THE CALL SHEET MOVES IT TO EMAIL.
  // It does not strip both lanes. While the two lists overlapped this was
  // implicit - anything pushed out of call was still inside email - and the
  // FIRST RUN of this function under a partition proved it was load-bearing:
  // a medium business publishing a marketing director, and a TheirStack lead,
  // both came back with no lane at all. Each of those is a recorded ruling
  // (Round 139 for the marketing director, Round 113 for TheirStack) and a
  // partition silently repealed both.
  //
  // A branch network, a PE-owned company and a national operator are NOT in
  // here: Round 114 keeps them on the call sheet ranked last under the cap,
  // which is a different ruling and still holds.
  const _forcedEmail = ts || siteHead || (prod && t !== 'below_floor');
  const _szChannel = _forcedEmail ? 'email'
    : _szMeasured ? (SIZE_TIER_CHANNEL[_sz] || '') : 'call';
  const inCall = (_szChannel === 'call' || reach) && !ts && !prod && !siteHead;
  // ══ ROUND 121: A BUSINESS WITH NO WEBSITE IS THE CLEAREST LEAD WE FIND ══
  // Vin, 2026-09-04, ruling on two leads from that press: Delta Solar Power
  // (232 reviews) and American Dream Solar (305), both with a phone and no
  // working website, both sitting in No-name-yet where the rep never saw them.
  //
  // They can NEVER be named: with no pages, the roster, the model read and the
  // regex backstop all refuse on their first line and the paid wave is
  // unreachable behind the dead-site return. So "wait until a name is found"
  // means "never", and Round 112's rule - the call lane means a named owner -
  // was quietly swallowing the shape the finder deliberately keeps. The
  // discovery path says so in its own words: "a plumber with two hundred
  // reviews and no website is the most obvious problem in the entire pipeline
  // - no audit needed, no ambiguity, and it is exactly what a rebuild is for."
  //
  // Ranked LAST, like the §114 hedge, and only with a number to dial: a call
  // lead nobody can phone is not a call lead.
  const _sitelessCall = siteless === true && !!phone && inCall && !named;
  const call = inCall && (named || _sitelessCall);
  const noname = inCall && !named && !_sitelessCall;
  // Round 115: a product company is an email lead whatever the tier GUESS - a
  // manufacturer's reviews do not measure it (Mission Solar, 37 reviews, was
  // "entry" and got no lane at all). A measured below-floor still benches.
  const email = named && (_szChannel === 'email' || (prod && t !== 'below_floor'));
  const last = call && (layered || !!big || _sitelessCall);
  if (t === 'below_floor') why.push('under the floor - benched');
  if (t === 'over_ceiling') why.push(reach ? `over the call cap but owner-run and measured under ${_usdShort(ICP_CALL_REACH_CEILING)} - still a call` : `over the call cap (${SCALE_BAND_SAY.over_ceiling}) - email, the marketing decision-maker`);
  if (layered && inCall) why.push('layered business - on the call sheet last, ask for the marketing head');
  if (big && inCall) why.push(`${big} - on the call sheet last; the local number reaches a branch, the decision is at head office`);
  if (big && !inCall && _szChannel === 'email') why.push(`${big} - email, the marketing decision-maker at head office`);
  if (ts && _szChannel === 'call') why.push('a TheirStack lead - email only');
  if (prod && _szChannel === 'call') why.push('a product company - email only, its reviews do not measure a manufacturer');
  if (siteHead && (_szChannel === 'call' || reach)) why.push('their own site names a marketing director, so the buying decision sits behind a marketing department - email only, and that director is who it goes to');
  if (_sitelessCall) why.push('no working website, so nobody can be named from their own pages - on the call sheet last, with the number to ask who runs it');
  if (noname) why.push('nobody named yet - off the call sheet until a name is found');
  if (_szChannel === 'email' && !email && !noname) why.push('nobody named to write to');
  if (!_szMeasured) why.push('their size is not measured anywhere we looked - on the call sheet so the rep can find out, and the row says so');
  if (_sz === SIZE_TIER_OVER) why.push(reach ? `measured over the top of the ICP but owner-run and under ${_usdShort(ICP_CALL_REACH_CEILING)} - still a call` : `measured over ${_usdShort(ICP_REVENUE_BAND.ceiling)}, the top of what still buys from an agency - not a lead`);
  return { call, email, noname, last, tier: t, measured, sizeTier: _sz, sizeTierMeasured: _szMeasured,
           sizeWord: SIZE_TIER_WORD[_sz] || '', sizeSay: SIZE_TIER_SAY[_sz] || '', channel: _szChannel, why: why.join('; ') };
};
const laneWord = (l) => !l ? 'none' : (l.call && l.email) ? 'call + email' : l.call ? 'call' : l.email ? 'email' : l.noname ? 'no name yet' : 'none';
let bad=0;
const show=(name,o,want)=>{
  const l=lanesFor(o); const got=laneWord(l); const both=(l.call&&l.email);
  const ok=(got===want)&&!both; if(!ok)bad++;
  console.log(ok?" ok ":" XX ",String(name).padEnd(38),"|",String(got).padEnd(12),"|",String(l.sizeWord||"not measured").padEnd(13),"| want",want);
};
show("very small, owner named",{sizeTier:"very_small",target:"owner",phone:true,layers:"owner"},"call");
show("small, owner named",{sizeTier:"small",target:"owner",phone:true,layers:"owner"},"call");
show("medium, owner named",{sizeTier:"medium",target:"owner",phone:true,layers:"owner"},"call");
show("large, marketing head named",{sizeTier:"large",target:"marketing_lead",phone:true,layers:"layered"},"email");
show("over the ICP, owner named",{sizeTier:"over_icp",target:"owner",phone:true,layers:"owner"},"none");
show("UNMEASURED, owner named",{target:"owner",phone:true,layers:"owner"},"call");
show("UNMEASURED, nobody named",{phone:true,layers:"owner"},"no name yet");
show("medium, site names a mkt head",{sizeTier:"medium",target:"marketing_lead",phone:true,siteMarketingHead:true},"email");
show("small, TheirStack lead",{sizeTier:"small",target:"owner",source:"theirstack"},"email");
show("small, product company",{sizeTier:"small",target:"owner",phone:true,product:true},"email");
show("small, PE-owned (call, ranked last)",{sizeTier:"small",target:"owner",phone:true,peOwned:true},"call");
show("no website at all + a phone",{sizeTier:"small",phone:true,siteless:true,layers:"owner"},"call");
const over=lanesFor({sizeTier:"over_icp",target:"owner",phone:true});
console.log("");
console.log("over the ICP row says:",JSON.stringify({word:over.sizeWord,say:over.sizeSay,measured:over.sizeTierMeasured}));
console.log(bad?(bad+" CASE(S) WRONG"):"all 12 correct, none in both lanes");
process.exit(bad?1:0);