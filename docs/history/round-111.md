# §111 — One ladder, two lanes: the ICP band re-derived, the size measured, the sheet made the call list — 2026-09-03
Written 2026-09-03 for docs/history (one file per round; CLAUDE.md carries no history). Not a moved section: verify-split.sh skips it.

## 111. One ladder, two lanes: the ICP band re-derived, the size measured, the sheet made the call list — 2026-09-03

Vin, the morning after Round 110 went live: *"the reason I made the ICP so
wide, $800k–$15M, is because of reachability ... this was not well
researched and we have the whole system built around this."* Then, in the
same sitting and each through the question widget: *"our goal is booked
meetings and ICP high quality leads that can afford all tiers of our
service, and the decision maker is reachable"*; *"I doubt we ever get anyone
on the phone [at the high tier] ... maybe just keep that part for email"*;
*"keep what our ICP has been for cold calling and up it for email"*; *"the
gold standard is marketing spend should be 10% of revenue"*; and, on what
all of it was for: *"the rep asked for low / medium / high rating during
export for the sheets, that's all, and it just needs to be accurate."* And:
*"it should be for all our niches, not just home service."*

### What the research said (2026-09-03, sources named in the plan and in `business-and-icp`)

- **Phone favours the owner-run shape at any size.** Founders answering
  their own phone connect at 10–15% of dials; behind a receptionist 5–9%;
  gatekeeper-heavy 3–5%; VPs are the hardest title to reach live (7.3%);
  about eight attempts per decision-maker; 2–3% of dials become a meeting
  (Belkins, JustCall, Skipcall, Martal, Cleverly, SalesHive).
- **Email holds up where the phone fails.** Directors reply at 3–5%, 66%
  more than juniors; owners reply most of all; email is 8–15× cheaper per
  touch and the same rep hour yields 3–5× more pipeline (Woodpecker, Sopro,
  Saleshandy, Scaledmail).
- **The floor is affordability.** Home services spend 5–8% of revenue to
  hold and 8–12% to grow; Vin's rule is 10%. The premium retainer
  ($120k/yr) therefore needs $1.2M; the lower tier ($39k) $390k; the
  $35k/mo tier ~$4.2M.
- **The ceiling is where the decision leaves the building.** Under ~$10M a
  brand almost always uses an agency, $10–30M runs a hybrid with an
  in-house marketing head, above ~$30M it goes in-house (clicksgeek); PE
  platforms buy home-services operators at $3–30M (Beancount, CT
  Acquisitions, Profitability Partners, Pipeline On); the average Nexstar
  member is ~$7M.
- **The words hold by niche.** Under $800k is the owner and a helper in
  every trade we search (median solo contractor ~$78k; one truck
  $300–600k). The "established, staffed, owner still runs it" shape sits at
  $1–3M everywhere: the average HVAC/plumbing employer ~$2.9M at 12 people
  (Vertical IQ), a single-location med spa $1.8–2M, a dental practice
  $0.7–2.5M, a two-doctor vet practice $1.1–1.7M, a three-lawyer firm
  ~$1.6M, a stable PT clinic $0.8–1.3M. What varies is how many people make
  a dollar: ~$530k per lawyer, $550–850k per vet, $150k per landscaper,
  $70k per caregiver.
- **Honest limits.** The $1.2M line is a rule Vin set on the price list,
  not a measurement of who buys; no source measures the revenue at which a
  practice hires its first marketing director; every benchmark is an
  average and a single lead's revenue is never known — which is why the
  sheet carries the confidence word and why the size lookup below exists.

### Vin's rulings

- One ladder: **floor $800k** (his; *"still a viable business"*; the rep
  qualifies live and the lower tier is sold by Vin and David), **core from
  $1.2M** (the 10% rule), **upper from $10M**, **ceiling $30M**. Below the
  floor is benched and marked, never deleted; over the ceiling is dropped.
- The rep's words pinned to it: **low** = $800k–$1.2M, **medium** =
  $1.2M–$10M, **high** = $10M–$30M, plus the confidence word. Sort: core,
  then upper, then entry.
