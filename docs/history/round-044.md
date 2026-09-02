# §44 — The safety gates were auditing our own facts, and killing the lead — 2026-08-21
Source: CLAUDE.md lines 2989-3219, moved verbatim 2026-09-02 from commit b01d952e4f95d7b69686bc2c4063ca2aa0cb7546 (branch backup/claude-md-monolith). Nothing below this line was edited.

## 44. The safety gates were auditing our own facts, and killing the lead — 2026-08-21

Vin ran five leads. **Four of the five audits failed**, each after a full paid
research cycle. *"nto sure why the numbers are off i clealry added 5 into the que
abnd hit audit 5... this was a very sloppy run it took forever and none of the
auidts worked... these wasted firecrawl creidts and anthropic as well i htink this
cant happen when we are doing 50 at a time this could drain our moeny."*

He is right about the money and the cause is one design error repeated in three
places: **a gate written to police the MODEL was pointed at the whole response,
which by then also held everything CODE had assembled.**

### The quote gate deleted the factual spine

`stripUnverifiedQuotes` removes a sentence that puts quotation marks round words
appearing nowhere in what we read. It ran four hundred lines below where the
ladder attaches its output, so by the time it ran `parsed` also carried
`factualSpine`, `problemList`, `subjectOptions`, `harmsRanked` and
`composedEmail` — code-assembled from measurements, every figure already traced,
every sentence already gated. The walker cannot tell those from model prose.

Live on Thrive Dental, it deleted this:

> Fusion Orthodontics | Dallas shows up above them on Google for **"orthodontist
> office in Dallas, TX"**, with 492 reviews against their 540

That is our own spine, and the quoted span is **the search we ran**. It is not a
sentence on their website and it never could be. §8 already records this exact
category error — a review-derived finding checked against web pages it cannot
appear on — and this is the same error a third time, with the corpus missing the
one thing that is entirely ours.

The stripper's own comment claimed it *"skips anything we assembled"*. It skipped
underscore-prefixed keys, and not one of those fields is underscore-prefixed. A
comment declaring an intent the code does not implement is the two-hand-kept-copies
disease with only one copy real.

Three fixes, all structural:

- **It runs before anything of ours is attached**, and walks only the key set
  captured at the moment the model's JSON parsed. "What the model wrote" is now
  decided by construction, so there is no list to keep in step.
- **It runs on every lead.** It sat inside `if (_harmsForResponse && parsed)` —
  false exactly when the harm ladder crashed, which is when the model wrote the
  whole audit with nothing under it. §40 is a whole section about the ladder
  having been dead on every lead for weeks: the last gate before Mike's phone
  call was absent on the leads that needed it most.
- **The corpus holds what we hold.** The search phrase, the competitor names
  Places returned, the city and the trade word. Strings only, never numbers,
  because the same corpus licenses a FIGURE in the money gate and a review count
  dropped in here would quietly license "$492" in a sentence about their money.

And one rule, asked of two different claims. The strippers ask *"did ANYONE we can
point to write this?"* — the search phrase qualifies, we typed it. `originalFindings`
asks *"is this read off THEIR OWN COPY?"* — our search phrase emphatically does
not, and that finding can be promoted into the factual spine by the sharper-claim
swap, so a false one reaches the EMAIL and not just the sheet. So the second keeps
the pages-and-reviews corpus it has always had. The boot check asserts the split by
building both and requiring the same quote to fail against one and verify against
the other — a fixture that only refuses proves nothing, because a quote that
verifies nowhere refuses everywhere.

### The money gate deleted our own price out of the field built to hold it

BVA: `⛔ INVENTED MONEY: removed 3 sentence(s)... $40k, $70k, $10k, $35k. First
one: "$40k-$70k implementation, variable ongoing"`. That is our AI Brain price in
`recommendedPrice`.

