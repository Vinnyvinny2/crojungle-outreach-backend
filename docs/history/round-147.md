# Round 147 — a floor must never take a lead off the call sheet

**2026-09-13.** Round 146 merged, Netlify took `index.html`, and Vin pressed Find and read a batch
of ten. Its own targets scored: **9 of 10** owners named (was 7), **18** credits for ten leads (was
68), **0** leads demoted for a high star rating (was 259 of 480), **0 of 10** sites wrongly graded
"bad" (was 8), and **13 of 341** businesses sized free off their own homepage where the pool had
carried **zero** measured sizes.

Then the sheet showed this:

> `🎯 TARGET [Andrew P. Trussler, MD]: size high (likely: at least 53 people on their own team page)
> | tier upper (estimated $10M-$20M …) | layers owner | target owner — the owner is within reach |
> lane email`

**One plastic surgeon, marked large, routed to email, off the rep's call sheet.**

Round 146 is what made that possible, and it is worth naming rather than burying. Before it, a wrong
size moved a *score*. Since it — Vin's ruling, *"size is the golden ticket because size kind of
decides reachability wise and also decides which channel we use"* — size decides whether a human
being ever dials the number. The ladder was built to report a **floor**, which is safe while a floor
only ever raises a score. It is not safe when raising a floor past $10M silently removes a lead.

Four defects, each reproduced by lifting the real declarations out of `src/all.js` and executing
them on the values the live log printed. None is a reading of the code. **All four shipped past 308
boot checks and 345 server assertions**, which is the fact that shaped this round: the work is as
much the guards as the fixes.

## 1. Reproduced first, before anything was specced

29 real declarations lifted verbatim — `_scaleLadder`, `estimateScaleBand`, `sizeTierFromRevenue`,
`SIZE_TIER_CHANNEL`, `STAFF_PROSE_RE` and their dependencies — reproduce the log's own sentences
byte for byte:

| lead, as the log printed it | band | usd | size word | floor? | channel |
|---|---|---|---|---|---|
| Trussler — `at least 53 people on their own team page` | upper | $10.6M | **large** | **yes** | **email** |
| Richard J Garcia CPA — `at least 27 people` | core | $4.05M | medium | yes | call |
| Dr. Sam Sukkar — `"50 doctors"` | core | $10.0M | medium | no | call |
| Henry A. Mentz, MD — `"two doctors"` | below_floor | $0.4M | very small | no | call |

## 2. The dollars behind a published count are not a floor

This is the sharpened cause, and it was found by execution after the first draft of the fix had
already been written — the first falsification run caught the first version passing for a reason
that had nothing to do with floors.

A published count is a **lower bound on people**: a firm with forty staff may publish four. The
ladder then multiplies it by a revenue-per-head constant and calls the *product* a floor. It is not
one. Executed:

```
trades with their OWN revenue-per-head figure:  PI Law, Estate Law, Accounting,
                                                Tree Service, Hardscaping, Home Care, Senior Care
default for everything else:                    $200k per head  (calibrated on HVAC/plumbing/electrical)

Plastic Surgery -> $200k   Med Spa -> $200k   Dental -> $200k

Trussler: 53 people x $200k = $10.6M  -> 3% over the $10M channel line
```

So the number that took a surgeon off the phone is a page parse multiplied by a constant that seven
trades have a row for and every medical trade borrows from HVAC. The headcount errs in one
direction; **the dollars err in both**, and they are what crossed the line.

That is the whole argument for the rule below, and it holds at both ends of the ladder.

## 3. The four fixes

**A floor keeps the call lane, at both ends** (`lanesFor`). Only a size measured in both directions
— a **verified headcount** or a **stated revenue figure** — takes a lead off the phone. Everything a
business publishes about itself keeps it, whether the inference reads `large` or over the ICP, and
the row says which fact kept it. Two cases this deliberately does not repeal: Rose Paving, PE-owned
and layered at $255M from a **directory's** figure, stays off the phone (a directory figure is not a
floor); and `_forcedEmail` is read **before** the floor, so a TheirStack lead with no phone, a
product company and a business publishing its own marketing director keep their email-only routing —
those are facts about the lead, not inferences about its size. `sizeIsFloor` is computed at the
contact read and passed explicitly; two needles pin the call site, because computed-but-not-passed
is the bug class this repo records most and it would have made every line above true and unreachable.

**A published count under three is not a measurement** (`_scaleLadder`, `SIZE_TERMS`). Henry A.
Mentz, MD — a multi-page practice with a med spa — wrote *"two doctors"* and the sheet read
**"estimated under $800k"**: a maximum stated from a minimum, and `below_floor` is the band that
benches. The rest of the file already knew the rule — `countTeamNames` refuses fewer than three
names, the team-page rung only speaks at the core cut, the line directly above says *"from three
people up"* — and only the fall-through disagreed. It now **falls through** rather than returning
nothing, so a two-doctor practice publishing four locations is still sized by its locations. The
same floor went on the rep's word ladder in the same commit, because two ladders disagreeing about
whether a business was measured at all is how one screen carries two verdicts.

**An award is not a headcount** (`STAFF_PROSE_RE`). Dr. Sam Sukkar, one plastic surgeon, carried the
row `"50 doctors" on their own pages`. His page says he was named one of Houston's **Top 50
Doctors**. Executed on the real regex:

