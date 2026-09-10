// ════════════════════════════════════════════════════════════════════════════
// ROUND 130 — the falsifications, as reverts for `node falsify.js docs/history/round-130-reverts.js`.
//
// The round after the contact list started producing sendable addresses. Round 129
// turned 0 sendable into 6 of 9 on a live ten-lead read, and cost 58 Firecrawl credits
// against 30 before. Four parts, each undoing one guard's premise against a baseline
// proven green, naming the proof that must go red ON THAT GUARD'S OWN LINE:
//
//   130-a-*  the address lookup stops buying a map it does not need and pages the
//            free read already fetched
//   130-b-*  a business named after its owner keeps that owner at the name door,
//            without re-admitting "Smith Brothers" as a person
//   130-c-*  the contact read reports its own mailbox spend (the day line was wired
//            into the research route, which a contact read never reaches)
//   130-d-*  the two durable writes stop being silent about whether a row landed
//   130-e-*  the batch chips partition: no lead counted under two of them
//
// Shapes falsify.js reads: { name, path, old, new, prove } — a text edit whose `old`
// must occur EXACTLY once in the ORIGINAL file, or the run says NO VERDICT.
// mustPrint: '…' | /…/ is the guard's own line; a run that is red WITHOUT printing it
// is red for the wrong reason and does not match.
// Anchors are UTF-8 here; falsify.js converts to the file's bytes and keeps CRLF
// (server.js) and LF (src/, index.html). Every file is restored byte for byte.
// ════════════════════════════════════════════════════════════════════════════
module.exports = [
  // ── PART A: stop paying for pages already held ──────────────────────────
  // (A1) the no-re-buy rule collapses into "buy everything", which IS the live
  // defect: /contact, already fetched free and already read by pass 1.5, bought.
  { name: '130-a1-no-re-buy-rule-collapses', path: 'src/all.js', prove: 'boot',
    old: "  const held = addressPagesAlreadyRead(freePages);\n  return (Array.isArray(targets) ? targets : []).filter(t => !held.has(_addrKey(t)));\n",
    new: "  void freePages;\n  return (Array.isArray(targets) ? targets : []);\n",
    mustPrint: /the address lookup buys their contact page again on a lead whose free read already fetched and read it/ },

  // (A2) the URL key stops normalising the trailing slash, so /about/ read for
  // free no longer matches /about on the buy list — the shape the live log had.
  { name: '130-a2-url-key-stops-normalising-the-slash', path: 'src/all.js', prove: 'boot',
    old: "  .replace(/[?#].*$/, '').replace(/^https?:\\/\\//, '').replace(/^www\\./, '').replace(/\\/+$/, '');\n",
    new: "  .replace(/[?#].*$/, '').replace(/^https?:\\/\\//, '').replace(/^www\\./, '');\n",
    mustPrint: /a trailing slash hides a page we already hold from the no-re-buy rule/ },

  // (A3) the floor drops to zero, so a page a free fetch returned nearly empty
  // counts as one we read and its contact page is never bought.
  { name: '130-a3-readable-floor-drops-to-zero', path: 'src/all.js', prove: 'boot',
    old: "const ADDRESS_FREE_TEXT_FLOOR = 800;\n",
    new: "const ADDRESS_FREE_TEXT_FLOOR = 0;\n",
    mustPrint: /a free fetch that came back nearly empty counts as a page we read/ },

  // (A4) the map rule goes back to "always worth it", which is the sitemap call
  // the live log bought on a lead holding 53 of the site's own links.
  { name: '130-a4-map-always-worth-buying', path: 'src/all.js', prove: 'boot',
    old: "const addressMapWorthBuying = (knownLinks) => !(Array.isArray(knownLinks) && knownLinks.length >= ADDRESS_NAV_FLOOR);\n",
    new: "const addressMapWorthBuying = (knownLinks) => { void knownLinks; return true; };\n",
    mustPrint: /a sitemap call is still bought on a site whose own navigation we already harvested/ },

  // (A5) the rule stays declared and stops being CALLED — the half-a-check
  // shape: the fixture would still pass while every lead pays.
  { name: '130-a5-no-re-buy-rule-never-called', path: 'src/all.js', prove: 'boot',
    old: "  targets = addressTargetsToBuy(targets, freePages);\n",
    new: "  targets = targets.slice();\n",
    mustPrint: /the no-re-buy rule is declared and never called/ },

  // (A6) the map gate stays declared and its call site stops reaching it.
  { name: '130-a6-map-gate-never-reached', path: 'src/all.js', prove: 'boot',
    old: "  if (!addressMapWorthBuying(_known)) {\n",
    new: "  if (_known.length >= 100000) {\n",
    mustPrint: /the address lookup maps the site unconditionally again/ },

  // (A7) the Find read stops remembering the navigation it harvested, so
  // cachedSiteMap is empty and the gate above can never fire in production.
  { name: '130-a7-find-read-forgets-its-navigation', path: 'src/all.js', prove: 'boot',
    old: "    try { rememberHtmlLinks(pages[0].html, pages[0].url, null); } catch (e) { void e; }\n",
    new: "    void 0;\n",
    mustPrint: /the Find read no longer remembers the navigation it harvested/ },

  // ── PART B: the eponymous owner is a person ─────────────────────────────
  // (B-1) THE DOOR STOPS BEING SKIPPABLE. The org-word clause fires again even
  // when the caller has licensed the name, which is the live refusal itself.
  { name: '130-b1-org-word-clause-unskippable', path: 'src/all.js', prove: 'boot',
    old: "  if (!allowOrgWord && toks.some(t => ORG_TOKEN_RE.test(t.replace(/[.,]$/, '')))) return 'not-a-name';\n",
    new: "  if (toks.some(t => ORG_TOKEN_RE.test(t.replace(/[.,]$/, '')))) return 'not-a-name';\n",
    mustPrint: /the live case is still refused/ },

  // (B-2) THE RANKER STOPS ASKING. The rule still exists and nothing calls it —
  // the shape this repo records most, and the fixtures would prove dead code.
  { name: '130-b2-ranker-does-not-consult-the-licence', path: 'src/all.js', prove: 'boot',
    old: "    const _lic = _door ? eponymousDoorLicence(f, companyName, _door) : null;\n",
    new: "    const _lic = null;\n",
    mustPrint: /the ranker no longer consults the eponymous licence/ },

  // (B-3) THE SURNAME ARM GOES. Any organisation word is licensed on a business
  // that is NOT named after the person — the widening the bound forbids.
  { name: '130-b3-surname-arm-dropped', path: 'src/all.js', prove: 'boot',
    old: "  if (!isEponymousOwnerRule(name, companyName, '')) return null;\n",
    new: "  if (false) return null;\n",
    // Re-aimed after the first run: deleting this line deletes the very text a source
    // needle pins, so the check catches it on THAT assertion and prints it first. That
    // IS this guard's own line - the surname ask, named as missing. The behaviour half
    // ("an organisation word walks through the door...") cannot be reached by any edit
    // that leaves the pinned text intact, and its widening direction is covered by
    // 130-b4, which ranks "Smith Brothers" as the decision-maker of Smith Brothers Roofing.
    mustPrint: /the licence no longer asks the surname arm against the company name alone/ },

  // (B-4) THE PERSON MARKER GOES. "Smith Brothers" of Smith Brothers Roofing is
  // eponymous, has a title and a real source, and is not a person (Round 113).
  { name: '130-b4-person-marker-dropped', path: 'src/all.js', prove: 'boot',
    old: "  if (!PERSON_INITIAL_RE.test(name) && !PERSON_SUFFIX_RE.test(name + ' ' + String(companyName || ''))) return null;\n",
    new: "  if (false) return null;\n",
    mustPrint: /"Smith Brothers" is ranked as the decision-maker of Smith Brothers Roofing/ },

  // (B-5) THE TITLE REQUIREMENT GOES. Vin's rule is that a source states the
  // name WITH a title; without it a bare name-shaped run is licensed.
  { name: '130-b5-title-not-required', path: 'src/all.js', prove: 'boot',
    old: "  if (!name || !title || !EPONYM_DOOR_SOURCE.has(source)) return null;\n",
    new: "  if (!name || !EPONYM_DOOR_SOURCE.has(source)) return null;\n",
    mustPrint: /a name with no title at all is licensed/ },

  // (B-6) THE SOURCE LIST WIDENS. Hunter is LinkedIn-biased and names titles,
  // not owners; it must not be the evidence an organisation word stands on.
  { name: '130-b6-source-list-widened-to-hunter', path: 'src/all.js', prove: 'boot',
    old: "const EPONYM_DOOR_SOURCE = new Set(['license_or_chamber', 'bbb_profile', 'own_website_brain', 'business_name', 'opencorporates']);\n",
    new: "const EPONYM_DOOR_SOURCE = new Set(['license_or_chamber', 'bbb_profile', 'own_website_brain', 'business_name', 'opencorporates', 'hunter']);\n",
    mustPrint: /a LinkedIn-biased source licenses an organisation word/ },

  // (B-7) THE OTHER DOOR CLAUSES STOP BEING RE-ASKED, so a company's own name
  // that happens to carry an organisation word is licensed as a person.
  { name: '130-b7-other-door-clauses-not-reasked', path: 'src/all.js', prove: 'boot',
    old: "  if (ownerNameDoor(name, companyName, true)) return null;\n",
    new: "  if (false) return null;\n",
    mustPrint: /a firm name that happens to carry an initial is licensed as a person/ },

  // ── PARTS C+D: the verifier and the writes report themselves ────────────
  // ── PART C: the contact read reports its own mailbox spend ────────────────

  // (C-1) the null-laundering class, pointed at the operator: Number(null) is 0
  // and 0 is finite, so a read with no per-lead ledger reports "0 checks" as a
  // measurement instead of saying it was never measured.
  { name: '130-c-1-null-laundered-into-a-measured-zero', path: 'src/all.js', prove: 'boot',
    old: "  const _lead = (typeof leadCount === 'number' && Number.isFinite(leadCount)) ? Math.round(leadCount) : null;\n",
    new: "  const _lead = Number.isFinite(Number(leadCount)) ? Math.round(Number(leadCount)) : null;\n",
    mustPrint: /Number\(null\) is 0 and 0 is finite/ },

  // (C-2) the whole point of the part: the footer stops saying it, which is the
  // state the live run was in.
  { name: '130-c-2-contact-footer-stops-reporting-mailbox-spend', path: 'src/all.js', prove: 'boot',
    old: " of model, ${verifierLeadSpendSay(_ledFrame ? (Number(_ledFrame.verifier) || 0) : null)}, ${Math.round(out.tookMs / 1000)}s | owner lookup: ",
    new: " of model, ${Math.round(out.tookMs / 1000)}s | owner lookup: ",
    mustPrint: /the contact footer no longer says what the read spent on mailbox checks/ },

  // (C-3) the counter itself is dark: the door spends the check and nothing
  // records it against the lead. The fixture drives the REAL door.
  { name: '130-c-3-per-lead-counter-removed-from-the-door', path: 'src/all.js', prove: 'boot',
    old: "  try { const _l = FC_LEDGER.getStore(); if (_l) _l.verifier = (_l.verifier || 0) + 1; } catch (e) { void e; }\n  saveVerifierDaySpend(false);\n",
    new: "  saveVerifierDaySpend(false);\n",
    mustPrint: /against the lead, so the per-lead figure on the contact row is either dark or double-counted/ },

  // (C-4) the other direction, which no other entry can produce: the check is
  // counted TWICE against the lead, so every contact row overstates its spend.
  { name: '130-c-4-per-lead-counter-double-counts', path: 'src/all.js', prove: 'boot',
    old: "  try { const _l = FC_LEDGER.getStore(); if (_l) _l.verifier = (_l.verifier || 0) + 1; } catch (e) { void e; }\n  saveVerifierDaySpend(false);\n",
    new: "  try { const _l = FC_LEDGER.getStore(); if (_l) _l.verifier = (_l.verifier || 0) + 1; } catch (e) { void e; }\n  try { const _l = FC_LEDGER.getStore(); if (_l) _l.verifier = (_l.verifier || 0) + 1; } catch (e) { void e; }\n  saveVerifierDaySpend(false);\n",
    mustPrint: /place\(s\) count a mailbox check against the lead and there must be exactly one/ },

  // (C-5) the frame capture: `|| {}` cannot tell a lead that spent nothing from
  // a call made with no per-lead ledger at all.
  { name: '130-c-5-contact-read-loses-the-ledger-frame', path: 'src/all.js', prove: 'boot',
    old: "  const _ledFrame = FC_LEDGER.getStore();\n  const led = _ledFrame || {};\n",
    new: "  const _ledFrame = FC_LEDGER.getStore();\n  const led = FC_LEDGER.getStore() || {};\n",
    mustPrint: /no longer holds the ledger FRAME/ },

  // (C-6) the day half disappears, so a rep reads what the lead cost and never
  // how close the free hundred is to its wall.
  { name: '130-c-6-day-figure-dropped-from-the-contact-line', path: 'src/all.js', prove: 'boot',
    old: "    ? `${_leadSay}, ${Math.round(r.verifier)} ${_capSay} today`\n",
    new: "    ? `${_leadSay} today`\n",
    mustPrint: /does not say how much of the free hundred is already gone/ },

  // (C-7) a count that was never seeded out of the day table is printed as
  // today's, so a restarted instance reports an allowance that may be spent.
  { name: '130-c-7-unseeded-count-printed-as-todays', path: 'src/all.js', prove: 'boot',
    old: "    : `${_leadSay}, ${Math.round(r.verifier)} ${_capSay} since this process started rather than today (the day table was not read at boot)`;\n",
    new: "    : `${_leadSay}, ${Math.round(r.verifier)} ${_capSay} today`;\n",
    mustPrint: /is printed as though it were today/ },

  // ── PART D: the write path stops being dark ───────────────────────────────

  // (D-1) the mail-facts write goes back to throwing its result away, which is
  // the live state: MAIL HOST printed twice, two rows were posted, and nothing
  // could say whether either landed.
  { name: '130-d-1-mail-facts-write-discards-its-result', path: 'src/all.js', prove: 'boot',
    old: "    }).then((_res) => noteDurableWrite(_res, `domain_mail_facts:${d}`,\n      `MAIL FACTS SAVED [${d}]: ${_say} is in the table, so the next lead on this domain reads it instead of buying it again. Said once per domain per process; a later write for this domain is silent unless it fails.`,\n      `\\u26a0 MAIL FACTS NOT SAVED [${d}]: ${_say} did NOT reach the table, so the next lead on this domain measures it again and pays for it again. The Supabase REST line for domain_mail_facts in this log says why.`)).catch(() => {});\n",
    new: "    }).catch(() => {});\n",
    mustPrint: /the mail-facts write is back to discarding its result/ },

  // (D-2) the same for the day-spend write: an instance that restarts can
  // resume at zero with nothing in the log to say the count was never saved.
  { name: '130-d-2-day-spend-write-discards-its-result', path: 'src/all.js', prove: 'boot',
    old: "    }).then((_res) => noteDurableWrite(_res, `api_day_spend:${r.day}`,\n      `DAY SPEND SAVED: today's mailbox count (${_used} check(s), UTC ${r.day}) is in the day table, so an instance that restarts resumes the day instead of spending the free allowance a second time. Said once a day per process; a later write of the same day is silent unless it fails.`,\n      `\\u26a0 DAY SPEND NOT SAVED: today's mailbox count (${_used} check(s), UTC ${r.day}) did NOT reach the day table, so a restart resumes at zero and can spend the free allowance twice over. The Supabase REST line for api_day_spend in this log says why. Every check is still counted inside this process.`)).catch(() => {});\n",
    new: "    }).catch(() => {});\n",
    mustPrint: /the day-spend write is back to discarding its result/ },

  // (D-3) the recorded live defect, exactly: the EMPTY BODY of a successful
  // return=minimal write read as a failure. That is the shape that reported 91
  // written rows as "the write failed".
  { name: '130-d-3-empty-body-success-read-as-a-failure', path: 'src/all.js', prove: 'boot',
    old: "const sbWriteLanded = (res) => !(res === null || res === undefined);\n",
    new: "const sbWriteLanded = (res) => !!(res && res.length);\n",
    mustPrint: /the empty body of a SUCCESSFUL return=minimal write is read as a failure/ },

  // (D-4) a failure de-duplicated is a broken table going quiet after one line.
  { name: '130-d-4-repeat-failure-silenced', path: 'src/all.js', prove: 'boot',
    old: "    if (!sbWriteLanded(res)) { console.log(lostSay); return false; }\n",
    new: "    if (!sbWriteLanded(res)) { if (_writeLandedSaid.has(onceKey)) return false; _writeLandedSaid.add(onceKey); console.log(lostSay); return false; }\n",
    mustPrint: /a failure that repeats is a failure that is still happening/ },

  // (D-5) the other direction: success said on every write, which is the
  // precaution-on-every-lead noise this repo already paid for once.
  { name: '130-d-5-success-said-on-every-write', path: 'src/all.js', prove: 'boot',
    old: "    if (_writeLandedSaid.has(onceKey)) return true;\n",
    new: "    void onceKey;\n",
    mustPrint: /a normal outcome recorded on every lead is a warning nobody reads/ },

  // (D-6) the failure line names the column instead of the fact, so the person
  // reading the log - who does not read code - cannot tell what went missing.
  { name: '130-d-6-failure-names-the-column-not-the-fact', path: 'src/all.js', prove: 'boot',
    old: "  return _k.length ? _k.map(k => _w[k] || k).join(' and ') : 'an empty row';\n",
    new: "  return _k.length ? _k.join(' and ') : 'an empty row';\n",
    mustPrint: /cannot say WHICH fact went missing/ },

  // (D-7) the read half: a table that did not answer collapses back into "no
  // row", silently, and the domain is never asked again in this process.
  { name: '130-d-7-failed-read-silent-again', path: 'src/all.js', prove: 'boot',
    old: "  if (!Array.isArray(rows)) {\n    _mailFactsUnread.add(d);\n    console.log(`\\u26a0 MAIL FACTS [${d}]: what we already measured about this domain could NOT be read back, so this lead treats the domain as unmeasured and may spend a check it did not need. The Supabase REST line for domain_mail_facts in this log says why; the next lead on this domain tries the read again.`);\n    return;\n  }\n  _mailFactsUnread.delete(d);\n  const row = rows[0] || null;\n",
    new: "  const row = Array.isArray(rows) ? rows[0] : null;\n",
    mustPrint: /a mail-facts read that FAILED is silent again/ },

  // (D-8) the retry is refused: one bad moment costs every later lead on that
  // domain the facts we already own.
  { name: '130-d-8-failed-read-never-retried', path: 'src/all.js', prove: 'boot',
    old: "  if (!d || (_mailFactsLoaded.has(d) && !_mailFactsUnread.has(d))) return;\n",
    new: "  if (!d || _mailFactsLoaded.has(d)) return;\n",
    mustPrint: /refused a second attempt for the life of the process/ },

  // (D-9) the ordering judgement call, falsified from the other side: the mark
  // moves off the top of the function, so two leads on one domain both issue
  // the awaited read and the day line's per-lead rate loses its denominator.
  { name: '130-d-9-domain-not-marked-open-before-the-read', path: 'src/all.js', prove: 'boot',
    old: "  _mailFactsLoaded.add(d);\n  if (!SB_URL || !SB_KEY) return;\n",
    new: "  if (!SB_URL || !SB_KEY) return;\n",
    mustPrint: /no longer marked as opened BEFORE the awaited read/ },

  // ── PART E: the chips partition ─────────────────────────────────────────
  // (1) THE LIVE DEFECT. "No email" goes back to meaning "not confirmed", so the
  // three leads with an address the engine cleared are counted as having none.
  { name: '130-e-a-no-email-means-not-confirmed', path: 'index.html', prove: 'clientcheck',
    old: "const batchBucketOf = (l) => queueStateOf(l) !== 'read' ? 'other'\n  : emailStatusOf(l) === 'none' ? 'noemail'\n",
    new: "const batchBucketOf = (l) => queueStateOf(l) !== 'read' ? 'other'\n  : emailStatusOf(l) !== 'verified' ? 'noemail'\n",
    mustPrint: /the "No email" chip counts/ },

  // (2) the unconfirmed chip swallows the confirmed rows again — the nesting
  // that made "Confirmed 3 | Can send 6" describe nine leads as twelve.
  { name: '130-e-b-unconfirmed-chip-swallows-the-confirmed-rows', path: 'index.html', prove: 'clientcheck',
    old: "  : emailStatusOf(l) === 'verified' ? 'email'\n  : emailHeldBackOf(l) ? 'held'\n  : 'sendable';\n",
    new: "  : emailSendableOf(l) ? 'sendable'\n  : emailHeldBackOf(l) ? 'held'\n  : 'email';\n",
    mustPrint: /the "Unconfirmed" chip counts/ },

  // (3) a lead we have NOT read to the end is given one of the four buckets, so
  // the screen reports an address we never looked for — an absence claim with no
  // look behind it, which is the rule in PART 3.
  { name: '130-e-c-unread-leads-get-a-bucket', path: 'index.html', prove: 'clientcheck',
    old: "const batchBucketOf = (l) => queueStateOf(l) !== 'read' ? 'other'\n",
    new: "const batchBucketOf = (l) => queueStateOf(l) === 'ruled_out' ? 'other'\n",
    mustPrint: /was never read to the end and is still filed under/ },

  // (4) the number on a chip stops being the size of the rows behind it.
  { name: '130-e-d-the-count-is-not-the-rows', path: 'index.html', prove: 'clientcheck',
    old: "  for (const k of BATCH_BUCKETS) out[k] = batchChipFilter(leads, k).length;\n",
    new: "  for (const k of BATCH_BUCKETS) out[k] = batchLiveLeads(leads).filter(l => batchBucketOf(l) !== k).length;\n",
    mustPrint: /is not the number of rows it shows/ },

  // (5) the card's third number leaves the buckets, so the card and the chips on
  // the same screen say two different things about one lead.
  { name: '130-e-e-card-and-chips-disagree', path: 'index.html', prove: 'clientcheck',
    old: "    if (_bucket === 'held') s.heldBack += 1;\n",
    new: "    if (st === 'read' && emailHeldBackOf(l)) s.heldBack += 1;\n",
    mustPrint: /the batch card and the chips above it disagree about/ },

  // (6) the review table filters the chips with its own chain again — the second
  // copy of the rule, which is where "No email" drifted in the first place.
  { name: '130-e-f-chips-filtered-by-a-second-chain', path: 'index.html', prove: 'clientcheck',
    old: "    const pick = batchChipFilter(leads, chipKey);\n",
    new: "    const live = (leads || []).filter(l => l && queueStateOf(l) !== 'ruled_out');\n    const pick = chipKey === 'fit' ? live.filter(l => typeof l.contactIcp === 'number' && l.contactIcp >= 70)\n      : live;\n",
    mustPrint: /the review table filters the chips with its own chain again/ },

  // (7) the numbers on the chips are assembled a second time beside the filter
  // that produces the rows.
  { name: '130-e-g-counts-assembled-a-second-time', path: 'index.html', prove: 'clientcheck',
    old: "    const counts = batchChipCounts(leads);\n",
    new: "    const live = leads.filter(l => queueStateOf(l) !== 'ruled_out');\n    const counts = { email: 0, sendable: 0, held: 0, all: live.length, noemail: 0, fit: 0 };\n",
    mustPrint: /the numbers on the chips are assembled a second time/ },

  // (8) the chip goes back to saying "Can send 3" beside a Screen A button
  // offering "Move 6 to Research" — one screen contradicting itself.
  { name: '130-e-h-chip-label-back-to-can-send', path: 'index.html', prove: 'clientcheck',
    old: "chipEl('sendable', 'Unconfirmed', counts.sendable)",
    new: "chipEl('sendable', 'Can send', counts.sendable)",
    mustPrint: /the unconfirmed chip is labelled "Can send" again/ },

  // (9) the four buckets are split apart on the row again, so nothing on the
  // screen shows the operator that they add up.
  { name: '130-e-i-buckets-split-from-all', path: 'index.html', prove: 'clientcheck',
    old: "chipEl('noemail', 'No email', counts.noemail), chipEl('all', 'All', counts.all)",
    new: "chipEl('all', 'All', counts.all), chipEl('noemail', 'No email', counts.noemail)",
    mustPrint: /the four buckets are no longer together with All after them/ },

  // (10) index.html changed and the contract number did not — the only staleness
  // signal there is, and the standing ruling since round 104.
  { name: '130-e-j-contract-not-bumped', path: 'index.html', prove: 'clientcheck',
    old: "const CLIENT_CONTRACT = 20261010;\n",
    new: "const CLIENT_CONTRACT = 20261009;\n",
    mustPrint: /the handshake constants differ in the repo/ },
];
