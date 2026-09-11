// Round 135 — the owner's mailbox is actually asked for, and Confirmed names somebody.
module.exports = [
  {
    name: '135-a-the-upgrade-reads-the-cache-instead-of-probing',
    path: 'src/all.js',
    old: "        if (_catchAll === undefined) _catchAll = await isCatchAllDomain(domain, verifierKey);",
    new: "        if (false) _catchAll = await isCatchAllDomain(domain, verifierKey);",
    prove: 'boot',
    mustPrint: /reads the catch-all CACHE without ever probing/,
  },
  {
    name: '135-b-the-guesses-go-unbounded-again',
    path: 'src/all.js',
    old: "          : buildCandidates(name, domain).slice(0, SHARED_INBOX_TRY_MAX).map(c => c.pattern);",
    new: "          : buildCandidates(name, domain).map(c => c.pattern);",
    prove: 'boot',
    mustPrint: /guesses at every mailbox its builder knows again, unbounded/,
  },
  {
    name: '135-c-confirmed-stops-needing-a-name',
    path: 'src/all.js',
    old: "  if (g === 'published_personal' && !String(ownerName || '').trim()) return false;",
    new: "  if (false) return false;",
    prove: 'boot',
    mustPrint: /still counts as Confirmed, so the card claims an owner mailbox it cannot name/,
  },
  {
    name: '135-d-the-two-halves-disagree-about-confirmed',
    path: 'index.html',
    old: "  if (g === 'published_personal' && !String(c.contactOwner || '').trim()) return 'shared';",
    new: "  if (false) return 'shared';",
    prove: 'clientcheck',
    mustPrint: /page and the server disagree about whether/,
  },
];