Our own prices are licensed only when the SENTENCE is about our own work, because
"$50k" is ours in *"a rebuild starts around $50k"* and invented in *"a $50k roof
replacement"*. A price fragment has no sentence to be about anything. The
fact-checker prompt has carried the exemption in words for months — *"this and
its price are shown to our own team... do NOT flag the product or its price"* —
and the gate that actually DELETES had never been told. **A guard in the wrong
function**, which is a named class in this file.

`recommendedPrice` and `topThreeProducts[].price` are now exempt by field, and
still bounded: only a figure in `OUR_PRICE_FIGURES` is licensed. An invented
`$275k` in a catalogue field is cut exactly as before.

### And one blank field destroyed the whole lead

The BRAIN GATE required `pitchAngle` to be over twenty characters. That was a
fair proxy for "the response was a husk" on the day it was written, and it stopped
being one the moment the quote gate started running over the audit.

> `⛔ BRAIN GATE [Jones Kahan Law]: the audit parsed but is EMPTY — pitchAngle="",
> product=Revenue Growth / CRO Retainer, candidates=3. Blocking.`
> `JOB job_mt3c57gr [Jones Kahan Law]: error in 310.9s of WORK (HTTP 422)`

A recommended product, three candidate findings and a fact-check that came back
**9 out of 10**, thrown away because one field was blank — and the 422 returns
almost nothing, so 310 seconds of Firecrawl, Places, Apify and eight Anthropic
calls went in the bin. Four times in one batch. At fifty a day that is the
money Vin is talking about.

The gate now asks the question it means — is there anything in here at all —
across the fields rather than at one of them, as a pure function the boot check
executes. The 31 Jul husk (every field null) is still refused, and so is a bare
product name with no findings and no prose.

**And a gate can no longer empty a field in silence.** Whatever the cause, a
field that goes from prose to nothing now says so by name: either the model
fabricated a whole field, or our corpus is missing something we hold. Both are
things somebody must be told. What it must never be again is a blank field four
hundred lines away, read by a different gate as "the audit is empty".

### "We read 150 reviews of 8"

BVA again, and it looks like a cosmetic log line. It is not: an impossible
measurement refuses the factual spine, `composeFullEmail` returns null, and the
lead falls through to the model writing the whole email from scratch — the
highest-invention path in the system, reached by a number that was never about
them.

The review mine reads the exact place ID, so 150 reviews exist. The **8** came
from the rank-search row. `checkLocalRank` finds our business in the search
result by place ID, else by domain, else by an exact normalised NAME — and the
third is a guess that can land on another business.

Two things were sharing one number, and they want different sources:

| | |
|---|---|
| `ourReviews` | compares us against the businesses in ONE search result. Both sides must come from that same search or the comparison is meaningless. Unchanged. |
| `reviewCount` | a FIGURE we state about the business and check other measurements against. The authority is Place Details, read on the exact place ID. |

So the figure now comes from Google's own record of that place, and **how we
matched travels with the result**: a row matched only by NAME whose review count
contradicts Place Details is refused as a different business — and `weakerAbove`
and the named competitor go with it, rather than being built on someone else's
numbers. An exact place-ID match is never questioned, and a two-review index lag
is left alone, because a filter that fires on the normal case is one somebody
switches off.

### One busy minute threw away a whole paid research cycle

Not from this run, but it is the same money and it is the thing that will bite a
fifty-lead day: **the audit call had no retry.** 429 rate limited, 529 overloaded,
500 api_error — Anthropic's guidance for all three is "retry in a moment", and
this file's own error branch says exactly that in those words and then throws the
lead away. The audit is the call the BRAIN GATE depends on, so one busy minute
returns 422 and discards the Firecrawl, Places and Apify spend already made.
Fifty leads through a three-wide pool is precisely where a per-minute limit is
met.

It is asked once more now, honouring their `Retry-After` where they send one and
capped at twenty seconds so one bad header cannot stall a run. Separately opted
into from the timeout retry, so the two stay separately falsifiable, and a 400,
401, 403 or 404 is never retried: a malformed request, a bad key and a credit
balance too low all fail identically the second time, and a blind retry doubles
the bill on exactly the failures that cannot be helped.

