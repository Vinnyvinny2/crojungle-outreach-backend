# Round 146 — the evidence, as runnable files

Each file lifts the REAL function out of `src/all.js` and executes it. None of
them reads the code and reasons about it: this repo's record is that reading has
been wrong about causes repeatedly and executing has not
([§102](../round-102.md), [§104](../round-104.md)).

Run any of them with `node docs/history/round-146-evidence/<file>`.

| file | what it proves |
|---|---|
| `size-lookup-crash.js` | `findSizeViaSearch` throws `Cannot read properties of undefined (reading 'length')` and returns `null` on any lead whose size search surfaces a bbb.org URL — reproducing the live log line byte for byte. `fetchBbbProfile` is retired and returns no `management` key, the `/^retired/` branch stores `management: undefined`, and the next line reads `.length` on it. The Firecrawl credits and the Haiku call are already spent when it throws. |
| `hunter-timeout-false-absence.js` | `hunterFindPersonEmail` with a throwing `fetchT` returns a bare `null`, indistinguishable from a genuine empty index, so the caller's final branch tells the row *"its index has no address for them. One credit spent."* — a false statement about a business, built on a failure of ours. Fired 3 times in a batch of 10. |
| `site-grade-invisible-faults.js` | `readSiteLooks` grades SLC Med Spa, Winn's Plumbing and Locust Pump as **bad** with **zero** vision faults, because `diyBuilder`(3) + `noClickToCall`(3) = exactly `SITE_LOOKS_BAD`(6) — two faults no customer can see. Also: a site nobody looked at is graded anyway, the eyes top out at 9 and the visible markup at 15, and the two are added. |
| `size-tier-boundaries.js` | The four size tiers execute correctly at every boundary: $1.5M, $4M, $10M, $20M and $21M, plus nothing-measured. Both shared cuts ($10M, $20M) are proven to DERIVE from `ICP_REVENUE_BAND` rather than being retyped — the defect [§139](../round-139.md) exists for. |
| `lane-partition.js` | 12 lane cases, none in both lanes. It is also the file that CAUGHT two bugs the partition introduced: a medium business publishing a marketing director, and a TheirStack lead, each came back with no lane at all, because the old lists overlapped and anything pushed off the call sheet was still inside email. |

## What is NOT in here, and is named as such

- **How often a trade's homepage states its own size.** Unmeasured. It is why the
  round's headline target is a floor and a re-measure rather than a percentage.
- **Whether the visible design markers separate a batch the way Vin would.** Never
  scored against a human's opinion of the same pages.
- **The rating-against-size question.** Vin's hypothesis; deferred by his own
  ruling until the crash fix above produces the first set of businesses carrying
  both a rating and a measured revenue.
