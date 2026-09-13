// Henry A. Mentz, MD - a multi-page plastic surgery practice with a med spa -
// wrote "two doctors" and the sheet read "estimated under $800k": a MAXIMUM
// stated from a MINIMUM. Run: node docs/history/round-147-evidence/a-count-under-three.js
const lift = require('./lift');
const L = lift(['ICP_REVENUE_BAND','ICP_REVENUE_PER_EMPLOYEE','ICP_REVENUE_PER_TRUCK','ICP_REVENUE_PER_EMPLOYEE_BY_TRADE',
  'revenuePerEmployeeFor','scaleCuts','SCALE_TIERS','tierFromCount','tierFromRevenue','_usdShort','SCALE_BAND_SAY',
  'SCALE_BAND_POINTS','SIZE_WORD','SIZE_ORDER','SIZE_RANK','SIZE_TERMS','parseStatedRevenueBound','parseStatedRevenue',
  '_scaleLadder','estimateScaleBand','sizeBand'], ['estimateScaleBand','sizeBand']);

const row = (label, sig) => {
  const b = L.estimateScaleBand(sig), w = L.sizeBand(sig);
  console.log('   ' + label.padEnd(38) + '| ladder ' + (b ? (b.band + ': ' + b.say) : 'NOT MEASURED').padEnd(62) +
              '| rep\'s word ' + String(w.band) + ' (' + w.confidence + ')');
};
console.log('== the two ladders must agree about whether a business was measured ==');
row('"two doctors"', { staffProse: 2, staffProseSay: 'two doctors' });
row('"three doctors"', { staffProse: 3, staffProseSay: 'three doctors' });
row('"a team of 14"', { staffProse: 14, staffProseSay: 'a team of 14' });
console.log('\n== and it FALLS THROUGH: the rungs below a small count still run ==');
row('"two doctors" + 4 locations', { staffProse: 2, staffProseSay: 'two doctors', locationsProse: 4 });
row('"two doctors" + 12 on the team page', { staffProse: 2, staffProseSay: 'two doctors', teamCount: 12 });
