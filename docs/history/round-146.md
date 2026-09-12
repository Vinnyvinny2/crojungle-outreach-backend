# Round 146 — size becomes real, and size picks the channel

**2026-09-12.** Vin gave Find's whole job and then the reason it matters:

> *"The find needs to be an overarching thing of ICP so high side 20 million low side whatever the
> floor … based on size — size is the golden ticket because size kind of decides reachability wise
> and also decides which channel we use."*

> *"i just want to be able to catgeroize these businesses properly so we kow the size and can filter
> through the size … the people that are technically back pages but are like gold in the pot their
> quiet succesful those are gold and those will be found by ctageroizign buinesses based ons ize."*

## 1. The finding the round exists for: nothing in the pool had a measured size

`signals.scaleBand` is assigned inside the CONTACT READ — ten leads a day. `placesTriageScore` reads
`l.scaleBand`, where it is **undefined for every fresh Places lead**, so at the press the tier fell
through to the **Google review count**. Round 144's own batch: 4 of 8 read rows still guessed the
tier, and Northgate at 82 reviews and Monticello at 12 landed in the same band. On a pool of 300 it
was all of them, and `clientcheck`'s own fixture line said so out loud: *"Sizes: 0 measured (0%) …
12 not measured."*

A review count is the worst possible instrument for the business Vin is after — *"quiet succesful"*,
few reviews, real revenue.

**The fix cost nothing, because the machinery existed and the bytes were already fetched.** Four of
the eight rungs on `_scaleLadder` read off a business's own pages (`staffProse`, `fleetProse`,
`locationsProse`, `teamCount`), and Round 145 already fetches every homepage free at the press. The
press now runs `readFindIcpSignals` + `estimateScaleBand` over the page it already holds: no
Firecrawl, no screenshot, no model call, no second fetch.

**It is a FLOOR and the row says so.** Vin asked for the sizing to be *"as accurate as possible"*,
and the honest answer is that a count a business PUBLISHES is a lower bound — this file's own words
at the staffProse rung: *"a forty-person firm may publish four"*. So the error has a known direction
and it is the direction that matters: it reads businesses **smaller** than they are, which is the
half of the ladder Vin works. Marked, never smoothed over.

**And it reverses the order of operations, which is where the money is.** Vin arrived at this
independently: *"id like to know if we can organzie the size before we run read … this owuld speed
th rporcess up and make it more cost effcient."* A contact read costs 6.33 Firecrawl credits and
$0.0076 of model. Before this round the size was measured INSIDE that read, so the tier arrived
after the money was spent. Now a business the press can already measure as out of range is never
read. **The size of the saving is not forecast here** — how often a homepage states its own size has
never been measured, and the two new yield rows ARE that measurement.

## 2. The two numbers, researched rather than picked

**$20M is the top of the ICP**, superseding the $15M of Round 139 and the $35M of §111. Round 139's
$15M settled a doc-versus-code disagreement; it was never a measurement. Vin asked for the number —
*"find me the ideal range for whats still reachabile either cold callign wise or email wise"* — and
three independent lines cross there: cold email reply falls almost linearly with headcount and
breaks near **100 people** (Belkins 7.5M emails: 0.72% under 10 people against 0.22% at 10,000+;
Sales.co 2M+: 18.2% positive replies at 1–10 people against 3.4% at 5,000+; Woodpecker/Stealery
8–15% / 4–8% / 1–3%); **agency buying gives way to in-house at $20–25M** across six sources; and a
**PE platform acquisition in these trades is a $20–80M operator**, after which marketing technology
and lead routing centralise at corporate. 100 people at $200k a head is $20M. *Honest shape: two of
the three lines are general B2B, not trades, and we have never sold to a $20M business.*

**$10M is the channel line, and it is not about the phone being answered.** Four trades staffing
sources give one ladder: under $1.5M the owner answers his own phone; ~$1.5M buys the first CSR (the
"unlock hire"); $3M splits CSR from dispatcher; $5–10M runs 2–3 CSRs and an ops manager **with the
owner still deciding marketing**; $10–20M adds a GM **and a Sales/Marketing Manager**. One office
person per 3–4 technicians at $250–350k per tech. So the line is where **somebody other than the
owner owns marketing**. *Weakest on the professional practices — a ten-person law firm at $1.75M has
a receptionist and a different shape.*

**Two existing rules the research independently confirmed**, worth more than either number: owners
and founders reply more than any other job title (0.57% against 0.32% for VPs), and asking a
receptionist for the owner by name works 60–70% of the time, falling off above ~200 people.

## 3. Four tiers as a SECOND ladder, not a rename

| tier | revenue | channel |
|---|---|---|
| very small | under $1.5M | call |
| small | $1.5M–$4M | call |
| medium | $4M–$10M | call |
| large | $10M–$20M | **email** |
| — | over $20M | no lane |

