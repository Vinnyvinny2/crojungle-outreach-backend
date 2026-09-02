# §5 — External services fail silently and look like bugs
Source: CLAUDE.md lines 436-448, moved verbatim 2026-09-02 from commit b01d952e4f95d7b69686bc2c4063ca2aa0cb7546 (branch backup/claude-md-monolith). Nothing below this line was edited.

## 5. External services fail silently and look like bugs

- **Apify** returned HTTP 200 with 5 reviews for a 116-review profile. No 402 to
  catch. Read as real it becomes "no repeating complaint" — the strongest finding
  in the system, silently deleted. Now guarded; the class is general.
- **Firecrawl** returns empty on nearly every homepage. Falls back to plain-text
  salvage at ~⅓ of the corpus, which is likely why `originalFindings` survives at a
  low rate.
- **SMTP verifier** times out at 30s on every call.

Both Apify and Firecrawl were out of credits at the end of the last session. **Any
judgement about email quality made on those runs is invalid.**

