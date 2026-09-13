// Round 148 — owner naming. One revert per fix, each restoring the SHIPPED
// expression verbatim so the original symptom comes back, and each naming the
// line its own guard must print.
module.exports = [
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
