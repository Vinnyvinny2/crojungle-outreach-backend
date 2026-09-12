# Round 143A — the press stops deleting the businesses we want, and starts catching the fakes it never looked for

**Shipped 2026-09-12. Server AND client. Contract bumped 20261017 → 20261018 — `index.html` needs
the Netlify drag, and Round 141's drag is still outstanding, so one drag serves both.**

Built by four agents in parallel worktrees and merged serially. **Everything in "What the merge
found" is a defect that did not exist until their work was combined** — which is the argument for
the serial merge, and the thing four green reports could not have told anyone.

## Why: the press deleted the target and protected nobody

Vin, 2026-09-11, from his own cold-calling years:

> *"i would start with the last page of google page 20 on like home service companeis and i would
> almost always get owner and convo's... the reachbility was insane"*

The research said his instinct was right and his explanation was wrong. Those businesses were not
failing — **they had never asked for reviews.** US home services collect a median of **2 Google
reviews a month** (ProsperQR, 816,307 reviews / 3,739 businesses), so the 40-review floor in eight
trades was really *"has been asking for twenty months."* A 20-year-old $4M plumbing company that
never asks sat in the low double digits and was deleted before anyone looked.

The floor was also mis-set per trade. Median review count of businesses **actually ranking in
Google's top three** (Local Falcon, 50.4M results, 1,993 categories): construction 20, general
contractor 28, tree service 47, electrician 56, roofing 79, garage doors 137, plumber 215, HVAC
244, pest control 265. **A 40 floor in tree service and electrical deleted businesses already in
the 3-pack.** BrightLocal (93,845 businesses): 26% of local businesses have zero reviews, and 20%
of those ranking in the top three local positions have none at all.

**And it did no anti-spam work, which is what everyone assumed it was for.** The FTC's May 2026
action over Premium Home Service documents **15,000+ fake profiles in these exact trades**, run
eight years, rated 4.1–5.0. Review counts on the named fakes: **Ramseys Electric 2, Levine Heating
14, Adani Electrical 37.** Fakes buy reviews at ~$5 each; a flat-out owner-operator has no process
for asking. The floor selected *for* businesses that farm reviews.

## The tests that must never be built

Measured and refuted. Each would delete real owner-operated businesses at a higher rate than fakes,
and those businesses are the entire target market. `SPAM TEST BAN CHECK` pins their absence **by
name**, with the evidence in the comment, so a later round cannot quietly add one:

| Test that sounds right | Why not |
|---|---|
| Keyword-stuffed name | **Anti-correlated.** Garage door repair: 87.6% removal, **0.15%** stuffed. The FTC's fakes were *"Levine Heating and Cooling"* — surname + trade |
| No website / free builder | ~35% of suspended listings had none either — **and it is the ICP signal itself** |
| Residential address | Google *instructs* home-based plumbers to hide it. The fakes used commercial addresses — a donut shop, an Arby's, a wine bar, a town-square fountain |
| Toll-free / tracking number | The fake operation used **250+ local area codes** |
| Open 24/7 | In the FTC's own exhibits the **legitimate** competitors showed "Open 24 hours"; the fake showed "Closes 8 PM" |
| VoIP carrier lookup | 2015 data only, and adoption among real contractors has risen enormously |
| Thin content / stock photos | That is a real small contractor's cheap website |

**What works is cross-lead collision** — one number under different names in different metros. Naive
sharing is dominated by real chains (a number on 99 listings is only 26.9% abusive), so
name-variance *and* metro-variance are both required.

## What shipped

- **The review floor demotes instead of deleting**, and is **derived** per trade —
  `min(median, base, max(5, median/10))` — so no trade's floor can exceed its own 3-pack median by
  construction. Knob `GP_FLOOR_MODE=cut` restores the delete.
- **Four free Google fields** the press never asked for: `consumerAlert`, `pureServiceAreaBusiness`,
  `containingPlaces`, `movedPlaceId` (plus the sibling `movedPlace`). All Essentials or Pro tier and
  the mask already bought Enterprise, so they cost nothing. **A mask Google refuses falls back to
  the ten fields the press used for months** — derived by removal, never a second copy — so one
  wrong field name costs the flags rather than the whole run.
- **`consumerAlert` is honoured by kind, not degree** (there is no severity scale). The classifier
  reads **prose only** — `overview`, `details.title`, `details.description`, named explicitly.
  **`details.aboutLink` is excluded by construction** and travels on its own key for the rep: that
  link points at a Google support page about *policies*, so a reader that swept every string matched
  the policy pattern on essentially every alert, and an alert saying nothing about reviews dropped
  the lead. The safe default — demote — was unreachable for every case it exists for.
- **Phone-collision detection**, a sibling to `detectChainOutlets` rather than an extension: that one
  flags the *same* brand in three metros (a franchise), this one *different* names on one number (a
  call centre). Folding them together would print the franchise sentence about a fake listing.
- **Dead listings dropped** — closed, or moved under either field spelling.
- **`marketCount` into the press score**, +3 a metro capped at +9. It was computed, logged as *"the
  affordability bar measured rather than inferred"*, and the score never read it.
- **The −14 no-website penalty removed.** A business with no website is the purest website-sale
  prospect; docking it was backwards once websites became the pitch.
