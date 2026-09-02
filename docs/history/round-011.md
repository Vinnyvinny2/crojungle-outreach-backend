# §11 — Discovery was costing real money and nothing measured it — FIXED 2026-08-19
Source: CLAUDE.md lines 608-670, moved verbatim 2026-09-02 from commit b01d952e4f95d7b69686bc2c4063ca2aa0cb7546 (branch backup/claude-md-monolith). Nothing below this line was edited.

## 11. Discovery was costing real money and nothing measured it — FIXED 2026-08-19

Vin's July Google Cloud invoice: **$48.83, SKU "Places API Text Search
Enterprise"**. August was on the same track. He had assumed Places was free and
briefly removed the billing account, which is worth knowing on its own: Maps
Platform requires a billing account **even to use the free allowance**, and
without one the rank check and the profile read both return "not checked" —
silently deleting about eleven of the forty-one measured signals, including both
findings that have ever earned a reply.

**Why it is the Enterprise SKU, and why that is correct.** Asking Places for a
star rating, a review count or a website URL puts the whole call on Enterprise,
whose free allowance is **1,000 calls a month**, not 5,000. All three earn their
place — the 4.2–4.85 band is the one filter with evidence, the review count is
the affordability proxy, and the website read routes a lead to CALL or REBUILD
before a penny is spent. The tier is not the defect.

**The defect was that the grid had no memory.** Every run shuffled 40 categories
against 20 cities and dealt 100 queries at random, plus up to 80 more pages.
Places answers each query with its twenty most prominent businesses *in the same
order every time*, so the twelfth run re-asked a search the third had already
drained, paid full price, and threw every result away as already owned —
`skippedAlreadyOwned` has been in the log line for weeks.

A category+city pair now rests after **two consecutive runs returning nothing
new**, for **30 days**. Four failure modes are closed by construction:

- a query that **errored** is not exhausted ground (one bad network moment would
  otherwise rest a live market)
- a query blocked by **`PER_CAT_CAP`** is not either — it returns nothing new
  from ground that is untouched
- it can **never return an empty run**; if everything is resting the stalest are
  admitted anyway and the log says so
- it does not undo the **stratification** — freshness orders the cities inside a
  category, the round-robin deal across categories is untouched

Supabase unreachable or the table missing produces an empty map and today's
behaviour exactly. **It needs a table:**

```sql
create table places_query_state (
  q text primary key, cat text, city text,
  last_run timestamptz, runs int default 0,
  last_new int default 0, dry_streak int default 0);
```

The run says plainly when the write fails, so a missing table is loud rather
than silent.

**And a meter**, because "what does 50 audits a day cost" could only be answered
with arithmetic from outside the system. It counts the two billed SKUs
separately, at DISPATCH — Google bills a request it received even when we give
up waiting. The RATE is a setting (`GP_RATE_SEARCH_PER_1K`,
`GP_RATE_DETAILS_PER_1K`) and the log says so: published third-party figures
disagree from $17 to $35 per thousand and the only authoritative number is on the
invoice, Billing › Reports › group by SKU.

**The shape of the spend, for planning.** An audit is 2–3 searches and 1 profile
read. One Find run was up to 180 calls. **One press of Find costs about what
sixty audits cost** — hunting is the expensive half, auditing is nearly free.

---

