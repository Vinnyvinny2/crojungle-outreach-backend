# §18 — Eleven measurements the server pays for never reached the lead — FIXED 2026-08-20
Source: CLAUDE.md lines 969-1042, moved verbatim 2026-09-02 from commit b01d952e4f95d7b69686bc2c4063ca2aa0cb7546 (branch backup/claude-md-monolith). Nothing below this line was edited.

## 18. Eleven measurements the server pays for never reached the lead — FIXED 2026-08-20

The research merge — 200 lines of "which value wins" — lived inside a React
function, so auditing fifty businesses at once meant writing it a second time. Its
own comment says why that must not happen: *"Two implementations of one operation
is the same mistake as the two fabrication lists and the two merge paths in this
file's history. The second copy is always the one that rots, because it only runs
in the case nobody tests."* A batch runner is precisely a case nobody tests one
lead at a time.

It is `applyResearchResult` at module scope now, pure, and **`clientcheck.js`
EXECUTES it**: it lifts the function out of index.html with its helpers, builds a
synthetic response where every field carries a unique marker, runs it, and asserts
each marker comes out on the lead.

**The requirement list is parsed from the SERVER's own `res.json`, not from the
client.** The first version read it off the merge itself — so deleting the `lsa`
assignment deleted the `data.lsa` read with it, the list got one shorter, and the
check reported a clean pass on the broken build. A check whose requirement comes
from the code under test cannot fail.

Driven from the server it found **eleven fields measured, paid for, returned, and
dropped one line before use.** `leadToRow` persists them FROM THE LEAD, so they
were stored as null and reloaded as null — not dark until refresh, gone. Five are
rendered by the UI today:

| | |
|---|---|
| `fullPageUrl`, `pageShots` | the full-page renders. The audit view says "above the fold only" without them, on every lead |
| `verifiedCEO`, `verifiedCEOTitle` | the confirmed decision-maker on the call sheet. `leadToRow`'s own comment calls verifiedCEO "the costly one" |
| `rateLimited` | the banner saying Firecrawl was REFUSED rather than finding nothing, and to re-run the lead |
| `phoneSource` | whether the number came off their Google listing |

The other six — Google's real-world speed field data and the early-channel
decision — were measured with nowhere to go. All eleven land now and the check
requires all 68, with **zero declared exceptions**.

Two more found on the way out:

- **The merge overwrote the server's `richData` with a dead browser measurement.**
  The browser PageSpeed call was removed weeks ago (it ran with no key and returned
  429 on every lead, recorded as a measurement), so `pageSpeed` has been `{}` ever
  since and those lines wrote "Not checked" over whatever the server sent. Fallback
  now, not override.
- **A re-research cleared three fields of the previous email and the writer sets
  eleven** — and the two it left behind, `subject` and `pitch`, are the two the
  send path reads. Nothing could ship it alone (approval goes false), but the
  comment above it promises the draft is dropped and the batch relies on that.
  Found by running fifty leads through the batch with a blocked composer.
  `clientcheck.js` now reads BOTH lists off the code and fails if they drift.

**And one more the batch made urgent.** The browser's poller gave up ten minutes
after SUBMITTING a lead. The server's clock starts when the WORK starts —
deliberately, because a job that waited six minutes for a slot used to have two
minutes left to do five minutes of work and was killed with the credits already
spent. So a lead that queued for five minutes and then worked for five was
abandoned **by the browser** at the moment the server was about to answer,
reported as "did not finish within 10 minutes", and the paid-for audit thrown
away. One lead at a time nothing ever queued and this was invisible. Fifty at a
time it is the normal case. Two clocks now, both from the server's own report:
ten minutes of WORK, and a wall-clock backstop for a server that never replies.

**And the bulk audit itself.** `runBatchAudit` reuses the shared request builder,
the shared merge, the shared compose body and the shared email commit — it
reimplements nothing. Audits only by default, because that is what Mike asked for;
"also write the email" is a tick box. `batchcheck.js` runs 50 leads through the
real runner with a fake network under it and proves seven things, each because the
opposite has happened here: the shared builder and merge are used, audits-only
costs zero compose calls, emails-on produces an actually sendable subject+body+arm,
a fact-check refusal is reported AND leaves no stale draft, no more than eight
leads are ever in flight, every job id is written to disk so a closed tab does not
lose paid-for work, and Stop keeps what finished. All four of its central
assertions were falsified by reverting the code they guard.

