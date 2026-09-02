# §54 — The bill could not be read, and half the reviews were never read — 2026-08-23
Source: CLAUDE.md lines 4508-4677, moved verbatim 2026-09-02 from commit b01d952e4f95d7b69686bc2c4063ca2aa0cb7546 (branch backup/claude-md-monolith). Nothing below this line was edited.

## 54. The bill could not be read, and half the reviews were never read — 2026-08-23

Vin: *"continue building at the highest level build flalwessly done right the
first time and we need to mitigae that cost a lot more theres no reason it
should be that exepnsive."*

Three things, and two of them are the same shape: a thing we PAY for that
nothing downstream actually consumes.

### We were buying reviews the model never saw

Apify was asked for 150 reviews. The pain miner built one string out of them and
sent `md.slice(0, 22000)` to the model. A trade review runs about 300 characters
once the star prefix and any owner reply are counted, so **the model read about
seventy-three of the hundred and fifty.** The pull is newest-first, so the half
that was binned was always the older half.

Apify bills per review scraped. That is not a saving to find, it is a bill for
nothing.

**And it made the most-travelled number in the system false.** Every sentence
built on this reads "N of the 150 reviews we read say it" — the pain finding's
own denominator, the share that decides the THROUGHPUT diagnosis (*"demand is
not the problem, delivery is"*, which tells Mike **not** to sell this business
more leads), and the floor that dismisses a thin finding. The model never read
150. It read what fitted. So that number described a PURCHASE rather than a
READING.

One rule fixes both: **every review is seen, long ones are clipped.** A repeating
complaint is named in the first lines of a review — an owner writing six hundred
words about a countertop says "nobody called me back" up front like everybody
else — so the budget is spent on breadth, which is what a pattern actually needs,
and the denominator becomes true by construction rather than by a second field
somebody has to remember to deliver. The clip ADAPTS: if the natural clip does
not fit, it shrinks to the per-review share of the budget, floored so it can
never be too short to hold a complaint. Only below that floor does anything get
dropped, and a drop is now reported by name instead of happening on every lead
in silence.

The corpus is built where the SAMPLE is decided, not in the miner. Split across
two functions, the miner cut its own string while owner replies, negatives and
the text count were taken over the whole scrape — so "40 owner replies out of the
150 we read" was a ratio whose halves were measured on different sets.

**150 → 90, and it is more evidence, not less.** Ninety fully read beats the
seventy-three we were actually getting, and Apify bills per review, so it is also
**forty per cent cheaper (~$82/mo → ~$49/mo at 1,100 leads)**. Every rung reading
this sample needs ten to fifteen reviews to fire. If the deeper pull is ever
wanted back, both halves have to move together: `APIFY_MAX_REVIEWS` buys the
reviews and `REVIEW_CORPUS_CHARS` decides how many are read. Raising one alone is
what produced this.

**Considered and rejected: sorting by lowest rating.** It would surface every
complaint a business has, and it would break three things at once — the review
velocity windows, the recency count and the owner-reply rate all assume a
newest-first contiguous sample, and re-scoping four rung sentences to a
negative-biased sample is a large truth surface for a gain nothing here can
measure yet. `REVIEW CORPUS CHECK`, four falsifications, each red alone.

### Nineteen of twenty-four model calls were anonymous in the meter

`meterAnthropic` takes a short name per call and `reportLeadSpend` prints them
sorted by cost. Its own comment says why: *"any call visible in the log but
absent from this line is the leak."*

Five call sites passed a name. The other nineteen printed as the word
`anthropic`, so the one line built to say WHICH call is expensive listed nineteen
indistinguishable rows — and three separate sessions have proposed cuts to the
Anthropic bill without one of them being measured. A meter that covers a fifth of
the thing is worse than none, because it invites confident decisions about the
wrong number. This file already records that sentence, about a different meter.

All twenty-four are named. `ANTHROPIC LABEL CHECK` computes the inventory from
the file's own call sites — not a hand-kept list — so a call added tomorrow fails
the build until somebody names it, and two calls sharing a name fails too,
because a report that cannot tell them apart has the same defect one level down.

**And the one call site that had bothered to name itself did it in a shape the
meter cannot print.** `rewriteEmailWithBrain` passed `{ label: 'email rewrite',
company }` into a parameter that is a plain string, so it rendered as
`[object Object]` — the single most useless row in a report whose whole job is
naming things. The meter now refuses a non-string label out loud.

