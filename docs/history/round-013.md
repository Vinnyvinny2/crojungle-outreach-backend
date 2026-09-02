# §13 — Three cost fixes, and the client's first automated check — 2026-08-19
Source: CLAUDE.md lines 732-812, moved verbatim 2026-09-02 from commit b01d952e4f95d7b69686bc2c4063ca2aa0cb7546 (branch backup/claude-md-monolith). Nothing below this line was edited.

## 13. Three cost fixes, and the client's first automated check — 2026-08-19

**The rating band was deleting 61% of every run to protect one finding.** 1,810
of 2,892 already-paid-for businesses were dropped at the band on the live run,
1,766 of them for sitting ABOVE the ceiling. Two measurements, both re-derived at
boot so they cannot rot:

- **Exactly one of the 41 rungs reads the star rating** — `low_rating` — and it
  is `INTERNAL_ONLY`, so it can never reach an email.
- **Running the real ladder over one business and moving only the rating gives
  the same answer at 4.6, 4.9 and 5.0**: two sayable findings, leading on
  `outranked_by_weaker`, one of the two with a reply behind it.

And the band cannot save money, because Google bills per CALL and a call returns
twenty businesses whether we keep them or not. So they are **demoted, not
deleted** — kept, marked, sorted behind every in-band lead, left to fill the
bench. The promise that in-band still goes first is enforced twice: two arrays
concatenated at the source, and a comparator term weighed ahead of tier and
score. The per-category cap is spent only on in-band leads, because results
arrive in prominence order and a slot taken by a 4.9-star business would push out
the 4.6-star one behind it. `GP_BAND_MODE=cut` restores the old delete.

**We bought the same reviews twice on every Places lead.** `fetchGBPHealth` asks
a Place record for photos, hours, category and REVIEWS — it needs the dates for
the staleness finding. Fifty lines later `fetchGoogleReviews` asked the same
record for the same reviews, as a second Place Details call. Both bill on the
Enterprise SKU at 1,000 free calls a month. The memo holds the in-flight promise
rather than only the result, so the day these run in a `Promise.all` the
duplicate does not quietly return.

**What actually stopped fifty leads at a time was memory, not the queue.** A page
render is the only allocation big enough to cross Render's ceiling (330MB and
382MB peak before the scaler was rewritten; 218MB now, which fits exactly once).
The bound is therefore on the DECODE — one gated door, both call sites through it
— so research concurrency can be raised for throughput without touching the
ceiling. Plus a second gate that measures rather than assumes: a lead is admitted
only while resident memory is under `RESEARCH_RSS_CEILING_MB`, and that hold is
bounded so it can never refuse leads forever. **A dyno over its limit does not
throw — it restarts, and that is what "no leads are running at all" looked like.**

**The client sent two different research requests.** `researchViaQueue` was
called from two hand-written bodies that disagreed about seventeen fields.
Pressing "Run Research" sent neither the rating, the review count, the phone, the
multi-market coverage nor the lead channel; the discovery path sent all of those
and none of the browser measurements, the prior verified email or the confirmed
owner. **So which audit a lead got depended on which button was pressed, and a
re-run could come back worse than the original while looking like a refresh.**
`marketsSeen`/`marketsAbsent` are the clearest case — nothing downstream can
recover them, so the coverage-gap finding could not exist on a re-run at all.
One `buildResearchBody` now, and `clientcheck.js` fails the build if a second
appears.

**`clientcheck.js` is the client's first automated check.** index.html is half
the system and the only thing ever run against it was `dupkeys.js`. It parses the
script blocks, follows the builder, and asserts that every call site goes through
it and that no field nothing downstream can recover has been dropped.

**What the falsification runs found in the new checks themselves** — every one of
these booted GREEN with the guard reverted, and only reverting found them:

- **Two assertions were matching their own source text.** A needle written as a
  literal sits in the check's own body, `indexOf` finds it, and the assertion
  passes on a build where the thing it guards is gone. Every source needle is
  assembled at runtime now. This file already recorded the same trap for
  `RANK GATE CHECK` and it came straight back.
- **The decode-gate assertion counted call sites** and could not tell a
  production decode from the ones the boot checks make on purpose — it reported
  five correct calls as unbounded. Replaced with one door that can be verified.
- **The headroom assertion added a small render's cost to the admission
  ceiling.** A real render is several times those pixels, and the cost does not
  scale with pixels anyway because the scaler caps its own inflate output.
- **One assertion was non-deterministic.** Resident memory never falls back, so
  the same decode measured 31MB on one boot and 0MB on the next. A check that
  fails at random is one somebody eventually deletes, and it takes the real ones
  beside it.
- **And the client check passed vacuously the moment it worked.** It read keys
  off the object literal at each call site; when both became one builder there
  were no literals left and it reported a clean pass while seeing nothing.

---

