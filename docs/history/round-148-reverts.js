// Round 148 falsification. Each entry reverts ONE fix against a green baseline
// and must turn ONE GUESS, ONE VERDICT red on its OWN named line.
//
// Both defects shipped past 308 boot checks: the lane rules were guarded end to
// end and no assertion had ever asked the two ladders inside lanesFor whether
// they agreed with each other. So the four reverts below are deliberately split
// by MECHANISM rather than by symptom - the two fixes hide each other on the
// Andrew Arthur row (either one alone removes the contradictory sentence), and
// a shared fixture is how two guards come to look proven while neither is.
module.exports = [
  {
    // DEFECT 1. Andrew Arthur Homes, a directory's $38.4M on a GUESS.
    // Round 139's headroom demoted the affordability tier and printed "kept as
    // high and still callable"; the four-word size tier stayed at over_icp, so
    // the over-the-ICP drop fired off the second ladder and stripped the
    // channel. One row, two verdicts. Asserted on the TIER rather than on the
    // sentence, because the guess rule below also removes the sentence.
    name: '148-a-the-second-ladder-is-not-demoted-with-the-first',
    path: 'src/all.js',
    old: '    if (_szTier === SIZE_TIER_OVER) _szTier = SIZE_TIER_IDS[SIZE_TIER_IDS.length - 1];',
    new: '    void SIZE_TIER_IDS;',
    prove: 'boot',
    mustPrint: /leaves the four-word size ladder reading/,
  },
  {
    // DEFECT 2. Fred Flores CPA: a directory range spanning two tiers took an
    // owner-run CPA firm off the phone, and his only address is BLOCKED.
    name: '148-b-a-guess-takes-a-lead-off-the-phone',
    path: 'src/all.js',
    old: "  const _guessOnly = sizeConfidence === 'guess' || sizeStraddles === true;",
    new: '  const _guessOnly = false;',
    prove: 'boot',
    mustPrint: /took a lead off the phone/,
  },
  {
    // COMPUTED AND NOT PASSED - the class this repo records most, and the shape
    // that makes every rule above true and unreachable.
    name: '148-c-the-straddle-never-reaches-the-lane',
    path: 'src/all.js',
    old: 'sizeIsFloor: _sizeIsFloor, sizeStraddles: _sizeStraddles, sizeWord: _size.band,',
    new: 'sizeIsFloor: _sizeIsFloor, sizeWord: _size.band,',
    prove: 'boot',
    mustPrint: /computed and never passed to the lane/,
  },
  {
    // And the other end of the same wire: the straddle must be READ from the
    // size ladder's own output rather than recomputed beside it.
    name: '148-d-the-straddle-is-not-read-from-the-ladder',
    path: 'src/all.js',
    old: "  const _sizeStraddles = SIZE_STRADDLE_SAY_RE.test(String(_size.why || ''));",
    new: '  const _sizeStraddles = false;',
    prove: 'boot',
    mustPrint: /no longer read from the size ladder/,
  },
];
