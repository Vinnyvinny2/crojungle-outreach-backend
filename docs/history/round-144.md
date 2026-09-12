# Round 144 — the rep's sheet says the tier, and the owner wave stops buying nobody

**2026-09-12.** Contract `20261019`. `index.html` changed, so it needs the Netlify drag.

Vin ran the first live batch against Round 143A on 2026-09-11: 10 leads read, 32 Firecrawl
credits, 2 dropped as branches. He asked what tier each business was; the answer was a table
built by hand out of `🎯 TARGET` log lines, because nothing in the product could produce it.

> *"absoilety love this table i wantv when we export it to look like this expect move who to
> ask for to the right of business name and just drop how size was decided. and also yes lets
> fix all of the issues we identified at the hgihehst level"*

and, on the columns:

> *"get rid of these (batch_id, exported_date,_owener confidence email_confidence. and add and
> all the ones form ur table that i said"*

## A correction on the record

Earlier in the session I told Vin *"the tier never reaches the screen or CSV"* and that
`contactSizeTier` was always empty. **That was half wrong.** `out.size.tier` is set
(`src/all.js:87355`) from `signals.scaleBand`, which `src/all.js:87350` nulls only when the
scale ladder **guessed**. So the tier reached the row on a measured lead and was empty on a
guessed one. The defect was narrower than I said, and the shape of the fix changed with it.

## What was broken

**1. Two tiers existed and the weaker one reached the row.** `lanesFor` returns seven keys
(`src/all.js:5525`); `contactFieldsFrom` copied four (`src/all.js:87867`). `tier` and
`measured` were computed, printed in the TARGET line, and dropped at that boundary — so the
log said `tier low` on a guessed lead while the row said nothing, and neither had a column.
`contactSizeSay` already carried the revenue band in words (`"estimated $1.2M-$10M from 9
verified employees"`) and had **zero readers** in `index.html` and `clientcheck.js`.

**2. 21 of 32 credits bought nothing.** The paid owner wave ran on four leads and named
nobody on three: The Insight Program (7cr), Northgate Park (8cr), The Colonnade (6cr). All
three are `ownerRisk` categories — Behavioral Health and Senior Care — flagged on
`GP_CATEGORIES` with the rationale written beside them since the table was built: *"Senior
living is dominated by national operators and REITs … flagging the whole category as
consolidation-risk makes Research confirm a real owner before we spend on it."* The flag is
stamped on the lead at the Places search (`src/all.js:8243`) and read in exactly three
places, all in research, merge and scoring. **`runFindContactRead` never read it**, and at
`src/all.js:86700` the incoming signals object is replaced outright — so the one signal
saying "there may be no local owner here" was discarded immediately before the money went
out. Computed-but-not-passed, on the route that spends.