### The batch panel had no word for "waiting"

*"i clearly added 5 into the que abnd hit audit 5"* — and the panel read
**"2 of 2 waiting will run"** directly above a button reading **"Stop — 0 of 5
done"**. Both numbers were correct answers to questions nobody asked.

"N of M waiting will run" is a statement about what the NEXT press would pick,
and its own filter deliberately excludes leads that are already running. Left on
screen during a run it counts down as leads start.

Underneath that: three leads run at a time, so a run of five has two leads
picked, paid for and not started for most of it — and the batch had no name for
that state. That is why *"the not audited yet section ws not used at all"*: the
sidebar could only ask "is this running" and "is this audited", both false, so
those two sat among leads nobody had chosen at all.

Three states now, named and adding up to the total at every moment: **queued in
this run / running / done**. The run emits its own roster before a single lead
starts, the bottom bar reports all three plus who is next, the sidebar has a
**Queued in this run** section, and while a run is on the control panel describes
THAT RUN instead of the next press. `batchcheck.js` folds a real fifty-lead run
through the reducer and fails if the three ever stop adding up — checked at every
event, because a panel that is only right when the run is over is exactly the one
nobody can read while it matters.

### A dead Apify token is one fact, not fifty

Apify answered 403 on every lead. The message was correct and it was in the
Render log, one grey line per lead, under a heading that reads like something
about the prospect ("REVIEW MINE: NOT MEASURED"). Nothing on the screen or the
call sheet said the review mine had not run at all.

`review_pain_pattern` is one of only two findings in this system with a real
human reply behind it. A run with a dead token loses it on every lead while
Firecrawl, Places and Anthropic are still paid in full. Same shape as the
Firecrawl credit latch: the token and the balance are facts about the ACCOUNT, so
they are held once, cleared the moment a call succeeds, and surfaced on the lead
as a **read limit** rather than as a fault of the business. Only 401/402/403
latch — a timeout is a per-lead event and must not be reported as a dead account.

### What the falsification runs found in the checks themselves

Five of the new assertions passed on a build with their own fix reverted, and
only reverting found it.

- **A fixture that could not reach the branch it named.** The catalogue-price
  test handed the OBJECT in with the path already set, so the key made it
  `recommendedPrice.recommendedPrice`, the field exemption could never match, and
  the assertion reported a clean pass on a build where the exemption licensed any
  figure at all.
- **A regex that cannot see across a newline.** `BRAIN GATE CHECK` looked for the
  old field name near the gate name on one line. The reverted gate spanned two
  lines and walked straight through. It names the decision itself now — there is
  exactly one right-hand side, and anything else fails however it is spelled.
- **The self-matching needle, twice more.** The same BRAIN GATE assertion, written
  as one literal, matched the line it was written on and failed a CORRECT build —
  and splitting it with a runtime join is not enough, because both halves still
  sit on one line. And the Apify assertion searched for the clear as a plain
  string when the DECLARATION is that same string, so deleting the clear left it
  green; it counts two now. Seven recorded instances of this trap.
- **Two fixes that hid each other.** Reverting the review-count precedence left
  every assertion green, because the wrong-row guard was catching the same
  fixture. A falsification that another fix silently covers proves nothing about
  the one under test, so there is now a case only the precedence can fix: a row
  matched on the exact place ID whose search-index count lags Google's own record.
- **A falsification detector that could not detect.** The first client sweep
  reported all three reverts GREEN, because it looked for `⛔` and `batchcheck.js`
  prints `✗`. A harness that cannot see a failure proves the opposite of what it
  appears to prove.

**Fifteen server falsifications and three client falsifications, every one red
alone.** 195 boot checks green, plus every gate in PART 6: 20,000 cases per
in-process gate with no leaks and no drift, and 2,065 emails composed over HTTP
with every invariant holding.

**`index.html` changed, so this needs a Netlify deploy.**
---

