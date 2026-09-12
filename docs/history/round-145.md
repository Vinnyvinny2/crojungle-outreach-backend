# Round 145 (Round B) — the press looks at the website, and the queue is ordered by it

**2026-09-12.** Contract `20261020`. `index.html` changed, so it needs the Netlify drag.

Vin's sequence: *"first i want to know how good the find press run was… next we need to ship plan b
then we need to do another test and figure out if eveyrhting is running according to plan."*

## Step 0 — two rounds of press rules had never run, and now have

Verified from the Render logs before building anything: **exactly one real press had run since
Sep 5**, on 2026-09-08 18:59. Every other `FIND YIELD` in the week was the boot self-check. So
every press-side change from Rounds 139 and 143A had been merged and never executed. Round B
would have been the third consecutive press round shipped blind.

Vin pressed Find. **16.0s, 300 leads, 24 Google queries, $0.84.**

| rule | round | fired on 466 seen |
|---|---|---|
| thin-review businesses demoted, not deleted | 143A | ✅ **0 deleted / 44 demoted** — Sep 8 deleted **42** |
| branch drop off the listing URL | 139 | ✅ **60** (4 on Sep 8), 57 free from the URL — now the largest single loss |
| too-big demoted, not deleted | 139 | ✅ 8 |
| yield report names its own worst loss | 139 | ✅ |
| no-website lane | 143A | ✅ 24 |
| free-builder lane | 143A | ✅ 1 |
| Google's suspicious-listing flag | 143A | ⚠️ **0** |
| same phone, different names, different metros | 143A | ⚠️ **0** |

**The press works. 44 businesses are in the queue that the old code binned.**

**The two zeros are unresolved and stay on the list.** Phone collision at 0 on 466 is believable —
it needs one number under different names in different cities. The listing flag at 0 is not: zero
permanently-closed, moved or Google-flagged listings in 466 suggests Places search already excludes
them, which would make that drop dead code. Its declared values have now survived their first live
press **unconfirmed**.

## Step 1 — the baseline, measured off that press

```
returned                     300
  with a website             276   (92%)   ← Round B's denominator
  no website at all           24
carrying a website grade       0           ← the press did not look at websites at all
press wall time             16.0s
queue after the press        743 unread + 1048 banked  →  74 days at 10 reads/day
```

**The ordering was the bottleneck, not the finding.** At ten reads a day what reaches the rep is
decided almost entirely by what sorts first, and nothing in that sort knew what a website looked
like.

## What changed

**The press reads every homepage free** — `pressSiteLooks`, a plain HTTP GET, five at a time behind
a wall clock, no Firecrawl, no screenshot, no model call. It runs on the leading slice of the
press's own preference order **before** the scoring map, because that map is synchronous: a verdict
arriving later could not reach the number without scoring the run twice. Every free drop — branch
URL, franchise name, review floor, dedupe — already ran, so a dropped lead is never fetched.

**It grades from markup alone**, reusing `readSiteBuild` and `readSiteLooks`'s blind-eyes path
verbatim. Round 142 proved that half works: it graded True Recovery and Newcomer `dated` off their
own code after both renders timed out.

**A press verdict can never be `modern`, and that is kept rather than overridden.** `readSiteLooks`
returns `unknown` when markup is clean and nobody took a picture — its own words: *"a site can have
perfect code and still look terrible."* There is never a picture at the press. So the only verdicts
reachable are `dated`, `bad` and `unknown`, which is exactly right: the press's job is to **find**
the bad ones, not certify the good ones. **The plan's own success line said `modern/dated/bad` —
that was wrong and the existing rule won.**

**A bad website lifts the press score** (+8 bad, +4 dated), never lowers it for being good — the
same shape as the website gap at the contact read, and for the same reason. `unknown` moves nothing
in either direction, in all three of its shapes: a refusal, a clock expiry, and a clean markup read.

**A bad website is read first.** `orderUnread` gains a tier above the owner-findable guess. That is
the one ordering trade in this round and it is deliberate: a bad-website lead whose owner we may not
find now outranks a tidy-website lead whose owner we probably will, because the rep **dials** — he
does not need the owner pre-found to ask for him, and the website is the pitch. The findable-owner
guess still orders within each website group, so it is narrowed, not retired.

**The refusal rate is now a number on every run** — four new yield rows (bad / dated / read clean
and left unknown / refused or not reached). This was the one figure the round could not measure
before building it: the press made no site call, so the only number anyone held was 3-of-9 from
already-selected contact-read leads, a biased sample and the wrong denominator.

