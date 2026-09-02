# §108 — The score learns the ICP's own questions — 2026-09-02
Written 2026-09-02 for docs/history (one file per round; CLAUDE.md carries no history). Not a moved section: verify-split.sh skips it.

## 108. The score learns the ICP's own questions — 2026-09-02

Vin, after the Round 107 diagnosis: *"anything we can add as well that makes it
more strong to know these leads are our ICP take a look at what we have
already. there has to be more we want to make sure theyre in our icp and high
quality lead think outside the box and try and figure out if we are missing
signals and what we can add."*

### What was found

The FIT score asked seven questions (size, ads, hiring, demand, rating,
afford, reach) and none of them was the ICP's own: the ICP is *"founder-led,
$800k–$15M, where the owner reads his own email"*, and the score never asked
whether the owner visibly runs the place and never estimated the size band.
Five things were measured on every read and scored nowhere: live chat, online
booking, call tracking (only as the all-three penalty), the newest posting
date, and the tag container. The pages already in hand carried founding
years, "team of N", fleet sizes, location counts, financing offers and
commercial-client pages that nothing read. And no rule read the ownership
tells a page cannot hide: "a division of", "portfolio company", "backed by X
Capital", "serving customers nationwide", or the franchisee's disclosure
"independently owned and operated" beside the word franchise.

### What changed

All of it from pages and lookups the read already pays for; no new request.

- **`readFindProse`**, pure, over the text of every page read: the founder
  phrase ("family-owned", "owner-operated", "founded by", "second
  generation"...), the founding year (`since / established / est. YYYY`),
  the LARGEST published headcount ("team of 14 technicians"), fleet ("12
  trucks"), location count, a financing offer, a commercial-clients line.
  Each number is bounded to what a local business can be (a four-digit
  headcount is refused) and carried with the phrase it came from.
- **Three new terms** in `FIND_ICP_TERMS`, denominator-safe like the rest:
  `founder` (max 25: the owner named on their own pages +10, a founder phrase
  +8, the owner signing the review replies +7; two corporate titles on the
  leadership page → 0; unreadable and nobody named → unmeasured); `scale`
  (max 20: `estimateScaleBand`, best evidence first — verified headcount,
  published headcount, fleet, locations, tenure at real review volume — and
  always worded "estimated $X–$Y from ..."; it never reaches
  `permittedFigures`); `invests` (max 15: one or two marketing tools is the
  best prospect shape, none is 5, all five is 8).
- **`hiring`** reads two or more open field roles as growth (+4) and a
  posting within 90 days (+3), capped at 17 below the marketing role's 20.
- **Affordability** takes three more facts: financing offered (+4),
  commercial clients (+3), fifteen or more years in business (+3).
- **An over-range size band marks the lead down** through the declared
  table (`aboveScale`, −10, `CONTACT_RANK_TERMS`), after the ratio, so the
  denominator cannot move.
- **`readOwnershipTells`** beside the chain and nonprofit reads: `owned`,
  `franchise` or `national`, dropped before the paid wave with the reason on
  the drop line. "Independently owned and operated" alone is a locally-owned
  tell and never drops.

Deliberately NOT done this round, each because it needs `index.html` (a
contract bump and a Netlify drag-in) or a new fetch: the enrichment lane's
`verifiedRevenueBand` and the multi-market count are on the lead but not in
the contact request; review velocity from the bench needs the bench in the
contact read; Places `reviews`, the LSA badge, licence-board bond lines and
domain age each cost a call. Listed in the Round 108 plan for when Vin wants
the founder and scale bands as sheet columns.

### What the falsification runs found in the checks themselves

Nine reverts, each alone against the green baseline, each RED on the check
named for it, restored byte for byte (CR count 79845 = line count):

| revert | red on |
|---|---|
| founder term returns null for everything | FIND CONTACT CHECK (max-score and nobody-named fixtures) |
| over-range band not demoted | FIND CONTACT CHECK |
| no tools scored as the best shape | FIND CONTACT CHECK |
| ownership tells blind | FIND ICP GATE CHECK |
| tells verdict not applied to notIcp | FIND ICP GATE CHECK (call-site needle) |
| fleet bound removed (600 trucks accepted) | FIND CONTACT CHECK |
| tenure not read by affordability | FIND CONTACT CHECK |
| size band not handed to the demotion | FIND ICP GATE CHECK (call-site needle) |

Two things the falsification found in the round's own checks: the first
"bound" fixture (a four-digit headcount) was refused by the regex's own
`\d{1,3}` and never reached the cap, so reverting the cap left it green — a
fixture that measured the wrong guard (`check-writing-traps`: a fixture that
measures nothing); the same was true of the location cap behind a `\d{1,2}`.
The fleet cap is the one that decides a three-digit figure, and it is the
one now tested. And servercheck's scenario H asserted "7 of 7 signals" as a
literal; it now reads the count off the response (`icp.of`), so the next
term does not break it.

Boot: 274 checks green.

**274 boot checks green.** `bash ci-gates.sh` all stages. The contract is 20260926 on
both sides — `index.html` did not change.

**`index.html` did not change, so this needs no Netlify deploy.** Nothing to
run in Supabase, no env vars. The new sentences reach the rep through the
existing `icpWhy` and `affordWhy` columns.