The round plan said rename `SCALE_TIERS`. That would have been wrong. `ICP_REVENUE_BAND` answers
*what can they pay* and its cuts are **prices** — `coreFrom` is $1.2M because a $10k/mo retainer is
10% of $1.2M, and a boot check proves it against the price list. Vin's cuts answer *how big are
they*, and the two **cross-cut**: very small, small and medium all sit inside one affordability band.
Kept apart, both stay provable and a row can say "small · lower tier" against "medium · premium
fit", which is the who-closes-it question. `ICP_SIZE_TIERS` types only two numbers — the $10M and
$20M lines are read from `ICP_REVENUE_BAND`, never retyped.

**The doc moved in the same commit**, because both L1 notes tell the next reader to change
`business-and-icp` FIRST and never retype the cap. Round 139 exists entirely because those two
copies disagreed for a week; changing the code alone would have re-earned that bug inside the round
that cites it.

## 4. The agents' base was stale, and that is mine

Five agents were run in parallel worktrees. **All five were cut from `8532a84` (Round 144)** — two
commits behind the branch — so every one was missing Round 145's press code AND the Round 146 size
ladder committed for them to build on. Their patches applied cleanly because the regions did not
collide textually, but two requirements were undoable in their world and were done by hand after:
Round 145's website-ranking removal, and the press progress line. **Verify the worktree base before
trusting parallel work**: the site/press agent correctly reported that Round 145 "does not exist in
this repo", which was true of its tree and false of the repo.

## 5. What the agents found that the diagnosis had missed

- **The size-lookup crash had a second, costlier path.** The reproduction only caught leads where the
  directories parsed nothing. On a lead that DID parse a size beside a bbb.org URL, the broken value
  is handed downstream and throws *inside the contact read's own try* — losing the free BBB owner
  pick and the SIZE LOOKUP line, recorded only as "the size lookup failed".
- **A second star-rating scorer.** `FIND_ICP_TERMS`' `rating` term gave 8/8 inside the old band and
  4/8 above it, so a 4.9-star business still lost half those points after every other penalty had
  gone. Neutralised; the below-band branch is untouched because Vin ruled on the high end only.
- **Three sentences that explain a blocked Hunter lookup each held their own copy of the states**, so
  a new state renders as "out of credits" unless added three times. One table now, rendered at
  exactly three sites, counted.
- **A live false cause, and worse on our instance than the agent could know.** The T4 block-reason
  ladder tested "every configured email checker is unavailable" FIRST and the recorded Hunter cause
  LAST. On an instance with no verifier key that first branch is true of every lead at once — and the
  BounceBan key was removed from Render — so **every blocked address reported a checker outage
  whatever had happened**. Fixed: the most specific RECORDED cause outranks a generic statement about
  our own capability. Guarded by OFFSET, not by a literal: the branch was never missing, it sat last.
- **The screen lost Round 145's press fallback** (built on a tree where Round 145 did not exist).
  Restored: without it the grade reads only fields a PAID read sets, and the queue is 743 unread
  against ten reads a day.
- **`clientcheck` was CRASHING, not failing** — its lift list did not know the round's names, so it
  died with "sizeStateOf is not defined" and covered nothing. A crash is worse than a red: a red
  tells you something is wrong.

## 6. The worst bug of the round, found by executing rather than reading

Taking the channel from the size tier alone meant every lead with an **unmeasured** size defaulted to
`'call'`, and that default **outranked the rules routing a big company away from the phone**. Rose
Paving — PE-owned, layered, **$255M** — came back as a call for the rep to dial. The affordability
tier is only ever set from a measured size, so it is not thrown away because a second ladder is
blank.

Two more of the same family, all mine, all this round, all sentences on a row that were not true of
that lead: every **exception sentence had gone silent** (gated on the channel being `'call'` while the
forced-email branch had already set it to `'email'`, so a lead moved off the rep's sheet came out
with `why: ""`); a lead with **no lane was told to email the marketing head**; and a lead **on** the
call sheet still said **"benched"**.

## 7. One recorded rule superseded, named not buried

§114 gave the email lane **no ceiling** — a big company was an email lead at any size. Vin put a
ceiling on the whole ICP instead: *"over 30m is dropped for now higher tiers are more so email leads
btu we arent wokring on email yet."* So over the ceiling is **no lane today**. **§114's reach
exception survives untouched** and is the one way back onto the call sheet: an owner-run business
with measured dollars under `ICP_CALL_REACH_CEILING` is still called — DMI Paving at $24M. **Round
139's headroom survives too**: over the cap on a *guess* stays callable.

## 8. Also in this round

- **The star rating moves nothing, in both directions.** 259 of 480 businesses in the 2026-09-12
  17:33 press were docked −10 for being rated above 4.85 — 259 of that run's 274 demotions. Vin,
  asked twice: *"trteat grate reviews as normal … take that out completley."* The +5 bonus goes with
  the penalty: "irrelevant" is zero either way. `GP_BAND_MODE=cut` stays as the way back. **Nothing
  connects a rating to a size** — Vin's hypothesis, deferred by his own ruling until the crash fix
  produces the first set of businesses carrying both a rating and a measured revenue.
