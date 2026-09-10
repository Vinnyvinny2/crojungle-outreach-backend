// ════════════════════════════════════════════════════════════════════════════
// ROUND 132 — the falsifications, for `node falsify.js docs/history/round-132-reverts.js`.
//
// The round the sheet stopped naming things that are not people. Each entry undoes
// ONE guard's premise against a baseline proven green, naming the proof that must go
// red ON THAT GUARD'S OWN LINE:
//
//   132-a-*  a trade noun is not a surname, and a bare title's name is the line BELOW
//   132-b-*  a question does not print
//   132-c-*  "could not ask" is not "none"
//
// Shapes falsify.js reads: { name, path, old, new, prove } — `old` must occur EXACTLY
// once in the ORIGINAL file, or the run says NO VERDICT. mustPrint is the guard's own
// line; red WITHOUT it is red for the wrong reason and does not match.
// ════════════════════════════════════════════════════════════════════════════
module.exports = [
  // ── PART A: the sheet stops naming things that are not people ───────────

  // (A-1) the surname slot forgets the trade nouns again. This is the live
  // defect exactly: "Functional Finished Basements" back as a person, on the
  // lead that sorted FIRST.
  { name: '132-a-trade-noun-back-in-the-surname-slot', path: 'src/all.js', prove: 'boot',
    old: "|corporation|basement|basements|remodel|remodels|",
    new: "|corporation|remodel|remodels|",
    mustPrint: /still reads as a person, so a company's own strapline can be the name a rep dials for/ },

  // (A-2) the other direction, and the one that costs leads rather than trust:
  // the tail list widens onto a word that is a real surname. "Law" is the
  // recorded example - the code says so where the list is declared.
  { name: '132-a-tail-widens-onto-a-real-surname', path: 'src/all.js', prove: 'boot',
    old: "|mechanical|electrical|hvac)$/i;",
    new: "|mechanical|electrical|hvac|law|wells|pool|waters|tree|care)$/i;",
    mustPrint: /a filter tightened until it eats real names is the expensive failure/ },

  // (A-3) the parser goes back to looking only at the line ABOVE a title, which
  // is what put the strapline on the sheet while the real owner sat one line
  // below it and free.
  { name: '132-a-title-first-pass-deleted', path: 'src/all.js', prove: 'boot',
    old: "      if (!t || titleKind(t) !== 'owner' || !looksLikeJobTitle(t)) continue;\n      const _p = personFromRun(runs[i + 1], companyName);\n",
    new: "      if (!t || titleKind(t) !== 'owner' || !looksLikeJobTitle(t)) continue;\n      const _p = null;\n",
    mustPrint: /their own page lists "owner" directly above Colby Lindsey and the roster settles on/ },

  // (A-4) the name below a title stops being validated, so a section heading
  // under the word "owner" becomes a person. This is the looseness the mononym
  // pass beside it was bounded four ways to avoid.
  { name: '132-a-line-below-not-validated', path: 'src/all.js', prove: 'boot',
    old: "      if (!_p || !looksLikeRealName(_p.name) || allRoleWords(_p.name) || FIND_ROLE_NOUN.test(_p.name)) continue;\n",
    new: "      if (!_p) continue;\n",
    mustPrint: /the line directly below an ownership title is taken as the person without being validated/ },

  // (A-5) the fix for the title-first layout costs the ordinary one. Every other
  // roster on the run is name-then-title, so this is the expensive direction.
  { name: '132-a-ordinary-roster-broken', path: 'src/all.js', prove: 'boot',
    old: "  if (!out.some(r => r.isOwner)) {\n    for (let i = 0; i < runs.length - 1; i++) {\n      const t = String(runs[i] || '').trim();\n",
    new: "  if (true) {\n    for (let i = 0; i < runs.length - 1; i++) {\n      const t = String(runs[i] || '').trim();\n",
    mustPrint: /the title-first pass runs on a page that already named an owner and invents a second one/ },

  // ── PART B: a question does not print ───────────────────────────────────

  // (B-1) the latch is gone and settled() prints once per ASK again - the live
  // double EPONYMOUS line on Craig, Kelley and Faultless.
  { name: '132-b-settle-latch-removed', path: 'src/all.js', prove: 'boot',
    old: "  let _settleSaid = false;\n",
    new: "  let _settleSaidUnused = false;\n",
    mustPrint: /the once-latch is gone, so the settle sentence prints once per ASK again/ },

  // (B-2) the eponymous sentence specifically comes back out from behind the
  // latch. That is the line that actually printed twice.
  { name: '132-b-eponymous-sentence-unlatched', path: 'src/all.js', prove: 'boot',
    old: "    if (!_settleSaid && eponymousConfident && !(corroborated || ownSiteConfident || rosterConfident)) {\n      _settleSaid = true;\n",
    new: "    if (eponymousConfident && !(corroborated || ownSiteConfident || rosterConfident)) {\n",
    mustPrint: /the EPONYMOUS sentence is no longer behind the latch/ },

  // (B-3) the roster sentence, which has the same shape and the same fault and
  // would otherwise be fixed by accident rather than on purpose.
  { name: '132-b-roster-sentence-unlatched', path: 'src/all.js', prove: 'boot',
    old: "    if (!_settleSaid && rosterConfident && !(corroborated || ownSiteConfident)) {\n      _settleSaid = true;\n      console.log",
    new: "    if (rosterConfident && !(corroborated || ownSiteConfident)) {\n      console.log",
    mustPrint: /the ROSTER SETTLES IT sentence is no longer behind the latch/ },

  // (B-4) the latch is set on ENTRY instead of at the print. Cheaper-looking and
  // strictly worse: a lead that settles on a later ask than the first then says
  // nothing at all, which is a silent loss rather than a visible duplicate.
  { name: '132-b-latch-set-on-entry-not-at-the-print', path: 'src/all.js', prove: 'boot',
    old: "    if (!_settleSaid && rosterConfident && !(corroborated || ownSiteConfident)) {\n      _settleSaid = true;\n",
    new: "    _settleSaid = true;\n    if (rosterConfident && !(corroborated || ownSiteConfident)) {\n",
    mustPrint: /the latch is set \d+ time\(s\) inside the settle sentences instead of 2/ },

  // ── PART C: "could not ask" is not "none" ───────────────────────────────

  // (C-1) the token stops leaving the server, so the client is back to having
  // only an English sentence to tell an outage from a refusal.
  { name: '132-c-lookup-token-never-reaches-the-row', path: 'src/all.js', prove: 'clientcheck',
    old: "    contactEmailLookupBlocked: em.lookupBlocked || '',\n",
    new: "",
    mustPrint: /the server stops sending the token that says the address lookup was unavailable/ },

  // (C-2) the client goes back to calling an outage an absence. This is the row
  // Bellwether got while its own log line said the opposite.
  { name: '132-c-outage-called-none-again', path: 'index.html', prove: 'clientcheck',
    old: "  if (!c || !c.contactEmail) return emailLookupUnavailable(c) ? 'unreadable' : 'none';\n",
    new: "  if (!c || !c.contactEmail) return 'none';\n",
    mustPrint: /which claims an absence about a question we never got to ask/ },

  // (C-3) the chip disappears, so the rows exist in a bucket nothing on the
  // screen counts and the numbers stop adding up.
  { name: '132-c-could-not-check-chip-dropped', path: 'index.html', prove: 'clientcheck',
    old: "chipEl('unreadable', 'Could not check', counts.unreadable), ",
    new: "",
    mustPrint: /the five buckets are no longer together with All after them/ },

  // (C-4) the widening direction: a lead the buying floor deliberately held back
  // has no address either, and it belongs in "none" - we could have asked and
  // chose not to. Reading the block-reason SENTENCE instead of the supplier
  // token is what would put it in the wrong bucket.
  { name: '132-c-refusal-counted-as-an-outage', path: 'index.html', prove: 'clientcheck',
    old: "  && (c.contactEmailVerifierDown === true || !!String(c.contactEmailLookupBlocked || ''));\n",
    new: "  && (c.contactEmailVerifierDown === true || !!String(c.contactEmailBlockReason || ''));\n",
    mustPrint: /is filed as an outage - we could have asked and chose not to/ },

  // (C-5) the two tokens stop being persisted on a promoted lead, so a row that
  // was honest in Find goes back to saying "none found" in the pipeline.
  { name: '132-c-tokens-not-persisted-on-promotion', path: 'index.html', prove: 'clientcheck',
    old: "      contactEmailVerifierDown: company.contactEmailVerifierDown === true,\n      contactEmailLookupBlocked: company.contactEmailLookupBlocked || '',\n",
    new: "",
    mustPrint: /are dropped on promotion, so a row that honestly said "could not check" in Find/ },

  // (C-6) the handshake number does not move on a round that changed
  // index.html, which is the only staleness signal there is (ruling since §104).
  { name: '132-c-contract-not-bumped', path: 'src/all.js', prove: 'clientcheck',
    old: "const CONTRACT_VERSION = 20261012;",
    new: "const CONTRACT_VERSION = 20261011;",
    mustPrint: /the handshake constants differ in the repo/ },
];
