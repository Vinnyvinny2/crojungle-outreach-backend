// Round 143B falsification. Each entry reverts ONE fix against a green baseline
// and must turn its OWN named check red. The round moved the free page read to
// the PRESS, so most of these are wires: a thing measured for nothing and then
// read by nobody is the class this repo records more than any other, and the
// free read creates ten new places for it to happen.
//
//   node falsify.js docs/history/round-143b-reverts.js
module.exports = [
  {
    // The whole round: the press stops reading their pages, so every website
    // verdict waits for the paid contact read again and nothing orders it.
    name: '143b-a-the-press-reads-nothing',
    path: 'src/all.js',
    old: '    _pressRead = await pressSiteRead(_toRead, {});',
    new: '    _pressRead = await pressSiteRead([], {});',
    prove: 'boot',
    mustPrint: /the press no longer reads a single page for free/,
  },
  {
    // Three pages a business, not twenty. FIND_MAX_FREE_PAGES is right for ONE
    // lead and is six thousand fetches at a press over three hundred.
    name: '143b-b-the-three-page-bound-goes-back-to-twenty',
    path: 'src/all.js',
    old: 'const FIND_PRESS_MAX_PAGES = 3;',
    new: 'const FIND_PRESS_MAX_PAGES = 20;',
    prove: 'boot',
    mustPrint: /page\(s\) where the bound is/,
  },
  {
    // Computed-but-not-passed, in its purest form: the verdict exists and
    // never lands on the lead, so nothing can persist, order or score by it.
    name: '143b-c-the-verdict-never-lands-on-the-lead',
    path: 'src/all.js',
    old: '      lead.pressSite = v;',
    new: '      const _unusedVerdict = v;',
    prove: 'boot',
    mustPrint: /the verdict is computed and never put on the lead/,
  },
  {
    // §42: one unknown key and PostgREST refuses the WHOLE row, so a press
    // that runs before the ALTER loses every lead in it rather than a column.
    name: '143b-d-the-column-is-written-without-asking-whether-it-exists',
    path: 'src/all.js',
    old: "  if (sbColumnReady('discovered_queue', 'site_verdict')) {",
    new: '  if (true) {',
    prove: 'boot',
    mustPrint: /the verdict column is written before the boot probe has seen it answer/,
  },
  {
    // The paid reads go back to being ordered by a guess off the business
    // NAME, which is what reach_predict is.
    name: '143b-e-the-queue-stops-drawing-by-what-the-free-read-found',
    path: 'src/all.js',
    old: '  || (pressDrawRank(queueSiteVerdict(b)) - pressDrawRank(queueSiteVerdict(a)))',
    new: '  || 0',
    prove: 'boot',
    mustPrint: /must be worked before one that merely has a promising NAME/,
  },
  {
    // The no-website leads stop being a list of their own and are mixed back
    // in with the businesses that have a site to critique.
    name: '143b-f-the-no-website-leads-are-mixed-back-in',
    path: 'src/all.js',
    old: '  || (queueHasSite(b) - queueHasSite(a))',
    new: '  || 0',
    prove: 'boot',
    mustPrint: /is mixed in rather than drawn as its own list/,
  },
  {
    // Round 142 built the visual verdict and handed it to nobody. This is the
    // wire that ends that, and without it the score reads the technical grade
    // while the row reads the visual one.
    name: '143b-g-the-visual-verdict-never-reaches-the-score',
    path: 'src/all.js',
    old: "  signals.siteLooks = (out.site && SITE_LOOKS_WORDS.indexOf(out.site.looks) >= 0) ? out.site.looks : 'unknown';",
    new: "  const _unusedLooks = (out.site && SITE_LOOKS_WORDS.indexOf(out.site.looks) >= 0) ? out.site.looks : 'unknown';",
    prove: 'boot',
    mustPrint: /the visual verdict never reaches the Fit score/,
  },
  {
    // The lift stops reading what a VISITOR meets and falls back to the
    // technical grade, which is more than half invisible faults.
    name: '143b-h-the-lift-reads-the-technical-grade-again',
    path: 'src/all.js',
    old: '  if (d.siteLooksMeasured === true && SITE_LOOKS_WORDS.indexOf(String(d.siteLooks)) >= 0) {',
    new: '  if (false && SITE_LOOKS_WORDS.indexOf(String(d.siteLooks)) >= 0) {',
    prove: 'boot',
    mustPrint: /is worth no more to us than a slightly dated one/,
  },
  {
    // The contact read goes back to buying a picture of a homepage whose
    // visible faults are already on the row - a paid confirmation.
    name: '143b-i-the-read-re-buys-what-the-press-already-answered',
    path: 'src/all.js',
    old: "      pressLooks: (company && company.pressSite && company.pressSite.looksMeasured === true) ? company.pressSite.looks : '' });",
    new: "      pressLooks: '' });",
    prove: 'boot',
    mustPrint: /the contact read stopped asking what the press already found/,
  },
  {
    // Built and wired to nothing - the shape LISTING RISK WIRING was written
    // to catch in the round before this one.
    name: '143b-j-the-tracking-collision-rule-is-called-by-nothing',
    path: 'src/all.js',
    old: '      const _tagColl = detectAnalyticsCollisions([...out, ...benched, ..._priorForTag]);',
    new: '      const _tagColl = detectAnalyticsCollisions([]);',
    prove: 'boot',
    mustPrint: /the tracking-collision rule is built and called by nothing inside the press/,
  },
  {
    // The demotion never reaches the sort, so a business whose own site never
    // names it ranks as though nothing were odd about it.
    name: '143b-k-the-name-not-on-site-mark-never-reaches-the-lead',
    path: 'src/all.js',
    old: '      lead.nameNotOnSite = v.nameOnSite === false;',
    new: '      lead.nameNotOnSite = false;',
    prove: 'boot',
    mustPrint: /is not marked, so the demotion this round adds can never reach the sort/,
  },
  {
    // A comparator is two reads of one rule. The half that forgets a reason
    // sorts that demotion FIRST whenever it happens to arrive early.
    name: '143b-l-the-comparator-halves-read-different-reasons-again',
    path: 'src/all.js',
    old: '        const bb = (b.outsideBand || b.aboveSizeCeiling || b.thinReviews || b.listingRisk || b.nameNotOnSite) ? 1 : 0;',
    new: '        const bb = (b.outsideBand || b.aboveSizeCeiling || b.thinReviews || b.listingRisk) ? 1 : 0;',
    prove: 'boot',
    mustPrint: /two halves of the demotion comparator read different lists of reasons/,
  },
  {
    // An absence needs readable text. Without the floor, a page with almost
    // nothing on it DEMOTES a real business for our own blindness.
    name: '143b-m-an-absence-is-claimed-off-a-page-nobody-could-read',
    path: 'src/all.js',
    old: '  out.nameOnSite = (corpus.length >= FIND_ABSENCE_TEXT_FLOOR && own.length) ? own.some(w => corpus.indexOf(w) >= 0) : null;',
    new: '  out.nameOnSite = (corpus.length >= 0 && own.length) ? own.some(w => corpus.indexOf(w) >= 0) : null;',
    prove: 'boot',
    mustPrint: /the honest answer is that we did not look hard enough/,
  },
  {
    // The pool stops being polite per host, so a small shared box meets eight
    // of our requests at once - which is how a crawler gets blocked.
    name: '143b-n-the-pool-stops-being-polite-per-host',
    path: 'src/all.js',
    old: '  const at = Math.max(now, (Number(_pressHostAt.get(host)) || 0) + gap);',
    new: '  const at = now;',
    prove: 'boot',
    mustPrint: /two requests to ONE host go out together/,
  },
  {
    // The counter that never reaches the tally: the run prints its own lines
    // and then adds itself up as though the read never happened.
    name: '143b-o-the-free-read-never-reaches-the-yield-report',
    path: 'src/all.js',
    old: '    tally.freeRead = _pressRead;',
    new: '    const _unusedFreeRead = _pressRead;',
    prove: 'boot',
    mustPrint: /what the free read found never reaches the yield report/,
  },
  {
    // The no-website mark, without which the separate call list cannot exist
    // anywhere downstream.
    name: '143b-p-the-no-website-mark-never-reaches-the-lead',
    path: 'src/all.js',
    old: '      lead.noWebsite = v.noWebsite === true;',
    new: '      lead.noWebsite = false;',
    prove: 'boot',
    mustPrint: /the no-website mark never reaches the lead/,
  },
  {
    // Number(null) is 0 and 0 is finite: a page stating NO founding year comes
    // back as a business founded this year, stamped "their own pages", and the
    // registry fallback under it is unreachable on every lead in the system.
    // Found by the servercheck harness on the one cast site built to say
    // nothing about its age, not by reading the line.
    name: '143b-q-a-page-with-no-founding-year-dates-the-business-anyway',
    path: 'src/all.js',
    old: "  const yrs = (typeof signals.yearsInBusiness === 'number') ? signals.yearsInBusiness : NaN;",
    new: '  const yrs = Number(signals.yearsInBusiness);',
    prove: 'boot',
    mustPrint: /Number\(null\) is 0 and 0 is finite/,
  },
  {
    // A last-changed date read as a registration date: a domain registered in
    // 1998 and edited last week reports as a business founded last week.
    name: '143b-r-the-registry-parse-reads-any-event-as-the-registration',
    path: 'src/all.js',
    old: "  const reg = ev.find(e => e && String(e.eventAction || '').toLowerCase() === 'registration');",
    new: "  const reg = ev.find(e => e && String(e.eventAction || '').toLowerCase().length > 0);",
    prove: 'boot',
    mustPrint: /the last time somebody edited it is read as the registration date/,
  },
];