- **The yield report can no longer name the survivors as the biggest loss.** Rows are objects with a
  declared `loss` flag and the window is anchored on the `returned` row **by name**, so a row
  appended after it — as Round 114 does — cannot corrupt the ranking. A flagged loss *after* the
  anchor is refused by name rather than dropped in silence.
- **The fake Google returns businesses.** `servercheck` drove a press for months against a fixture
  that answered with nothing, because the scenario sent `niches:['roofer']` against the label
  `'Plumbing'` and `'Dallas, TX'` against `'Dallas TX'`. Both lists came out empty, the press dealt
  a grid of **zero queries**, spent nothing and returned 200. Five further assertions sat inside a
  dead `else`. **That is why three rounds of press-side rules had never executed.** A 24-listing
  cast now proves each rule, and Round 139's branch-URL drop ran for the first time.

## What the merge found — none of it visible to a single agent

1. **The discovery comparator read four demotion reasons in `ba` and three in `bb`.** A listing
   Google itself flags sorted **first** whenever it arrived before an in-band lead — the bench
   promise broken by the comparator while every gate stayed correct. The boot needle pinned only
   `ba`, which is why it stayed green. Both halves are pinned now. **Mine, introduced while fixing
   the other half.**
2. **`skippedListingRisk` and `skippedListingPhone` were incremented, printed on their own log
   lines, and never assigned to the tally the report reads.** A run that deleted seven listings
   reported losing one. Computed-but-not-passed, one line each. Both assignments are now pinned.
3. **Both new demotion reasons changed the SORT and not the NUMBER** — re-earning the contradiction
   [§110](round-110.md) removed for the first two: a card reading 90 sitting below a card reading 60
   with nothing on screen explaining it. Both now carry terms in `CONTACT_RANK_TERMS`.
4. **A gratuitous rename**, `demotedUnderFloor` the counter against `underFloorDemoted` the tally
   key, which would have made the count silently never print.
5. **Two boot needles pinned row syntax another agent had restructured**, and one existing check
   (`ICP FILTER CHECK`) **asserted the exact opposite of the fix** — it required every high-volume
   trade to sit *above* the base floor, which is how the 40 got there. Re-aimed to hold both
   directions, so nobody can satisfy it by deleting the floor.

## Proven

```
node docs/gen-refs.js                  ✓
node build.js --check                  ✓ 90,614 lines, CRLF, byte for byte
GATES=static bash ci-gates.sh          ✓
node clientcheck.js                    ✓ exit 0
node servercheck.js                    ✓ exit 0 — 299 assertions, press driven over a real fixture
boot                                   ✓ GREEN — 308 checks (was 304), 1 expected decline, 0 failures
node falsify.js round-143a-reverts.js  ✓ 5 of 5 RED on their own named line, tree restored byte for byte
bash ci-gates.sh (all stages)          ✓ ALL GREEN — fuzz: 2,112 emails, every invariant held
```

Driven end to end over the fixture, not asserted: of 24 listings Google hands the press, a
12-review 20-year-old business **survives and reaches the rep**; a phone-collision pair is
**dropped** while a real two-branch chain on one number **survives**; both moved spellings drop; a
policy alert drops; a review alert is **demoted and carries Google's own words**; and **Cochran
Chapel Plumbing — whose only "policy" words are in Google's help link — is kept**. The line adds
up: **24 seen − 8 deleted − 3 merged = 13 returned**, asserted as an identity.

**No check was deleted or disabled.** Several were re-aimed, each with the reversal recorded beside
the assertion.

## Needs your eyes

- **Drag `index.html` into Netlify.** Contract `20261018`. Round 141's drag was never done, so this
  one carries both — the bad-websites toggle AND the two new bench reasons.
- **Press Find, then read a batch.** Nothing here is live-validated. The lines to read are
  `LISTING RISK`, `PHONE COLLISION`, `FLOOR DEMOTED` and the two new `FIND YIELD` rows. **Watch for
  a mask refusal on the first press** — if a field name is wrong Google answers `INVALID_ARGUMENT`,
  and the fallback should log that it dropped to the ten-field mask rather than returning nothing.
- **The wording Google puts in `consumerAlert` is declared, not measured.** No live response has
  been scored through this build. That is why it is patterns with a safe default rather than a rule.
- **Med spas still carry a 40-review demotion bar with no measurement behind it.** The formula caps
  a *measured* trade at 15 and leaves an *unmeasured* one at 40, which is backwards — a trade we
  measured gets a lower bar than one we did not. It only sorts now, so nothing is deleted, but
  med spas are the best category the research found and this is a judgement rather than a finding.
- **Two scoring bars moved with the floor.** `affordabilityBand`'s thin-volume penalty and
  `placesTriageScore`'s low-rating lift both key off `reviewFloorFor × 2`, so tree service's bar
  fell from 80 reviews to 10. The direction follows the same evidence; it is still a distribution
  change nobody asked for.
- **A named-owner no-website lead now crosses the "predicted findable" line**, and the closed loop
  scores that against finding an *email* — a yardstick from the email lane applied to a phone lead.
  Expect MISS lines that are not the predictor getting worse.
- Carried: `hunterFindPersonEmail failed: timeout` still logged as "their index has no address";
  `findSizeViaSearch` still crashes twice a run, swallowed; the per-category cap is still an
  unexercised press rule.
