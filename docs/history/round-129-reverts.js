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
    old: "    if (st === 'read' && emailSendableOf(l)) { s.sendable += 1; if (emailStatusOf(l) !== 'verified') s.sendableOnly += 1; }\n",
    new: "    if (st === 'read' && emailStatusOf(l) === 'verified') { s.sendable += 1; }\n",
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
    old: '  const known = normalizePattern(pattern);\n  if (known) domainPatternMemory.set(domain, known);\n  return known;\n',
    new: '  domainPatternMemory.set(domain, pattern);\n  return pattern;\n',
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
];
