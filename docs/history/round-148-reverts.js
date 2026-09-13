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
    old: "  const _sizeStraddles = directoryRangeStraddles(signals);",
    new: '  const _sizeStraddles = false;',
    prove: 'boot',
    mustPrint: /no longer read from the size ladder/,
  },

  // ══ OWNER NAMING ─ merged from the agent that owned the name ladder ══
  {
    name: 'name-across-a-line-break-shape-A',
    path: 'src/all.js',
    // The general whitespace class back in the "owner of X, Name is" name
    // slot. \s matches a line break, which is what made "Property An".
    old: "(?:${OWNER_SENTENCE_NAMEGAP}${OWNER_SENTENCE_NAMETOK})?",
    new: "(?:\\\\s+${OWNER_SENTENCE_NAMETOK})?",
    prove: 'boot',
    mustPrint: 'A NAME IS ON ONE LINE CHECK',
  },
  {
    name: 'name-across-a-line-break-shape-B',
    path: 'src/all.js',
    // And in the "<Name>, Owner" slot, which is the one the live John and
    // Jerry page went through.
    old: "[a-z]{1,15}${OWNER_SENTENCE_NAMEGAP}${OWNER_SENTENCE_NAMETOK})",
    new: "[a-z]{1,15}\\\\s+${OWNER_SENTENCE_NAMETOK})",
    prove: 'boot',
    mustPrint: 'A NAME IS ON ONE LINE CHECK',
  },
  {
    name: 'practice-principal-rule-gone',
    path: 'src/all.js',
    // The rule answers nobody, which is the state Adam Dickreiter, CPA, PLLC
    // shipped in: a practice named after a man, and no owner on the row.
    old: "const practicePrincipalName = (companyName) => {\n  const raw = String(companyName || '').trim();\n  if (!raw) return null;",
    new: "const practicePrincipalName = (companyName) => {\n  const raw = String(companyName || '').trim();\n  if (!raw) return null;\n  return null;",
    prove: 'boot',
    mustPrint: 'A PRACTICE IS ITS PRINCIPAL CHECK',
  },
  {
    name: 'practice-candidate-built-from-nothing',
    path: 'src/all.js',
    // The push stays exactly where it is and is fed an empty variable - the
    // hard-coded-null shape that satisfies a position needle and ships
    // nobody.
    old: "  const _practice = practicePrincipalName(companyName);\n  if (_practice) {",
    new: "  const _practice = null;\n  if (_practice) {",
    prove: 'boot',
    mustPrint: 'A PRACTICE IS ITS PRINCIPAL CHECK',
  },
  {
    name: 'practice-graded-on-site-copy',
    path: 'src/all.js',
    // The registration settle is no longer recorded, so the grade falls
    // through to "their own site states it" - a sentence about a page we
    // never read - and can read CONFIRMED once a second source lands.
    old: "      : practiceConfident ? 'practice_name'\n",
    new: "",
    prove: 'boot',
    mustPrint: 'A PRACTICE IS ITS PRINCIPAL CHECK',
  },
  {
    name: 'hunter-asked-only-about-marketing',
    path: 'src/all.js',
    // The second question carries the marketing filter again, so the lead
    // with no name gets the same empty list for the same credit.
    old: "&type=personal&limit=10&api_key=${hunterKey}`, {}, 10000));\n  const d = await safeJson(r);\n  const read = readHunterRoster(",
    new: "&type=personal&department=marketing&limit=10&api_key=${hunterKey}`, {}, 10000));\n  const d = await safeJson(r);\n  const read = readHunterRoster(",
    prove: 'boot',
    mustPrint: 'HUNTER IS ASKED WHO WORKS THERE CHECK',
  },
  {
    name: 'hunter-name-may-be-written-to',
    path: 'src/all.js',
    // An index-only name counts as real evidence again, so canBuy is true,
    // the grade becomes sendable, and a cold email opens with the first name
    // of somebody nothing this business published ever named.
    old: "const ownerEvidenceIsReal = (sources, corroborated) => corroborated === true\n  || (Array.isArray(sources) ? sources : []).filter(s => s !== 'hunter').length >= 1;",
    new: "const ownerEvidenceIsReal = (sources, corroborated) => corroborated === true\n  || (Array.isArray(sources) ? sources : []).length >= 1;",
    prove: 'boot',
    mustPrint: 'HUNTER IS ASKED WHO WORKS THERE CHECK',
  },
  {
    name: 'hunter-roster-not-ranked-by-authority',
    path: 'src/all.js',
    // The list comes back in the index's own order, which is what puts a
    // Marketing Coordinator at confidence 95 above a President at 82.
    old: "    .sort((a, b) => b.authority - a.authority);\n  const top = people[0] || null;",
    new: "    .sort((a, b) => 0);\n  const top = people[0] || null;",
    prove: 'boot',
    mustPrint: 'HUNTER IS ASKED WHO WORKS THERE CHECK',
  },
  {
    name: 'practice-settle-sentence-off-the-latch',
    path: 'src/all.js',
    // The third settle sentence prints once per ASK again, which is what
    // inflates the free-settle rate the Firecrawl plan is sized from.
    old: "    if (!_settleSaid && practiceConfident) {\n      _settleSaid = true;",
    new: "    if (practiceConfident) {\n      const _unused = true;",
    prove: 'boot',
    mustPrint: 'SETTLE SAID ONCE CHECK',
  },
];
