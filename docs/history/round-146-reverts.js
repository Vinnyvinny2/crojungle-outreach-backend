// Round 146 falsification. Each entry reverts ONE fix against a green baseline
// and must turn its OWN named check red.
//
// Two of these exist because the guard they trip was written this round to
// close a mechanism that had NO guard at all: the measured size reaching
// lanesFor, and the press reading a size off the homepage. Both are the point
// of the round, and until the pins were added a revert of either would have
// left every gate green - one of them behind a comment that claimed a check
// pinned it, which is worse than no comment because the next reader believes it.
module.exports = [
  {
    // THE ROUND'S HEADLINE. Without this the press hands every lead to the
    // queue with no measured size, so the tier is a Google review count again -
    // 0 of 300 on 2026-09-12 - and Vin's size filter filters a guess.
    name: '146-a-the-press-stops-measuring-size',
    path: 'src/all.js',
    old: "        const _sig = readFindIcpSignals([{ intent: 'home', url: c.website, finalUrl: r.finalUrl || '', html: r.html, text: r.text }]);",
    new: '        const _sig = {};',
    prove: 'boot',
    mustPrint: /the press stops reading their own pages for a size/,
  },
  {
    // COMPUTED AND NOT PASSED, the bug class this repo records most. The size
    // is measured, put on the answer, and then not handed to the function that
    // decides the channel - so the channel falls back to its unmeasured
    // default, which is 'call', and every read lead goes to the rep whatever
    // its size. Nothing else in the round would have gone red.
    name: '146-b-the-measured-size-never-reaches-the-lane',
    path: 'src/all.js',
    old: 'const _lanes = lanesFor({ tier: signals.scaleBand, sizeTier: _sizeTier, sizeWord:',
    new: 'const _lanes = lanesFor({ tier: signals.scaleBand, sizeWord:',
    prove: 'boot',
    mustPrint: /the measured size never reaches lanesFor/,
  },
  {
    // Vin, twice: "trteat grate reviews as normal ... take that out
    // completley". THIS ENTRY WAS WRONG FIRST TIME and the falsification run
    // said so: it put the term id back into demotionPenalty's want list, which
    // is INERT on its own because the term no longer exists in the declared
    // table. A revert that changes no behaviour proves nothing about a guard.
    //
    // Re-aimed at the hole that was actually open: the SECOND place the star
    // rating scored a lead, 8/8 inside the old band against 4/8 above it. The
    // agent that removed the first penalty could not see this one, and nothing
    // guarded it until the round added the assertion this now trips.
    name: '146-c-a-high-rating-is-a-penalty-again-in-the-second-scorer',
    path: 'src/all.js',
    old: "      if (r >= 4.2) return { points: 8, say: `${r} stars` };",
    new: "      if (r >= 4.2 && r <= 4.85) return { points: 8, say: `${r} stars` };\n      if (r > 4.85) return { points: 4, say: `${r} stars - so high there is rarely a complaint to work with` };",
    prove: 'boot',
    mustPrint: /the rating term scores/,
  },
  {
    // Round 141 built the visible-groups filter because "the existing grade is
    // 56% faults nobody can see", left two invisible faults inside it, and
    // added them on top of the eyes. diyBuilder is 3 of the 6 points that
    // graded SLC Med Spa, Winn's and Locust Pump "bad" with ZERO eye faults.
    name: '146-d-invisible-faults-decide-the-website-grade-again',
    path: 'src/all.js',
    old: "const SITE_LOOKS_VISIBLE_GROUPS = ['converts'];",
    new: "const SITE_LOOKS_VISIBLE_GROUPS = ['build', 'converts'];",
    prove: 'boot',
    mustPrint: /the groups a visitor can see are now/,
  },
  {
    // The only defect in the round that cost money EVERY time it fired: a
    // retired reader answering with no management key, stored as undefined,
    // and read for its length on the next line. Reproduced byte for byte
    // against the live log line before it was fixed.
    name: '146-e-the-size-lookup-crashes-on-a-bbb-result-again',
    path: 'src/all.js',
    old: "  if (r.ok !== true) return { parsed: parsed, why: String(r.why || 'no reason given') };",
    new: "  if (r.ok !== true && !/^retired/.test(String(r.why || ''))) return { parsed: parsed, why: String(r.why || 'no reason given') };",
    prove: 'boot',
    mustPrint: /BBB|management|retired/i,
  },
  {
    // A generic statement about our own capability outranking a cause we
    // actually recorded. On an instance with no verifier key - which is Vin's
    // since he removed the BounceBan one - EVERY blocked address reported a
    // checker outage whatever had happened.
    name: '146-f-a-hunter-timeout-is-reported-as-a-verifier-outage-again',
    path: 'src/all.js',
    old: '  const _blockWhy = _lookupBlocked ? hunterBlockedSay(_lookupBlocked)\n    : _stalls',
    new: "  const _blockWhy = !verifierAnyAvailable(undefined, verifierKey)\n    ? 'every configured email checker is unavailable, so nothing could be checked'\n    : _lookupBlocked ? hunterBlockedSay(_lookupBlocked)\n    : _stalls",
    prove: 'boot',
    mustPrint: /no longer tests the recorded Hunter cause FIRST/,
  },
  {
    // Vin's own find: "Anesthesia Options" reached a call sheet as a person.
    // It also makes ownPagesNameNobody read "their pages DO name somebody",
    // so the paid owner wave buys a search for a business naming nobody.
    name: '146-g-a-nav-label-is-a-person-again',
    path: 'src/all.js',
    old: "  'options', 'option', 'plans', 'plan', 'packages', 'package', 'pricing',",
    new: "  'option', 'plans', 'plan', 'packages', 'package', 'pricing',",
    prove: 'boot',
    mustPrint: /reads as a person/,
  },
];
