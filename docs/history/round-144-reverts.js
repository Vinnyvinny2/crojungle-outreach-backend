// Round 144 falsification. Each entry reverts ONE fix against a green baseline
// and must turn its OWN named check red. Five fixes, five guards: the tier
// reaching the row, the guess being marked, the CSV opening on Vin's table, the
// owner wave standing down, and the render failures being counted.
//
// A guard that stays green with its fix reverted is not a guard.
module.exports = [
  {
    // lanesFor returns seven keys and contactFieldsFrom copied four. The tier
    // was computed on every read, printed in the TARGET line, and dropped at
    // this exact boundary - so the sheet a rep dials off could not say whether
    // a business was a $900k shop or a $12M one.
    name: '144-a-the-tier-is-dropped-at-the-client-boundary-again',
    path: 'src/all.js',
    old: "    contactTier: (d.lanes && d.lanes.tier) || '',",
    new: "    contactTier: '',",
    prove: 'clientcheck',
    mustPrint: /the server stops sending the tier the TARGET line prints/,
  },
  {
    // Four of eight rows in the last live batch took their tier from a review
    // count. Without the marker the rep reads LOW off a guess exactly as he
    // reads it off a measurement, and the revenue band invents a dollar range
    // nobody measured - which is the one thing this system must never do.
    name: '144-b-a-guessed-tier-reads-as-a-measured-one',
    path: 'index.html',
    old: "  return c.contactTierMeasured === true ? w : (w + ' (guess)');",
    new: '  return w;',
    prove: 'clientcheck',
    mustPrint: /exports tier "LOW" - without the marker a rep reads a guess as a measurement/,
  },
  {
    // "get rid of these (batch_id, exported_date, owener confidence,
    // email_confidence)" - Vin, 2026-09-12. A column that merely moves into the
    // tail is still a column he deletes by hand after every paste.
    name: '144-c-the-file-no-longer-opens-on-the-table-he-asked-for',
    path: 'index.html',
    old: "const FIND_CSV_PREFIX = ['company', 'target', 'tier', 'revenueBand', 'website',",
    old_note: 'the first five columns ARE his table; swapping two of them is enough',
    new: "const FIND_CSV_PREFIX = ['company', 'tier', 'target', 'revenueBand', 'website',",
    prove: 'clientcheck',
    mustPrint: /does not open on the fixed 22 columns/,
  },
  {
    // 21 of the 32 credits the 2026-09-11 batch spent bought nothing, on three
    // leads in two consolidated categories whose own pages named nobody.
    name: '144-d-the-owner-wave-buys-nobody-at-a-consolidated-operator-again',
    path: 'src/all.js',
    old: '  const paidOwner = opts.paidOwnerLookup !== false && !_headOffice && !_ownerRisk;',
    new: '  const paidOwner = opts.paidOwnerLookup !== false && !_headOffice;',
    prove: 'boot',
    mustPrint: /the owner wave no longer stands down at a consolidated operator/,
  },
  {
    // A failed render costs zero in our ledger, so it moves no meter we have.
    // The only reason anyone knew half of them failed on 2026-09-11 is that a
    // human counted log lines off a screenshot.
    name: '144-e-the-render-failure-never-reaches-anything-that-counts-it',
    path: 'src/all.js',
    old: "    contactSiteRenderFailed: !!(d.site && d.site.renderFailed === true),",
    new: "    contactSiteRenderFailedUnused: !!(d.site && d.site.renderFailed === true),",
    prove: 'boot',
    mustPrint: /the render outcome is computed and dropped at the client boundary/,
  },
];
