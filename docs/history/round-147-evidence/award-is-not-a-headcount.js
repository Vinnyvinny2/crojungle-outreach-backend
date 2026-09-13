// Dr. Sam Sukkar, one plastic surgeon, carried the row '"50 doctors" on their
// own pages'. His page says he was named one of Houston's TOP 50 DOCTORS.
// Run: node docs/history/round-147-evidence/award-is-not-a-headcount.js
const lift = require('./lift');
const L = lift(['PROSE_NUM','PROSE_NUM_WORDS','STAFF_PROSE_RE','STAFF_PROSE_AWARD_RE','_proseSentence','_isAwardNotStaff',
  '_maxCapture','CREW_PROSE_RE','FLEET_PROSE_RE','LOCATIONS_PROSE_RE','FOUNDER_PHRASE_RE','FIND_FINANCING_RE',
  'FIND_COMMERCIAL_RE','FIND_FOUNDED_RE','readFindProse'], ['readFindProse','STAFF_PROSE_RE','_isAwardNotStaff']);

const AWARDS = [
  "Dr. Sukkar was named one of Houston's Top 50 Doctors by H Texas Magazine.",
  'Voted among the top 10 doctors in Texas for five consecutive years.',
  'Castle Connolly Top Doctors 2024 - one of only 25 doctors in the region.',
  'Named to the Super Doctors list of 40 doctors statewide.',
  'Awarded a place among the best 20 attorneys in the county.',
  'Ranked in the top 100 agents nationwide by volume.',
  'Winner: Best 15 Designers in Austin, 2025.',
  'Recognized by Texas Monthly magazine as one of 30 top dentists.',
  'Honored as a finalist alongside 12 designers from across the state.',
  '#1 of 50 agents in the region three years running.',
  'Our founder was nominated with 18 other therapists for the state award.',
  'Austin Business Journal ranking: 45 lawyers you should know.',
];
const REAL = [['A team of 14 dedicated professionals.', 14], ['Our practice employs 12 full-time staff members.', 12],
  ['We are a 9-person team serving the whole metro.', 9], ['A 6-man crew arrives on every job.', 6],
  ['Employing 20 licensed technicians across two counties.', 20], ['Our 30 technicians are on call around the clock.', 30],
  ['One of our 30 technicians will arrive within the hour.', 30], ['We have grown to 45 employees since 1998.', 45]];

console.log('== what the RAW regex still matches (the defect, unchanged) ==');
for (const t of AWARDS.slice(0, 3)) {
  L.STAFF_PROSE_RE.lastIndex = 0;
  console.log('   ' + JSON.stringify([...t.matchAll(L.STAFF_PROSE_RE)].map(m => m[0].trim())) + '  <- ' + t);
}
let bad = 0;
console.log('\n== through the real reader: awards must measure NOTHING ==');
for (const t of AWARDS) {
  const p = L.readFindProse(t);
  if (p.staffProse !== null) { bad++; console.log('   LEAK  ' + p.staffProse + ' "' + p.staffProseSay + '"  <- ' + t); }
}
console.log('   ' + (AWARDS.length - bad) + ' of ' + AWARDS.length + ' refused');
console.log('\n== and the forms that say staff in their own words must survive ==');
for (const [t, want] of REAL) {
  const got = L.readFindProse(t).staffProse;
  if (got !== want) { bad++; console.log('   LOST  wanted ' + want + ', got ' + got + '  <- ' + t); }
}
console.log('   ' + REAL.filter(([t, w]) => L.readFindProse(t).staffProse === w).length + ' of ' + REAL.length + ' kept');
console.log(bad ? '\n' + bad + ' FAILURES' : '\nboth directions correct');
