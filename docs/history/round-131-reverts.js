// ════════════════════════════════════════════════════════════════════════════
// ROUND 131 — the falsifications, for `node falsify.js docs/history/round-131-reverts.js`.
//
// The round a guess stopped outranking the truth. Each entry undoes ONE guard's
// premise against a baseline proven green, naming the proof that must go red ON THAT
// GUARD'S OWN LINE:
//
//   131-a-*  a grade-D name scores lower and builds no address; the eponymous
//            sentence says which evidence it actually saw
//   131-b-*  no sentence ships that the owner could disprove by opening his own site
//   131-c-*  every export opens on the same 23 columns; an already-exported lead is
//            withheld
//
// Shapes falsify.js reads: { name, path, old, new, prove } — `old` must occur EXACTLY
// once in the ORIGINAL file, or the run says NO VERDICT. mustPrint is the guard's own
// line; red WITHOUT it is red for the wrong reason and does not match.
// ════════════════════════════════════════════════════════════════════════════
module.exports = [
  // ── PART A: a guess stops outranking the truth ──────────────────────────
  // ── 131-a1: THE GRADE REACHES THE SCORE ─────────────────────────────────

  // (A1-1) the wire. The grade is computed on every owner and the score never
  // saw it, which is this repo's most-recorded class: computed but not passed.
  { name: '131-a1-grade-never-reaches-the-score', path: 'src/all.js', prove: 'boot',
    old: "  signals.ownerGrade = (out.owner && out.owner.grade) || '';\n",
    new: "  signals.ownerGrade = '';\n",
    mustPrint: /the contact read no longer carries the owner GRADE into the score/ },

  // (A1-2) the call site itself, so a rename cannot leave the term reading a
  // field nothing writes.
  { name: '131-a1-wire-renamed-out-of-existence', path: 'src/all.js', prove: 'boot',
    old: "  signals.ownerGrade = (out.owner && out.owner.grade)",
    new: "  signals.ownerGradeX = (out.owner && out.owner.grade)",
    mustPrint: /the contact read no longer carries the owner GRADE into the score/ },

  // (A1-3) the reach term stops reading the grade, so a held-back name falls
  // back into the two lines written about a lead where NOBODY could be named -
  // which is both a wrong sentence and, after the address rule below, the same
  // 1 point a read that produced nothing at all scores.
  { name: '131-a1-reach-stops-reading-the-grade', path: 'src/all.js', prove: 'boot',
    old: "      if (s.ownerGrade === 'unconfirmed') {\n",
    new: "      if (s.ownerGrade === 'never') {\n",
    mustPrint: /the reach term no longer reads the grade/ },

  // (A1-4) the number stops moving. 3 rounds to the same FIT as the 4 this lead
  // scored while a pattern address was still being built for it, so the row
  // sorts exactly where it did and the ruling is invisible to the rep.
  { name: '131-a1-demotion-rounds-away', path: 'src/all.js', prove: 'boot',
    old: "        return { points: 2, say: 'a name the rep can ask for, but the buying floor held it back, so no address is built from it' };\n",
    new: "        return { points: 3, say: 'a name the rep can ask for, but the buying floor held it back, so no address is built from it' };\n",
    mustPrint: /a lead whose only name the buying floor held back scores 3 on the reach term instead of 2/ },

  // (A1-5) the other direction, and the one Vin ruled against explicitly: the
  // grade test widens off 'unconfirmed' onto every name that is not confirmed.
  // The lane it reaches from HERE is the no-owner one - grade 'none' is truthy
  // and not confirmed - so a lead we found nobody on is demoted like a name the
  // floor held back, and having looked stops being worth anything.
  { name: '131-a1-grade-test-widens-onto-the-no-owner-lane', path: 'src/all.js', prove: 'boot',
    old: "      if (s.ownerGrade === 'unconfirmed') {\n        // A published or SMTP-confirmed address",
    new: "      if (s.ownerGrade && s.ownerGrade !== 'confirmed') {\n        // A published or SMTP-confirmed address",
    mustPrint: /a lead with no owner at all now scores differently because of the grade/ },

  // (A1-5b) the same widening aimed at the lane it CAN reach. An eponymous
  // owner clears the buying floor, so canBuy is true and the three branches
  // above the grade test return before it - the eponymous lane cannot be
  // demoted from there at all. It can be demoted HERE, which is the branch an
  // eponymous lead with a pattern address actually takes, and Vin's ruling
  // that grade C does not move is only guarded if this goes red.
  { name: '131-a1-eponymous-lane-docked-for-the-grade', path: 'src/all.js', prove: 'boot',
    old: "      if (s.ownerCanBuy === true && anyAddr) return { points: 10,",
    new: "      if (s.ownerCanBuy === true && anyAddr) return { points: s.ownerGrade === 'confirmed' ? 10 : 6,",
    mustPrint: /an eponymous owner now scores differently because of the grade/ },

  // (A1-6) a published address is docked for a doubt about the name, which
  // charges a measurement of their own site for something it has nothing to do
  // with. The blunt version of the same ruling.
  { name: '131-a1-published-address-docked-for-the-name', path: 'src/all.js', prove: 'boot',
    old: "        if (solid) return { points: 8, say: 'a published or mailbox-confirmed address, and a name to ask for that the buying floor held back' };\n",
    new: "        if (solid) return { points: 2, say: 'a published or mailbox-confirmed address, and a name to ask for that the buying floor held back' };\n",
    mustPrint: /an address published on their own site is being docked because the owner name was held back/ },

  // (A1-7) the founder term takes the grade after all. On a readable lead it
  // already measures a held-back name at its floor, so the only leads this can
  // reach are ones whose pages we could not read - and there it claims who runs
  // the place off a page nobody looked at.
  { name: '131-a1-founder-scores-an-unreadable-page', path: 'src/all.js', prove: 'boot',
    old: "      const known = [s.ownerNamedOnSite, s.founderPhrase, s.ownerAnswersReviews].some(v => v !== null && v !== undefined);\n      if (!known) return null;\n",
    new: "      const known = [s.ownerNamedOnSite, s.founderPhrase, s.ownerAnswersReviews].some(v => v !== null && v !== undefined);\n      if (!known) return s.ownerGrade === 'unconfirmed' ? { points: 3, say: 'nothing here says the owner runs the place' } : null;\n",
    mustPrint: /the founder term now scores a held-back name on a site we could not read/ },

  // ── 131-a2: A HELD-BACK NAME BUILDS NO ADDRESS ──────────────────────────
  // This part REVERSES Round 129's p3-c on Vin's ruling. The reverts below
  // restore Round 129's answer and must go red.

  // (A2-1) Round 129's answer, restored: the address is kept and marked instead
  // of not being built. That is the mailbox invented for a person nobody
  // vouched for, back on the row.
  { name: '131-a2-guard-marks-instead-of-refusing', path: 'src/all.js', prove: 'boot',
    old: "  return { email: '', ...EMAIL_TIERS.NONE, name: r.name || '', pattern: null,\n    lookupBlocked: r.lookupBlocked || null,\n",
    new: "  return { ...r, verifyToSend: true, name: r.name || '', pattern: r.pattern || null,\n    lookupBlocked: r.lookupBlocked || null,\n",
    mustPrint: /a tier-3 address constructed from a held-back name is still on the row/ },

  // (A2-2) the tier-4 exemption comes back: a guess that was already not
  // sendable rides the row as this person's address, which is the half of the
  // ruling that is about what the REP is shown rather than about sending.
  { name: '131-a2-unsendable-guess-still-shown', path: 'src/all.js', prove: 'boot',
    old: "  if (r.smtpVerified === true) return r;       // proven by the mailbox itself\n",
    new: "  if (r.smtpVerified === true) return r;       // proven by the mailbox itself\n  if (r.sendable !== true) return r;\n",
    mustPrint: /an unsendable tier-4 guess still rides the row as this person address/ },

  // (A2-3) the refusal takes the NAME with it. Vin ruled the name still appears
  // on the sheet: only the address and the score change, and owner_confidence
  // carries the doubt.
  { name: '131-a2-refusal-eats-the-name', path: 'src/all.js', prove: 'boot',
    old: "  return { email: '', ...EMAIL_TIERS.NONE, name: r.name || '', pattern: null,",
    new: "  return { email: '', ...EMAIL_TIERS.NONE, name: '', pattern: null,",
    mustPrint: /the tier-3 refusal took the NAME off the row as well/ },

  // (A2-4) the guard widens onto a measurement: a published address, read off
  // their own site, deleted because of a doubt about a name it never came from.
  { name: '131-a2-guard-widens-onto-a-published-address', path: 'src/all.js', prove: 'boot',
    old: "  if (!(_tier >= 3)) return r;                 // T1/T2 are measurements, not guesses\n",
    new: "  if (!(_tier >= 1)) return r;\n",
    mustPrint: /a published address is being deleted because the owner name was held back/ },

  // (A2-5) the row stops reading as an ordinary no-address lead, so the card,
  // the CSV and the sheet need a second vocabulary for one fact.
  { name: '131-a2-second-vocabulary-for-no-address', path: 'src/all.js', prove: 'boot',
    old: "  return { email: '', ...EMAIL_TIERS.NONE, name: r.name || '', pattern: null,\n    lookupBlocked: r.lookupBlocked || null,\n    blockReason:",
    new: "  return { email: '', tier: null, score: 0, sendable: false, label: '', name: r.name || '', pattern: null,\n    lookupBlocked: r.lookupBlocked || null,\n    blockReason:",
    mustPrint: /does not read as an ordinary no-address lead/ },

  // (A2-6) the row carries no reason at all, so a rep reading "no address" on a
  // lead we DID find a person on cannot tell whether we looked.
  { name: '131-a2-refusal-carries-no-reason', path: 'src/all.js', prove: 'boot',
    old: "    blockReason: `no address was built: ${r.name || 'the only name we found'} was held back by the authority gate, and a mailbox is never constructed out of a person nobody vouched for` };\n",
    new: "    blockReason: '' };\n",
    mustPrint: /carries no reason on the row/ },

  // ── 131-a3: THE EPONYMOUS SENTENCE ──────────────────────────────────────

  // (A3-1) the site-copy test goes back to the haystack that made the claim
  // untrue: with the company name concatenated it passes on a name that appears
  // nowhere in their copy, and the sentence then offers that same business name
  // back as the corroboration.
  { name: '131-a3-copy-test-takes-the-company-name-back', path: 'src/all.js', prove: 'boot',
    old: "      const _epoInCopy = nameCorroborated(ranked.name, '', _epoCopy);\n",
    new: "      const _epoInCopy = nameCorroborated(ranked.name, companyName, _epoCopy);\n",
    mustPrint: /the eponymous line no longer asks whether their own site copy names the person/ },

  // (A3-2) the answer is computed and thrown away, so the sentence says the
  // same thing on every lead again - computed but not passed, on the one line
  // that explains where a decision-maker came from.
  { name: '131-a3-answer-computed-and-discarded', path: 'src/all.js', prove: 'boot',
    old: "the business is named after ${ranked.name}, and ${_epoInCopy\n        ? 'their site copy names them as well",
    new: "the business is named after ${ranked.name}, and ${true\n        ? 'their site copy names them as well",
    mustPrint: /the eponymous line no longer prints what the copy test found/ },

  // (A3-3) the corpus the test reads collapses to nothing, so every eponymous
  // settle prints the weaker line and the check stops separating the two cases.
  { name: '131-a3-copy-corpus-emptied', path: 'src/all.js', prove: 'boot',
    old: "      const _epoCopy = [String(homepageContent || '')].concat(\n",
    new: "      const _epoCopy = [String('')].concat(\n",
    mustPrint: /the copy the eponymous test reads is no longer their homepage/ },

  // ── PART B: no sentence a prospect could disprove ───────────────────────
  // ── B1: the form and phone claims, gated on markup a person could read ────
  // (b1a) the form gate goes back to the 12,000-character flag. The 926-char
  // Next build then reports "there is no enquiry form anywhere we read" again.
  // hasChat is left in place on purpose so this revert cannot be credited for
  // the chat guard as well — one case per guard (§106).
  { name: '131-b1a-form-gate-back-on-the-12000-char-floor', path: 'src/all.js', prove: 'boot',
    old: "    noForm: (homeMarkupRead && (contactRead || navRead)) ? !(hasForm || hasChat) : null,\n",
    new: "    noForm: (!jsOnly && (contactRead || navRead)) ? !(hasForm || hasChat) : null,\n",
    mustPrint: /a two-kilobyte React build is told there is no enquiry form anywhere we read/ },

  // (b1b) the same for the tap-to-call claim, which has its own gate and its
  // own sentence, so it needs its own revert.
  { name: '131-b1b-tap-to-call-gate-back-on-the-12000-char-floor', path: 'src/all.js', prove: 'boot',
    old: "    noClickToCall: (homeMarkupRead && navRead) ? !hasTel : null,\n",
    new: "    noClickToCall: (!jsOnly && navRead) ? !hasTel : null,\n",
    mustPrint: /a two-kilobyte React build is told its phone number is not tappable/ },

  // (b1c) the floor itself. At zero every page counts as readable, which is the
  // old behaviour stated a different way — the number is what is load-bearing.
  { name: '131-b1c-readable-markup-floor-drops-to-zero', path: 'src/all.js', prove: 'boot',
    old: "  const homeMarkupRead = rawReadableChars(homeHtml) >= 500;\n",
    new: "  const homeMarkupRead = rawReadableChars(homeHtml) >= 0;\n",
    mustPrint: /a two-kilobyte React build is told there is no enquiry form anywhere we read/ },

  // ── B2: a dated build nobody can see ──────────────────────────────────────
  // (b2a) the visible-marker requirement comes off, which is the live shape: a
  // maintained WordPress build charged "years out of date" on a keywords tag
  // and a plugin's jQuery, with agedSay empty.
  { name: '131-b2a-dated-build-fires-with-no-visible-evidence', path: 'src/all.js', prove: 'boot',
    old: "    datedBuild: !age.checked ? null\n      : age.dated !== true ? false\n      : (age.markers || []).some(m => m && m.visible === true) ? true : null,\n",
    new: "    datedBuild: age.checked ? age.dated === true : null,\n",
    mustPrint: /is told its build is years out of date on two markers nobody can see/ },

  // (b2b) and the other direction, because a gate that silences the TRUE
  // finding is the more expensive failure: the 2016 table-layout build must
  // still report a dated build.
  { name: '131-b2b-dated-build-never-fires-at-all', path: 'src/all.js', prove: 'boot',
    old: "    datedBuild: !age.checked ? null\n      : age.dated !== true ? false\n      : (age.markers || []).some(m => m && m.visible === true) ? true : null,\n",
    new: "    datedBuild: null,\n",
    mustPrint: /a genuine 2016 table-layout build no longer reports a dated build/ },

  // ── B3: a chat widget is a route in ───────────────────────────────────────
  // (b3a) the suppression comes off the call site. The detector stays, so this
  // revert proves the WIRE and not the list.
  { name: '131-b3a-chat-stops-clearing-the-form-fault', path: 'src/all.js', prove: 'boot',
    old: "    noForm: (homeMarkupRead && (contactRead || navRead)) ? !(hasForm || hasChat) : null,\n",
    new: "    noForm: (homeMarkupRead && (contactRead || navRead)) ? !hasForm : null,\n",
    mustPrint: /a site whose corner carries a live-chat bubble is told there is no enquiry form/ },

  // (b3b) and the detector goes dead with the call site intact — the other half
  // of the same guard, which a single revert could not tell apart.
  { name: '131-b3b-chat-detector-goes-dead', path: 'src/all.js', prove: 'boot',
    old: "  const hasChat = CHAT_SIGNATURES.test(allHtml);\n",
    new: "  const hasChat = false;\n",
    mustPrint: /a site whose corner carries a live-chat bubble is told there is no enquiry form/ },

  // ── B4: plain http is about where the request finished ────────────────────
  // (b4a) the claim goes back on the URL we were handed, which is the live
  // defect: a stored http:// address for a site that redirects to https.
  { name: '131-b4a-https-read-off-the-url-we-were-handed', path: 'src/all.js', prove: 'boot',
    old: "    isHttps: landed ? /^https:/i.test(landed) : undefined,\n",
    new: "    isHttps: /^https:/i.test(String((home && home.url) || website || '')),\n",
    mustPrint: /has us telling the owner his site is still on plain http/ },

  // (b4b) the plain fetch stops recording where it landed — measured and never
  // passed, the class this repo produces most.
  { name: '131-b4b-plain-fetch-stops-recording-where-it-landed', path: 'src/all.js', prove: 'boot',
    old: "    const finalUrl = landedUrl(url, r);\n",
    new: "    const finalUrl = '';\n",
    mustPrint: /the plain fetch no longer records the address it actually landed on/ },

  // (b4c) it is recorded and never travels with the home page, so the website
  // read cannot see it. Same class, one wire further on.
  { name: '131-b4c-landed-address-never-reaches-the-home-page', path: 'src/all.js', prove: 'boot',
    old: "      pages.push({ url: home.url, intent: 'home', html: home.html, text: home.text, finalUrl: home.finalUrl || '' });\n",
    new: "      pages.push({ url: home.url, intent: 'home', html: home.html, text: home.text });\n",
    mustPrint: /the landed address is measured and never travels with the home page/ },

  // (b4d) the host check comes out, so a request that finishes on somebody
  // else's server decides what we say about this business's site.
  { name: '131-b4d-landed-url-stops-checking-the-host', path: 'src/all.js', prove: 'boot',
    old: "    return (a && a === b) ? got : '';\n",
    new: "    return got;\n",
    mustPrint: /is taken as this business's own address/ },

  // ── B5: the mailto: harvest, and the rule about whose address it is ───────
  // (b5a) the owner's address lookup stops receiving the harvested targets.
  { name: '131-b5a-owner-lookup-loses-the-mailto-targets', path: 'src/all.js', prove: 'boot',
    old: "        freePages: pages.map(p => ({ url: p.url, text: p.text, intent: p.intent, mailtos: mailtoLinksFromHtml(p.html) })),\n        onAddressSource:",
    new: "        freePages: pages.map(p => ({ url: p.url, text: p.text, intent: p.intent })),\n        onAddressSource:",
    mustPrint: /of the two address lookups is handed the mailto: targets/ },

  // (b5b) and the marketing decision-maker's lookup, which is a separate call
  // site — half an edit ships without this one.
  { name: '131-b5b-marketing-lookup-loses-the-mailto-targets', path: 'src/all.js', prove: 'boot',
    old: "        industry: (company && company.industry) || '',\n        freePages: pages.map(p => ({ url: p.url, text: p.text, intent: p.intent, mailtos: mailtoLinksFromHtml(p.html) })),\n",
    new: "        industry: (company && company.industry) || '',\n        freePages: pages.map(p => ({ url: p.url, text: p.text, intent: p.intent })),\n",
    mustPrint: /of the two address lookups is handed the mailto: targets/ },

  // (b5c) the targets are harvested, carried, and thrown away at the free pass.
  { name: '131-b5c-mailto-targets-harvested-and-thrown-away', path: 'src/all.js', prove: 'boot',
    old: "    const _hrefs = (p && Array.isArray(p.mailtos)) ? p.mailtos : [];\n",
    new: "    const _hrefs = [];\n",
    mustPrint: /is still invisible to the free passes/ },

  // (b5d) the free pass stops being the STRICT pass, which is what keeps a
  // webdev's or a broker's inbox off a call sheet.
  { name: '131-b5d-free-pass-stops-being-the-strict-pass', path: 'src/all.js', prove: 'boot',
    old: "    const got = extract(String(body || '') + (_hrefs.length ? '\\n' + _hrefs.map(a => 'mailto:' + a).join('\\n') : ''), false);\n",
    new: "    const got = extract(String(body || '') + (_hrefs.length ? '\\n' + _hrefs.map(a => 'mailto:' + a).join('\\n') : ''), true);\n",
    mustPrint: /is taken as the business's own/ },

  // (b5e) the harvest stops decoding its target, so mailto:%20joe@ ships an
  // address that cannot exist and the bounce is charged to our sending domain.
  { name: '131-b5e-mailto-target-stops-being-decoded', path: 'src/all.js', prove: 'boot',
    old: "    const a = addressFromMailto(h.replace(/^href\\s*=\\s*[\"']\\s*/i, '').replace(/[\"']\\s*$/, '').trim());\n",
    new: "    const a = String(h).replace(/^href\\s*=\\s*[\"']\\s*/i, '').replace(/[\"']\\s*$/, '').trim().replace(/^mailto:/i, '').toLowerCase();\n",
    mustPrint: /the harvest keeps the URL-encoded space/ },

  // ── PART C: the export stops drifting ───────────────────────────────────
  // ── THE FIXED TWENTY-THREE ──────────────────────────────────────────────
  // (a) THE LIVE DEFECT. The prefix stops leading the file, so the layout goes
  // back to being whatever the filter happens to leave - which is what made a
  // lean file and a full file two different shapes.
  { name: '131-c-a-the-prefix-stops-leading-the-file', path: 'index.html', prove: 'clientcheck',
    old: "  const head = FIND_CSV_PREFIX.map(k => _byKey.get(k));\n",
    new: "  const head = [];\n",
    mustPrint: /the lean CSV does not open on the fixed 23 columns/ },

  // (b) the FULL file goes back to the declared table, so the tick box changes
  // the head of the file again - the exact defect, one toggle setting at a time.
  { name: '131-c-b-full-export-drops-the-prefix', path: 'index.html', prove: 'clientcheck',
    old: "const findCsvColumns = (full) => {\n  const _byKey = new Map(FIND_CSV_COLUMNS.map(c => [c[0], c]));\n",
    new: "const findCsvColumns = (full) => {\n  if (full === true) return FIND_CSV_COLUMNS;\n  const _byKey = new Map(FIND_CSV_COLUMNS.map(c => [c[0], c]));\n",
    mustPrint: /the full CSV does not open on the fixed 23 columns/ },

  // (c) the rating and the review count fall back out of the fixed set, which
  // is where they were before this round: full export only.
  { name: '131-c-c-rating-pair-leaves-the-fixed-set', path: 'index.html', prove: 'clientcheck',
    old: "  'rating', 'reviews', 'payingForAds', 'hiringMarketing',\n",
    new: "  'payingForAds', 'hiringMarketing',\n",
    mustPrint: /the fixed CSV prefix is 21 column\(s\), not 23/ },

  // ── THE COLUMNS THEMSELVES ──────────────────────────────────────────────
  // (d) the owner grade stops being empty when nobody was named. A "D" on a row
  // with no name reads as "we checked and he cannot sign" about a person the
  // file does not name - the absence claim PART 3 exists to refuse.
  { name: '131-c-d-owner-grade-prints-a-letter-with-no-name', path: 'index.html', prove: 'clientcheck',
    old: "const ownerGradeRating = (c) => (c && c.contactOwner && OWNER_GRADE_RATING[c.contactOwnerGrade]) || '';\n",
    new: "const ownerGradeRating = (c) => (c && OWNER_GRADE_RATING[c.contactOwnerGrade]) || '';\n",
    mustPrint: /a lead with nobody named exports owner_confidence/ },

  // (e) email_confidence goes back to being a sentence, which is what it was
  // and why it could not be sorted, filtered or scanned.
  { name: '131-c-e-email-confidence-back-to-a-sentence', path: 'index.html', prove: 'clientcheck',
    old: "    emailGrade: emailGradeRating(c),\n",
    new: "    emailGrade: (c.contactEmailLabel || 'unknown'),\n",
    mustPrint: /and should be the letter A - a sentence there is what Round 131 replaced/ },

  // (f) the city column carries Google's formattedAddress again - a street
  // address in a city slot, which is the fault Round 112 recorded on the server
  // side and this round finally shipped to the browser.
  { name: '131-c-f-city-column-carries-the-street', path: 'index.html', prove: 'clientcheck',
    old: "    cityState: cityStateCell(c),\n",
    new: "    cityState: c.location || '',\n",
    mustPrint: /and not the city parsed out of the street address/ },

  // (g) the trade the press searched them under stops reaching the file. It was
  // on the lead from discovery and the Research exporter read it for a year.
  { name: '131-c-g-trade-never-reaches-the-file', path: 'index.html', prove: 'clientcheck',
    old: "    trade: c.industry || c.category || '',\n",
    new: "    trade: '',\n",
    mustPrint: /the trade the press searched them under never reaches the rep file/ },

  // (h) we start filling in the rep's own columns. Anything we put there is a
  // claim nobody measured, in the one place he types what he knows.
  { name: '131-c-h-we-fill-in-the-reps-columns', path: 'index.html', prove: 'clientcheck',
    old: "    lastContact: '',\n    convoHad: '',\n",
    new: "    lastContact: today(),\n    convoHad: 'no',\n",
    mustPrint: /the rep column last_contact was filled in by us/ },

  // ── A ROW GOES OUT ONCE ─────────────────────────────────────────────────
  // (i) THE LIVE DEFECT. The stamp stops filtering, so a second press on one
  // batch hands the rep the same businesses again - which is what Round 128's
  // exported_at column watched happen without ever stopping it.
  { name: '131-c-i-export-stops-reading-its-own-stamp', path: 'index.html', prove: 'clientcheck',
    old: "  return { all, already, rows: again === true ? all : all.filter(c => !(c && c.exportedAt)) };\n",
    new: "  return { all, already, rows: all };\n",
    mustPrint: /a second CSV press on one batch still hands out 2 row\(s\)/ },

  // (j) the withheld rows stop naming the batch they went out in. A count with
  // no "where" reads as a bug in the file rather than as a judgement.
  { name: '131-c-j-withheld-rows-do-not-name-their-batch', path: 'index.html', prove: 'clientcheck',
    old: "    const b = c.batchId ? ('batch ' + String(c.batchId).slice(0, 8)) : 'an earlier batch';\n",
    new: "    const b = 'an earlier batch';\n",
    mustPrint: /the export does not say which batch the withheld rows went out in/ },

  // (k) the press stops going through the one splitter, so the rows in the file
  // and the number in the message become two different sets again - and the
  // call-lane filter comes off the press with it.
  { name: '131-c-k-export-bypasses-the-splitter', path: 'index.html', prove: 'clientcheck',
    old: "    const split = exportSplit(leads, csvAgain);\n    const rows = split.rows;\n",
    new: "    const split = { all: [], already: [], rows: (leads || []).filter(exportableContact) };\n    const rows = split.rows;\n",
    mustPrint: /the CSV export no longer goes through exportSplit/ },

  // ── THE HANDSHAKE ───────────────────────────────────────────────────────
  // (l) index.html changed and the contract number did not - the only staleness
  // signal there is, and the standing ruling since round 104.
  { name: '131-c-l-contract-not-bumped', path: 'index.html', prove: 'clientcheck',
    old: "const CLIENT_CONTRACT = 20261011;\n",
    new: "const CLIENT_CONTRACT = 20261010;\n",
    mustPrint: /the handshake constants differ in the repo/ },

  // ── THE GENERATED REFERENCE ─────────────────────────────────────────────
  // (m) the CSV reference goes back to TRANSCRIBING a declaration instead of
  // executing the chooser, so the one file somebody opens before editing the
  // columns can disagree with the file the app writes. Proven by the static
  // stage, which regenerates the reference and compares it (lint-skills
  // --check-refs), not by clientcheck.
  { name: '131-c-m-csv-reference-transcribes-instead-of-executing', path: 'docs/gen-refs.js', prove: 'static',
    old: "const lean = emitted.lean.map(c => c[0]);\n",
    new: "const lean = [...leanBlock[0].matchAll(/'([a-zA-Z]+)'/g)].map(m => m[1]);\n",
    mustPrint: /csv-columns\.md: differs from a fresh regeneration/ },
];
