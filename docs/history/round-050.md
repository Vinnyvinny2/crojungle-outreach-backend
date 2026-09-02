# §50 — Why a five-lead run took an hour — 2026-08-22
Source: CLAUDE.md lines 3947-4126, moved verbatim 2026-09-02 from commit b01d952e4f95d7b69686bc2c4063ca2aa0cb7546 (branch backup/claude-md-monolith). Nothing below this line was edited.

## 50. Why a five-lead run took an hour — 2026-08-22

Vin ran five leads on the freshly-merged build: *"these 5 leads took way way too
long... it also seems like the audit for each company is taking longer than
usual."* He also asked whether three-at-a-time is a design decision or a
Firecrawl limit.

Neither. Two mechanisms were taxing every lead, both of them numbers that were
correct when they were written and had quietly stopped being true. The slot
count was never the constraint, which is why raising it earlier would have
bought nothing.

### One endpoint's rate limit was pacing every other endpoint

Three lines from that run's own log, minutes apart:

```
FIRECRAWL PACE: their header says 10 request(s)/minute   ... 350ms  → 7500ms
FIRECRAWL PACE: their header says 5000 request(s)/minute ... 7500ms → 350ms
FIRECRAWL PACE: their header says 500 request(s)/minute  ... 7500ms → 350ms
```

Firecrawl publishes a **different limit for each endpoint** and reports it in
that endpoint's own response header. §39 correctly made the measured limit set
the pace — and set ONE pace, globally, from whichever endpoint answered last.
So a 10/minute endpoint spaced every **scrape** 7.5 seconds apart on a plan
allowing five thousand a minute, and the two numbers thrashed against each
other all run. One lead makes about fourteen Firecrawl calls.

The pace is per endpoint now, which is the thing Firecrawl actually limits. The
BROWSER cap still takes the most restrictive endpoint we have been told about,
because browsers are an account-wide resource and that one should be
conservative — the two rules point in opposite directions on purpose, and the
log says which is which. A 429 still holds the whole gate: that is a real
account-wide signal. The endpoint is read off the request URL, so a new call
site is paced correctly without anyone remembering to label it.

### The memory ceiling was below the process's own weight

`RESEARCH_RSS_CEILING_MB` is 205, written from a boot that settled at ~145MB.
The live process reports `BOOT MEMORY: ... rss 320MB` — the 209 boot checks
allocate, and resident memory does not hand itself back. So the admission test
`rss > 205` was true on **every lead forever**: each one printed HOLDING, slept
the full 90-second bound, and started anyway with a warning. Three slots means
a flat ninety seconds per wave — about twenty-five minutes of pure sleep in a
fifty-lead run, buying nothing, while the guard it was supposed to be protected
nothing either.

The rule was never wrong, only the constant. What it wants to say is "do not
start another lead when this process has grown well past its own settled size",
so the baseline is now MEASURED once the boot verdict settles and the ceiling is
that baseline plus room for a page render. A boot that really does settle at
145MB keeps the configured 205 and behaves exactly as before.

**And it corrects something this file has assumed throughout:** the process runs
steadily at 320MB without Render restarting it, so this container's limit is NOT
the ~256MB stated all over these comments. That is one observation, not a
measurement of the plan, so nothing was raised on the strength of it — but stop
treating 256 as known.

### Only then, the slot count

`RESEARCH_CONCURRENCY` 3 → 6, and the client's `BATCH_CONCURRENCY` 3 → 6 with
it. Those two must move together: the client pool decides how many leads are
ever in flight, so a server raised on its own changes nothing for a batch. Six
rather than more because each lead holds page buffers — and because the memory
gate is now calibrated well enough to hold leads at the door if that genuinely
climbs, which is the honest way to find the ceiling rather than guessing it in
a constant.

`ENDPOINT PACING CHECK` and `MEMORY CEILING CHECK`, four falsifications, each
red alone. `FIRECRAWL PACING CHECK` was RE-AIMED rather than deleted: it went
red on the new build because it asserted the global gap moves, which is the
behaviour that was removed. Its underlying rule — a limit we measured must
actually reach the pacing — is unchanged and now tested per endpoint.

**The call-outcome CSV button is gone from the sidebar** at the owner's request.
The route stays: `/api/call-outcome` still records an outcome against the
finding that opened the call and `/api/call-outcomes` still serves the grouped
report to anyone who opens the URL, because that pairing is still the only
evidence in this project that is not the system grading itself.

**`index.html` changed, so this needs a Netlify deploy.**

### What the same run's call sheets carried — fixed 2026-08-22

Two leads of the five were killed at the eight-minute WORK clock with every
API already paid for, and the log proves the cause was the pacing above: seven
to fifteen seconds between every paid Firecrawl call, and Factory Surplus's own
line reading *"138s of that was spent WAITING for a free Firecrawl browser"* —
a third of that lead's entire working time. The three that survived exported
correctly; "Export 3" after a five-lead run was the button being right about a
run in which two leads died.

