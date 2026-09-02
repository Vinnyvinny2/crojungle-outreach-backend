# §12 — We paid for 513 businesses and kept 120 — FIXED 2026-08-19
Source: CLAUDE.md lines 671-731, moved verbatim 2026-09-02 from commit b01d952e4f95d7b69686bc2c4063ca2aa0cb7546 (branch backup/claude-md-monolith). Nothing below this line was edited.

## 12. We paid for 513 businesses and kept 120 — FIXED 2026-08-19

From the live run's own log:

```
Google Places: 514 local owner-operated businesses from 177 queries
After merge: 513 unique
Unique: 513 | Returning: 120
```

Every one of those 513 cleared the rating band, the size gate, the franchise
filter and the pipeline dedupe. **393 were dropped on the floor** because
`MAX_TOTAL` is 120 — a decision about how many rows are useful on a screen,
acting silently as a decision about how many businesses are worth having. Nothing
remembered them, so the next run paid Google to find the same businesses and
threw the same 393 away again.

**The bench** stores the overflow and the next run serves it before spending
anything. One run yielded 120 usable leads; with the bench it yields about 513,
so four runs do the work of seventeen. Three failure modes closed by
construction: stale leads past a 60-day TTL are dropped rather than served (a
bad lead costs a whole research cycle, far more than the search that found it);
the Google budget scales to the shortfall but **never below a quarter of the
cap**, so a bench full of one trade cannot stop us searching for anything else;
and the table is bounded by score. Needs a table:

```sql
create table lead_bench (
  id text primary key, name text, website text, source text,
  score real, payload jsonb, created_at timestamptz default now());
```

**And the correction that matters most about the price.** Google bills per CALL,
not per result, and a call returns up to twenty businesses. From the same run:
2,892 businesses seen across 177 calls, which is **$2.14 per thousand businesses**
at $35 per thousand calls. The Apify Google Maps scraper is $1.50–2.10 per
thousand businesses. **They cost the same**, so moving discovery off Google's API
saves nothing — an earlier estimate of "20x cheaper" compared a per-call price to
a per-result price and was simply wrong. It also follows that filtering results
harder cannot save money: the only way to spend less is to make FEWER CALLS,
which is what the query memory, the bench and the page budget all do.

**Depth is no longer bought for a category that is already full.** `PER_CAT_CAP`
discards every further result on that query by definition, so a second page there
is a paid call bought to produce nothing. 335 businesses hit that cap on the live
run and 77 extra pages were bought in the same run. The page budget also scales
with the run cap now, since a page costs exactly what a query costs.

Whether depth pays AT ALL is now measured rather than argued: `DEPTH YIELD`
reports what a first page returned against what the bought pages returned, and
splits the businesses we paid for and did not keep into band, cap and
already-ours — only the last is a gap a deeper page can fill.

**What was considered and rejected:** taking one local-rank sample instead of two.
It would save roughly $40 a month and it would reinstate a bug fixed the same
day — two samples exist because single draws returned #10 and #1 on one business
minutes apart. The finding at risk is `outranked_by_weaker`, one of only two with
a real reply behind it. Not worth it.

---

