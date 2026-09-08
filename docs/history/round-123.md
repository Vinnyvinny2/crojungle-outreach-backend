# §123 — The queue: the trades re-tiered on sourced job values, and the metros wait on the pool the memory already holds — 2026-09-08
Written 2026-09-08 for docs/history (one file per round; CLAUDE.md carries no history). Not a moved section: verify-split.sh skips it.

## 123. The queue: the trades re-tiered on sourced job values, and the metros wait on the pool the memory already holds — 2026-09-08

Vin, after Round 122: *"ok lets dive into that lets be throiughough ak me eveyr
single question u need to know."* The "that" was the queue — the trade searches
and metros a Find press spends its budget on — and the standing ask was on the
record twice (`owner-decisions`: *"Vin knows the niches; a deeper correctness
pass is owed"*; `business-and-icp`, 2026-09-02: *"the niche list still needs a
deeper pass to confirm every searched trade is correct and ideal"*). Asked what
should decide the list, he ruled **research only**, **queue first, outcomes
next**, and that the rep's outcomes stay in *"a google sheet never read by the
app"* — so this round builds no outcome capture.

### What the queue was, measured from the code

**55 declared trades, not 53.** `docs/gen-refs.js` counted LINES inside
`GP_CATEGORIES`, and two lines carry two trades each, so `tables.md` and the
`owner-decisions` register both said 53 while the boot printed 55. The counter
counts objects now. **23 metros sampled equally; 100 Places queries a press**,
dealt round-robin across every searched trade × metro pair (1,265 pairs) with
the query memory resting a dry pair 30 days. At Find time the tier did two
things only: C is never searched, and the tier feeds the affordability band.
Nothing in docs/history measures yield per trade or per metro; the only
outcome data is §117's four booked meetings (a $255M PE paver, a Richmond
remodeler, a medical practice, a solo CPA). And three comments had rotted:
"twenty metros" (three places), "114 rows in GP_CATEGORIES" (two), "ELEVEN
terms" (one). Fixed in passing.

### The rule, so a row can be argued with

$10k a month is $120k a year; at Vin's 10% rule that needs $1.2M of revenue,
which is `ICP_REVENUE_BAND.coreFrom`. **A** when the typical INDEPENDENT firm
clears $1.2M, one job is $5k or more, and the owner still signs. **B** when the
big ones fit and the typical one does not — the review floor and the size read
sort them. **C — benched, never searched, never deleted; `GP_INCLUDE_TIER_C=1`
puts them back** — when the average job is under about $3k AND the typical firm
is under $1.2M AND the firms that do fit are the ones private equity is already
buying, or the buyer normally does not exist (a chain, a REIT, referral-only
work). Benching frees the pairs: **39 searched trades instead of 55 is about
2.6 queries per trade per press instead of 1.8, for the same $2.10.**

Three research passes fed it — 35 home-services trades, 20 practice types, the
23 metros and ten candidates — every figure with a source URL and year, "not
found" where none was found. The tables are at the end of this note. **Evidence
quality, stated plainly:** job values are Angi / HomeAdvisor / Cost-vs-Value /
ASPS / ADA-class sources; "typical firm revenue" is often an IBISWorld market
size divided by a firm count, a mean over a long tail that understates the modal
firm we want; the two disagreements with the 2026-08-28 comments (Insulation's
spray-foam ticket, Garage Doors' and Tree Service's "size, not category")
are kept in the code beside the new row, not overwritten.

### The moves (`CATEGORY_TIER`, rewritten with a sourced comment per row)

- **A (20):** Roofing, Commercial Roofing, HVAC, Kitchen Remodel, Bath Remodel,
  Construction (design-build), Home Additions, Home Builder, Pool Construction,
  Windows & Doors, Siding, Basement Finishing, Paving, Plastic Surgery,
  Orthodontics, PI Law, Behavioral Health (screened), Dental Implants, Cosmetic
  Dentistry — and **Med Spa, promoted from B.** AmSpa 2024: the average med spa
  takes $1.4M, spends ~7% of it on marketing, is single-owner two times in three
  and PE-owned about 3% of the time. The 2026-08-28 demotion described the modal
  one-injector shop; the average clears the core floor and an NP or MD owner
  signs. Its capacity class is `mixed` now (it was `solo`, which capped it at
  the lower tier however it scored) and its review floor is 40, because a $536
  visit earns a review the way a service call does.
- **B (19):** Concrete, Electrical, Plumbing, Decks, Signage, Dental, Senior
  Care, Home Care, Managed IT unchanged — and ten demoted from A on the
  published average against the tier's own claim: **Restoration** ($3,833 a
  job, not "five figures"; insurer networks route the claims), **Foundation**
  ($5,175; Groundworks consolidating a $2.9B market), **Solar** ($29k median,
  but the 30% credit ended in December 2025 and acquisition costs 24–34% of the
  ticket), **Hardscaping** ($9,000 a project), **Outdoor Living** (an outdoor
  kitchen is $13,180 and a pergola $4,251, not $40–150k), **Cabinetry** (sells
  through remodelers and dealers), **Well & Septic** (need-driven), **Commercial
  Mechanical** (bid-led), **Dermatology** (medical derm needs no lead
  generation), **Oral Surgery** (referral-fed).
- **C (16):** Tree Service, Garage Doors, Pest Control, Flooring, Insulation,
  Coatings, Fire Protection, Excavation, Masonry, LASIK, Veterinary, Accounting,
  Estate Law, Insurance, Funeral Homes, Weight Loss — each with its figure in
  the code. Two dissents are recorded rather than erased: Garage Doors and Tree
  Service were restored from C on 2026-08-28 on *"size, not category, is the
  filter"* behind the 40-review floor, and the research says that floor finds
  the $3M+ operators PE is already buying; and a solo CPA booked one of the
  four §117 meetings, so Vin's hedge (*"it's better to never find out if we cut
  it"*) applies to Accounting. C is a bench, not a delete, for exactly this.

**Money lines** (`TRADE_JOB_VALUE`, the only figure an email may carry): the
restoration row said "five figures" and the published average is $3,833, so it
reads **$2k–$8k, and a large loss more**; foundation "five figures" → **$2k–$16k**;
outdoor living **$40k–$150k → $5k–$25k**; the deck row carried the fence in one
$5k–$25k figure, and Cost vs Value 2025 puts a plain wood deck at $18,263 and a
composite one at $25,096, so a deck or patio reads **$15k–$30k** and a fence
gets no row at all — no money line is the honest outcome, as the law row already
chose. A new row ahead of the driveway one prices **a commercial lot at
$50k–$250k**, because the **Paving query is `commercial paving contractor`**
now: `paving contractor` returned the residential driveway trade, whose mean
firm is ~$126k, while the tier note had said all along that the parking-lot
operators are the ICP. The brief key moved with the query.

### The metros did not move, and why

The plan ranked Cleveland, Louisville and Salt Lake City out and Orlando,
Washington DC and Sarasota in — on population growth, household income and the
rep's calling window. Vin stopped it: **"you don't actually know if Orlando has
more pool contractors than Louisville."** He was right. Growth and income rank
the BUYERS in a metro, not the SELLERS the press searches for, and every
establishment-count source (Census CBP, BLS QCEW, DataUSA, DataForSEO) is
blocked from the build sandbox.

**The number already existed and is better than a Census count.** Every press
writes one row per trade × metro pair into `places_query_state`: how many times
the pair was searched, how many NEW businesses the last search returned after
the review floor and the franchise rule, and how many runs in a row returned
nothing. That is the pool we can actually sell to, per trade, per metro, and
its only reader was the freshness sort. `poolByDimension` groups it (pure, so
the boot executes it), **`📊 POOL BY METRO` and `📊 POOL BY TRADE`** print at
the end of every press from the memory the run just wrote (no extra call), and
**`GET /api/find-pool`** returns both tables. A name with no searched pair is
UNMEASURED and ranks after every measured one — "we did not look" has never
meant "nothing there". The loader fetches `cat`, `city` and `last_new` now.