- **Round 145's website RANKING comes out; the free READ stays.** *"i dont want find targeting
  explcitly bad ones i never said that did i?"* — mine to own: he asked for lower-tier businesses ON
  the rep's list and that became the press ranking them first. The grade now moves the Find score and
  the draw order by exactly 0, asserted on all four words.
- **One website grade, four words** (`poor`/`bad`/`fair`/`good`), decided only by what a visitor can
  see. `SITE_LOOKS_BAD` was 6 and `diyBuilder`(3) + `noClickToCall`(3) was exactly 6, so SLC Med Spa,
  Winn's and Locust Pump were graded **bad** with **zero** eye faults while the picture's own words
  were "modern", "professional", "professional". Design age now comes from `readSiteAge`'s **visible**
  markers, which already existed and decided nothing.
- **The nav-label hole, closed at its root.** *"Anesthesia Options"* reached a call sheet as a person.
  Measured on that exact string: all three name doors said yes, because the only thing wrong with it
  is the last word. It cost more than a wrong row — a junk pair makes `ownPagesNameNobody` read
  "their pages DO name somebody", so the paid owner wave buys a search for a business naming nobody.
- **The owner stand-down fires on evidence, not on a category.** 28 of 68 credits and ~620s on three
  leads that named nobody, none in the twelve flagged categories. The licence stage still runs —
  Vin's ruling, and where a sole proprietor is found. **Honest correction to the saving:** the
  searches are ~6 credits a lead and the licence register is the other half, so this saves about 6 of
  every 10 credits on such a lead, not all of them.
- **The press stops going silent.** 16.0s → 168.3s with nothing printed for three minutes, which Vin
  came and asked about. The wall time was the **concurrency**, not the bytes: pool 5 → 20, plus a
  progress line at least every 15s. *NOT PROVEN that this lands under 60s; it has never run at this
  pool size.*

## 9. Guards re-aimed, never deleted

57 assertions across four files, each with the old rule, the new rule and whose ruling in a comment
beside it. Two were **strengthened** rather than re-worded: *a website we could not read must never
be given a verdict*, and *a dollar range nobody measured must never print* — both now run on rows
that deliberately carry leftover values with the measured flag false.

**Three checks that could not have caught anything**, found and closed: `FIND YIELD CHECK` was a
COULD NOT RUN (its sandbox did not know the new grade list); `clientcheck` crashed; and the
stand-down case in `servercheck` asserted **zero owner searches** while its own predicate matched
the licence query, which is deliberately still bought — a number that could never be reached.

**And one trap walked into and closed inside the same hour it was read**: a new draw-order check
grepped the source for a literal that sat inside the check itself, so it could only ever fire.

## 10. Verified

`node docs/gen-refs.js` · `node build.js --check` byte for byte at **92,341 lines CRLF** · static
gates GREEN · `clientcheck` exit 0 · `servercheck` **345 assertions** (was 322, net +23) · **BOOT
VERDICT: GREEN, 308 checks, 0 failures** · 5,000 fake audits through the real ladder, every invariant
held · fuzz 2,092 emails, every invariant held · **7 of 7 falsifications RED on their own named
line**, tree restored byte for byte · `ALL GATES GREEN (all)`.

## 11. Needs your eyes

- **Drag `index.html` into Netlify — contract `20261021`.** The server half goes live on merge; until
  the drag, the four size words, the size filter, the channel column and the four-word grade are all
  dark, which is the shape that makes a bug look intermittent.
- **Press Find once, then read one batch of ten.** Three numbers can only be scored there: how many
  businesses state their own size on their homepage (the round's headline, deliberately a floor and a
  re-measure rather than a forecast), credits spent on leads that name nobody, and owners named per
  ten. **This round cannot close itself.**
- **Open a few of the sites and disagree or not.** The visible design markers have never been scored
  against a human's opinion of the same pages.
- **`size` and `tier` now print the same word**, and both website columns print the same grade,
  because each pair is one derivation that cannot disagree. Dropping either is your call — you
  specified those columns.
- **A dead `laneChip` in `index.html`** still branches on the retired size ids and is called from
  nowhere. Delete or rewire is your call; four `clientcheck` assertions pass on it because they match
  live behaviour and must move with it.
- **Wording to confirm:** "over the ICP", "email lane", "not measured", "not graded".
- **Carried:** whether a high rating predicts a bigger business (your hypothesis, deferred); the
  2,000-review ceiling, which demoted 4 of 480 and points the opposite way to it; a measured
  over-the-ICP lead still exportable on a row read by an older build; and `GP_BAND_MODE=cut`, covered
  by boot needles rather than driven.
