// Round 145 (Round B) falsification. Each entry reverts ONE fix against a green
// baseline and must turn its OWN named check red.
//
// Two of these exist because the checks they trip were themselves written this
// round to close a check-that-cannot-fail: the draw-order fixture passed over
// the new website tier without reaching it, and servercheck graded no website
// at all because its cast had no bad website in it.
module.exports = [
  {
    // The whole round: the press looks at the homepage. Without the call, every
    // lead reaches the queue with no verdict, exactly as before Round B.
    name: '145-a-the-press-stops-looking-at-the-website',
    path: 'src/all.js',
    old: '    const _siteRead = await pressSiteLooks(unique.slice(0, FIND_PRESS_SITE_MAX));',
    new: '    const _siteRead = { considered: 0, graded: 0, dated: 0, bad: 0, clean: 0, refused: 0, notReached: 0, noWebsite: 0 };',
    prove: 'boot',
    mustPrint: /the press no longer looks at a single website/,
  },
  {
    // A verdict nobody measured moving the draw is the unmeasured-treated-as-
    // measured class: a site that refused a read, or one the clock never
    // reached, would be promoted as though somebody had looked at it.
    name: '145-b-an-unmeasured-verdict-moves-the-draw-order',
    path: 'src/all.js',
    old: '  const _m = (x.contactSiteLooksMeasured === true) || (x.siteLooksMeasured === true);\n  if (!_m) return 0;',
    new: '  const _m = true;\n  if (!_m) return 0;',
    prove: 'boot',
    mustPrint: /a site that refused a free read is ranked|an UNMEASURED bad verdict moves the draw/,
  },
  {
    // The press's markup-only guess outranking the contact read that actually
    // looked at the page - so a lead somebody read and found fine gets promoted
    // to the top of the rep's list as a bad website.
    name: '145-c-the-press-guess-outranks-the-read-that-saw-the-page',
    path: 'src/all.js',
    old: "  const v = String(x.contactSiteLooks || x.siteLooks || '').toLowerCase();",
    new: "  const v = String(x.siteLooks || x.contactSiteLooks || '').toLowerCase();",
    prove: 'boot',
    mustPrint: /outranking the contact read that actually looked at the page/,
  },
  {
    // A good website becoming a penalty. The website gap at the contact read is
    // a LIFT for exactly this reason and the press term has to match it.
    name: '145-d-a-tidy-website-becomes-a-penalty',
    path: 'src/all.js',
    old: "    if (m.siteLooks === 'bad') base += TRIAGE_SITE_BAD;\n    else if (m.siteLooks === 'dated') base += TRIAGE_SITE_DATED;",
    new: "    if (m.siteLooks === 'bad') base += TRIAGE_SITE_BAD;\n    else if (m.siteLooks === 'dated') base += TRIAGE_SITE_DATED;\n    else base -= TRIAGE_SITE_DATED;",
    prove: 'boot',
    mustPrint: /a good website has become a penalty/,
  },
  {
    // The verdict computed at the press and dropped before the row - the
    // computed-but-not-passed class, which this file records more than any
    // other and which Round 144 shipped twice.
    name: '145-e-the-verdict-never-reaches-the-queue-row',
    path: 'src/all.js',
    old: '        c.siteLooksMeasured = _saw.measured === true;',
    new: '        c.siteLooksMeasuredUnused = _saw.measured === true;',
    prove: 'boot',
    mustPrint: /drops whether it MEASURED anything/,
  },
];