Before any press, the same table answers in the Supabase SQL editor:

```sql
select city, count(*) as pairs, sum(runs) as runs, sum(last_new) as new_last_run,
       round(100.0 * sum(case when dry_streak > 0 then 1 else 0 end) / count(*)) as pct_dry
from places_query_state group by city order by new_last_run desc;
```

(and `cat` for `city`). Read `last_new` beside `runs`: it is the LAST run's new
businesses, so a pair searched many times reads lower than a fresh one. The
research below stays on file as the tie-breaker. Vin also flagged the other half
of the same idea — **supply against demand**: *"if there's 10k plumbing
businesses the supply might be higher than the demand … 90 plumbers in a 20-mile
radius."* The pool by trade × metro is the supply side; the demand side is
search volume per trade per metro, which the DataForSEO Labs credentials the
app already holds can price. Deferred to a round with the first two presses of
pool data in hand.

### Vin's ruling on the cut, the same day

Shown the sixteen benched trades, Vin set the rule the tier list should have
used: *"can they afford us at all? if the answer is yes they should be in
there."* That is the $800k floor of the ladder, not the $1.2M core, and it is
a better rule because the lower tier exists to be closed when the fit is right.
Ten came back to B on it, each because the TYPICAL firm clears the floor:
garage doors (~$960k), pest control, fire protection ($500k–5M regionals),
excavation (~$862k mean), masonry (~$1.8M mean), LASIK (a solo ophthalmology
practice is $800k–1.3M), vets (~$1.5M a practice, AVMA 2024), accountants,
insurance agencies (half over $500k), funeral homes (~$1.1M a location). Six
stay benched because the typical firm cannot pay any tier: tree service
(~$226k), flooring (~$307k), insulation (~$472k), epoxy coatings, estate law
(solo firms), weight-loss clinics. **49 searched of 55.** Then flooring and
insulation too, on Vin's word that the big firms exist (*"there's huge companies
of those niches"*), both behind the 40-review floor that finds them. **51 of 55.**

The same day's first press on the 39-trade grid ran only 24 Google searches,
because the bench already held 1,000 paid-for leads and the rep had a week's
work queued — so the pool measurement moves at 24 pairs a press and the metro
swap is not two presses away; it is weeks away, or ruled on the research. Vin
also said the side lanes (jobs, funding, news, for-sale) should be off: that
press spent TheirStack and Firecrawl credits sizing Tyson Foods, LVMH, IMAX and
Six Flags.

### What else changed, at the root

- **`COVERAGE RADIUS CHECK` asserts `GP_CITIES` and `Object.keys(GP_CITY_COORDS)`
  are one set, both directions.** The playbook said the two lists "move
  TOGETHER" and nothing enforced it: a metro searched with no coordinate booted
  green and the coverage finding silently stopped firing for it. Built now so
  the next metro swap cannot ship half.
- The `placesTriageScore` solo fixture used Med Spa as its solo example; it
  uses Weight Loss now (still solo). Falsified: put Med Spa back with its new
  class and the fixture goes red, which is the fixture being live.

### What the falsification runs found

**Twelve reverts, each applied alone against a baseline the harness proves
green first, each RED on its own named assertion, each restored byte for byte;
plus the generator counter reverted by hand (the refs linter goes red on the
53).** A metro searched with no coordinate and a coordinate never searched both
red on `COVERAGE RADIUS CHECK`; the pool read red when an empty name counts as
measured, when the line hides the unmeasured, when the dry share miscounts, when
a row without its own city stops grouping off the key, when the loader fetches
the old columns, and when the press or the route stops calling it; the paving
brief key red on `NICHE BRIEF COVERAGE`; and the solo fixture red the moment
Med Spa is put back in it with its new class, which is the fixture being live.

**One revert stayed GREEN on the first run and was right to.** Dropping the
measured-first term from the pool sort left the fixture green, because the
unmeasured name was Orlando and the tie fell through to the alphabet, where
Cleveland happens to precede it. The fixture's unmeasured name is Atlanta now,
which sorts first, and it also asserts the unmeasured row is LAST; the revert
went red on its own line. A check that passes by the alphabet is the class
`check-writing-traps` records as a fixture that cannot reach its branch.

**What has no revert, said plainly:** the tier letters, the review-floor set
membership and the money sentences are RULINGS. The checks that guard them are
coverage checks (every trade tiered, classed, priced, briefed) and they cannot
tell a right value from a wrong one — that is what the sourced comment beside
each row, this note and Vin's strikes are for.

**281 boot checks green.** `bash ci-gates.sh`, all stages. Contract unchanged
at **20261005** on both sides. **`index.html` did not change** (the picker reads
`/api/find-options`), so no Netlify deploy for this round — but the page live
today is still 20260926 and must be dragged to 20261005 regardless. Render
redeploys on merge. Hands: the Supabase SQL above (or the CBP NAICS 238 pull),
the verifier top-up, and Vin's strikes on the trade list. Grep the next press
for `ICP FILTER: searching 39 of 55`, the two `📊 POOL BY` lines, and any
`commercial paving contractor` query's yield.

## Appendix A — home-services evidence (2024–2026)

Retainer math: $10k/mo = $120k/yr; at 8–12% marketing spend a firm needs ~$1.0–1.5M revenue and an average job ≥ ~$5k. "Firm rev" = IBISWorld market ÷ count unless a survey is cited (a mean over a long tail).

