// Round 138 — an eponymous mailbox nobody could ask about stops shipping sendable.
module.exports = [
  {
    name: '138-a-the-unverified-eponymous-guess-ships-sendable-again',
    path: 'src/all.js',
    old: "        email: epEmail, ...EMAIL_TIERS.PATTERN_INFERRED, name, pattern: EPONYMOUS_PATTERN,",
    new: "        email: epEmail, tier: 3, score: 78, sendable: true, name, pattern: EPONYMOUS_PATTERN,",
    prove: 'boot',
    mustPrint: /ships SENDABLE again on a domain that can bounce/,
  },
  {
    name: '138-b-the-address-is-dropped-instead-of-shown',
    path: 'src/all.js',
    old: "        blockReason: `no email is sent to ${epEmail}: the business is named after ${name}",
    new: "        notTheBlockReason: `no email is sent to ${epEmail}: the business is named after ${name}",
    prove: 'boot',
    mustPrint: /dropped instead of shown with a reason/,
  },
];
