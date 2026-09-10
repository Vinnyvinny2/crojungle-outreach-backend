// ════════════════════════════════════════════════════════════════════════════
// ROUND 133 — the falsifications, for `node falsify.js docs/history/round-133-reverts.js`.
//
// The round the checker became a setting and Confirmed stopped meaning "somebody
// reads this". Each entry undoes ONE guard's premise against a baseline proven
// green, naming the proof that must go red ON THAT GUARD'S OWN LINE:
//
//   133-a-*  one door, any checker; a spent primary does not take the run down
//   133-b-*  a dead key is known at boot
//   133-c-*  Confirmed counts the owner's own mailbox, and volume does not fall
//
// After Rounds 131 and 132: each revert is aimed at the consumer that can
// actually SEE the defect, never through a caller that re-applies the same rule.
// ════════════════════════════════════════════════════════════════════════════
module.exports = [
  // ── PART A: one door, any checker ───────────────────────────────────────

  // (A-1) THE DEFECT ITSELF, restored: one checker running out stands every
  // other one down. This is the 2026-09-10 run exactly - out of credits on lead
  // one, and nine leads then lose the owner-mailbox upgrade in silence.
  { name: '133-a-one-spent-checker-stands-them-all-down', path: 'src/all.js', prove: 'boot',
    old: "const verifierBlocked = (id) => { const st = _vState(id); return st.exhausted || st.dead; };\n",
    new: "const verifierBlocked = (id) => (VERIFIER_EXHAUSTED || VERIFIER_DEAD);\n",
    mustPrint: /ONE checker running out stands the OTHER one down as well/ },

  // (A-2) the fallback is never reached because the door stops walking the
  // list - the table exists, and one vendor is still all there is.
  { name: '133-a-door-stops-walking-the-list', path: 'src/all.js', prove: 'boot',
    old: "  for (const _p of _providers) {\n    if (!verifierGate(undefined, _p.id)) continue;\n",
    new: "  for (const _p of _providers.slice(0, 1)) {\n    if (!verifierGate(undefined, _p.id)) continue;\n",
    mustPrint: /two configured checkers do not come back in order|ONE checker running out stands the OTHER one down/ },

  // (A-3) a checker with no key counts as configured, so a server with no keys
  // at all reports it can check mailboxes - and a lead is told its mailbox does
  // not exist when nothing ever asked.
  { name: '133-a-keyless-checker-counts-as-configured', path: 'src/all.js', prove: 'boot',
    old: "    if (key) out.push({ id, key, def: EMAIL_VERIFIERS[id] });\n",
    new: "    out.push({ id, key, def: EMAIL_VERIFIERS[id] });\n",
    mustPrint: /a checker with no key counts as configured/ },

  // (A-4) an unrecognised token is guessed into a verdict instead of being
  // reported as unchecked. Reoon's vocabulary is not verifiable from this
  // network, so this is the guard that stops a wrong guess grading a live
  // mailbox as dead - indistinguishable from a working mapping.
  { name: '133-a-unknown-token-guessed-into-a-verdict', path: 'src/all.js', prove: 'boot',
    old: "      if (VALID.includes(token)) return { token, valid: true, invalid: false, catchAll };\n      if (INVALID.includes(token)) return { token, valid: false, invalid: true, catchAll };\n      return { token, valid: null, invalid: null, catchAll };\n",
    new: "      if (INVALID.includes(token)) return { token, valid: false, invalid: true, catchAll };\n      return { token, valid: true, invalid: false, catchAll };\n",
    mustPrint: /a token the adapter does not recognise is being turned into a verdict instead of UNKNOWN/ },

  // (A-5) a spam trap stops being do-not-send. This is the one that burns the
  // sending domain rather than losing a lead.
  { name: '133-a-spam-trap-treated-as-sendable', path: 'src/all.js', prove: 'boot',
    old: "      const INVALID = ['invalid', 'undeliverable', 'disabled', 'spamtrap', 'spam_trap', 'disposable', 'inbox_full', 'role_account'];\n",
    new: "      const INVALID = ['invalid', 'undeliverable'];\n",
    mustPrint: /Reoon reporting a spam trap is not treated as do-not-send/ },

  // (A-6) the row-level readers go back to meaning "the PRIMARY is down"
  // instead of "no checker could be asked", so a lead checked by the secondary
  // is still told nobody could check it.
  { name: '133-a-row-says-down-while-a-checker-answers', path: 'src/all.js', prove: 'boot',
    old: "    const _smtpActuallyRan = (_mayProbe && verifierAnyAvailable(undefined, verifierKey));",
    new: "    const _smtpActuallyRan = (_mayProbe && !verifierBlocked());",
    mustPrint: /the give-up branch could not be located|the SMTP-gated block could not be found/ },

  // (A-7) the day counter stops counting the check it is about to spend, so
  // the ceiling is decorative and the wall is found by walking into it.
  { name: '133-a-door-stops-counting-what-it-spends', path: 'src/all.js', prove: 'boot',
    old: "    noteVerifierCall();\n    const url = provider.def.url(email, verifierKey);\n",
    new: "    const url = provider.def.url(email, verifierKey);\n",
    mustPrint: /the one door to the verifier no longer counts the check it is about to spend/ },

  // ── PART B: a dead key is known at boot ─────────────────────────────────

  // (B-1) the boot goes quiet about which checker is configured, so a run with
  // no checker at all looks exactly like a healthy one until a lead finds out.
  { name: '133-b-boot-stops-naming-the-checker', path: 'src/all.js', prove: 'boot',
    old: "      probeContactKeys().catch(() => {});\n",
    new: "",
    mustPrint: /MAILBOX CHECKER|HUNTER PROBE/, expect: 'GREEN' },

  // ── PART C: Confirmed means the owner's own mailbox ─────────────────────

  // (C-1) THE DEFECT, restored on the SERVER: the tier fallback outranks an
  // explicit grade again, so every published info@ is "verified" and the card
  // reads 5 confirmed on a batch with no owner mailbox in it.
  { name: '133-c-tier-fallback-outranks-the-grade-again', path: 'src/all.js', prove: 'clientcheck',
    old: "  if (g) return false;\n  return String(sendable) === 'true' && Number(tier) >= 1 && Number(tier) <= 2;\n",
    new: "  return String(sendable) === 'true' && Number(tier) >= 1 && Number(tier) <= 2;\n",
    mustPrint: /shared|confirmed|owner/ },

  // (C-2) and on the CLIENT: a shared mailbox is counted as confirmed, which is
  // the number the rep reads before he starts writing to receptionists.
  { name: '133-c-shared-inbox-counted-as-confirmed', path: 'index.html', prove: 'clientcheck',
    old: "  if (g === 'published_role') return sendableT12 ? 'shared' : 'unverified';\n",
    new: "",
    mustPrint: /counted as confirmed|shared inbox/i },

  // (C-3) the volume direction, which is the one that costs Vin his 50 a day: a
  // shared inbox stops being sendable or exportable and the file empties out.
  { name: '133-c-shared-inbox-stops-being-sendable', path: 'index.html', prove: 'clientcheck',
    old: "const emailSendableOf = (c) => !!(c && c.contactEmail) && String(c.contactEmailSendable) === 'true';",
    new: "const emailSendableOf = (c) => !!(c && c.contactEmail) && String(c.contactEmailSendable) === 'true' && emailStatusOf(c) === 'verified';",
    mustPrint: /sendable|export/i },

  // (C-4) the handshake number does not move on a round that changed
  // index.html, which is the only staleness signal there is (§104).
  { name: '133-c-contract-not-bumped', path: 'src/all.js', prove: 'clientcheck',
    old: "const CONTRACT_VERSION = 20261013;",
    new: "const CONTRACT_VERSION = 20261012;",
    mustPrint: /the handshake constants differ in the repo/ },
];