```
MATCH ["50 Doctors"]  <- named one of Houston's Top 50 Doctors by H Texas Magazine
MATCH ["10 doctors"]  <- voted among the top 10 doctors in Texas
MATCH ["25 doctors"]  <- Castle Connolly Top Doctors 2024 - one of only 25 doctors in the region
```

The bare-number branch has an **optional** prefix, so any number standing next to a trade noun was a
staff count. This is the one rule that does not bend — *"I'd rather send nothing than tell them
something's wrong when it isn't"* — and it fires at the **press**, on every business found, where
nobody opens the page: the press read passes only `intent: 'home'`, so `teamCount` cannot fire there
and **all 13 free-measured sizes came from this reader**. Refused on the bare-number branch only:
the five grammatical forms that say staff in their own words are untouched, so *"one of our 30
technicians"* still counts 30 while *"one of 50 agents"* does not. **12 award phrasings refused, 8
real counts kept, asserted in both directions.**

**A checker that only ever errors is unavailable** (`verifierUnknownAnswer`). Reoon answered `error`
**six times** in the batch — every call it was asked to make. `error` is in neither token list, so
each was honestly printed as UNCHECKED and then forgotten: nothing latched, `verifierAnyAvailable`
kept saying yes, and the row's block reason reads that function. A lead then falls through to *"no
evidence of this mailbox from any source"* — a statement about a prospect built on a failure of ours,
the same offence as the Hunter timeout one round earlier. Three unrecognised answers in a row now
stand a checker down for the cooldown, a recognised verdict clears the run, and the vendor's own
`reason` is quoted so the line can tell a wrong key from a spent quota. (Reoon's docs are unreachable
from this network — the file has said so since Round 133 — so its token list remains evidence rather
than gospel.)

## 4. The guards, and what falsification caught

One guard per fix, each **executing the real function** on the live values rather than reading
source. Falsification: `node falsify.js docs/history/round-147-reverts.js` — **7 of 7 RED on their
own named line**, tree restored byte for byte.

Two things the run caught that review had not:

- **`147-b` went GREEN with the fix reverted.** The over-the-ICP assertion used an owner-run business
  at $22M, so Round 114's reach exception ($50M owner-run line) passed it for a reason that had
  nothing to do with floors — and, worse, it meant the first version of the fix never handled the
  over-ICP case at all: `SIZE_TIER_CHANNEL` has no row for `over_icp`, so the lead still got no lane.
  Re-aimed onto a **layered** business, where reach cannot fire, and the fix gained its second branch.
- **A guard my own change disarmed, named rather than widened.** The Round 146 needle
  `sizeTier: _sizeTier, sizeTierMeasured: !!_sizeTier,` broke when `sizeIsFloor` was inserted between
  its halves. Re-aimed to pin two fields instead of one, and a second needle added for the new field.

## 5. Scored against the targets

| # | target | result |
|---|---|---|
| 1 | 0 of 10 read leads leave the call sheet on a floor (was 1) | **met** — executed: Trussler's exact inputs return `channel "call"`, with the reason on the row |
| 2 | 0 of 10 carry a dollar ceiling from a published count (was 1) | **met** — `estimateScaleBand({staffProse: 2})` returns nothing, and the rep's ladder agrees |
| 3 | 0 of 12 award phrasings counted as staff, all true forms kept | **met** — 12 refused, 8 kept, both directions asserted |
| 4 | a checker stands down after 3 unrecognised answers (was 6, never) | **met** — executed on the real latch |
| 5 | re-measure at the next press | **open — needs a press.** Today 13 sized of 341, 1 large, 3 over the ICP. The press line now reports how many floors would have cost the rep the lead |

## 6. Needs your eyes

- **Whether 53 was a parse artifact or a real roster is still unproven.** `drtrussler.com` is blocked
  by this container's egress proxy, so the page could not be fetched and the count could not be
  reproduced from the real HTML. The fix does not depend on the answer — a floor keeps the call lane
  at 53 or at 5 — but the parser itself is unexamined, and the same is true of the 27 at Richard J
  Garcia CPA.
- **Every medical trade converts at HVAC's $200k per head.** That constant, not the headcount, is
  what pushed Trussler 3% over the channel line. Adding rows for the medical trades is a business
  fact only Vin can supply, and it is the single highest-leverage change left in the size ladder.
- **13 of 341 is the free yield** — about 5% of the 272 readable homepages. The mechanism works; the
  harvest is thin. Free alone will not fill the size filter.
- **Press time was 99.3s against a 60s target**, the site read ~85s of it on 341 homepages. Missed.
- **`index.html` did not change this round**, so there is no Netlify drag and no contract bump. The
  contract stays **20261021**. The floor reason reaches the Render log, not the row.

## Verification

```
node docs/gen-refs.js            ✓
node build.js --check            ✓  92,573 lines, CRLF, byte for byte
GATES=static bash ci-gates.sh    ✓  ALL GATES GREEN (static)
node clientcheck.js              ✓  exit 0
node servercheck.js              ✓  345 assertions, exit 0
GATES=boot bash ci-gates.sh      ✓  BOOT VERDICT: GREEN — 308 checks, 1 expected decline
node falsify.js …-147-reverts.js ✓  7 of 7 RED on their own line, tree restored
bash ci-gates.sh                 ✓  ALL GATES GREEN (all), fuzz 2,044 emails, every invariant held
```