**What this buys: one live lead now answers the cost question outright.** Read
the `💰 ANTHROPIC TOTAL` line, sorted by cost, with every call named. That is the
next cost decision made on evidence instead of arithmetic.

### The only measurement of his actual customers could never be said

Google's CrUX field data is a 28-day record of what real phones experienced on
their site. It is free, it has been measured on every lead since
`measureRealWorldSpeed` was written — and it was only ever a `flaws` string,
which cannot be ranked, cannot be priced and can never open an email. **Every
other rung in the ladder is something WE looked at. This is the one thing we
measure that happened to THEM**, and it was structurally unable to compete for a
single opener. Instance twenty-two of computed-but-not-passed.

`slow_mobile` is a rung now: harm 83, pillar **LEAKING**, `cannot_know` on the
knowability table — and that last one is the clearest case in it. The only phone
he ever sees his own site on is his own, already cached, on his own wifi.

**The FIELD data only, and that is not a detail.** The same PageSpeed response
carries a Lighthouse LAB score, and a lab score is a simulation that moves
between runs — §6 is an entire entry about two looks at one business returning
different numbers. The field figures are a 28-day aggregate: stable, and he can
open PageSpeed Insights on his own site and read the same number we did.

Three silences, all executed on the predicate itself: a site that performs fine,
a site with too little traffic for Google to hold a record (that is a fact about
TRAFFIC, never about speed), and a lab score with no field data behind it. The
sentence states the seconds and never the word "slow" — the seconds he cannot
argue with, the adjective he can.

**And the key had nowhere to come from — which I documented as a Settings field
without ever looking.** Vin: *"this is the second time youve told me the pagespeed
api was in settings and its not what else have u been lying about."* He is right,
and the failure is the one this file is mostly a record of, committed by me: I
inferred the answer from the variable's NAME, wrote it into PART 8's knob table
as fact, and then repeated it. An inference reported as a measurement.

The sweep it earned found nothing else of the kind — the eleven keys this server
consumes are otherwise all real Settings fields the app really sends — but it
should never have taken a person noticing, so the class is now mechanical. `clientcheck`
reads `KEY_SOURCES`, a declaration in server.js of where every key comes from, and
fails the build on a key that is read with no row, a row naming an environment
variable server.js never reads, or a 'client' row with no Settings field behind it.
The boot EXECUTES the resolver for an `env:` row, which is the half a source scan
cannot see.

**Two versions of that check passed on a broken build first, and only falsification
found either.** The first inferred env support from any similarly-named variable
appearing anywhere in the file — so reverting the fix left it green, because the
boot check that sets `PAGESPEED_KEY` still mentions the name. The second checked
only the keys it could find by scanning: after the fix the key is resolved inside a
helper, so `req.body.keys.pageSpeedKey` no longer appears literally, the key fell
out of the scan entirely, and the check reported a clean pass while not looking at
it at all. The declaration is the authority for WHICH keys exist; the scan is only
what catches one that is read and never declared. Its first run also reported the
word "Falls" as a missing setting, off the prose *"The model's own keys. Falls back
to..."* — the needle-finds-a-comment trap, tenth recorded instance.

**And the key had nowhere to come from.** `measureRealWorldSpeed` read
`req.body.keys.pageSpeedKey` for its whole life, and there is no `pageSpeedKey`
field anywhere in `index.html` — not in Settings, not in the request builder,
nowhere. Vin, looking for it: *"no where to add pagespeed api."* He was right.
The key was always empty, the function always returned `{checked:false}`, and
the only measurement taken from the prospect's own visitors has been dark on
every lead of this project's life, silently.

It belongs on the SERVER anyway: it is a Google Cloud key from the same project
as `GOOGLE_PLACES_KEY`, and putting it in Settings would need a Netlify deploy to
reach anybody and would put a Google credential in a browser for no reason. It is
`PAGESPEED_KEY` in Render now, resolved through one door, with the client slot
kept as a fallback. A lead running without it says so once an hour and names the
variable, instead of leaving a whole rung dark in silence.

**What the falsification runs found in the check itself.** Two of the four
reverts passed on a broken build: widening the test to fire on a lab score, and
deleting the field-says-fine half of it, both left every ladder fixture green —
because a rung whose sentence comes out empty is DROPPED before it reaches the
list, so the silence I was asserting was being produced by something other than
the guard under test. The predicate is what decides whether a simulation may ever
become a sentence, so the predicate is what gets asserted. Only running them
found it.

**218 boot checks green.** Eleven falsifications, each red alone.
`index.html` did not change this round, so no Netlify deploy is needed.

---