| Trade | Avg job $ (year) | Source | Typical firm / consolidation | Fit |
|---|---|---|---|---|
| HVAC | replacement $7,500 avg, repair ~$1,205 (2025/26) | angi.com/articles/insider-s-price-guide-new-heating-and-cooling-system.htm; homeadvisor.com/cost/heating-and-cooling | ~120k firms, $159B → mean ~$1.3M; ~11% PE-owned, 76% independent (workyard.com hvac-facts; catalystforthetrades.com) | Good ≥$2M; PE owns many $3M+ |
| Roofing | $9,528 avg (2025) | angi.com/articles/how-much-does-roof-replacement-cost.htm | ~100k firms, $76B → mean ~$764k; RC survey median $2–4.9M; PE platform every 48h in 2025 (roofingcontractor.com 100416, 100478) | Good ≥$1.5M |
| Commercial roofing | $50k–500k a project (2025) | aaarfg.com commercial-roof-replacement-cost | commercial median $2–15M; Tecta 1.7% share (roofingcontractor.com 101568) | Strong |
| Restoration | $3,833 avg, $1,364–6,301 (2025) | homeadvisor.com/cost/disaster-recovery/repair-water-damage | $7.2B / 57,615 firms → mean ~$130k; Servpro 2,100 franchises; TPA routing (ibisworld.com 6278) | Caution |
| Foundation | $5,175 avg (2025) | homeadvisor.com/cost/foundations/repair-a-foundation | $2.9B market; Groundworks 70+ branches (futuremarketinsights.com; ctacquisitions.com) | Moderate |
| Solar | $29,016 median, $2.48/W (H1 2025) | pv-magazine-usa.com 2025/09/03 EnergySage | top-10 = 35%; bankruptcies (SunPower, Sunnova, Titan); CAC $0.60→0.84/W, ITC ended 2025, demand −19% (woodmac.com) | Poor in 2026 |
| Kitchen & bath | minor kitchen $28,458, major midrange $82,793, bath $26,138 (CvV 2025) | Cost vs Value 2025 (lookbooklink.com/storage/14805) | NAHB remodelers median $1.7M, 5 staff, unconsolidated (eyeonhousing.org 2025/09) | Good |
| Windows & doors | $750/window; whole-house $8–15k (2025/26) | angi.com window-replacement-cost; thisoldhouse.com | Andersen >12%; 25+ PE dealer platforms (ctacquisitions.com window-door tracker) | Good |
| Paving | driveway $5,268 (2025); lot $2.50–7/sf | homeadvisor.com install-asphalt-paving; angi.com cost-to-pave-parking-lot | $17.5B / 138,341 firms → mean ~$126k (ibisworld.com paving 2020) | Residential poor; commercial fit |
| Concrete | driveway $6,400 (2026) | angi.com concrete-driveway-cost | 92,778 firms, mean ~$982k (blueskyexitplanning.com) | Moderate |
| Pool builder | $41,924 avg (2025) | homeadvisor.com build-a-swimming-pool | $24.8B / 22,731 → mean ~$1.09M; no firm >2% (ibisworld.com) | Strong |
| Custom home builder | ~$400k+ per home ($166/sf median 2024) | eyeonhousing.org 2025/10 | NAHB builder median $3.7M (eyeonhousing.org 2025/08) | Strong; referral-led |
| Design-build / additions | addition $50,997 (2026); whole-home ~$52k | angi.com home-additions; houzz.com 2025 trends | NAHB median $1.7M, unconsolidated | Strong |
| Fire sprinkler | $5k–60k commercial (2026) | getsafeandsound.com | $22.1B, no firm >5%; Pye-Barker 57 acquisitions 2025 (pyebarkerfs.com) | Bid-led, roll-up |
| Excavation | $3,980 residential (2025) | homeadvisor.com excavate-land | $203B / 235k firms → mean ~$862k incl. civil (ibisworld.com 206) | Residential poor |
| Masonry | repair $175–1,500; projects to $50k | homeadvisor.com chimney-repair; homeguide.com | $40B / 22,035 → mean ~$1.8M, commercial-heavy (ibisworld.com 191) | Repair poor; commercial bid-led |
| Hardscaping | $9,000 avg (2026) | angi.com hardscape labor-vs-material | landscaping $188.8B / 556k → mean ~$340k; PE in 78 of 108 deals 2025 (greenindustrylaw.com) | Moderate |
| Tree service | $750 avg removal (2026) | angi.com tree-removal-cost | $39.5B / 175k → mean ~$226k; 24 PE platforms (ctacquisitions.com tree tracker) | Poor |
| Insulation | $1,852 avg (2026) | homeadvisor.com/cost/insulation | $13.6B / 28,814 → mean ~$472k; TopBuild ~40% residential (umbrex.com) | Poor (code comment disagrees: spray foam ~$5.5k) |
| Electrical | $348 avg hire (2025) | homeadvisor.com hire-an-electrician | $345B / 262k → mean ~$1.3M, commercial-heavy | Service poor; panel/commercial ≥$2M fit |
| Plumbing | call ~$275; blended ticket $4,148 (2026) | webtonic.io plumbing-analytics; sequoiageo.com | $190B / 127k → mean ~$1.5M (ibisworld.com 1946) | Fit ≥$2M repipe/sewer |
| Flooring | $3,159 avg (2026) | angi.com how-much-should-my-new-floor-cost | $33.8B / ~110k → mean ~$307k (ibisworld.com 196) | Poor |
| Garage door | replacement $1,230; repair $265 (2026) | angi.com garage-door-replacement-cost | $16B, 90% independents ~$960k mean; 26 PE deals 2025 (fmicorp.com; pitchbook.com) | Poor |
| Deck & patio | wood $18,263, composite $25,096 (CvV 2025) | lawnlove.com citing Zonda CvV 2025 | $1.3B / 6,808 → mean ~$191k (ibisworld.com 4717) | Ticket fits; firm small |
| Signage | $2–5k installed; monument $5–65k (2026) | homeguide.com business-sign-cost; blinksigns.com | $16.4B / 5,702 → mean ~$2.9M; FASTSIGNS 673 + Signarama 402 units | Moderate; franchise screen |
| Well & septic | septic $8,011; well $5,500 (2025/26) | angi.com septic; angi.com well-drilling | well $9.6B/8,379 → ~$1.15M; septic $8.1B/7,338 → ~$1.1M (ibisworld.com 6130, 4710) | Moderate; need-driven |
| Pest control | $171 a treatment; $300–900/yr (2026) | thisoldhouse.com pest-control-cost; homeguide.com | $12.65B, 17k firms, 2/3 single-location; top-6 = 45%; 22 PE platforms (pctonline.com top-100 2026) | Poor below ~$3M |
| Outdoor living | outdoor kitchen $13,180; pergola $4,251 (2025/26) | homeadvisor.com build-an-outdoor-kitchen; angi.com pergola | not found | Moderate |
| Commercial mechanical | projects $250k–$20M (2026) | ctacquisitions.com commercial-hvac-valuation | Comfort Systems 3.7%; >70% family-owned (ibisworld.com 1945) | Fit on size; bid-led |
| Cabinets | custom $7,421 avg (2025) | angi.com custom-cabinets-cost | $22.1B / 5,833 → mean ~$3.8M; MasterBrand+Woodmark ~20% (ibisworld.com 861) | Moderate; sells through dealers |
| Basement finishing | $32,000 avg (2026) | angi.com finish-basement | not found | Fit; cold markets only |
| Siding | fiber cement $14,674 (2025) | homeadvisor.com fiber-cement-siding | roofing & siding $75.4B / 130k → mean ~$578k (ibisworld.com 6545) | Good |
| Epoxy / coatings | $2,517 avg (2025) | homeadvisor.com install-concrete-coating | franchise-led (Garage Force, Guardian) | Poor |

## Appendix B — practice evidence (2024–2026)

