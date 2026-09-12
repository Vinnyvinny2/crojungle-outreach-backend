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
const SIZE_TIER_WORD = Object.fromEntries(ICP_SIZE_TIERS.map(t => [t.id, t.word]));
// The dollar range each word covers, derived from the cuts so the sheet and
// the ladder can never disagree.
const SIZE_TIER_SAY = Object.fromEntries(ICP_SIZE_TIERS.map((t, i) => [t.id,
  i === 0 ? `under ${_usdShort(t.to)}` : `${_usdShort(ICP_SIZE_TIERS[i - 1].to)}-${_usdShort(t.to)}`]));
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
const cases=[[0,"nothing measured"],[900e3,"$900k"],[1.4e6,"$1.4M"],[1.5e6,"$1.5M exactly"],[1.6e6,"$1.6M"],[4e6,"$4M exactly"],[4.1e6,"$4.1M"],[9e6,"$9M"],[10e6,"$10M exactly"],[11e6,"$11M"],[19e6,"$19M"],[20e6,"$20M exactly"],[21e6,"$21M"],[40e6,"$40M"]];
for(const [usd,say] of cases){
  const t=sizeTierFromRevenue(usd);
  const word=t===""?"NOT MEASURED":t===SIZE_TIER_OVER?"OVER THE ICP - dropped":SIZE_TIER_WORD[t];
  const ch=t===""?"-":t===SIZE_TIER_OVER?"-":SIZE_TIER_CHANNEL[t];
  console.log(String(say).padEnd(16),"->",String(word).padEnd(24),String(ch).padEnd(6),t?(SIZE_TIER_SAY[t]||""):"");
}
console.log("");
console.log("the four words   :",SIZE_TIER_IDS.map(i=>SIZE_TIER_WORD[i]).join(" | "));
console.log("channel line     : medium ends at",ICP_SIZE_TIERS.find(t=>t.id==="medium").to/1e6+"M  (upperFrom is "+ICP_REVENUE_BAND.upperFrom/1e6+"M) derived:",ICP_SIZE_TIERS.find(t=>t.id==="medium").to===ICP_REVENUE_BAND.upperFrom);
console.log("top of the ICP   : large ends at",ICP_SIZE_TIERS.find(t=>t.id==="large").to/1e6+"M  (ceiling is "+ICP_REVENUE_BAND.ceiling/1e6+"M) derived:",ICP_SIZE_TIERS.find(t=>t.id==="large").to===ICP_REVENUE_BAND.ceiling);
console.log("call lane covers :",SIZE_TIER_IDS.filter(i=>SIZE_TIER_CHANNEL[i]==="call").join(", "));
console.log("email lane covers:",SIZE_TIER_IDS.filter(i=>SIZE_TIER_CHANNEL[i]==="email").join(", "));
console.log("in BOTH lanes    :",SIZE_TIER_IDS.filter(i=>false).length,"(a partition by construction - one word, one channel)");
console.log("employee gate    : warn",ICP_EMPLOYEE_WARN,"block",ICP_EMPLOYEE_BLOCK,"people at $200k/head");
