# §32 — Markets, and the second list that would have drifted
Source: CLAUDE.md lines 2089-2103, moved verbatim 2026-09-02 from commit b01d952e4f95d7b69686bc2c4063ca2aa0cb7546 (branch backup/claude-md-monolith). Nothing below this line was edited.

## 32. Markets, and the second list that would have drifted

The Find picker held its own hardcoded array of the twenty cities the server
searches — a copy of `GP_CITIES` typed out again. A market added on the server
would never have appeared in the picker, and a market picked in the picker that
the server does not search returns nothing at all, which reads as "Find is broken"
rather than "two lists drifted apart".

`/api/find-options` serves both lists from the constants themselves, and the
picker is now multi-select: the server has always accepted an array and filtered
`GP_CITIES` against it, and only the single dropdown was the bottleneck.
`clientcheck` refuses a hardcoded "City ST" list coming back.

---

