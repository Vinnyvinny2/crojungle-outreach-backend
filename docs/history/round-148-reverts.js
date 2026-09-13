// ═══════════════════════════════════════════════════════════════════════════
// ROUND 148 — the size ladder. One revert per mechanism, each restoring the
// SHIPPED expression verbatim, each demanded to go red on its OWN named check.
// ═══════════════════════════════════════════════════════════════════════════
module.exports = [
  {
    // 1. A parsed roster of 1-8 people IS a size. Reverted, the ladder is
    // silent on Dawn Designs Texas and Rick Stone Masonrys again.
    name: 'roster-is-a-size',
    path: 'src/all.js',
    old: '  if (_rosterTier) return _rosterRow();\n  return null;\n};',
    new: '  return null;\n};',
    prove: 'boot',
    mustPrint: /A SMALL ROSTER IS A SIZE:/,
  },
  {
    // 2. The tier must travel with whatever answer wins. Reverted, the tier is
    // computed and dropped one line from where it was computed.
    name: 'roster-tier-reaches-the-row',
    path: 'src/all.js',
    old: 'const _sizeTier = (_scale && _scale.sizeTier) ? _scale.sizeTier : sizeTierFromRevenue(_sizeUsd);',
    new: 'const _sizeTier = sizeTierFromRevenue(_sizeUsd);',
    prove: 'boot',
    mustPrint: /SIZE AND LAYERS CHECK:/,
  },
  {
    // 3. A bare count with NOBODY parsed is refused. Reverted, John and Jerry
    // report "at least 16 people on their own team page" again.
    name: 'a-page-that-names-nobody',
    path: 'src/all.js',
    old: '      if (!(Number(_rosterParsedOn.get(p)) >= 1)) {\n        teamNamedNobody = true;\n        if (n > teamNamesCounted) teamNamesCounted = n;\n        continue;\n      }\n',
    new: '',
    prove: 'boot',
    mustPrint: /A PAGE THAT NAMES NOBODY STATES NO SIZE:/,
  },
  {
    // 4. Their own page outranks a directory range that straddles tiers.
    // Reverted, Fred Flores CPA is 126 employees and $15.1M again.
    name: 'own-site-beats-a-straddling-range',
    path: 'src/all.js',
    old: '  if (_rosterTier && !_dirTrusted && (_dirHead || parseStatedRevenueBound(d.revenueStated))) return _rosterRow();',
    new: '',
    prove: 'boot',
    mustPrint: /THEIR OWN SITE OUTRANKS A STRADDLING RANGE:/,
  },
  {
    // 5. The straddle rule has ONE declaration, executed by both ladders.
    // Reverted to a rule that never straddles, the same check goes red.
    name: 'one-straddle-declaration',
    path: 'src/all.js',
    old: '  return bandOf(Number(m[1])) !== bandOf(Number(m[2]));\n};',
    new: '  return false;\n};',
    prove: 'boot',
    mustPrint: /THEIR OWN SITE OUTRANKS A STRADDLING RANGE:/,
  },
  {
    // 6. The rep's word ladder reads the parsed roster below the core cut.
    // Reverted, the sheet prints a review-count guess on a four-person page.
    name: 'the-sheet-reads-a-small-roster',
    path: 'src/all.js',
    old: "    if (t.floor && n < k.medium && !(t.lowOk && t.lowOk(d))) continue;",
    new: '    if (t.floor && n < k.medium) continue;',
    prove: 'boot',
    mustPrint: /A SMALL ROSTER IS A SIZE:/,
  },

  // ══ THE LANES ─ merged from the agent that owned lanesFor ══════════
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
