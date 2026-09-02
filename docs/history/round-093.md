# §93 — The Find run outlives its request, and the score stopped arguing with the sort — 2026-08-28
Source: CLAUDE.md lines 12122-12295, moved verbatim 2026-09-02 from commit b01d952e4f95d7b69686bc2c4063ca2aa0cb7546 (branch backup/claude-md-monolith). Nothing below this line was edited.

## 93. The Find run outlives its request, and the score stopped arguing with the sort — 2026-08-28

Vin, on the workaround he had been handed: *"ive never needed to do this fix
this at the root Right now: narrow the scope bar... and fix eveyrhting else i
ran that in sql."* He is right on both counts. Narrowing the pull until a run
finishes inside a minute is a workaround wearing the clothes of a setting, and
the three answers he had asked for the round before were: are we paying for
Places leads and throwing them away, why is the Find rating not proper, and why
did the leads never load.

### The waste was one line of SQL, and he ran it

The cuts were never the problem. From one live run: ~1,437 unique businesses
found, **120 returned**, and what is actually DELETED is small and correct — 24
franchises by name, 3 chain outlets, 20 already in the pipeline. Everything else
is demoted, not deleted: 285 too big, ~945 outside the star band, 227 over the
review ceiling, 81 over the per-category cap. §12 and §17 already made that
decision and built the bench to hold the overflow.

The bench was refusing every write. Three consecutive runs, 13:01 to 13:03, in
the server's own words:

```
⛔ LEAD BENCH: 1317 qualified lead(s) could not be saved — the write failed,
   so they are lost and the next run will pay Google to find them again.
   the lead_bench table EXISTS but row-level security is refusing this write.
```

1317, then 1310, then 1318. The same refusal `places_query_state` had been
printing for weeks, on a second table. **So every demotion was a deletion**, and
the query memory could not record which ground had been drained either, so the
next run paid Google to re-ask the same searches and discard the same
businesses. Two `disable row level security` statements, run by Vin, and the
next press serves ~1,300 banked leads before it spends anything.

Recording it because the shape is the point: the demote-don't-delete design was
correct, shipped, and completely inert, and the only thing that ever said so was
one grey line per run.

### A Find run can never survive its own HTTP request

Three `=== DISCOVERY START ===` at **12:59:30, 13:00:30 and 13:01:31 — exactly
sixty seconds apart** — each completing in 102 to 120 seconds. Something between
the browser and Render cuts the connection at 60. The server found 1,437
businesses three times over, finished three times over, and had nowhere to send
any of it; the screen said "Failed to fetch". Every attempt still billed about a
hundred Places searches, so roughly $10.50 bought nothing at all.

`runDiscovery(body)` is a function now, returning `{ code, payload }` — the
shape the research job wrapper already hands its poller — and an HTTP request is
no longer what holds it open. `/api/discover-async` accepts, `/api/discover-job/:id`
collects. The old single-request door survives as the fallback for a server
predating this build (a 404 on `-async`), and **runs the SAME function**, so
there is no second copy of a Find run to drift. A cut connection now costs one
poll rather than a run.

Four things this design got right by construction rather than by remembering:

- **One store.** The same `_jobs` map, sweep, TTL and cap as research. A second
  job system is the two-hand-kept-copies disease, and this copy would rot,
  because Find is pressed far less often.
- **A Find job's phase is `'find'`, not `'running'`.** Both research slot
  counters key on `phase === 'running'`, so a whole discovery grid can never
  occupy one of the slots the memory ceiling exists to bound — and a third
  counter written tomorrow is correct without knowing this route exists. The
  cost of that choice is that the stale sweep cannot see it either, so the sweep
  carries an explicit Find branch with its own twenty-minute ceiling and a
  message that does not tell the operator to re-run a lead.
- **One run at a time.** A press is ~100 Places searches, and the 60-second cut
  produced exactly the failure a dedupe prevents. A second press returns the
  running job's id.
- **The browser's wall sits ABOVE the server's sweep.** The old client abort was
  three minutes, which was harmless while the run could never survive sixty
  seconds anyway — and would have become the NEW thing killing a healthy run.
  `clientcheck` reads both numbers from their own files and fails the build if
  either moves past the other.

### The score argued with the sort, and with the other ranker

`outsideBand` and `aboveSizeCeiling` changed the ORDER and never the NUMBER. So
a 4.9-star business could show **Find score 90** and sit below a 4.5-star lead
scoring 60, with nothing on screen accounting for it — which reads as a broken
rating, and is a real contradiction. Worse, `contactRankFor` DID subtract for
both, so **one app held two verdicts about one lead and the card showed the one
that did not know.**

