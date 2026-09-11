// Round 140 — the owner's own mailbox is asked for before ANY other person's,
// not only before a front desk. Each revert reproduces a defect that shipped on
// the 2026-09-11 ten-lead run, and reddens an assertion only it can reach.
module.exports = [
  {
    // The live defect: JFK Window & Door published megan@ and the owner is John
    // F. Karle; Wasatch Recovery published ryan@ and the owner is Mark Richards.
    // Both shipped the colleague as the lead's email with nothing tried for the
    // owner, because this gate asked whether the address was GENERIC.
    name: '140-a-a-colleague-inbox-closes-the-owner-mailbox-search-again',
    path: 'src/all.js',
    old: '    if (!_isOwnMailbox && name && verifierKey) {',
    new: '    if (isGeneric && name && verifierKey) {',
    prove: 'boot',
    mustPrint: /gated on the published address being GENERIC again/,
  },
  {
    // A colleague's real mailbox read as identical to the owner's own on the
    // rep's row - same tier, same label, same score 100.
    name: '140-b-a-colleagues-mailbox-is-labelled-like-the-owners-own',
    path: 'src/all.js',
    old: "    else if (!_isOwnMailbox && name && _kind === 'person') _marks.push(`a colleague's mailbox, not ${name}'s`);",
    new: "    else if (false) _marks.push('unreachable');",
    prove: 'boot',
    mustPrint: /cannot tell that an email opening with the owner's first name would land on somebody else's desk/,
  },
  {
    // The swap succeeds and nothing records it, so the owner's own confirmed
    // mailbox is then described as a colleague's and scored below a front desk.
    name: '140-c-a-confirmed-owner-mailbox-is-not-recorded-as-his',
    path: 'src/all.js',
    old: '              _isOwnMailbox = true;',
    // A no-op duplicate of the line above it: this must COMPILE, so the red
    // comes from this round's own guard and not from SCOPE CHECK noticing an
    // undefined binding. A revert that trips a different check proves that
    // check, not this one.
    new: '              isGeneric = false;',
    prove: 'boot',
    mustPrint: /is not recorded as his/,
  },
  {
    // Two sentences about one measurement: a lead whose owner mailbox WAS
    // confirmed is also told it could not be.
    name: '140-d-a-confirmed-lead-is-also-told-its-owner-mailbox-could-not-be-confirmed',
    path: 'src/all.js',
    old: '          if (!_isOwnMailbox) console.log(`EMAIL [${domain}]: their site publishes ${_pubSay}',
    new: '          if (true) console.log(`EMAIL [${domain}]: their site publishes ${_pubSay}',
    prove: 'boot',
    mustPrint: /no longer guarded on the outcome/,
  },
];
