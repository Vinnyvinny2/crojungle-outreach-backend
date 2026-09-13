// Andrew P. Trussler, MD - one plastic surgeon - read as "at least 53 people on
// their own team page" and routed to the email lane, off the rep's call sheet,
// on 2026-09-12. Run: node docs/history/round-147-evidence/floor-decides-the-channel.js
const lift = require('./lift');
const L = lift(['ICP_REVENUE_BAND','ICP_CALL_REACH_CEILING','ICP_REVENUE_PER_EMPLOYEE','ICP_REVENUE_PER_TRUCK',
  'ICP_REVENUE_PER_EMPLOYEE_BY_TRADE','revenuePerEmployeeFor','scaleCuts','SCALE_TIERS','tierFromCount','tierFromRevenue',
  '_usdShort','SCALE_BAND_SAY','ICP_SIZE_TIERS','SIZE_TIER_IDS','SIZE_TIER_OVER','SIZE_TIER_UNMEASURED','sizeTierFromRevenue',
  'SIZE_TIER_WORD','SIZE_TIER_SAY','SIZE_TIER_CHANNEL','SCALE_BAND_POINTS','SIZE_WORD_TIER','parseStatedRevenueBound','lanesFor'],
  ['lanesFor','sizeTierFromRevenue','SIZE_TIER_CHANNEL','SIZE_TIER_OVER','revenuePerEmployeeFor','ICP_REVENUE_PER_EMPLOYEE_BY_TRADE','ICP_REVENUE_PER_EMPLOYEE']);

const show = (label, o) => {
  const l = L.lanesFor(o);
  console.log('\n' + label);
  console.log('   channel ' + JSON.stringify(l.channel) + '   call ' + l.call + '   email ' + l.email + '   noname ' + l.noname);
  console.log('   why: ' + (l.why || '(nothing on the row)'));
};
console.log('== WHY $10.6M: the dollars are not a floor, the headcount is ==');
for (const t of ['Plastic Surgery', 'Med Spa', 'Dental', 'Accounting', 'HVAC']) {
  console.log('   ' + t.padEnd(17) + '$' + (L.revenuePerEmployeeFor(t) / 1000) + 'k per head' +
    (L.ICP_REVENUE_PER_EMPLOYEE_BY_TRADE[t] ? '  (its own row)' : '  (borrowed from HVAC, the default)'));
}
console.log('   53 people x $' + (L.revenuePerEmployeeFor('Plastic Surgery') / 1000) + 'k = $' +
  (53 * L.revenuePerEmployeeFor('Plastic Surgery') / 1e6).toFixed(1) + 'M, which is 3% over the $10M channel line');

show('TRUSSLER - the exact live inputs, floor', { tier: 'upper', sizeTier: 'large', sizeIsFloor: true, sizeConfidence: 'likely', layers: 'owner', source: 'google_places', target: 'owner', usd: 10.6e6, phone: true });
show('the same business on a VERIFIED headcount - still leaves the phone', { tier: 'upper', sizeTier: 'large', sizeIsFloor: false, sizeConfidence: 'sure', layers: 'owner', source: 'google_places', target: 'owner', usd: 12e6, phone: true });
show('a floor OVER the ICP, layered (reach cannot mask it)', { tier: 'over_ceiling', sizeTier: L.SIZE_TIER_OVER, sizeIsFloor: true, sizeConfidence: 'likely', layers: 'layered', source: 'google_places', target: 'owner', usd: 22e6, phone: true });
show('ROSE PAVING - $255M from a DIRECTORY figure, not a floor', { tier: 'over_ceiling', sizeTier: L.SIZE_TIER_OVER, sizeIsFloor: false, sizeConfidence: 'sure', layers: 'layered', source: 'google_places', target: 'owner', usd: 255e6, peOwned: true, phone: true });
show('a TheirStack lead on a floor - email only survives, it is a FACT not a size', { tier: 'core', sizeTier: 'medium', sizeIsFloor: true, layers: 'owner', source: 'theirstack', target: 'owner' });