§110 declined to act on a pair count from two leads in one afternoon (*"Two of two in one run
is NOT evidence"*) and was right to. This is a different thing: a declared category flag with
its reasoning in the source, now three of three in a second run.

**3. Half the renders failed and no meter moved.** 4 of 8 (3 timeouts, one HTTP 408).
`fcHomeShot` budgeted 25,000ms for a 3,000ms `waitFor`, while the audit's full-page render
next door budgets 30,000ms for a **longer** 4,000ms wait and `firecrawlScrape` budgets
45,000ms. The one render a Find lead gets had the least headroom in the file and no retry
behind it. A failed render returns `credits: 0` (`src/all.js:15928`), so it advances neither
the per-lead cap nor the daily budget — while this file's own note says *"Firecrawl bills the
submit"*. The only reason anyone knew half of them failed is that a human counted log lines.

**4. The negative cache covered one of four paid stages.** The file said so itself at the
dead-site stop (`src/all.js:36584`): *"Licence, chamber and registry were re-bought at full
price."* Worse, a websearch cache hit returns `null` without settling the lead, so the licence
stage was reached **faster** on a re-press, not avoided.

Round 142 worked exactly as built: True Recovery and Newcomer both timed out and were still
graded `dated` off their own markup. Northgate got `unknown` because its free markup read
found zero visible `build`/`converts` faults — nothing for the rescue to stand on. That gap is
Round B's free homepage read and is deliberately **not** in this round.

## What changed

**The sheet.** The export opens on Vin's table:
`company | who_to_ask_for | tier | revenue_band | website | phone | …`. The four columns he
named are gone from the file entirely, on both toggle settings. 22 fixed columns (was 23),
31 lean (was 33), 55 full (was 57).

- `contactTier`, `contactTierMeasured`, `contactTierBand` added to `contactFieldsFrom`. The
  band is `SCALE_BAND_SAY`, the existing tier-to-dollars map derived from `ICP_REVENUE_BAND`
  — reused, never retyped, so the sheet and the ladder cannot drift.
- `TIER_SHEET_WORD`, `tierCell`, `revenueBandCell` on the client, beside `AFFORD_LABEL`.
  `SIZE_WORD` could not be reused: it collapses `over_ceiling` into `high`, which is the one
  distinction the column exists to make. Over the ceiling now reads **TOO BIG**.
- **A guess says so.** Vin's ruling, 2026-09-12: mark it inside the cell, because a rep
  scanning five columns never reaches the sixth. A guessed tier exports `LOW (guess)` and its
  revenue band exports `not measured` — never a dollar range. Four of the eight rows in the
  last batch were guesses off a review count.
- **Never looked is not measured zero.** A lead read by an older build exports an empty tier
  and an empty band, not `LOW` and not `not measured`.
- **Nothing the dropped columns carried is lost.** `owner_confidence` moved into the *head* of
  the who-to-ask-for cell (`Owner (stated): Jo Blogs`) — the head and not the flag, because
  `nameWithFlag` drops a flag whole to keep a long name intact, and a caveat that disappears
  on long names is not a caveat. `email_confidence`'s two states where a **sendable** address
  is still unverified — a catch-all domain and a verifier that was down — moved into the
  address cell. `sizeConfidence` stays as its own column: it is not what was dropped.

**The wave.** A lead in an `ownerRisk` category **whose own pages name nobody** no longer buys
the paid owner search, in the same shape as §117's branch stand-down. Both halves are
required: the category alone never decides it, because Darrel owns a funeral home and finding
Darrel is the entire point of this system. The roster half reads `teamCount`, `teamNames`,
`teamTitles` and `founderPhrase` — all set by `readFindIcpSignals` from pages already held, so
it costs nothing and is known before a byte is bought. Behind `FIND_OWNER_RISK_STANDDOWN`,
default on. `ownerNamedOnSite` is deliberately **not** read: it is written 300 lines below the
wave out of what the wave found, so reading it there would be a clause that can never be
false.

The 14-day negative now also covers the **licence** stage, keyed on the name and city (that
function is not even handed a website). Written only where the model read real results and
found no owner in them — `firecrawlSearch` returns `[]` on an empty balance too, and
remembering that would turn one unpaid Firecrawl bill into a fortnight of leads we believe we
searched.

**The renders.** `FC_HOME_SHOT_TIMEOUT_MS = 35000`, pinned by an **executed** boot check
(`>= 30000`, the audit render's floor) plus a needle proving the signature still reads the
constant. The outcome reaches the row (`renderTried` / `renderFailed` / `renderFailWhy`) and
the run tally prints it: *"Website renders: 8 bought, 4 came back empty (50%) — 3 timed out,
1 refused."* Printed whenever a render was bought, including when none failed: a counter that
only speaks up on bad news cannot be read as a rate.

## Checks re-aimed, not retired

Five guards were pointed at facts that moved. Each is named here because a guard nobody can
trip still reads as coverage.

| was | now |
|---|---|
| `clientcheck` `WANT23`, pinning Round 131's two A-D letters in the prefix | `WANT22` on the new order, **plus** `GONE4` asserting the four are absent from the whole file, plus the grade heads and the unverified-address qualifiers asserted where those facts moved |
| `clientcheck` index-based `owner_confidence === 'A'` / `email_confidence === 'A'` | the clean states asserted in the cells: a confirmed owner names him with no qualifier, a published mailbox stands alone — the absence of a caveat **is** the A |
| `clientcheck` ownerGrade/emailGrade must be **in** the prefix and declared table | must be **absent**, plus an inferred owner must not produce the same cell as a confirmed one |
| boot: `paidOwner = … && !_headOffice;` as a literal | both stand-downs asserted separately — losing either is its own live failure (30 credits on 2026-09-04, 21 on 2026-09-11) |
| boot: the licence executor's no-second-evaluate guard as a one-line literal | the **order** — the no-new-hits return must precede the second `evaluate`, which is the actual rule and survives a rewrite |

## Verified

```
node docs/gen-refs.js                                    green
node build.js --check          byte for byte, CRLF, 90,842 lines
GATES=static bash ci-gates.sh                            GREEN
node clientcheck.js                                      exit 0
node servercheck.js            310 assertions (was 299)  exit 0
boot                           308 checks, 0 failures, 1 expected decline
node falsify.js docs/history/round-144-reverts.js        5 of 5 RED, tree restored byte for byte
bash ci-gates.sh (all)         ALL GATES GREEN — 2,106 emails, 0 request errors
```

The stand-down is **driven through `/api/find-contact` and counted off the ledger**, not off
the log: a log line saying the wave stood down proves the log line, not the spend. Three
leads, because the rule is two halves — a control (a roofing contractor naming nobody buys the
wave, which is what makes the other two mean anything), the case (senior care naming nobody
buys **zero**), and the half that keeps Darrel (senior care with a roster is not stood down).

One assertion was written and then removed for being a test of the fixture rather than of the
rule: a senior-care lead with a roster does not buy the wave because its own team page names
Pete Barnes as Owner, so stage 1 settles and the wave is rightly never reached. What is
asserted is the flag, and the predicates behind it are executed directly by the boot check.

## NOT proven

- **That 35s fixes the timeouts.** Three timeouts on eight leads is not a distribution. The
  render counters are what make the next batch answer it; the raise is a reasoned guess.
- **Whether Firecrawl bills a timed-out render.** This file asserts it; nobody has checked it
  against the dashboard. The counters are what would let that delta be read.
- **That the stand-down saves ~21 credits a batch.** It saves them on this batch's shape. How
  often `ownerRisk` leads appear in a press is not measured.
- **Whether the stand-down ever costs a real owner.** The roster half is the guard, but only a
  live run says whether a consolidated-category business with a named owner and no team page
  is in the queue. The stand-down logs the lead by name so one can be spot-checked.
- **Whether the five-column sheet is the one the rep works from.** Only his dials answer that.

## Not in scope, deliberately

The **guessed tier itself**. Marking a guess is not measuring it, and four of eight rows will
still say `(guess)`. The fix is the free homepage read, the founding year and domain age —
**Round B, running in Vin's other window.** Doing it here would collide. Northgate's `unknown`
website is the same. Also carried: the med spa 40-review bar with no measurement behind it,
the revenue unit bug, `site.looks` into the Fit score, and prices and the lower tier.

## Needs your eyes

1. **Top up Firecrawl.** `FIRECRAWL OUT OF CREDITS (search)` fired twice in the last run, and
   an out-of-credits search returns `[]` that the caller reads as *"we looked and found
   nobody"* (`src/all.js:10531`). Nothing in this round changes that.
2. **Drag `index.html` into Netlify** — contract `20261019`. The new columns, the guess
   marker, the render counters and Round 141's bad-websites toggle are all dark until then.
3. **Press Find, export one batch, read the first five columns.** They are proven by
   execution; whether they are the sheet the rep works from is yours.
4. **`TOO BIG` reaches a human.** So does `Owner (stated):` and `(catch-all domain,
   unverified)`. Those are your words to approve or change.
5. **Dropping `owner_confidence` and `email_confidence` as columns** now rests on the inline
   markers above. I believe nothing is lost; you read the sheet and I do not.
6. **Read Deirdre Taylor CPA through a contact read** (~6 credits). Still the only real test of
   the website strategy.
7. **Watch the Firecrawl bill.** The stand-down should drop it; the render raise may push the
   other way if Firecrawl bills the submit.