| Category | Avg case / patient / client $ | Source | Owner-operated revenue / consolidation | Owner reachable? | Marketing % | Fit flag |
|---|---|---|---|---|---|---|
| Med spa | $536 per visit; 73% repeat rate (2024) | https://www.americanmedspa.org/news/2024-medical-spa-state-of-the-industry-executive-report-recap/ ; https://americanmedspa.org/blog/amspas-2024-medical-spa-state-of-the-industry-report-shows-medical-aesthetics-continues-steady-growth-after-pandemic (AmSpa 2024) | Avg revenue per med spa $1,398,833 (2024, AmSpa). >66% single-ownership (AmSpa 2024); only ~3% PE-owned; multi-site groups avg 9 locations (2024) https://scalehaven.io/blog/med-spa-industry-statistics/ ; https://greenwichgp.com/wp-content/uploads/2025/04/Evaluating-Aesthetics-MedSpa-Growth-and-Strategic-Consolidation.pdf | YES – single MD or NP owner; NPs now nearly equal MDs as owners (AmSpa 2024) | ~7% of revenue avg, range 2–15% (AmSpa 2024) https://www.americanmedspa.org/news/industry-experts-weigh-in-to-help-answer-how-much-should-i-spend-on-med-spa-marketing/ | EXCELLENT above ~$1.5M revenue (owner-run, cash-pay, 7% spend, competitive local search). Below that a $120k/yr retainer exceeds the whole marketing budget. |
| Plastic surgery | ASPS avg surgeon fees 2023: tummy tuck $8,174, facelift $11,395, breast augmentation ~$4,875; surgical range $3k–$15k (2024) | https://www.plasticsurgery.org/Documents/News/Statistics/2023/cosmetic-procedures-average-cost-2023.pdf ; https://www.ccplasticsurgery.com/blog/plastic-surgery-cost-statistics-average-prices-by-procedure ; https://www.statista.com/statistics/281371/major-surgical-cosmetic-procedures-costs-in-the-us/ | Per-practice revenue: not found (median surgeon income $445k, 2026 https://fastrvu.com/specialties/plastic-surgery ; industry $26.0B 2026 IBISWorld https://www.ibisworld.com/united-states/industry/plastic-surgeons/4157/). PE: practices acquired rose 4,300% 2000–2023 but share of all practices not stated (ASJ 2025) https://pmc.ncbi.nlm.nih.gov/articles/PMC13369132/ ; one of fastest-consolidating specialties in 2024 (VMG via https://focusbankers.com/plastic-surgery-private-equity/) | YES – surgeon-owned cash-pay practices still the norm; screen out PE platform names (TX/FL/NY concentrated) | 8–12% established, 10–15% growth (2025–26) https://plastixmarketing.com/how-much-should-a-plastic-surgery-practice-spend-on-marketing/ ; https://cakesmashmedia.com/resources/how-much-plastic-surgeon-marketing-budget | EXCELLENT – high case value, cash-pay, owner is surgeon, already spends 8–12%. Top tier confirmed. |
| Dermatology | Medical visit $150–$400; Mohs $1,200–$3,000; injectables $400–$1,500; laser $800–$2,500 (2025); first-year patient value $1,000–$1,500; LTV $2,600–$8,000 | https://www.clarityrcm.com/articles/how-to-start-a-dermatology-practice ; https://www.patientnow.com/resources/blog/dermatology-patient-lifetime-value-what-it-is-why-it-matters-how-to-increase/ | Revenue per FTE derm $1.3M medical / $1.8M cosmetic (FTI, 2019 benchmarks) https://www.fticonsulting.com/insights/articles/dermatology-looking-good . 35+ PE platforms; ~10–15% of practices PE-backed (2023), ~15% of dermatologists at PE platforms (JAAD, 2025–26) https://practicaldermatology.com/issues/september-2025/preparing-for-private-equity-benefits-and-drawbacks/37629/ ; https://ctacquisitions.com/guides/private-equity-dermatology-2026/ | MOSTLY – ~85% still independent, but PE dense in Sunbelt/mid-tier metros; need a platform-name screen | not found | MIXED – medical derm runs on referrals/waitlists and needs no lead gen; only cosmetic-heavy practices fit. Keep top tier only with a cosmetic screen. |
| Orthodontist | Braces $6,219; clear aligners $6,301 per case (2025) | https://orthodonticproductsonline.com/practice-management/business-development/steady-year-shifting-landscape-findings-from-the-2025-orthodontic-practice-survey/ (2025 Orthodontic Practice Survey) | Avg production per orthodontist $1,570,806 (2025); 60% solo; 96% private practice. 14% of orthodontists corporate-affiliated in 2023 (6% in 2018); orthodontist-owned practices 71%, down from 91% in 2014 (JCO 2024) https://www.jco-online.com/archive/2024/06/334-the-editors-corner-private-inequity/ | YES – orthodontist-owner | not found (dental generic 4–7%) | EXCELLENT – #1 reported challenge is "not enough new patient starts" (2025 survey); $6.2k case, $1.57M/doctor, owner-run. Top tier confirmed – strongest evidence of all 20. |
| Oral surgery | Wisdom teeth (all 4, sedation) $1,200–$3,500, typically $1,500–$2,200 (2025); single implant $3,000–$7,000 (2025); full arch $12k–$28k (2025) | https://www.carecredit.com/well-u/health-wellness/wisdom-teeth-removal/ ; https://www.goodrx.com/conditions/dental-care/wisdom-teeth-removal-cost ; https://www.nvimplantcenter.com/dental-implant-costs/ ; https://cddallas.com/blog/cost-of-full-mouth-dental-implants/ | ADA avg gross billings per dental specialist $1,146,320 (2024) / $1,213,040 (2025) – all specialists, OMS not broken out https://www.ada.org/resources/research/health-policy-institute/dental-practice-research/trends-in-dentist-income . PE affiliation among dentists 6.6% (2015) → 12.8% (2021), rising fastest among specialists incl. oral surgeons (ADA HPI Aug 2024) https://adanews.ada.org/ada-news/2024/august/private-equity-affiliation-among-dentists-increases/ ; 30 OMS add-on deals in LTM (PGP 2024) https://physiciangrowthpartners.com/market-update/oral-surgery-private-equity-winter-2024/ | MOSTLY – still majority surgeon-owned, but roll-ups (USOSM, Allied OMS, P3) active | not found | WEAK for a lead-gen retainer – OMS is referral-fed by GPs/orthodontists; consumer search only drives implants/wisdom teeth. Probably second tier. |
| Cosmetic dentistry | Porcelain veneers $925–$2,500/tooth; smile makeover $8k–$25k (2025–26) | https://www.rankmydentist.com/blog/cosmetic-dentistry/dental-veneers-cost ; https://goodtoothdentalcare.com/how-to-budget-for-veneers-in-2026-costs-materials-and-smart-financing/ | Same business as general dentistry: GP owner gross billings $942,290 (2024) / $965,660 (2025) (ADA HPI); 13.8% of dentists DSO-affiliated (2023) https://www.ada.org/resources/research/health-policy-institute/dental-practice-research/trends-in-dentist-income ; https://www.dentistryiq.com/dentistry/research-and-news/article/55318380/the-future-of-dentistry-2024-ada-hpi-workforce-report-unpacks-emerging-trends | YES | 4–7% of revenue (2025) https://www.firegang.com/dental-marketing-cost/ | STRONG but it is not a separate business – it is a GP dentist with a veneer page. Needs a site-content screen, not a separate search category. |
| Dental implants | Single implant $3,000–$7,000; full arch $12k–$28k; full mouth $24k–$55k (2025); single case $3k–$5k revenue, full-mouth $25k–$60k | https://www.nvimplantcenter.com/dental-implant-costs/ ; https://cddallas.com/blog/cost-of-full-mouth-dental-implants/ ; https://dentplicity.com/blog/dental-implant-marketing-strategies | Same as dentistry (13.8% DSO). National chains (Aspen Dental / ClearChoice) compete directly in full-arch search https://www.aspendental.com/dental-implants/full-mouth-dental-implants/full-mouth-dental-implants-cost/ | YES (for independents) | 4–7% (dental generic) | STRONG case value; top tier holds, but the search is chain-crowded and the lead is the same dentist as "cosmetic"/"general". |
| LASIK / refractive | $2,632 per eye avg, range $1,000–$4,000 (2026); RSC national average $4,492 (both eyes) | https://www.allaboutvision.com/treatments-and-surgery/vision-surgery/lasik/cost-of-lasik/ ; https://americanrefractivesurgerycouncil.org/cost-of-lasik/ | Solo ophthalmology practice revenue $800k–$1.3M https://physiciansthrive.com/private-practice/ophthalmology . 70.4% of ophthalmologists in private practice (AMA 2024 survey) https://www.ophthalmologymanagement.com/issues/2025/julyaugust/private-equity-or-private-practice/ ; 8% at PE MSOs in 2022 https://physiciangrowthpartners.com/white-paper/state-of-eye-care-private-equity-q1-2025/ . LASIK volume down 10–15% (2022–23) https://www.eyeworld.org/2024/a-decline-in-lasik-procedures/ . Chain share (LasikPlus, NVISION, LVI, TLC): not found | MIXED – LASIK-only centres are chain/PE; the reachable owner is a comprehensive ophthalmologist for whom LASIK is a side line | ≤15% gross, ~10% mature; CAC $250–$800/patient https://www.reviewofophthalmology.com/article/how-to-capitalize-on-the-lasik-boom ; https://www.liveseysolar.com/lasik-customer-acquisition-cost/ | WEAK as a category – shrinking procedure, chain-dominated search, $2.6k case. Demote to second tier. |
| Veterinary clinic | $580 (2024) / $598 (2025) per dog owner per year | https://www.avma.org/news/pet-population-continues-increase-while-pet-spending-declines ; https://ebusiness.avma.org/files/productdownloads/002_AVMA_SotPReport25_NoPasswordPRO.pdf | ~$1.5M gross per practice (2024); $554,982 per veterinarian (AVMA) https://www.avma.org/news/less-foot-traffic-veterinary-practices-spells-declining-revenue . Corporate consolidators own 22% of vet businesses (up from 16%) https://www.aaha.org/trends-magazine/publications/corporate-consolidation-and-the-rise-of-private-equity/ ; Mars ~3,000 clinics https://finance.yahoo.com/news/candy-maker-mars-biggest-vet-100000723.html | YES for the ~65–78% independent | 1–5% typical; 2–5% established https://www.beyondindigopets.com/blog/what-should-you-allocate-to-marketing-budgets-for-your-practice/ ; https://www.tailwerks.com/how-much-should-your-veterinary-practice-spend-on-marketing-a-realistic-budget-guide | POOR – $598/yr client, 1–5% spend, declining visits; $120k retainer = 8% of a $1.5M clinic. |
| General dentistry | Per-patient value: not found | – | GP owner gross billings $942,290, net $217,780 (2024, ADA HPI); 13.8% DSO (2023) https://www.ada.org/resources/research/health-policy-institute/dental-practice-research/trends-in-dentist-income | YES | 4–7% https://www.firegang.com/dental-marketing-cost/ | MARGINAL – $120k = 12.7% of average revenue; only $2M+ multi-doctor offices fit. Second tier confirmed. |
| Personal injury law | Avg settlement $55,056 (cases 2021–2024, Brown & Crouppen); firm averages $24k–$55k (2025); fee 33–40% → *derived* ~$18k fee per average case | https://www.casepeer.com/blog/personal-injury-settlement-amount-examples/ ; https://saeedianlawgroup.com/what-percentage-do-most-personal-injury-lawyers-take/ | Per-firm revenue: not found. 64,331 PI firms; industry $61.3B (2024) https://www.rev.com/blog/personal-injury-statistics ; 58% of PI solos earn $500k+ https://referent.law/blog/us-lawyers-by-firm-size-2026-statistics-solo-small-midsize-big-law/ . No PE ownership (non-lawyer ownership barred outside AZ/UT). | YES – named partner | 10–20% of gross typical; largest advertisers 19–35% https://www.legalscapes.com/blog/how-much-should-a-personal-injury-law-firm-spend-on-marketing-in-2026/ ; https://cimmp.com/how-much-does-personal-injury-law-firm-marketing-cost/ ; PPC cost per case ~$2,700 | EXCELLENT – highest marketing spend of any category, owner-run, brutally competitive local search. Top tier confirmed (caveat: sophisticated buyers who already have agencies). |
| Estate planning law | Flat fee $1,500–$3,500; trust-based plan $3,500–$4,500 (2025–26, study of 909 firms) | https://legaltemplates.net/resources/estate-planning/cost-of-estate-planning/ ; https://www.findlaw.com/estate/planning-an-estate/what-does-an-average-estate-plan-cost-detailed-price-analysis.html | Solo owner avg income $140k; only 34% earn >$250k https://www.embroker.com/blog/solo-law-firm-statistics ; 28% of WealthCounsel respondents solo (2024) https://www.wealthcounsel.com/articles/2024-estate-planning-industry-trends-report . No PE. | YES | 2–5% relationship practices; 5–10% growth firms https://www.lawfirmvelocity.com/post/law-firm-marketing-budget ; https://kaizengrowthmarketing.com/how-to-build-an-estate-planning-law-firm-marketing-plan/ | POOR – $3k case, tiny firms, referral-led. $10k/mo is not credible. |
| CPA / accounting firm | Small-business client $1,000–$5,000/yr; $250–$900/mo (2025) | https://smartasset.com/financial-advisor/how-much-does-a-cpa-cost-for-a-small-business ; https://www.remotebooksonline.com/blog/how-much-do-cpa-fees-cost-small-business-2025 | 81% of MAP respondents ≤$5M revenue; net remaining per partner $252,663 (FY2024) https://www.aicpa-cima.com/news/article/cpa-firms-report-steady-growth-in-revenue-and-profit-aicpa-research-finds . PE owns ~24 of top-100 firms, 10 of top-20 (2025) https://cpatrendlines.com/2025/11/18/cornerstone-dealflow-timeline-private-equity-investments-in-cpa-and-accounting-firms-2020-2025/ ; https://www.cfobrew.com/stories/10-of-the-top-20-cpa-firms-are-backed-by-private-equity – local firms untouched | YES | 2–3% avg incl. staff; 1% excl. comp (2025) https://www.cpapracticeadvisor.com/2025/06/02/high-growth-accounting-firms-spend-twice-as-much-on-marketing-study-finds/161501/ | POOR – 1–3% spend means $120k exceeds the whole budget of a $4M firm; referral/capacity-constrained. |
| Independent insurance agency | Commission 10–12% of premium; per-client revenue: not found | https://www.sonant.ai/blog/insurance-agent-commission-structure | 39,000 agencies (2024); 51.6% under $500k revenue, 27.1% under $150k (2024 Agency Universe Study) https://www.iamagazine.com/2024/10/01/a-deep-dive-into-the-2024-agency-universe-study/ ; https://agencychecklists.com/2024/09/30/despite-decline-in-agent-numbers-agency-profits-are-up-says-latest-agency-universe-study-72579/ ; M&A + perpetuation shrinking count, 1/3 expect ownership change in 5 yrs https://www.insurancejournal.com/news/national/2024/09/27/794611.htm | YES | 2–5% typical; 5–10% growing https://insuranceproagencies.com/insurance-agency-marketing-budget ; https://agentsalliance.com/how-much-do-insurance-agencies-spend-on-marketing/ | POOR – half the universe is under $500k; only $3M+ commercial-lines agencies could pay. |
| Assisted living facility | Median $6,200/mo = $74,400/yr per resident (2025); NIC $5,900/mo (2024) | https://www.whereyoulivematters.org/resources/how-much-does-assisted-living-cost-2025/ ; https://www.caring.com/resources/assisted-living-statistics | Per-community revenue: not found (avg ~35 residents/facility https://www.consumeraffairs.com/assisted-living/statistics.html ). 56% of facilities chain-owned (Welltower, Ventas, Brookdale) https://alineops.com/blog/assisted-living-statistics/ ; healthcare REITs own 8,392 properties (2023) https://www.reit.com/news/articles/health-care-reits-the-silver-tsunami-is-driving-demand ; industry $45.5B (2024) IBISWorld | MIXED – on-site executive director is not the buyer; reachable owner is a small regional operator | 7–10% of gross; $5k–$15k/mo per community (2026) https://usrengage.com/senior-living-marketing-budgets/ | MIXED – case value and spend fit perfectly; ownership does not. Treat as a regional-operator HQ lead, not a local one. |
| Addiction treatment center | 30-day residential $6,000–$30,000, avg ~$13,000–$13,500 (2025–26); insurance-only centres $25k–$35k/patient | https://www.addictionresource.net/cost-of-rehab/ ; https://drugabusestatistics.org/cost-of-rehab/ ; https://amitypb.com/blog/how-much-do-rehab-centers-earn | Per-center revenue: not found. Only 41% of facilities are private for-profit (N-SSATS 2020) https://www.samhsa.gov/data/sites/default/files/reports/rpt35313/2020_NSSATS_FINAL.pdf ; PE >$20B into behavioral health 2018–25 https://www.forwardcare.com/blog/how-private-equity-is-reshaping-behavioral-health ; SUD deals at 6-yr low, 33 in 2025 https://bhbusiness.com/2026/04/02/private-equitys-retreat-from-addiction-treatment-could-leave-a-dangerous-void/ ; ~30% of OTPs PE-owned | MIXED – many owner-run for-profit centres, but 59% non-profit/public and large PE platforms | 6–12% steady; 10–20% growth/new https://treatmentcenteragency.com/addiction-treatment-marketing-guide/ ; https://seaislenews.com/news/2024/jul/17/what-do-rehab-centers-spend-on-marketing/ | STRONG economics; needs a for-profit + owner screen and LegitScript-gated ads. Top tier holds with caveats. |
| Funeral home | Median funeral w/ viewing & burial $8,300; cremation $6,280 (NFDA 2023) | https://www.tributetech.com/funeral-costs-arent-rising-as-fast-as-inflation-according-to-nfda | ~$1.06–$1.2M per location (15,401 homes / $16.3B; avg 113 calls/yr) https://us-funerals.com/the-us-funeral-industry-today/ ; https://funeraldirectordaily.com/so-whats-the-average-size-funeral-home-in-the-united-states/ . 75% family/privately owned; SCI 1,485 locations, $4.4B (2025) https://www.memorials.com/info/funeral-planning-guide/largest-funeral-home-companies | YES | ~3%; 44% spend <$15k/yr (Kates-Boylston) https://blog.funeralbusinessbuilder.com/2024/03/08/funeral-home-advertising-how-much-should-you-spend/ | POOR – demand is not search-created; $1.1M revenue, 113 calls, <$15k/yr budgets. |
| In-home senior care | Per-client annual value: not found | – | Median agency revenue $2.3M (2024, +14%); median profit margin 9.7%; client turnover 45.5% https://www.mcknightshomecare.com/news/home-care-revenues-rise-as-client-caregiver-turnover-rates-drop-activated-insights-reports/ ; https://homehealthcarenews.com/2025/07/inside-the-data-revenue-staffing-wins-and-challenges-shape-home-based-care-strategy/ . Franchise avg $2.3M/unit; franchise share of market: not found https://www.seniorhelpersfranchise.com/blog/home-care-franchise-profit-margins-earnings/ | PARTLY – franchisee is a local owner, but franchisor controls brand/web | not found | WEAK – revenue fits the band but 9.7% margin means $120k ≈ half the profit; franchise sites can't be rebuilt. |
| Managed IT services (MSP) | $185/user/month SMB seat (2025); MRR $7.5k–$10k band only 4% of MSPs | https://medhacloud.com/blog/managed-services-market-statistics-2026 ; https://www.kaseya.com/blog/key-findings-from-kaseyas-2025-global-msp-benchmark-report/ | Median $2.8M ARR (Datto 2025); EBITDA 18.4% (2025). PE in 69–72% of 2025 deals; top-20 platforms hold 12% of market (Canalys) https://ctacquisitions.com/guides/private-equity-msp-2026/ ; https://masignal.com/msp/report-full.html | YES – founder-owned majority | not found | MIXED – revenue band and owner fit; but B2B, referral-led, not a local-search category; PE roll-up screen needed. Second tier OK. |
| Medical weight loss clinic | Program $1,500–$3,000; monthly management $300–$1,500 (2026) | https://pabau.com/blog/how-weight-loss-clinics-make-money/ | US clinic market only $1.21B (2025) https://www.grandviewresearch.com/industry-analysis/us-medical-weight-loss-clinics-market-report . Franchise model (Medi-Weightloss 110+ units, no physician needed) https://www.mediweightlossfranchising.com/ ; compounded-semaglutide pathway closed Feb 2025, FDA proposed 503B exclusion Apr 2026, 50+ warning letters 2026; Hims/Ro exited compounded https://www.telehealthally.com/guides/compounded-semaglutide-fda-ban-guide ; https://med.stanford.edu/news/insights/2026/07/glp1s-compounded-why-doctors-worry-about-safety.html ; CVS $29 GLP-1 consult https://www.cvs.com/minuteclinic/services/weight-loss-program | Often YES but tiny | not found | POOR – business model under regulatory collapse, telehealth/pharmacy price competition, sub-$1.2M clinics. |

