// ════════════════════════════════════════════════════════════════════════════
// ROUND 129 — the falsifications, as reverts for `node falsify.js docs/history/round-129-reverts.js`.
//
// The round the contact list stopped being a phone list: a ten-lead live read on
// 2026-09-09 returned ten owner names, ten phone numbers and zero addresses the
// operator could send to. Four parts shipped in wave one, and each entry below undoes
// ONE of their guards' premises against a baseline proven green, naming the proof that
// must go red ON THAT GUARD'S OWN LINE (falsify.js's header is the contract):
//
//   129-p5-*  the batch card told the truth about how many leads can be sent to
//   p0-*      one name for the first-name mailbox (the dead '{first}' token)
//   p2-*      the published-address yield: the free read reaches a contact page
//   p4-*      the size lookup restricted to the leads a directory could answer
//
// The shapes falsify.js reads:
//   { name, path, old, new, prove }   a text edit; `old` must occur EXACTLY once in the
//                                     ORIGINAL file, or the run says NO VERDICT
//   mustPrint: '…' | /…/   the guard's own line. The colour comes from the exit code or the
//                          BOOT VERDICT; this says WHICH guard went red. A run that is red
//                          without printing it (a sibling refusal, one of the other checks)
//                          is red for the wrong reason and does not match.
//   rebuild: false    the source edit is NOT rebuilt into server.js (that omission is the defect)
//   expect: 'GREEN'   the proof is expected green — mustPrint is then the whole proof
//
// Anchors are written in UTF-8 here; falsify.js converts them to the file's bytes and keeps
// CRLF (server.js) and LF (src/, index.html) exactly. Every file is restored byte for byte,
// and the restore is verified (sha1 + git status) after every entry.
// Proofs used here: 'boot' (BOOT VERDICT), 'clientcheck' (node clientcheck.js by exit code).
//
// This file is read only by falsify.js: gen-refs reads server.js and index.html, lint-skills
// reads the skills and round-NNN.md, verify-split reads *.md. Nothing scans the literals below.
// ════════════════════════════════════════════════════════════════════════════
module.exports = [
  // (P5-1) the card's rule collapses back into the letter rule: a tier-3 address
  // the engine itself cleared counts as nothing, which is the live defect.
  { name: '129-p5-a-sendable-collapses-into-verified', path: 'src/all.js', prove: 'boot',
    old: "const emailSendableRow = (email, grade, sendable, tier) => !!email && String(sendable) === 'true';\n",
    new: "const emailSendableRow = (email, grade, sendable, tier) => emailVerifiedRow(email, grade, sendable, tier);\n",
    mustPrint: /a sendable tier-3 address counts as no email at all on the batch card/ },

  // (P5-2) the other direction: "verified" widened to swallow a guess, so
  // "confirmed" on the card stops meaning confirmed. Widened by GRADE, which is
  // the one shape the four older fixtures beside it cannot refuse.
  { name: '129-p5-b-verified-widened-onto-a-guess', path: 'src/all.js', prove: 'boot',
    old: "  && (EMAIL_GRADE_VERIFIED.includes(String(grade || '')) || (String(sendable) === 'true' && Number(tier) >= 1 && Number(tier) <= 2));\n",
    new: "  && (EMAIL_GRADE_VERIFIED.includes(String(grade || '')) || String(grade || '') === 'pattern_guess' || (String(sendable) === 'true' && Number(tier) >= 1 && Number(tier) <= 2));\n",
    mustPrint: /the verified rule has widened onto a tier-3 guess/ },

  // (P5-3) the fixture proves the FUNCTION; this proves the CALL SITE. The batch
  // route goes back to counting only the confirmed addresses.
  { name: '129-p5-c-batch-route-stops-counting-sendable', path: 'src/all.js', prove: 'boot',
    old: "    if (emailSendableRow(r.email, r.emailGrade, r.emailSendable, r.emailTier)) { b.sendableEmail += 1; if (!_ver) b.sendableOnly += 1; }\n",
    new: "    if (_ver) { b.sendableEmail += 1; }\n",
    mustPrint: /the batch route no longer counts the addresses the engine says we can send to/ },

  // (P5-4) held back is "we found an address and the engine refused it", not
  // "anything we did not confirm".
  { name: '129-p5-d-batch-route-stops-counting-held-back', path: 'src/all.js', prove: 'boot',
    old: "    if (emailHeldBackRow(r.email, r.emailGrade, r.emailSendable, r.emailTier)) b.heldBackEmail += 1;\n",
    new: "    if (!_ver) b.heldBackEmail += 1;\n",
    mustPrint: /the batch route no longer counts the addresses the engine refused/ },

  // (P5-5) the page's copy of the rule collapses into the letter rule, so the
  // review screen and the card become two different numbers again.
  { name: '129-p5-e-page-sendable-collapses-into-verified', path: 'index.html', prove: 'clientcheck',
    old: "const emailSendableOf = (c) => !!(c && c.contactEmail) && String(c.contactEmailSendable) === 'true';\n",
    new: "const emailSendableOf = (c) => emailStatusOf(c) === 'verified';\n",
    mustPrint: /a tier-3 address the engine itself marked sendable reads on the page as nothing to send to/ },

  // (P5-6) the bulk-move button back on the confirmed count — the button that
  // offered nothing on the live run.
  { name: '129-p5-f-move-button-back-on-the-confirmed-count', path: 'index.html', prove: 'clientcheck',
    old: "      (latest.sendableEmail > 0) ? btn('research', 'Move ' + latest.sendableEmail + ' to Research', () => moveSendableOfRun(latest.id), { disabled: busy === 'move' }) : null,\n",
    new: "      (latest.withEmail > 0) ? btn('research', 'Move ' + latest.withEmail + ' to Research', () => moveSendableOfRun(latest.id), { disabled: busy === 'move' }) : null,\n",
    mustPrint: /the Move-to-Research button counts only the confirmed addresses/ },

  // (P5-7) the card stops printing the sendable counter at all.
  { name: '129-p5-g-card-stops-printing-what-can-be-sent-to', path: 'index.html', prove: 'clientcheck',
    old: "            stats.withEmail + ' confirmed · ' + stats.sendableOnly + ' more we can send to · ' + stats.heldBack + ' held back')),\n",
    new: "            stats.withEmail + ' with email')),\n",
    mustPrint: /the batch card does not read the sendable counter/ },

  // (P5-8) the bulk move filters on the confirmed rule while the card counts the
  // sendable one, so the button moves fewer leads than the number on it.
  { name: '129-p5-h-bulk-move-filters-on-the-confirmed-rule', path: 'index.html', prove: 'clientcheck',
    old: "      const ids = (b.leads || []).map(companyFromBatchLead).filter(l => l && queueStateOf(l) === 'read' && emailSendableOf(l)).map(l => l.id);\n",
    new: "      const ids = (b.leads || []).map(companyFromBatchLead).filter(l => l && queueStateOf(l) === 'read' && emailStatusOf(l) === 'verified').map(l => l.id);\n",
    mustPrint: /the bulk move filters on the confirmed rule again/ },

  // (P5-9) the page's own card counters stop separating the three numbers.
  { name: '129-p5-i-card-stats-stop-counting-sendable', path: 'index.html', prove: 'clientcheck',
    // Re-aimed in Round 131: Part C moved the three-way split into batchBucketOf, so the
    // old compound line no longer exists. The premise is unchanged - stop counting what
    // can be sent to and the card is back to the binary the round was built to kill.
    old: "    if (st === 'read' && emailSendableOf(l)) s.sendable += 1;\n",
    new: "    if (st === 'read' && emailStatusOf(l) === 'verified') s.sendable += 1;\n",
    mustPrint: /the batch card does not count what can be sent to/ },

  // ── P0: one name for the first-name mailbox ──────────────────────────────
  // Each entry undoes ONE premise of PATTERN NAME CHECK and names the line only
  // that revert can turn red (check-writing-traps §4, §8: a fixture shared by two
  // guards leaves both looking proven).
  // (1) the one constant drifts back to the brace-wrapped spelling the eponymous
  //     branch used to write: the name it teaches is a name buildCandidates does
  //     not hand out, which is the whole defect
  { name: 'p0-1-eponymous-pattern-name-unknown', path: 'src/all.js', prove: 'boot',
    old: "const EPONYMOUS_PATTERN = 'first';\n",
    new: "const EPONYMOUS_PATTERN = '{first}';\n",
    mustPrint: /^⛔ PATTERN NAME CHECK: the eponymous branch teaches a pattern name buildCandidates does not know/m },
  // (2) the migration door stops unwrapping: a row saved before this round keeps
  //     the brace-wrapped token and the domain is re-guessed from scratch
  { name: 'p0-2-legacy-token-not-migrated', path: 'src/all.js', prove: 'boot',
    old: '  const bare = /^\\{[a-z._]+\\}$/.test(raw) ? raw.slice(1, -1) : raw;\n',
    new: '  const bare = raw;\n',
    mustPrint: /^⛔ PATTERN NAME CHECK: a lead row saved before this round carries the brace-wrapped first-name token and is not migrated on the way in/m },
  // (3) the setter stops being a door: any name a caller learns is installed in
  //     the process-lifetime memory and handed to the next lead on the domain
  { name: 'p0-3-domain-memory-ungated', path: 'src/all.js', prove: 'boot',
    // Round 129 wave two moved this: P1 made rememberPattern the ONE door that also
    // writes the table, so the gate became a block. The premise reverted is unchanged -
    // ungate normalizePattern and a name buildCandidates does not hand out is remembered.
    old: '  const known = normalizePattern(pattern);\n',
    new: '  const known = pattern;\n',
    mustPrint: 'a name buildCandidates does not hand out overwrites a good remembered pattern' },
  // (4) the pattern that arrives on the request is installed without the door
  { name: 'p0-4-prior-pattern-installed-unmigrated', path: 'src/all.js', prove: 'boot',
    old: '      rememberPattern(domain, priorEmailPattern);\n',
    new: '      if (priorEmailPattern) domainPatternMemory.set(domain, priorEmailPattern);\n',
    mustPrint: 'a pattern arriving on the request is installed in the domain memory without passing the migration door' },
  // (5) the pattern saved on the lead row is handed straight back out, so an old
  //     brace-wrapped token is written to the row again and outlives the fix
  { name: 'p0-5-prior-pattern-returned-unmigrated', path: 'src/all.js', prove: 'boot',
    old: '        pattern: normalizePattern(priorEmailPattern) || domainPatternMemory.get(domain) || null,\n',
    new: '        pattern: priorEmailPattern || domainPatternMemory.get(domain) || null,\n',
    mustPrint: 'a pattern saved on the lead row is handed straight back out without being migrated' },

  // ── ROUND 129 / P2: the address fix ──────────────────────────────────────
  // (P2-1) the read stops on "an owner is named" alone again — the defect that
  // produced zero published addresses on a ten-lead live run.
  { name: 'p2-1-early-stop-ignores-the-contact-page', path: 'src/all.js', prove: 'boot',
    old: '  return _read.some(_isContact) || !_left.some(_isContact);\n',
    new: '  return true;\n',
    mustPrint: 'the read stops the moment a roster names an owner, so a site that publishes its address on /contact is never asked for it' },

  // (P2-2) the picker drains one intent before it looks at the next again, so
  // the first wave of five is five team pages and no contact page.
  { name: 'p2-2-picker-drains-the-team-intent', path: 'src/all.js', prove: 'boot',
    old: '  const perPass = free ? 1 : Infinity;\n',
    new: '  const perPass = Infinity;\n',
    mustPrint: 'pickFindPages drains the team intent before the contact intent, so with a free budget of 20 and a wave of 5 no contact page is in the first wave' },

  // (P2-3) no mode permits the contact-page buy on a lead that can use it: the
  // only case 'fallback' allows is one the email engine refuses as a dead site.
  { name: 'p2-3-no-mode-permits-the-contact-page-buy', path: 'src/all.js', prove: 'boot',
    old: "\n        || (FIND_EMAIL_FIRECRAWL === 'unfound' && pages.length > 0)",
    new: '',
    mustPrint: 'the contact-page buy is no longer permitted on a site that answered and published no address for free' },

  // (P2-4) the FIND CONTACT line stops saying where the address came from, so
  // the next live run cannot answer what the buy is worth.
  { name: 'p2-4-contact-line-drops-the-address-source', path: 'src/all.js', prove: 'boot',
    old: ' | address source ${_addressSource} | phone ${out.phone',
    new: ' | phone ${out.phone',
    mustPrint: 'the FIND CONTACT line no longer says where the address came from' },

  // (P2-5) and the half the line alone cannot show: the engine is never asked,
  // so the line prints "none" on every lead including the ones that published one.
  { name: 'p2-5-engine-never-asked-for-the-address-source', path: 'src/all.js', prove: 'boot',
    old: "        onAddressSource: (s) => { _addressSource = String(s || 'none'); },\n",
    new: '',
    mustPrint: 'the address lookup is never asked where it found the address' },

  // (P2-6) the buy this round makes reachable spends outside the per-lead ceiling.
  { name: 'p2-6-address-buy-outside-the-lead-ceiling', path: 'src/all.js', prove: 'boot',
    old: '      const md = await firecrawlScrapeCapped(fcKey, target, 45000);\n',
    new: '      const md = await firecrawlScrape(fcKey, target, 45000);\n',
    mustPrint: 'the address lookup buys its contact pages outside the per-lead ceiling' },

  // (P4-1) the defect as it shipped on 2026-09-09: `_rv <= 0` read a MEASURED
  // zero review count as an unknown one and bought the second directory query.
  { name: 'p4-1-second-query-on-measured-zero', path: 'src/all.js', prove: 'boot',
    old: "  const known = typeof reviewCount === 'number' && Number.isFinite(reviewCount);\n  return !known || reviewCount >= SIZE_SECOND_QUERY_MIN_REVIEWS;\n",
    new: "  const _rv = Number(reviewCount);\n  return !Number.isFinite(_rv) || _rv <= 0 || _rv >= SIZE_SECOND_QUERY_MIN_REVIEWS;\n",
    mustPrint: /⛔ SIZE AND LAYERS CHECK:.*bought on a MEASURED zero review count/ },

  // (P4-2) null laundering, the other way round: signals.reviewCount is null
  // when nothing was measured, Number(null) is 0 and 0 is finite, so asking
  // Number() instead of the raw value stands the query down on "we never looked".
  { name: 'p4-2-unmeasured-review-count-laundered-into-zero', path: 'src/all.js', prove: 'boot',
    old: "  const known = typeof reviewCount === 'number' && Number.isFinite(reviewCount);\n",
    new: "  const known = Number.isFinite(Number(reviewCount));\n",
    mustPrint: /⛔ SIZE AND LAYERS CHECK:.*arrives as null, Number\(null\) is 0/ },

  // (P4-3) the call site (check-writing-traps §2): the rule derived inline again,
  // where no fixture can execute it. The fixtures still pass; the needle does not.
  { name: 'p4-3-second-query-rule-inlined-again', path: 'src/all.js', prove: 'boot',
    old: "  const secondWorth = sizeSecondQueryWorth((opts || {}).reviewCount);\n",
    new: "  const _rv = Number((opts || {}).reviewCount);\n  const secondWorth = !Number.isFinite(_rv) || _rv >= SIZE_SECOND_QUERY_MIN_REVIEWS;\n",
    mustPrint: /⛔ SIZE AND LAYERS CHECK:.*derived inline again/ },

  // (P4-4a/b) the buy gate stops asking whether their own team page settled it.
  // Two guards pin this one line, so it is reverted once per guard.
  { name: 'p4-4a-size-gate-ignores-settled-small', path: 'src/all.js', prove: 'boot',
    old: "  if (!sizeMeasured(signals) && !sizeSettledSmall(signals) && website && !_ownerWaveFoundNobody && !out.notIcp) {\n",
    new: "  if (!sizeMeasured(signals) && website && !_ownerWaveFoundNobody && !out.notIcp) {\n",
    mustPrint: /⛔ SIZE AND LAYERS CHECK:.*whose own team page already settles it as small/ },
  { name: 'p4-4b-size-gate-ignores-settled-small-place-check', path: 'src/all.js', prove: 'boot',
    old: "  if (!sizeMeasured(signals) && !sizeSettledSmall(signals) && website && !_ownerWaveFoundNobody && !out.notIcp) {\n",
    new: "  if (!sizeMeasured(signals) && website && !_ownerWaveFoundNobody && !out.notIcp) {\n",
    mustPrint: /⛔ PLACE IS NOT A PERSON CHECK:.*the size lookup is bought on a lead the read has already dropped/ },

  // (P4-5) the team-page branch of the weaker predicate deleted: a four-name
  // practice buys the four-credit search again.
  { name: 'p4-5-team-page-no-longer-settles-small', path: 'src/all.js', prove: 'boot',
    old: "  if (Number.isFinite(n) && n >= 3 && n < scaleCuts(revenuePerEmployeeFor(d.tradeLabel)).core) return true;\n",
    new: "",
    mustPrint: /⛔ SIZE AND LAYERS CHECK:.*own team page lists four people still buys the four-credit directory search/ },

  // (P4-6) the three-name floor dropped: a two-name page (a layout, not a
  // measurement) would stand the size lookup down.
  { name: 'p4-6-team-page-floor-dropped-below-three', path: 'src/all.js', prove: 'boot',
    old: "  if (Number.isFinite(n) && n >= 3 && n < scaleCuts(revenuePerEmployeeFor(d.tradeLabel)).core) return true;\n",
    new: "  if (Number.isFinite(n) && n >= 1 && n < scaleCuts(revenuePerEmployeeFor(d.tradeLabel)).core) return true;\n",
    mustPrint: /⛔ SIZE AND LAYERS CHECK:.*two-name team page stands the size lookup down/ },

  // (P4-7) the solo branch deleted: a one-person trade buys the directory search
  // that has no company page to find.
  { name: 'p4-7-solo-trade-no-longer-settles-small', path: 'src/all.js', prove: 'boot',
    old: "  if (capacityClassFor(d.tradeLabel, d.trade) === 'solo') return true;\n",
    new: "",
    mustPrint: /⛔ SIZE AND LAYERS CHECK:.*one-person trade still buys the directory search/ },

  // (P4-8) the solo branch widened to 'mixed' — the veto that would blind the
  // size gate across Electrical, Plumbing and Dental.
  { name: 'p4-8-mixed-capacity-vetoes-the-size-gate', path: 'src/all.js', prove: 'boot',
    old: "  if (capacityClassFor(d.tradeLabel, d.trade) === 'solo') return true;\n",
    new: "  if (['solo', 'mixed'].includes(capacityClassFor(d.tradeLabel, d.trade))) return true;\n",
    mustPrint: /⛔ SIZE AND LAYERS CHECK:.*'mixed' trade with nothing measured stands its own size lookup down/ },

  // (P4-9) sizeMeasured widened instead of a weaker predicate added beside it:
  // the rep's band would start calling a four-name team page a measured size.
  { name: 'p4-9-size-measured-widened-instead', path: 'src/all.js', prove: 'boot',
    old: "  if (Number(d.teamCount) >= scaleCuts(revenuePerEmployeeFor(d.tradeLabel)).core) return true;\n",
    new: "  if (Number(d.teamCount) >= 3) return true;\n",
    mustPrint: /⛔ SIZE AND LAYERS CHECK:.*sizeMeasured was widened instead of a weaker predicate/ },

  // (P4-10) the saving made silent: the operator sees a lead skip the size
  // lookup with no line saying why, which reads as a broken feature.
  { name: 'p4-10-settled-small-saving-is-silent', path: 'src/all.js', prove: 'boot',
    old: "    console.log(`\\u{1F4CF} SIZE LOOKUP [${name}]: not bought - ${_sizeSettledWhy}, and a directory has no record of a business this size. ~4 Firecrawl credits saved.`);\n",
    new: "",
    mustPrint: /⛔ SIZE AND LAYERS CHECK:.*nothing in the log says so/ },

  // ── ROUND 129 / P3: the false blocks ─────────────────────────────────────
  // ── (a) THE TITLE WORD CAP ────────────────────────────────────────────────

  // (A-1) the cap counts the whole title again, credential and all. This is the
  // live defect: seven tokens, refused, and the caller's filter takes the whole
  // person with the title.
  { name: 'p3-a-cap-counts-the-credential-again', path: 'src/all.js', prove: 'boot',
    old: "    if (_head.split(/\\s+/).length > 6) return false;     // a line of copy\n",
    new: "    if (s.split(/\\s+/).length > 6) return false;     // a line of copy\n",
    mustPrint: /TITLE CREDENTIAL CHECK: the roster row for an owner whose title carries a spelled-out credential is DELETED/ },

  // (A-2) the OTHER direction, and the change this fix was told not to make:
  // the cap is simply raised until the real title fits. Eight words of
  // marketing copy standing where a title stands is then a job title again.
  { name: 'p3-a-cap-raised-instead-of-aimed', path: 'src/all.js', prove: 'boot',
    old: "    if (_head.split(/\\s+/).length > 6) return false;     // a line of copy\n",
    new: "    if (s.split(/\\s+/).length > 8) return false;     // a line of copy\n",
    mustPrint: /a line of marketing copy \("Gain a partner and keep your practice today"\) is read as a job title/ },

  // (A-3) the strip eats the whole title rather than a trailing credential, so
  // a practitioner row whose title IS the credential loses it.
  { name: 'p3-a-credential-strip-eats-the-first-segment', path: 'src/all.js', prove: 'boot',
    old: "  while (parts.length > 1) {\n    const last = parts[parts.length - 1];\n",
    new: "  while (parts.length > 0) {\n    const last = parts[parts.length - 1];\n",
    mustPrint: /a title that is ONLY a credential is emptied/ },

  // ── (b) ONE EPONYMOUS RULE, AND IT SAYS WHICH ARM ─────────────────────────

  // (B-1) the settle widens onto the weak arm: a domain that merely carries the
  // owner's FIRST name now stands the paid owner sources down. None of the five
  // older isEponymousOwnerRule fixtures beside it can see this, which is why
  // this guard had to be written.
  { name: 'p3-b-settle-widens-onto-the-first-name-arm', path: 'src/all.js', prove: 'boot',
    old: "const isEponymousOwnerRule = (personName, coName, siteUrl) => eponymousMatch(personName, coName, siteUrl).match === 'surname';\n",
    new: "const isEponymousOwnerRule = (personName, coName, siteUrl) => eponymousMatch(personName, coName, siteUrl).match !== null;\n",
    mustPrint: /the eponymous SETTLE now fires on the first-name arm/ },

  // (B-2) the rule still knows the arm and the line stops saying it — which is
  // exactly the log that could not be used to tell the two apart.
  { name: 'p3-b-address-line-stops-naming-the-arm', path: 'src/all.js', prove: 'boot',
    old: "      console.log(`✓ EMAIL [${domain}] EPONYMOUS (${_epArm.arm}): ${EPONYM_ARM_SAY[_epArm.arm]}, so ${epEmail} on their own domain is ${name}'s mailbox`);\n",
    new: "      console.log(`✓ EMAIL [${domain}] EPONYMOUS: the company is named after ${name}, so ${epEmail} on their own domain is the owner's mailbox`);\n",
    mustPrint: /the eponymous address line does not name the arm it matched on \(1 of the 2 eponymous branches\)/ },

  // (B-3) the arm is named and the words for it go back to the strong claim, so
  // naming the arm buys nothing at all.
  { name: 'p3-b-weak-arm-stops-saying-it-is-weak', path: 'src/all.js', prove: 'boot',
    old: "  'first-name': 'their first name is the domain, and the business name does NOT carry their surname \\u2014 weaker evidence, which is why this line says which',\n",
    new: "  'first-name': 'the business is named after them',\n",
    mustPrint: /the weak arm no longer says it is the weak one/ },

  // (B-4) the labels are rewritten around the arm and the word the research
  // route reads them for goes with it. That route downgrades a CACHED tier-2
  // row whose label says it came from this shortcut, and its only other handle
  // is a flag that rows cached before it do not carry.
  { name: 'p3-b-label-drops-the-word-the-cache-downgrade-reads', path: 'src/all.js', prove: 'boot',
    old: "        label: `${name}: ${EPONYM_ARM_SAY[_epArm.arm]} \\u2014 a first-name mailbox on their own eponymous domain (inferred, not SMTP-confirmed)`,\n",
    new: "        label: `${name}: ${EPONYM_ARM_SAY[_epArm.arm]} \\u2014 a first-name mailbox on their own domain (inferred, not SMTP-confirmed)`,\n",
    mustPrint: /the inferred label on the second branch no longer carries the word the research route reads it for/ },

  // ── (c) OFFERED ONE CHECK, NOT DELETED ────────────────────────────────────

  // (C-1) the guard goes back to deleting the population. Neither hard bounce
  // on record came through it, and it refuses every constructed address on an
  // unvouched name.
  // RETIRED in Round 131. Its premise - that the guard should mark a held-back name's
  // address rather than refuse it - is the behaviour Vin reversed on 2026-09-10: a grade-D
  // name now builds no address at all. The entry is unfalsifiable (its anchor occurs zero
  // times) and is replaced from the other direction by 131-a2-guard-marks-instead-of-refusing.
  // (C-2) the send route stops asking, so the mark is decoration and an
  // `unknown` answer sends an unproven person's mailbox exactly as before.
  { name: 'p3-c-send-route-stops-asking', path: 'src/all.js', prove: 'boot',
    old: "      let _mustProve = sendUnknownIsNotAYes(lead)\n        ? `${lead.email} was built from a name the owner ladder would not vouch for, and nothing has confirmed the mailbox`\n        : '';\n",
    new: "      let _mustProve = '';\n",
    mustPrint: /the send route never asks whether an unknown answer counts for this row/ },

  // (C-3) the other direction: the rule widens onto every unproven address, so
  // every catch-all domain in the pipeline stops sending on no evidence. That
  // is the blunt version the send boundary was built to avoid.
  { name: 'p3-c-unknown-refused-for-every-lead', path: 'src/all.js', prove: 'boot',
    old: "const sendUnknownIsNotAYes = (lead) => {\n  const l = lead || {};\n  if (!sendNeedsVerify(l)) return false;\n  return (l.emailResult && l.emailResult.verifyToSend === true) || l.verifyToSend === true;\n};\n",
    new: "const sendUnknownIsNotAYes = (lead) => sendNeedsVerify(lead || {});\n",
    mustPrint: /an ordinary tier-3 address is now refused on an unknown answer/ },

  // (C-4) the check is bought and its answer thrown away: a yes no longer
  // clears the hold, so the address the mail server confirmed is refused too.
  { name: 'p3-c-a-yes-no-longer-clears-the-hold', path: 'src/all.js', prove: 'boot',
    old: "              _verified = true;\n              _mustProve = '';\n",
    new: "              _verified = true;\n",
    mustPrint: /a valid answer no longer clears the hold/ },

  // ── ROUND 129 / P1: the verifier budget ──────────────────────────────────
  // ── MAIL FACTS CHECK ──────────────────────────────────────────────────────
  // (1) The clock comes off the house pattern. Until this round the Render
  // restart was the only thing that had ever cleaned a poisoned pattern, so a
  // stored one with no clock is a permanent wrong address for that domain.
  { name: '129-p1-a-pattern-never-expires', path: 'src/all.js', prove: 'boot',
    old: '  if (mailFactFresh(row.pattern_at, PATTERN_FACT_TTL_MS, nowMs)) out.pattern = normalizePattern(row.pattern);\n',
    new: '  out.pattern = normalizePattern(row.pattern);\n',
    mustPrint: /a house pattern two hundred days old is still read as a measurement/ },

  // (2) The catch-all clock, the dangerous direction: a stale `false` keeps the
  // SMTP path open and ships "mailbox exists" about a domain that now accepts
  // everything.
  { name: '129-p1-b-catch-all-verdict-never-expires', path: 'src/all.js', prove: 'boot',
    old: "  if (typeof row.catch_all === 'boolean' && mailFactFresh(row.catch_all_at, CATCHALL_FACT_TTL_MS, nowMs)) out.catchAll = row.catch_all;\n",
    new: "  if (typeof row.catch_all === 'boolean') out.catchAll = row.catch_all;\n",
    mustPrint: /a catch-all verdict two hundred days old is still read as a measurement/ },

  // (3) The type test becomes a presence test: a column that is not a boolean is
  // read as a verdict, which is the unmeasured-treated-as-zero class in boolean
  // clothes.
  { name: '129-p1-c-catch-all-column-coerced', path: 'src/all.js', prove: 'boot',
    old: "  if (typeof row.catch_all === 'boolean' && mailFactFresh(row.catch_all_at",
    new: "  if (row.catch_all !== undefined && mailFactFresh(row.catch_all_at",
    mustPrint: /a catch-all column that is not a boolean is coerced into one/ },

  // (4) The pattern write leaves the one door it must go through — the door that
  // has already run normalizePattern and sits inside the vouched guard.
  { name: '129-p1-d-pattern-write-leaves-the-one-door', path: 'src/all.js', prove: 'boot',
    old: "    saveDomainMailFact(domain, { pattern: known, pattern_at: new Date().toISOString() });\n",
    new: "",
    mustPrint: /the house pattern is written to the table from somewhere other than the one door/ },

  // (5) The UNKNOWN catch-all verdict reaches the table. It is a fact about the
  // probe's moment; a stored one shuts the SMTP path on that domain for ninety days.
  { name: '129-p1-e-unknown-verdict-persisted', path: 'src/all.js', prove: 'boot',
    old: "      catchAllCache.set(domain, null);\n",
    new: "      catchAllCache.set(domain, null);\n      saveDomainMailFact(domain, { catch_all: null, catch_all_at: new Date().toISOString() });\n",
    mustPrint: /place\(s\) write a catch-all verdict to the table and there must be exactly one/ },

  // (6) Nothing hydrates: every restart starts the day over and re-buys facts we
  // already hold, which is the whole round.
  { name: '129-p1-f-engine-never-hydrates', path: 'src/all.js', prove: 'boot',
    old: "  await primeDomainMailFacts((_args && _args.website) || '');\n",
    new: "",
    mustPrint: /the engine no longer hydrates what we know about the domain before it runs/ },

  // (7) A boot fixture's made-up domain writes a row a later lead reads back as a
  // fact about a real business.
  { name: '129-p1-g-fixture-domains-write-rows', path: 'src/all.js', prove: 'boot',
    old: "const _fixtureDomain = (d) => /(^|\\.)example\\.(com|net|org)$|\\.(invalid|test|example|localhost)$/.test(String(d || '').trim().toLowerCase());\n",
    new: "const _fixtureDomain = () => false;\n",
    mustPrint: /it now reaches the table, so every boot writes fixture rows/ },

  // ── VERIFIER DAY CHECK ────────────────────────────────────────────────────
  // (8) The counter stops being a brake: it refuses only AFTER the allowance is
  // over, which is what the latch already did by walking into the wall.
  { name: '129-p1-h-day-counter-is-off-by-one', path: 'src/all.js', prove: 'boot',
    old: "  if (_used + _want <= _cap) return null;\n",
    new: "  if (_used <= _cap) return null;\n",
    mustPrint: /the hundred-and-first check is allowed, so the counter is a report and not a brake/ },

  // (9) The other direction: a count nobody could seed is read as "all spent",
  // which stops the day rather than running it.
  { name: '129-p1-i-unseeded-count-refuses-everything', path: 'src/all.js', prove: 'boot',
    old: "  if (!Number.isFinite(_used)) return null;\n",
    new: "",
    mustPrint: /a count that was never seeded refuses every call/ },

  // (10) The one door stops counting the check it spends, so the day counter is
  // decorative.
  { name: '129-p1-j-verifier-door-stops-counting', path: 'src/all.js', prove: 'boot',
    old: "    noteVerifierCall();\n    const url = `https://client.myemailverifier.com",
    new: "    const url = `https://client.myemailverifier.com",
    mustPrint: /the one door to the verifier no longer counts the check it is about to spend/ },

  // (11) The gate every caller asks goes back to reading only the latch — the
  // latch that is set by hitting the wall and cleared by every restart.
  { name: '129-p1-k-gate-reads-only-the-latch', path: 'src/all.js', prove: 'boot',
    old: "  if (!verifierMaySpend(1)) return false;\n  if (!verifierBlocked()) return true;\n",
    new: "  if (!verifierBlocked()) return true;\n",
    mustPrint: /still reads only the latch/ },

  // (12) The day count is never seeded, so an instance that slept resumes at zero
  // and spends the free hundred a second time.
  { name: '129-p1-l-day-count-never-seeded', path: 'src/all.js', prove: 'boot',
    old: "      seedVerifierDay().catch(() => {});\n",
    new: "",
    mustPrint: /the day count is never seeded from the table/ },

  // (13) The line claims a seed it never had: "0 of 100 used" off an unseeded
  // counter is the unmeasured-treated-as-zero class pointed at the operator.
  { name: '129-p1-m-unseeded-count-printed-as-todays-total', path: 'src/all.js', prove: 'boot',
    old: "  const _seedSay = VERIFIER_DAY_SEEDED === r.day\n",
    new: "  const _seedSay = true\n",
    mustPrint: /is printed as though it were today's total/ },

  // (14) The external allowance becomes a route ceiling, so a lead that would
  // still have returned an owner, a phone and a website is not read at all.
  { name: '129-p1-n-allowance-becomes-a-route-ceiling', path: 'src/all.js', prove: 'boot',
    old: "  const list = (Array.isArray(needs) && needs.length) ? needs : spendAdmissionServices();\n",
    new: "  const list = (Array.isArray(needs) && needs.length) ? needs : Object.keys(SPEND_NAMES);\n",
    mustPrint: /refuses a route that spends no mailbox checks at all/ },

  // (14b) And the declaration behind it: the allowance rejoins the default
  // admission list, so the same refusal is reached the other way round.
  { name: '129-p1-w-allowance-rejoins-the-admission-list', path: 'src/all.js', prove: 'boot',
    old: "const SPEND_NOT_ADMISSION = new Set(['verifier']);\n",
    new: "const SPEND_NOT_ADMISSION = new Set([]);\n",
    mustPrint: /refuses a whole route at admission/ },

  // ── CHECK BUDGET CHECK ────────────────────────────────────────────────────
  // (15) The verdict is bought up front on every lead again, before a single
  // question has been put to the mail server.
  { name: '129-p1-o-verdict-bought-up-front-again', path: 'src/all.js', prove: 'boot',
    old: "  let catchAll = catchAllKnown(domain);\n",
    new: "  let catchAll = await isCatchAllDomain(domain, verifierKey);\n",
    mustPrint: /the catch-all verdict is bought up front on every lead again/ },

  // (16) The lazy purchase goes, so an acceptance on a server that accepts every
  // address would ship as "SMTP-verified (mailbox exists)".
  { name: '129-p1-p-lazy-purchase-removed', path: 'src/all.js', prove: 'boot',
    old: "        if (catchAll === undefined) catchAll = await isCatchAllDomain(domain, verifierKey);\n",
    new: "",
    mustPrint: /the verdict is no longer bought at the moment a candidate is accepted/ },

  // (17) Back to four or five blind guesses at a mailbox per lead.
  { name: '129-p1-q-waterfall-cap-widens', path: 'src/all.js', prove: 'boot',
    old: "    const toTry = ordered.slice(0, 2);\n",
    new: "    const toTry = ordered.slice(0, learnedFirst ? 5 : 4);\n",
    mustPrint: /the pattern waterfall is back to four or five blind guesses a lead/ },

  // (18) The shared-inbox upgrade guesses again on a domain whose convention we
  // do not know — on a lead that already has an address.
  { name: '129-p1-r-shared-inbox-guesses-again', path: 'src/all.js', prove: 'boot',
    old: "        const _tryPatterns = _learned ? [_learned] : [];\n",
    new: "        const _tryPatterns = _learned ? [_learned] : ['first', 'firstlast', 'f.last', 'first.last'];\n",
    mustPrint: /the shared-inbox upgrade guesses at four mailboxes again/ },

  // (19) And buys the two-probe verdict for a lead that already has one.
  { name: '129-p1-s-shared-inbox-buys-the-probe-again', path: 'src/all.js', prove: 'boot',
    old: "        const _catchAll = _tryPatterns.length ? catchAllKnown(domain) : undefined;\n",
    new: "        const _catchAll = await isCatchAllDomain(domain, verifierKey);\n",
    mustPrint: /buys the two-probe catch-all verdict again/ },

  // (20) The probe is spent on a host that stalls address probes by design.
  { name: '129-p1-t-probe-spent-on-a-stalling-host', path: 'src/all.js', prove: 'boot',
    old: "  if (mailProviderStalls(domain)) {\n    console.log(`Catch-all probe [${domain}]: NOT RUN",
    new: "  if (false) {\n    console.log(`Catch-all probe [${domain}]: NOT RUN",
    mustPrint: /the catch-all probe is spent on a host that stalls address probes by design/ },

  // (21) A lookup that returned nothing is given a mail host anyway, so "we never
  // looked" becomes a measurement.
  { name: '129-p1-u-empty-mx-invents-a-host', path: 'src/all.js', prove: 'boot',
    old: "  if (!hosts.length) return '';\n",
    new: "  if (!hosts.length) return 'other';\n",
    mustPrint: /is given a mail host anyway/ },

  // (22) A host that answers probes perfectly well joins the stall list, which
  // would switch the free SMTP route off across a large share of this ICP.
  { name: '129-p1-v-stall-list-swallows-a-host-that-answers', path: 'src/all.js', prove: 'boot',
    old: "const MAIL_PROVIDERS_THAT_STALL = ['microsoft365'];\n",
    new: "const MAIL_PROVIDERS_THAT_STALL = ['microsoft365', 'google'];\n",
    mustPrint: /is on the stall list, so the free SMTP route is switched off/ },
];