**No SQL.** The verdict rides the queue row's existing `extra` JSONB blob. A new top-level column
would have risked PostgREST refusing a whole 300-lead write on one unknown key — launch night, §42 —
and the server has no strip-and-retry.

**The client toggle reads it as a fallback.** `siteLooksOf` read only the contact-read field, so
"bad websites only" could filter only leads somebody had already paid to read — almost none of a
743-deep queue. The contact verdict still wins where it exists; it saw a picture.

## Two checks that could not fail, found and closed

**The draw-order fixture.** Its five rows carry no website verdict, so the new tier returned 0 for
every one and `'cbeda'` passed **without the new code running at all**. Re-aimed rather than
replaced — it now also proves the tier is inert with no verdict anywhere, which is the
switched-off case — and a second fixture with verdicts on it asserts `'fgih'`: bad first even on
the worst owner guess in the set, dated second, and a site nobody could read sitting with the
unjudged ones.

**The servercheck cast had no bad website in it.** Every `.example` host served a homepage with an
enquiry form, a tappable phone and a current copyright — a clean site — so the press graded **none**
of them and the assertion "graded at least one" went red on its first run. That was the fixture, not
the code. Two cast businesses added: **Grim Site Plumbing** (2011 copyright, no form, no `tel:`) and
**Refused Site Plumbing** (403 on a plain read). Both asserted by name, in both directions.

## Verified

```
node docs/gen-refs.js                                    green
node build.js --check       byte for byte, CRLF, 91,166 lines
GATES=static bash ci-gates.sh                            GREEN
node clientcheck.js                                      exit 0
node servercheck.js        322 assertions (was 310)       exit 0
boot                       308 checks, 0 failures, 1 expected decline
node falsify.js docs/history/round-145-reverts.js        5 of 5 RED, tree restored byte for byte
bash ci-gates.sh (all)     ALL GATES GREEN — 2,064 emails, 0 request errors
```

## The target, and where it landed

```
Today: 0 of 300 pressed leads carried a website grade.
Done:  every lead with a website either carries a grade or is marked
       "nobody looked" — and ZERO are graded modern by default.
Landed: green on the fixture. NOT YET SCORED on real data.
```

**The round is not closed.** It can only be scored by Vin's next press, which is step 3 of his own
sequence. Everything above is *green*, which means the code does what the code says — not that the
thing has run.

## NOT proven

- **The refusal rate on real websites.** The whole point of the new yield rows; unknown until a
  real press prints them.
- **Whether 276 fetches stay inside the clock.** This press used 24 Google queries because the
  bench served 1,000. A full 100-query grid is ~4× the leads and has never run.
- **Whether ordering by website gets the rep better leads.** Only his dials answer that.
- **That the two zero-firing rules from Round 143A are correct.** Untouched.

## Needs your eyes

1. **Drag `index.html` into Netlify** — contract `20261020`.
2. **Press Find again.** This is step 3 of your own sequence and the only thing that scores this
   round. Read the four new website rows on the `FIND YIELD` line and the `PRESS SITE READ` line:
   how many bad, how many dated, how many refused. Expect the press to take ~2 minutes rather
   than 16 seconds.
3. **Then read a batch** and see whether the leads you get are the bad-website ones.
4. **The rating band is the next lever and it is bigger than this round was.** 222-256 leads
   demoted for sitting *above* 4.85 stars, executed at **−10** against −4 for a thin review count.
   You said rating is not what you care about. Raised mid-round and parked at your instruction.

## Carried
- **Round 146**: the Hunter timeout claiming *"its index has no address for them"* on a lookup that
  never completed — cost three addresses on the 2026-09-12 batch, including the top lead. Also the
  nav label ("Anesthesia Options") disarming the owner-wave stand-down, 6 credits. Both diagnosed
  and falsifiable; no code written.
- **The revenue multiplier**: tier = headcount × $200k, a figure sourced from *"HVAC/plumbing/
  electrical"*, applied to 6 of 8 rows on the current sheet because Oral Surgery, Chiropractic,
  Fertility, Behavioral Health and Dental have no override. Shown as `MEDIUM` with no `(guess)`
  marker, because a team-page count reads as measured. **The marker Round 144 shipped guards a
  different failure than this one.**
- Google's suspicious-listing flag and the phone-collision drop: 1 press, 0 firings.
- Round 144's render counter, never seen on screen.
- Renders: 2 of 9 unknown last batch, neither a timeout — one half-loaded, one bot-block page.
