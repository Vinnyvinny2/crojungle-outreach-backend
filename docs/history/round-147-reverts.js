// Round 147 falsification. Each entry reverts ONE fix against a green baseline
// and must turn its OWN named check red.
//
// Every defect this round fixes shipped past 308 boot checks and 345 server
// assertions. That is the fact that shapes this file: the guards are new, and
// a revert that leaves everything green would mean the guard is decoration.
module.exports = [
  {
    // THE ROUND'S HEADLINE. Andrew P. Trussler, MD - one plastic surgeon -
    // read as "at least 53 people on their own team page" and routed to the
    // email lane, off the rep's call sheet, on 2026-09-12. A FLOOR is the
    // least certain number this system holds, and since Round 146 made size
    // decide the channel it became the one thing that can delete a lead.
    name: '147-a-a-floor-takes-a-lead-off-the-call-sheet',
    path: 'src/all.js',
    old: "  const _floorKeptCall = _floorOnly && _byTier === 'email';",
    new: '  const _floorKeptCall = false;',
    prove: 'boot',
    mustPrint: /took a business off the rep's phone|a size read as "at least 53 people/,
  },
  {
    // The other half of the same rule: a published count that reads OVER the
    // top of the ICP drops the lead outright rather than moving it. Reverted
    // alone, the channel assertion above still passes - which is why this is
    // a separate entry rather than a second assertion on one revert.
    name: '147-b-a-floor-over-the-icp-still-drops-the-lead',
    path: 'src/all.js',
    old: '  const _overIcp = _rawOverIcp && !_floorOnly;',
    new: '  const _overIcp = _rawOverIcp;',
    prove: 'boot',
    mustPrint: /reads over the top of the ICP DROPS the lead/,
  },
  {
    // COMPUTED AND NOT PASSED, the bug class this repo records most, and the
    // shape that would make every fix above true and unreachable: lanesFor
    // learns the rule and the call site never tells it which leads it applies
    // to.
    name: '147-c-the-floor-flag-never-reaches-the-lane',
    path: 'src/all.js',
    old: 'const _lanes = lanesFor({ tier: signals.scaleBand, sizeTier: _sizeTier, sizeIsFloor: _sizeIsFloor,',
    new: 'const _lanes = lanesFor({ tier: signals.scaleBand, sizeTier: _sizeTier,',
    prove: 'boot',
    mustPrint: /the floor flag never reaches lanesFor/,
  },
  {
    // Henry A. Mentz, MD: "two doctors" on a multi-page practice with a med
    // spa, and the sheet read "estimated under $800k" - a MAXIMUM stated from
    // a MINIMUM. Reverting the floor restores the fall-through that said it.
    name: '147-d-two-names-state-a-dollar-ceiling',
    path: 'src/all.js',
    old: "  if (Number.isFinite(staff) && staff >= 3) return mk(staff < cuts.entry ? 'entry' : tierFromCount(staff, cuts), `\"${d.staffProseSay || staff + ' staff'}\" on their own pages`, staff * per);",
    new: "  if (Number.isFinite(staff) && staff > 0) return mk(staff < cuts.entry && staff >= 3 ? 'entry' : tierFromCount(staff, cuts), `\"${d.staffProseSay || staff + ' staff'}\" on their own pages`, staff * per);",
    prove: 'boot',
    mustPrint: /two names on their own pages decided a size band/,
  },
  {
    // And the rep's word ladder, the second of the two. Reverted alone, the
    // affordability ladder above still refuses - so one screen carries two
    // verdicts about whether the business was measured at all.
    name: '147-e-the-reps-ladder-still-sizes-two-names',
    path: 'src/all.js',
    old: '    if (Number.isFinite(t.min) && n < t.min) continue;   // Round 147: a published count under three measures nothing',
    new: '    if (false) continue;',
    prove: 'boot',
    mustPrint: /the rep's word ladder still reads two names as a size/,
  },
  {
    // Dr. Sam Sukkar: '"50 doctors" on their own pages'. His page says he was
    // named one of Houston's TOP 50 DOCTORS. A false sentence about a real
    // business, written at the PRESS where nobody opens the page.
    name: '147-f-an-award-is-counted-as-staff',
    path: 'src/all.js',
    old: '  let staff = _maxCapture(t, STAFF_PROSE_RE, 999, 1, _isAwardNotStaff);',
    new: '  let staff = _maxCapture(t, STAFF_PROSE_RE, 999);',
    prove: 'boot',
    mustPrint: /a magazine's ranking was counted as staff/,
  },
  {
    // Reoon answered "error" 6 times in a batch of 10 - every call it made -
    // and stayed counted as available, so a lead can be told there is "no
    // evidence of this mailbox from any source" while a checker never once
    // returned a verdict.
    name: '147-g-a-checker-that-only-errors-stays-available',
    path: 'src/all.js',
    old: '  if (st.unknownRun >= VERIFIER_UNKNOWN_RUN_MAX && !verifierBlocked(id)) {',
    new: '  if (false) {',
    prove: 'boot',
    mustPrint: /unrecognised answers in a row from one checker leave it counted as available/,
  },
];
