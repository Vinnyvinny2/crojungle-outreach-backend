// Round 142 — the website verdict can flag something, because it reads the free
// code half as well as the picture. Every revert reproduces a defect that
// shipped on the 2026-09-11 ten-lead run, where nine of nine leads read modern.
module.exports = [
  {
    // The live defect: "the design is starting to show its age" is worth 1 and
    // the band started at 2, so the only fault the eyes ever raised could not
    // reach it. Vin ruled on 2026-09-11 that aging counts as dated.
    name: '142-a-starting-to-show-its-age-reads-modern-again',
    path: 'src/all.js',
    old: 'const SITE_LOOKS_DATED = 1;',
    new: 'const SITE_LOOKS_DATED = 2;',
    prove: 'boot',
    mustPrint: /Vin ruled on 2026-09-11 that it counts as dated/,
  },
  {
    // The free read said "the build is years out of date" on Journey Treatment
    // and the verdict called it modern, because it only looked at the picture.
    name: '142-b-the-free-code-read-is-thrown-away-again',
    path: 'src/all.js',
    old: '  const _score = _faults.reduce((n, f) => n + f.points, 0) + _codeScore;',
    new: '  const _score = _faults.reduce((n, f) => n + f.points, 0);',
    prove: 'boot',
    mustPrint: /the free read that DID notice is being thrown away/,
  },
  {
    // Invisible faults back in how a site LOOKS - the exact defect Vin asked
    // about, one missing schema tag crossing a band nobody can see.
    name: '142-c-a-schema-tag-makes-a-website-look-bad-to-a-visitor',
    path: 'src/all.js',
    old: "const SITE_LOOKS_VISIBLE_GROUPS = ['build', 'converts'];",
    new: "const SITE_LOOKS_VISIBLE_GROUPS = ['build', 'converts', 'geo'];",
    prove: 'boot',
    mustPrint: /crosses a band on a fault nobody can see/,
  },
  {
    // The function stops filtering and trusts its caller again - which is how
    // this round's own check caught the bug in this round's own fix.
    name: '142-d-the-verdict-trusts-whatever-faults-it-is-handed',
    path: 'src/all.js',
    // Two lines, because the one-line form also appears inside this round's
    // own check as half of a needle - the self-matching trap, in a revert.
    old: "  const _code = (Array.isArray(codeFaults) ? codeFaults : [])\n    .filter(f => f && SITE_LOOKS_VISIBLE_GROUPS.indexOf(f.group) >= 0);",
    new: "  const _code = (Array.isArray(codeFaults) ? codeFaults : [])\n    .filter(f => !!f);",
    prove: 'boot',
    mustPrint: /no longer filters the code faults it is handed/,
  },
  {
    // A lead whose picture failed but whose markup says the build is years out
    // of date goes back to being unknown, when the free read already judged it.
    name: '142-e-a-lead-the-markup-already-judged-goes-back-to-unknown',
    path: 'src/all.js',
    old: "  const _unknown = (why) => (_code.length",
    new: "  const _unknown = (why) => (false",
    prove: 'boot',
    mustPrint: /the free read already judged it and the verdict is discarding that/,
  },
  {
    // The question a desktop screenshot cannot answer comes back, and two of
    // the eleven points go dead again.
    name: '142-f-the-eyes-are-asked-a-question-the-picture-cannot-answer',
    path: 'src/all.js',
    old: "  { id: 'cheapPhotos', points: 1, say: 'the pictures are stock, stretched or blurry' },",
    new: "  { id: 'cheapPhotos', points: 1, say: 'the pictures are stock, stretched or blurry' },\n  { id: 'desktopOnly', points: 2, say: 'the page is laid out for a desktop screen, so a phone gets it shrunk down' },",
    prove: 'boot',
    mustPrint: /from a DESKTOP screenshot/,
  },
  {
    // The drop stops refusing the verdict and only refuses the spend, so a
    // franchise comes back graded on its own markup. Found by servercheck's
    // own drop-discipline assertion the first time the full suite ran.
    name: '142-g-a-business-the-system-refused-comes-back-with-a-website-grade',
    path: 'src/all.js',
    old: "_looksSaw = readSiteLooks(null, _buy.why, _buy.reason === 'dropped' ? [] : _freeSeen);",
    new: "_looksSaw = readSiteLooks(null, _buy.why, _freeSeen);",
    prove: 'boot',
    mustPrint: /dropped as a franchise, a branch or a chain is graded on its own markup anyway/,
  },
];