## Appendix C — metro evidence (2024–2026), research only; the pool read decides

## Table 1 — the current 23

| Metro (TZ) | Pop 2025 (Jul 1) | Pop 2020 | Growth 20–25 | MHI (yr) | NAICS 238 estabs | Sources |
|---|---|---|---|---|---|---|
| Phoenix-Mesa-Chandler (MST, no DST; UTC-7) | 5,228,938 | 4,845,832 | +7.9% | $90,133 (ACS 2024) | not found | [realestatedaily-news 2026](https://realestatedaily-news.com/phoenix-continues-to-power-arizona-growth-as-new-census-data-shows-another-strong-year/), [Census Reporter](http://censusreporter.org/profiles/31000US38060-phoenix-mesa-chandler-az-metro-area/) |
| Dallas-Fort Worth-Arlington (CT) | 8.5M | — | +11.0% (Census states) | $92,733 (ACS 2024 1-yr) | not found | [Census press release Mar 2026](https://www.census.gov/newsroom/press-releases/2026/vintage-2025-pop-estimates.html), [Census Reporter](http://censusreporter.org/profiles/31000US19100-dallas-fort-worth-arlington-tx-metro-area/) |
| Charlotte-Concord-Gastonia (ET) | 2,938,830 | 2,660,1xx (2025 minus +278,700 stated) | +10.5%; 7th-largest 5-yr gain of 387 MSAs | $85,938 (ACS 2024 1-yr) | not found | [Axios Charlotte 2026-03-27](https://www.axios.com/local/charlotte/2026/03/27/charlotte-population-growth-2025-census), [Citadel Cofield 2026](https://citadelcofield.com/blog/charlotte-metro-population-growth-2026), [Census Reporter](http://censusreporter.org/profiles/31000US16740-charlotte-concord-gastonia-nc-sc-metro-area/) |
| Tampa-St. Petersburg-Clearwater (ET) | 3,418,895 | 3,175,275 | +7.7% | $71,254 (2024; Data USA, likely 5-yr) | not found | [Trading Economics/FRED 2025](https://tradingeconomics.com/united-states/resident-population-in-tampa-st-petersburg-clearwater-fl-msa-fed-data.html), [Data USA](https://datausa.io/profile/geo/tampa-st-petersburg-clearwater-fl) |
| Denver-Aurora-Centennial (MT) | 3,092,037 | 2,963,821 | +4.3% | $102,339 (2024) | not found | [Data Commons](https://datacommons.org/place/geoId/C19740), [nchstats 2026](https://nchstats.com/denver-population/) |
| Nashville-Davidson-Murfreesboro-Franklin (CT) | 2,197,416 (Statista) | 1,989,519 | +10.4% | $82,499 (2024) | not found | [Statista 2025](https://www.statista.com/statistics/815653/nashville-metro-area-population/), [Center Square](https://www.thecentersquare.com/tennessee/article_9d2982f6-fc7b-11eb-a4ca-332d496fec0e.html), [Census Reporter](http://censusreporter.org/profiles/31000US34980-nashville-davidson-murfreesboro-franklin-tn-metro-area/) |
| Columbus OH (ET) | 2,242,028 | 2,138,926 | +4.8% | $82,938 (ACS 2024 1-yr) | not found | [All Columbus Data 2026](https://allcolumbusdata.com/2025-county-and-metro-population-estimates/), [Census Reporter](http://censusreporter.org/profiles/31000US18140-columbus-oh-metro-area/) |
| Austin-Round Rock-San Marcos (CT) | 2.62M (+337,500 since 2020) | 2,283,371 | +14.7% | $99,897 (ACS 2024) | not found | [Muskin Elam 2026](https://muskin-elam.com/austin-area-ranks-as-fastest-growing-major-texas-metro-in-2025/), [AroundAustin 2025](https://aroundaustin.com/aboutaroundaustin/austin-metro-demographics-2025/) |
| Kansas City MO-KS (CT) | 2,270,682 | 2,192,035 | +3.6% (+0.77% in 2024–25) | $83,785 (2024) | not found | [KC Star via Yahoo 2026](https://www.yahoo.com/news/articles/see-counties-kansas-city-metro-102000444.html), [Census Reporter](http://censusreporter.org/profiles/31000US28140-kansas-city-mo-ks-metro-area/) |
| Indianapolis-Carmel-Greenwood (ET) | 2,205,695 | 2,111,040 | +4.5% | $80,239 (ACS 2024) | not found | [Wikipedia / Census Reporter](http://censusreporter.org/profiles/31000US26900-indianapolis-carmel-greenwood-in-metro-area/) |
| Jacksonville FL (ET) | 1,785,500 | 1,605,848 | +11.2% | $82,053 (2024) | not found | [Wikipedia](https://en.wikipedia.org/wiki/Jacksonville_metropolitan_area), [Census Reporter](http://censusreporter.org/profiles/31000US27260-jacksonville-fl-metro-area/) |
| San Antonio-New Braunfels (CT) | ~2.81M | 2,558,143 | ~+9.8% | $78,112 (ACS 2024) | not found | [Statista 2025](https://www.statista.com/statistics/815304/san-antonio-metro-area-population/), [Census Reporter](http://censusreporter.org/profiles/31000US41700-san-antonio-new-braunfels-tx-metro-area/) |
| Raleigh-Cary (ET) | 1,595,720 | 1,413,982 (unverified by search) | +12.9% | $102,144 (ACS 2024 1-yr) | not found | [Statista 2025](https://www.statista.com/statistics/815728/raleigh-metro-area-population/), [Census Reporter](http://censusreporter.org/profiles/31000US39580-raleigh-cary-nc-metro-area/) |
| Salt Lake City-Murray (MT) | 1,308,377 | 1,257,936 | +4.0% | $100,548 (2024) | not found | [FRED SLCPOP 2025](https://fred.stlouisfed.org/series/SLCPOP), [Census Reporter](http://censusreporter.org/profiles/31000US41620-salt-lake-city-murray-ut-metro-area/) |
| Oklahoma City (CT) | 1,512,813 | 1,425,695 | +6.1% | $72,930 (2024) | not found | [Grokipedia/Census](https://grokipedia.com/page/Oklahoma_City_metropolitan_area), [Census Reporter](https://censusreporter.org/profiles/31000US36420-oklahoma-city-ok-metro-area/) |
| Louisville/Jefferson County KY-IN (ET) | 1,402,509 | 1,363,012 (Jul 2020 est.) | +2.9% | $74,305 (ACS 2024) | not found | [FRED LOIPOP 2025](https://fred.stlouisfed.org/series/LOIPOP), [Census Reporter](http://censusreporter.org/profiles/31000US31140-louisvillejefferson-county-ky-in-metro-area/) |
| Cincinnati OH-KY-IN (ET) | 2,312,858 | 2,252,077 | +2.7% | $81,489 (2024) | not found | [Census Reporter](http://censusreporter.org/profiles/31000US17140-cincinnati-oh-ky-in-metro-area/), [FRED CTIPOP](https://fred.stlouisfed.org/series/CTIPOP) |
| Richmond VA (ET) | ~1,376,000 (1,316,742 + "nearly 60,000") | 1,316,742 | ~+4.5% (+12,000 in 2024–25) | $83,460 (2024) | not found | [Axios Richmond 2026-03-31](https://www.axios.com/local/richmond/2026/03/31/metro-richmond-population-growth-2025-census-immigration-henrico-chesterfield), [Census Reporter](http://censusreporter.org/profiles/16000US5167000-richmond-va/) |
| Greenville-Anderson-Greer SC (ET) | 1,014,101 | 928,207 | +9.25% (stated) | $75,881 (2024) | not found | [Greenville Journal 2026](https://greenvillejournal.com/news/greenville-metro-population-grows-to-1-million-residents-new-census-estimates-shows/), [Census Reporter](http://censusreporter.org/profiles/31000US24860-greenville-anderson-greer-sc-metro-area/) |
| Atlanta-Sandy Springs-Roswell (ET) | 2025 total not found; 2024 = 6.41M; +61,953 (+0.96%) Jul 2024–Jun 2025 | 6,089,815 | +5.3% to 2024 | $89,724 (ACS 2024 5-yr) | not found | [USAFacts](https://usafacts.org/answers/how-many-people-live-in-the-us/metro-area/atlanta-ga/), [ARC 33n 2026](https://33n.atlantaregional.com/population/the-metro-shuffle-winners-and-losers-in-2025-population-growth), [Data USA](https://datausa.io/profile/geo/atlanta-sandy-springs-roswell-ga) |
| Minneapolis-St. Paul-Bloomington (CT) | 3,790,295 | 3,690,261 | +2.7% | $97,928 (ACS 2024) | not found | [FRED MSPPOP 2025](https://fred.stlouisfed.org/series/MSPPOP), [Census Reporter](http://censusreporter.org/profiles/31000US33460-minneapolis-st-paul-bloomington-mn-wi-metro-area/) |
| Houston-Pasadena-The Woodlands (CT) | "slightly above 7.9M"; +126,720 in 2024–25, most of any US metro | 7,122,240 | ~+11% | ~$81,000 (ACS 2024 1-yr; fell 0.5% y/y) | not found | [Kinder Institute 2026](https://kinder.rice.edu/urbanedge/houstons-population-keeps-growing-new-census-data-reveals-notable-shifts), [Houston Chronicle](https://www.houstonchronicle.com/news/houston-texas/article/houston-income-census-21039741.php) |
| Cleveland OH (ET) | not found (FRED series discontinued; Macrotrends 1.78M is a UN agglomeration, not the MSA) | 2,086,509 (Jul 2020 est.); 2,063,132 in 2022 (−1.1%) | not found; negative through 2022 | $72,532 (ACS 2024) | not found | [FRED CVLPOP](https://fred.stlouisfed.org/data/CVLPOP), [Census Reporter](http://censusreporter.org/profiles/31000US17410-cleveland-oh-metro-area/) |

## Table 2 — ten strongest candidates not on the list

| Metro (TZ) | Pop 2025 | Pop 2020 | Growth 20–25 | MHI (yr) | NAICS 238 | Sources |
|---|---|---|---|---|---|---|
| Orlando-Kissimmee-Sanford (ET) | 2,957,672 (+37,690 in 2024–25, 10th-largest US gain) | not found in results (2,673,376 recalled, unverified) | ~+10.6% if 2020 figure holds | $78,708 (2024) | not found | [Florida Phoenix 2026-03-27](https://floridaphoenix.com/2026/03/27/census-data-show-population-increases-in-orlando-reductions-in-pinellas-miami-dade/), [Rathly 2026](https://www.rathlymarketing.com/blog/orlando-population-growth-statistics/) |
| North Port-Sarasota-Bradenton (ET) | 948,158 | 833,716 | +13.7% | not found | not found | [Data USA](https://datausa.io/profile/geo/north-port-sarasota-bradenton-fl), [Wikipedia](https://en.wikipedia.org/wiki/Sarasota_metropolitan_area) |
| Cape Coral-Fort Myers (ET) | 975,000 (Macrotrends; UN-basis, not Census) | 760,822 (Lee County = MSA, 2020 Census) | not comparable (different bases) | metro not found; Cape Coral city $78,104 (2024) | not found | [Macrotrends](https://www.macrotrends.net/global-metrics/cities/22993/cape-coral/population), [Wikipedia Lee County](https://en.wikipedia.org/wiki/Lee_County,_Florida) |
| Miami-Fort Lauderdale-West Palm Beach (ET) | 6,391,072 | 6,138,333 | +4.1% | $80,625 (ACS 2024 1-yr) | not found | [FRED MIMPOP](https://fred.stlouisfed.org/series/MIMPOP), [Census Reporter](http://censusreporter.org/profiles/31000US33100-miami-fort-lauderdale-west-palm-beach-fl-metro-area/) |
| Washington-Arlington-Alexandria (ET) | 2025 not found; 2024 = 6,436,489 | 6,260,475 (Jul 2020 est.) | +2.8% to 2024 | $126,244 (ACS 2024) | not found | [FRED WSHPOP](https://fred.stlouisfed.org/data/WSHPOP), [Census Reporter](https://censusreporter.org/profiles/31000US47900-washington-arlington-alexandria-dc-va-md-wv-metro-area/) |
| Philadelphia-Camden-Wilmington (ET) | ~6.33M | 6,242,286 (Jul 2020 est.) | +1.4% | $90,850 (2024; alt. $89,273) | not found | [Statista 2025](https://www.statista.com/statistics/815192/philadelphia-metro-area-population/), [FRED PCWPOP](https://fred.stlouisfed.org/data/PCWPOP) |
| Boise City ID (MT) | 864,243 | 764,718 | +13.0% | $83,904 (2024; may be city) | not found | [Wikipedia](https://en.wikipedia.org/wiki/Boise_metropolitan_area), [FRED BOIPOP](https://fred.stlouisfed.org/series/BOIPOP) |
| Las Vegas-Henderson-North Las Vegas (PT) | 2,407,226 | not found in results (2,265,461 recalled, unverified) | ~+6.3% if 2020 holds | $73,845 (alt. $76,472) (2024) | not found | [Population Review](https://www.populationreview.org/metro/las-vegas-nv), [Census Reporter](http://censusreporter.org/profiles/31000US29820-las-vegas-henderson-north-las-vegas-nv-metro-area/) |
| Omaha-Council Bluffs (CT) | 1,009,836 | 967,604 | +4.4% | $84,829 (2024) | not found | [Grow Omaha 2026](https://growomaha.com/an-analysis-of-omahas-million-plus-metro-population/), [Data USA](https://datausa.io/profile/geo/omaha-council-bluffs-ne-ia) |
| Tulsa OK (CT) | 1,069,273 | 1,023,988 | +4.4% | metro not found; city $59,838 (5-yr) | not found | [FRED TULPOP](https://fred.stlouisfed.org/series/TULPOP), [Tulsa World](https://tulsaworld.com/news/local/tulsa-area-population-tops-1-million-for-first-time-census-bureau-data-says/article_92eda23c-ace3-11eb-b51f-af0d39031dee.html) |

Other candidates with partial data: Des Moines 758,539 (2025, FRED) vs 753,913 (2020, Census Reporter; delineation unclear), MHI $85,446 (2024); Knoxville 2020 = 903,300, MSA MHI $69,606 (Knoxville Chamber), 2025 not found; Chattanooga 2025 = 594,530 (FRED), 2020 not found, metro MHI not found; Savannah metro 431,589 (Census Reporter, year unstated), 2025 not found, city MHI $57,137. Not searched at all (budget exhausted): Sacramento, San Diego, Seattle, Portland, Pittsburgh, St. Louis (partial: 2025 = 2,814,421, flat vs 2022; metro MHI not found), Milwaukee, Detroit, Chicago suburbs, Boston, Baltimore, Birmingham, Memphis, Albuquerque, Tucson, Lexington, Grand Rapids, Madison.

## Independent share and competition

No source gives independent-vs-PE share **by metro**. National figures: roughly 76% of companies doing "critical and rare" home services (HVAC install, complex plumbing, electrical) are still true independents, and 70% of plumbing-repair share is independent ([Profitability Partners, 2025/26](https://profitabilitypartners.io/home-services-fragmentation-independent-pe-consolidation/)); about 11% of HVAC companies are PE-owned and "most of a typical metro is still independents" ([HVAC Know It All, 2026](https://hvacknowitall.com/blog/ai-private-equity-and-the-independent-hvac-contractor-in-2026)); but more than 60% of the top-50 HVAC companies and over half of the top plumbing companies are PE-backed and PE drives more than half of HVAC deals ([Catalyst for the Trades, 2026](https://www.catalystforthetrades.com/blog/how-private-equity-consolidation-is-changing-the-home-services-industry), [Grata 2025](https://grata.com/resources/hvac-pe-playbook-2025)). Read for a lead: the $1.2M–$35M independents are the majority everywhere, and PE concentration is a firm-size problem, not a metro one. On competition, the only benchmark-grade source is LocaliQ's 2025 home-services search benchmarks (3,211 US campaigns, Apr 2024–Mar 2025): average CPL $90.92; HVAC $84.92; Roofing & Gutters $228.15 at a 3.70% conversion rate; Doors & Windows $200.34; Construction & Contractors $165.67 ([LocaliQ 2025](https://localiq.com/blog/home-services-search-advertising-benchmarks/)). LocaliQ does not publish per-metro figures. Blog-grade sources only say the largest metros (New York, LA, Chicago) run 20–50% above national CPL and that a roofing click costs $15–25+ in NY/LA versus ~$8 in Boise ([BuiltRight 2026](https://builtrightdigital.com/google-ads-cost-for-home-services/), [ClicksGeek 2026](https://clicksgeek.com/google-ads-cost-per-click-for-roofing/)); none rank the 23 metros. Implication: roofing/windows/general contracting are the trades where the owner most feels the marketing bill, regardless of metro; a per-metro CPL table would need a DataForSEO/Google Keyword Planner pull, which the app already has credentials for.

## Time zone

No study breaks connect rate out by prospect region or state; all evidence is by local hour. The consistent finding is that the windows are 10–11 a.m. and 4–5 p.m. **in the prospect's local time**, with 4–5 p.m. up to 71% more effective than 11–12 ([Revenue.io 2025](https://www.revenue.io/blog/the-best-time-to-cold-call-prospects), [Cognism 2026](https://www.cognism.com/blog/cold-calling-statistics), [ZoomInfo 2026](https://pipeline.zoominfo.com/sales/cold-call-timing)); one 7,699-call dataset put the peak connect rate (53.7%) in late-afternoon US Eastern ([Saleshandy 2026](https://www.saleshandy.com/blog/cold-calling-statistics/)); Gong's 300M-call baseline is 5.4% average connect, 13.3% top quartile ([Skipcall 2026](https://skipcall.io/en/blog/cold-call-connect-rate-benchmarks)). For a rep on Eastern hours (say 8:30–5:30 ET): Eastern and Central metros expose both windows; Mountain metros (Denver, SLC, Boise) push the 4–5 p.m. local window to 6–7 p.m. ET; Phoenix (no DST) is 3 hours behind in summer; Pacific metros (Las Vegas, Sacramento, San Diego, Seattle, Portland) lose the afternoon window entirely and their morning window lands at 1–2 p.m. ET. That is the structural argument for the current ET/CT weighting and against adding Pacific metros.
