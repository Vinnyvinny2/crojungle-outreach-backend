// Round 143A falsification. Each entry reverts ONE fix against a green baseline
// and must turn its OWN named check red. These are the INTEGRATION-level fixes:
// the four agents falsified their own work in their own worktrees, and every
// entry here is a defect that did not exist until their work was merged and
// wired, which is exactly the class no single agent could have proven.
module.exports = [
  {
    // The comparator is two reads of one rule. ba grew a fourth demotion reason
    // and bb did not, so a listing Google itself flags sorted FIRST whenever it
    // arrived before an in-band lead - the bench promise broken by the sort
    // rather than by any gate, with every gate still correct.
    name: '143a-a-the-comparator-halves-read-different-reasons',
    path: 'src/all.js',
    old: '        const bb = (b.outsideBand || b.aboveSizeCeiling || b.thinReviews || b.listingRisk) ? 1 : 0;',
    new: '        const bb = (b.outsideBand || b.aboveSizeCeiling || b.thinReviews) ? 1 : 0;',
    prove: 'boot',
    mustPrint: /two halves of the demotion comparator read different lists of reasons/,
  },
  {
    // Google's own verdict stops feeding the one flag every gate asks, so a
    // flagged listing takes a per-category cap slot and a queue position.
    name: '143a-b-googles-own-verdict-leaves-the-one-demotion-flag',
    path: 'src/all.js',
    old: '        const _demoted = _outsideBand || _tooBig || _underFloor || _risk.demote;',
    new: '        const _demoted = _outsideBand || _tooBig || _underFloor;',
    prove: 'boot',
    mustPrint: /the listing demote does not feed the press/,
  },
  {
    // Counted in the loop, printed on its own line, and never assigned to the
    // tally the report reads: a run that deleted seven listings reported one.
    name: '143a-c-the-listing-risk-count-never-reaches-the-report',
    path: 'src/all.js',
    old: '    tally.skippedListingRisk = skippedListingRisk;',
    new: '    const _unusedRisk = skippedListingRisk;',
    prove: 'boot',
    mustPrint: /dropped as closed, moved or flagged by Google never reaches the yield report/,
  },
  {
    name: '143a-d-the-phone-collision-count-never-reaches-the-report',
    path: 'src/all.js',
    old: '    tally.skippedListingPhone = skippedListingPhone;',
    new: '    const _unusedPhone = skippedListingPhone;',
    prove: 'boot',
    mustPrint: /sharing a number with a differently-named business never reaches the yield report/,
  },
  {
    // The rep's row describes TOO FEW reviews with the word the row beside it
    // uses for TOO MANY, so the sentence tells him the opposite of the
    // measurement. The exact collision the block's own comment records.
    name: '143a-e-the-thin-review-reason-reads-like-its-own-opposite',
    path: 'index.html',
    old: "    c.thinReviews ? (c.thinReviewNote || 'under the review count its trade needs') : '',",
    new: "    c.thinReviews ? (c.thinReviewNote || 'above the review count its trade needs') : '',",
    prove: 'clientcheck',
    mustPrint: /does not say it is UNDER the count/,
  },
];
