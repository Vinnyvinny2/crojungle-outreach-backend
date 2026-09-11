// Round 137 — the Hunter finder escapes the probe gate, and says what it did.
module.exports = [
  {
    name: '137-a-the-finder-goes-back-inside-the-probe-gate',
    path: 'src/all.js',
    old: "  const _hfLate = await _askHunterForTheirOwnMailbox();\n  if (_hfLate) return _hfLate;",
    new: "  const _hfLate = null;\n  if (_hfLate) return _hfLate;",
    prove: 'boot',
    mustPrint: /no call site outside the probe gate/,
  },
  {
    name: '137-b-the-probe-branch-stops-asking',
    path: 'src/all.js',
    old: "    const _hfOwn = await _askHunterForTheirOwnMailbox();\n    if (_hfOwn) return _hfOwn;",
    new: "    const _hfOwn = null;\n    if (_hfOwn) return _hfOwn;",
    prove: 'boot',
    mustPrint: /probe branch no longer asks the Hunter finder/,
  },
  {
    name: '137-c-a-skipped-lookup-goes-silent-again',
    path: 'src/all.js',
    old: "the Hunter email-finder was NOT asked - ${_why}",
    new: "the Hunter email-finder outcome - ${_why}",
    prove: 'boot',
    mustPrint: /cannot tell "we did not ask" from "we asked and there was nothing"/,
  },
  {
    name: '137-d-an-empty-lookup-goes-silent-again',
    path: 'src/all.js',
    old: "the Hunter email-finder WAS asked for ${name} and its index has no address",
    new: "the Hunter email-finder result for ${name}: no address",
    prove: 'boot',
    mustPrint: /came back empty prints nothing/,
  },
  {
    name: '137-e-the-finder-probes-a-host-that-stalls',
    path: 'src/all.js',
    old: "      if (verifierKey && !_stalls) {",
    new: "      if (verifierKey) {",
    prove: 'boot',
    mustPrint: /even on a host that stalls probes by design/,
  },
];