**The kill message named the wrong cause.** It said *"the usual cause is
several leads researched at once on a single free-tier instance — run them one
at a time and this will not happen."* That was a guess, it was wrong, and
acting on it makes a fifty-lead day take all day. It now points at the run's
own `⏱ TIME` line and says how to read it: mostly gate wait means the throttle
is ours, mostly inside their calls means the site is slow. Third recorded
instance of a message naming the wrong cause.

**"Do not say" was carrying true sentences again.** Platinum Series Homes:
*"The email states '…19 reviews against their 26' — this is measured and
correct."* No objection in it at all, sitting in the section that exists to
stop a FALSE sentence being read down a phone. §45's rule required the word
"but", so the confirm-BUT-wording case was cleared correctly while the entry
with nothing wrong survived — the clearer case was the one that leaked. Factory
Surplus carried two `VOICE FAILURE:` notes as well: critiques of the pitch's
register, which are reasoning for the screen and not warnings for the sheet.

The filter existed as two hand-written copies, one in production and one inside
its own guard, which is why they agreed with each other and were both missing
the same two shapes. One `factCheckNoteKind` now, classifying real / wording /
style / clean, with anything `CRITICAL_FACT_RE` matches never cleared — so "the
claim is correct but the number is wrong" is still a warning. The live Platinum
sentence is the fixture, and reverting the widening turns it red.

**JLWinter arrived with no city**, so `LOCAL RANK: skipped — no city could be
parsed` cost it four rungs: a data gap on the lead, not a defect in the read.

### A brief describes a business MODEL and was matched on a trade WORD

Factory Surplus and Akin Bros. Floor Stores are flooring RETAILERS, and both
received the crew-trades brief — *"the unit of business is one job from the
phone ringing to the invoice"*, *"an idle truck costs the same as a working
one"*, and on the call sheet, for a warehouse showroom: **"when somebody calls
and you are up on a roof, who picks up?"**

Vin: *"why are flooring companies getting a roofers brief we need to make sure
we never run into this problem again... prevent this from happening with any
niche in the future."*

The cause is structural rather than a missing word. Each brief matched on a stem
list — `floor\w*` here — while the brief itself asserts a MODEL. "Floor" belongs
to an installer AND to a shop, and so do pool, window, kitchen, sign and garage
door. A stem can never tell those apart, so no amount of adding stems fixes it.
That is exactly why the per-brief `notWhen` list, which already held supply,
wholesale, manufacturer, distributor and franchise, still let "store" through: a
denylist somebody remembered is the disease this file records most often.

Two mechanisms, because they fail on different days:

- **One shared disqualifier**, applied to every brief in the library instead of
  kept per brief: words that name a DIFFERENT model — store, shop, showroom,
  retail, outlet, warehouse, surplus, gallery, dealer, supply, wholesale,
  manufacturer, distributor, franchise, rental, school, academy, association,
  marketplace. A brief written FOR one of those models declares `claimsModel`
  and is exempt; none is today. Deliberately model-naming ONLY: "center",
  "clinic", "practice" and "group" are not in it and the check asserts they
  never will be, because §14 records a size gate that refused a dermatology
  practice for containing "cancer center". A filter widened until it catches
  the ICP is the more expensive failure.
- **Every searched category declares its brief.** `NICHE_BRIEF_EXPECT` maps all
  46 `GP_CATEGORIES` queries to the brief they must receive, or null, and
  `NICHE BRIEF COVERAGE CHECK` runs the REAL matcher over every row — failing
  the boot on a disagreement, on a declaration for a category we no longer
  search, and on any category with no declaration at all. So a target added
  tomorrow cannot silently inherit somebody else's vocabulary: the build refuses
  until a human writes down which brief it gets. Same shape as
  `STEM_COMPLETE_WORDS` in §15, and for the same reason — a rule nobody has to
  declare is a rule nobody maintains. Twenty-six live trade strings are fixtured
  alongside, because the text a lead arrives with is Google's own category or a
  phrase read off their homepage, never our query.

Falsified three ways, each red alone: removing the disqualifier puts the
flooring stores back on crew trades, adding a category without declaring it
fails the boot by name, and widening the disqualifier to "center" goes red on
the dermatology and LASIK rows.

**A retailer now gets NO brief, and that is the deliberate answer.** The
matcher's own comment already stated the trade: a business we cannot place costs
a paragraph on a call sheet, while a business placed in the wrong bucket gets a
page of confident vocabulary about somebody else's trade. Writing a retail brief
from memory is what the library's DECLARED/SOURCED discipline exists to prevent
— it is 2-4 hours of research, and it is the honest next step if flooring stores
are a segment worth keeping.

---