- Two lanes on the ladder: the **call lane** (owner within reach, entry or
  above) is the rep's CSV and Google Sheet and nothing else; the **email
  lane** (core or above with a named owner or marketing head) goes to
  Research. Layered businesses and TheirStack leads are email only (*"I
  don't think these should make the call sheet at all"*). An owner-run core
  lead is in both: call first, email if no connect. No outcome column (the
  rep tracks meetings elsewhere); direct numbers come from the dialer Vin is
  buying, not from this system.
- **Measure the size instead of guessing it**: when nothing is published,
  buy one lookup. All niches, one conversion table per trade.
- Two PRs: this one (the ladder, the lanes, the lookup, the call-lane sheet,
  size and target on the card); the two-lane table with a bulk action bar
  after a clickable mockup.

### What changed

- **`ICP_REVENUE_BAND`** `{ floor 0.8e6, coreFrom 1.2e6, upperFrom 10e6,
  ceiling 30e6 }` with `ICP_MARKETING_SHARE` 0.10 and
  `ICP_PREMIUM_RETAINER_MONTHLY` 10,000 (the `$10k` in `OUR_PRICE_FIGURES`);
  `ICP_REVENUE_PER_EMPLOYEE` $200k with `ICP_REVENUE_PER_EMPLOYEE_BY_TRADE`
  overrides (PI Law and Estate Law $175k, Accounting $150k, Tree Service and
  Hardscaping $150k, Home Care and Senior Care $70k, each with source and
  date); `ICP_REVENUE_PER_TRUCK` $300k. **Every cut is the table divided by
  the benchmark** (`scaleCuts`, `tierFromCount`, `tierFromRevenue`): the
  default staff cuts are 4 / 6 / 50 / 150 and the truck cuts 3 / 4 / 33 /
  100. `estimateScaleBand` returns the five tiers (`below_floor` / `entry` /
  `core` / `upper` / `over_ceiling`), reads a directory's stated revenue
  first, then the strongest headcount; `SIZE_TERMS` cuts are functions of
  the same cuts (medium = the core cut, high = one past the upper cut) so
  the sheet word and the tier cannot disagree; `SIZE_WORD` pins low /
  medium / high; the `size` term, the affordability team cuts, the
  discovery employee gate (`ICP_EMPLOYEE_WARN` 50 / `ICP_EMPLOYEE_BLOCK`
  150, replacing five literal 200s and 500s and the audit prompt's), the
  TheirStack query and the audit-leads ceiling all read the ladder.
- **The size lookup** in the contact read: only when `estimateScaleBand`
  is null, the Companies API by domain (free), then `findSizeViaSearch`
  (one snippet-only Firecrawl search + Haiku, already on the research
  path); the result is `directoryEmployees` / `revenueStated`, labelled a
  directory's, never `verifiedEmployees`. Log line `📏 SIZE LOOKUP`. The
  `companiesApiKey` joins the contact request; `affordBand` and the trade
  label reach the read.
- **`lanesFor`** → `out.lanes { call, email, tier, why }`: tier null falls
  back on the Find-time affordability band (premium → core, below_floor →
  below, else entry — "we did not look" never means "cannot pay"); call =
  entry/core/upper and not layered and not TheirStack; email = core/upper
  with a named target. `🎯 TARGET` and `📇 FIND CONTACT` print the tier and
  the lane.
- **Demotions**: `aboveScale` on `over_ceiling` always (a $30M+ buyer is
  corporate whoever was found); new `scaleBelowFloor` −10; the review
  ceiling mark still lifts when the marketing head is found.
  `GP_MAX_REVIEWS` default 750 → **2,000**.
- **TheirStack**: `min_employee_count` = the core cut (6),
  `max_employee_count` = the ceiling (150), 30 days, `job_location_pattern_or`
  from `GP_CITIES` (documented; if ignored, the run is nationwide as
  before and the log prints the pattern count); triage by tier (core 84,
  upper 76, entry 60, below 40); `📉 FIND YIELD` counts its leads per tier.
- **index.html** (contract **20260928**): the request carries `affordBand`
  and `companiesApiKey`; the merge carries `contactSizeTier`,
  `contactSizeSay`, `contactLanes`, `contactLanesWhy`; pure `laneOf`,
  `laneChip`, `exportableContact`; `findContactRows` and the panel count
  read `exportableContact`, so the CSV, the Sheet and the button are the
  call lane and nothing else; the read card shows the lane chip, size with
  its confidence and dollar band, and the target; `BAND_REVENUE` labels
  restated at $200k a head; `extraLanes` defaults ON when a TheirStack key
  is set, and a choice made on the box (`extraLanesSet`) still wins.
- **Checks**: `SIZE AND LAYERS CHECK` gains the derivation property (the
  cuts are the table ÷ the benchmark; the core floor is the retainer at the
  10% rule and a licensed price figure; the boundaries sit on the cuts; the
  gate is derived; the sheet word equals the tier word for 3 / 4 / 6 / 50 /
  51 / 150 / 151 employees; six people are a core HVAC shop and an entry law
  firm; every per-trade row names a searched trade with a source and a
  date), the lane fixtures both ways, the call-site needles (lanes
  returned, trade label passed, the lookup bought and only when nothing
  was published, the gate and the TheirStack query on the ladder) and a
  runtime-assembled needle that refuses a literal 200 or 500 gate anywhere;
  the scale fixtures moved to the new tier names; `clientcheck.js` executes
  the lane split (Darrel on the sheet, a layered business and a TheirStack
  lead and a below-floor row off it, an older row without lanes still on
  it, the Sheet payload reading the same rule).
- Prose: `business-and-icp`, `owner-decisions` (three lever rows),
  `find-and-contact-list`, `new-niche-playbook`, `log-vocabulary`; the
  reference files regenerated.

Deliberately NOT done: the two-lane table with the bulk action bar (PR 2,
after the mockup Vin asked for); a marketing-director version of the email
(the email is still written for "one busy owner"); an outcome column
(Vin: the rep tracks meetings elsewhere); direct dials (the dialer);
raising the per-press cap (`FIND_RUN_MAX` 300 — the overflow banks in
`lead_bench`; the next press's `📉 FIND YIELD` tier rows say whether to
raise it).

### What the falsification runs found in the checks themselves

Each revert alone against the green baseline, each RED on the check named
for it, restored byte for byte (CR count = line count throughout):

| revert | red on |
|---|---|
| the rep's staff cuts back to literals (60 / 10) | SIZE AND LAYERS CHECK (medium is not the core cut) |
| the core floor moved alone to $1.5M | SIZE AND LAYERS CHECK (not the retainer at the 10% rule) |
| the size lookup bought on every lead | SIZE AND LAYERS CHECK (the guard needle) |
| a layered row back on the rep sheet | clientcheck.js (the lane fixtures) |

What the checks caught in the round's own work: `FIND ICP GATE CHECK`'s
call-site needle for the scale band was written against the old
one-liner and went red the moment the band was computed after the lookup
(re-aimed at the new line); `clientcheck` refused a fixture that read a
layered business off the rep's rows (it is email only now, so the fixture
reads the cells directly and asserts the row is absent), the export
population needle, and the `extraLanes` control regex once the box also
records that a choice was made. And servercheck's scenario H caught the
ladder being applied to a team PAGE: three people on a page read as "under
the floor" and the fixture lead scored 67 — a page count is a floor, not a
headcount ("a forty-person firm may publish four"), so from three people
up a page reads as a real crew and only a VERIFIED count can put a business
under the floor; the same rule keeps the affordability band's "tiny" mark
at one or two people off a page. The first lane-rule draft also overwrote
the read's own affordability band with the Find press's (scenario H: "the
affordability band is not reaching the contact score"); the Find-time band
is now kept beside it as the fallback only. And the size lookup was bought
on a lead with no website (scenario H3: "a lead with no website still spent
Firecrawl credits") — it now needs a website, by the rule the free read
already keeps.

**275 boot checks green.** `bash ci-gates.sh` all stages. **The contract is
20260928 on both sides.**

**`index.html` changed, so this NEEDS the Netlify drag-in** (one drag covers
Rounds 110 and 111). Render env: nothing required; `GP_MAX_REVIEWS` only if
Vin wants the old 750 back. Settings: the Hunter key turns the marketing-head
lookup on, the TheirStack key turns that lane on by default, the Companies
API key makes the size lookup free before the 1-credit search.