And the score paid for the property that demoted it: a 4.9 earned +5 for its
rating AND was demoted for sitting above the 4.85 ceiling. PART 5 is explicit
about why that ceiling exists — at 4.9 there are almost no negative reviews left
to mine, and the repeating complaint is one of only two findings with a real
human reply behind it.

`demotionPenalty` reads the SAME declared `CONTACT_RANK_TERMS` table both
rankers read. Only the above-the-ceiling case loses its rating bonus; a lead
demoted for a LOW rating still takes the struggling deduction, which is the same
judgement pointed the other way and was never in dispute.

**And the curve is a function now.** Thirty lines inside a 1,300-line request
handler meant nothing in this repo could ever execute the one number an operator
repeats out loud when deciding what to audit. `placesTriageScore` is pure and
`FIND SCORE CHECK` runs it — including that an unmeasured reachability is
SKIPPED rather than laundered into a confident zero, which at `Number(null)` is
a silent -15 on a lead nobody looked at.

### The card stopped guessing at leads it had already read

"Owner findable 31/40" is read off whether a person's name sits in the business
name. It is free and it genuinely predicts — and on any lead the contact button
had READ it was rendering beside a strip already naming the owner, the address
and the phone number we measured. `findScoreLine` is one function both the card
and `clientcheck` call: a read lead reports what was measured, an unread lead
says out loud that its number is a guess, and a demoted lead finally says why it
was sorted last.

### And the queue held 200

Vin: *"the find tab only holds 200 companies at a time u cna higher it or do
whatevr idc."* It was 200 written by hand in three places — the merge, the
Supabase upsert and the Supabase restore — so raising it meant finding all
three. `FIND_QUEUE_MAX` is one number and it is 1,000. 200 was a decision about
how many rows are useful on a screen, acting as a decision about how many
paid-for businesses are worth keeping, which is §12's failure one tab across.

### What the falsification runs found

Twelve reverts, each applied ALONE against a green baseline, each red on its
own named assertion. Getting there took three attempts, and every one of the
three failures is a shape this file already records:

- **One fixture proved nothing, and only the revert showed it.** The
  rating-bonus assertion compared a demoted 4.9 against an IN-BAND 4.7 — and
  the demotion is -10 while the bonus is +5, so the penalty swamped the very
  thing under test and the assertion held whether the guard existed or not.
  Two fixes hiding each other. Both leads in the fixture now carry the SAME
  demotion, so the rating bonus is the only thing that can separate them, and
  the revert goes red at 73 against 71.
- **A killed run left a revert applied, and the next pass ran against a RED
  baseline** — which proves reds too cheaply, exactly as §74 records after the
  CRLF flattening did the same thing from inside the proving machinery. The
  harness now REFUSES to start unless the baseline boots green, and verifies
  every restore byte for byte before moving on.
- **One revert reported RED for the wrong reason.** servercheck could not boot
  inside its own window on a busy machine and printed "healthz never went
  green", which the runner read as the guard firing. That is a NO VERDICT
  wearing a RED coat, and it is now reported as one. A second reporting bug
  named the expected MODEL DECLINED notice as the cause of a red boot, because
  it takes the same glyph as a failed check; the runner prefers a CHECK line
  now.

And the edit machinery itself broke twice, both times in ways already written
down:

- **A stray `cd` inside a compound command sent an edit script at a stale copy
  of `server.js` in the scratchpad, and it reported "applied 3".** Every edit
  path is an absolute path now.
- **`ed.sub1` wrote the file per call**, so a script that died on edit two left
  edit one applied — the §77 half-applied-script hazard, which shipped a broken
  build from this repo once already. `ed.edits` checks every anchor against the
  ORIGINAL text and writes once.

**269 boot checks green**, and every gate: tdz, dupkeys and scopecheck on both
files, fetchtest, pngscale, clientcheck, batchcheck, auditfuzz over 5,000
vectors, fuzzcore over 20,000 cases, servercheck's **74** assertions over a fake
network (scenario I drives the new Find job end to end and asserts the submit
answers in under ten seconds), and 2,096 emails composed over HTTP.

**HONEST SHAPE: none of this has run against a live Find press.** The route, the
dedupe, the poll and the 404 are driven over a fake network; whether a real
1,400-business grid collects cleanly is settled by the first real press, and the
`FIND JOB` lines report it outright.

**`index.html` changed, so this needs a Netlify deploy**, and the contract is
**20260915** on both sides — without the new server the button answers 404 and
falls back to the old single request, and a stale page says so by number.
