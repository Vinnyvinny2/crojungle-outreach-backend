# §39 — The first live run, read line by line — 2026-08-21
Source: CLAUDE.md lines 2535-2648, moved verbatim 2026-09-02 from commit b01d952e4f95d7b69686bc2c4063ca2aa0cb7546 (branch backup/claude-md-monolith). Nothing below this line was edited.

## 39. The first live run, read line by line — 2026-08-21

Vin ran three leads for real and sent the screen, the export and the whole
Render log. He asked for three things on the front end. The log carried three
more that nobody had reported, and two of those were costing paid-for work.

### The gate learned the plan and paced as if it had not

Eleven `FIRECRAWL RATE LIMITED` lines on a **three-lead** run, and Gregory S.
Young finished with **five of his seven pages missing** — "this lead's audit is
INCOMPLETE". Two causes, both the same disease this file is mostly a record of.

`FC_LIMIT_PER_MIN` is read off Firecrawl's own `x-ratelimit-limit` header on
every response, stored, and used for exactly one thing: choosing a CONCURRENCY.
The gap between starts stayed at its 350ms default — **171 requests a minute, on
every plan they sell.** A measurement taken correctly and never delivered to the
thing that acts on it, instance twenty-four. The gap is now derived from the
limit with a quarter of headroom and never falls below the configured floor.
Deliberately NOT gated on `FC_CONCURRENCY` being set: those are two different
settings, and letting one govern the other would mean an operator who pinned the
browser cap silently lost pacing altogether.

And both retry loops treated a 429 as a fact about ONE request. While one caller
slept its 4s, 8s, 12s, the gate started the next one 350ms later into the same
closed door — a backoff that is individually correct and collectively a
thundering herd with politeness bolted to one of its members. A 429 now holds the
WHOLE gate, using Firecrawl's own `Retry-After` where they send one and our
backoff where they do not, capped at 60 seconds so one bad header cannot stop
every Firecrawl call in the process.

**A third rate-limit branch was found while fixing the two.** The homepage read
counted the hit and held nothing — and it is the FRONT of a seven-page fan-out,
so the six interior reads behind it were about to walk into the same door. All
three branches go through one holder now. `FIRECRAWL PACING CHECK`, six
falsifications, every one red alone.

### The last gate before a prospect did not run on half the audits

Two of four audits: `FACT CHECK DID NOT RUN — the critique call failed
(timeout)`. That call is the only thing between a composed email and somebody's
inbox, and one slow answer removed it for the whole lead. There was **no retry
anywhere in twenty-three Anthropic call sites.**

`max_tokens` on that call is 1600 and Haiku writes roughly a hundred a second, so
a full answer is about sixteen seconds of writing before the first token and
before a long prompt is read. The ceiling was 25 seconds. It is 45 now — but the
number is inferred from the call's own shape, not measured, and **the retry is
what makes this reliable**; a ceiling can always be one second short of the next
slow afternoon.

Only the word "timeout" is retried, and only where it was asked for. A refusal, a
4xx and a bad key all fail identically the second time, so a blind retry across
all twenty-three sites would double the bill on exactly the failures that cannot
be helped. The transport is a parameter, so `FACT CHECK RELIABILITY CHECK`
EXECUTES the loop rather than reading it — and its first falsification printed
`COULD NOT RUN — timeout`, which reads as an infrastructure problem at boot
rather than as the missing retry. Named properly now: a message pointing at the
wrong cause costs exactly what one naming no cause costs.

### The three the screen needed

- **"i had to chekc the logs to know" where the run was.** The only progress on
  screen was `now: <one name>` in 10px grey inside a 200px sidebar, and it held
  ONE name while the runner runs three leads at once — so it showed whichever
  started last and changed under you for no visible reason. A bottom bar now
  reports finished of total, a progress line, the leads actually in flight, the
  elapsed clock, the outcome tally as it lands, and any lead that needs a human
  by name. The only derived figure is the time remaining: it says out loud that
  it is an estimate, appears only once two leads have finished, and is computed
  from this run's own wall clock, which is what makes it right at any
  concurrency. The sidebar's copy of all this was REMOVED rather than left
  beside it — one home each.
  Its reducer is at module scope and pure, so `batchcheck.js` folds every event
  of a real fifty-lead run through it: a name added on start and never removed on
  done is invisible on three leads and puts fifty names on the screen on fifty.
  Falsified both ways.
- **The three tier filters are gone.** "Likely reachable", "Named after a
  person" and "Size verified" were three views of `reachPredict` and
  `sizeVerified`, and both of those already decide the ORDER of the list — the
  strongest leads are at the top whether anything is pressed or not. The
  prediction itself is untouched; only the three ways of looking at it are.
  A tab id selected before the removal now falls back to All, because without
  that it drops through to a source comparison that can never match and the
  screen shows an empty list with no way to tell why.
- **The bulk panel says what it will do.** A number box, a bare count, two
  lowercase checkboxes and a button whose label changed shape depending on a tick
  box. Every control survives — this is the button that spends real credits — but
  each now says in plain words what it does, and the count is of the pool as well
  as the limit, because "50 ready" against a pipeline of 4 and against a pipeline
  of 400 are different situations the old line could not tell apart.

### "It said export 4 audits" after a three-lead run

It was right, and it read as a miscount: the fourth lead was audited in an
earlier session and is still in the pipeline. The button was not wrong; its label
was silent about its own scope. On a fifty-lead day that silence is a file handed
to Mike with last week's leads mixed into it and no way to tell which is which.
The sidebar button now says it covers the whole pipeline, and the run's OWN set
is offered separately in the progress bar, where the run is.

### And a boot check that was wrong about a live server

`BATCH MEMORY CHECK` went red on Render and green locally. Render's boot is about
2.7× slower under contention — `FIRECRAWL GATE CHECK` measures 12,900ms there
against 4,824ms here — so a 12-second liveness budget was measuring the dyno, not
the code. Raised to 60 seconds, with the reasoning written at the assertion: a
genuinely leaked slot never resolves at ANY budget, so the number only decides
how much slow boot it tolerates, and a check that fails on a slow afternoon is
one somebody switches off, taking the real ones beside it.

**`index.html` changed, so this needs a Netlify deploy.**

---

