# §9 — Cost — and a correction about the cache
Source: CLAUDE.md lines 522-538, moved verbatim 2026-09-02 from commit b01d952e4f95d7b69686bc2c4063ca2aa0cb7546 (branch backup/claude-md-monolith). Nothing below this line was edited.

## 9. Cost — and a correction about the cache

`cacheRead=0` on a BRAIN COST line does **not** mean the cache is broken. That
line's own text says "cache WRITTEN (first call — reads are 10% from here)", and
`BRAIN_STATIC` is 64,000 characters with exactly one interpolation
(`FACT_DISCIPLINE`, itself static), so the cached prefix is byte-identical across
leads and the cache works. Read the whole log line before concluding.

The real cost shape, from a live lead at **$0.1148 across 8 calls**:
- the brain audit is **66%** of it — 31,228 fresh input tokens, of which
  **22,040 is evidence text sent uncached on every lead**
- the other seven calls total ~$0.039

So the lever is the size of the evidence block and the number of calls, not the
cache. Cutting evidence trades directly against audit quality, so it is a
decision to take deliberately rather than a bug to fix.

