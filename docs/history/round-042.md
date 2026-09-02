# §42 — The second live run: the fixes held, and the export read them out loud — 2026-08-21
Source: CLAUDE.md lines 2834-2904, moved verbatim 2026-09-02 from commit b01d952e4f95d7b69686bc2c4063ca2aa0cb7546 (branch backup/claude-md-monolith). Nothing below this line was edited.

## 42. The second live run: the fixes held, and the export read them out loud — 2026-08-21

Vin ran a second batch on the freshly-deployed build and sent the screen, the
export and the log. The big picture: **the ladder is alive** — David Price,
Joseph Jensen and McCormick Law all carry real measured problem lists, and
McCormick's sheet names the competitor above him with both review counts. The
blind-corpus banners fired on every lead Firecrawl starved. The old audits
(Bret, Fit Money, Binh, Stanley) still show the pre-fix contradictions because
they are STORED text from the dead-ladder run — re-run them, do not read them.

Seven defects surfaced, one of them self-inflicted that same day:

- **Two new row fields killed every save.** `held_back_contact` and
  `corpus_read` were added to `leadToRow` with no matching Supabase columns, and
  PostgREST refuses the ENTIRE payload on one unknown key — the red NOT SAVING
  banner, HTTP 400, on launch night. The root fix is that this class can never
  do that again: on a 400 the client reads Supabase's own body, which names the
  missing column, strips that ONE key, retries so everything else lands, and
  prints the exact `alter table` that fixes it permanently. The parser is
  executed by `clientcheck.js` against the real PGRST204 body, with a 500 and an
  RLS refusal asserted NOT to match — misreading either would strip fields
  forever instead of naming the real problem.
- **One sidebar list held three different kinds of lead.** A finished audit, a
  lead mid-research and an untouched lead were identical score-sorted rows, and
  "Export 7 audits" after a five-lead run read as a miscount. Three sections
  now — **Auditing now / Not audited yet / Audited — what Export covers** — one
  row renderer for all three, in-flight membership read from the same records
  the resume path uses.
- **The blind guard sat one branch too low.** McCormick's sheet said "We never
  read a single page of their website" and then "Fix this first — FOUNDATION:
  the site cannot convert". `_siteConverts` is false when nothing was read, so
  an UNREAD site satisfied "cannot convert" before the NOT-MEASURED guard could
  fire. The guard now sits above every absence-built branch — everything above
  it rests on positive evidence, which proves we looked. The order is asserted
  by `DIAGNOSIS AGREEMENT CHECK` and falsified by moving it back.
- **The deferral repeated the block above it.** David Price's "Fix this first —
  OFFER" restated the whole "one thing — OFFER" paragraph directly beneath
  itself. One sentence now, pointing up.
- **"15 reviews at 3.5" against a measured 150.** The unsourced-number check
  exempts anything ≤ 20 so "3 things" is not flagged — and a DROPPED DIGIT
  produces a small number by construction, so the exemption protected exactly
  the error. A sub-floor number is now flagged when it is a measured number with
  one digit missing or added. Executed against Jensen's exact sentence.
- **The checker's own approval reached the sheet as a warning.** The merge into
  `_claimRisks` ran on the RAW flag list, 25 lines above the cleared-entry
  filter, so McCormick's "Do not say" carried the literal item "fact-check: No
  flagged claims." Moved below the filter; a clearance can never render as a
  caution again.
- **Register polish that is really accuracy:** "1 other above them have fewer"
  → has/have by count on the flagship finding; a CPA's call window no longer
  says the owner is "with patients"; the export deduplicates a flag that
  arrives both as a critical entry and as a prefixed claim risk.

And `LADDER SURVIVAL CHECK`'s green line now states its honest limit: it builds
its own arguments, so it cannot see a bad name at the live call site —
scopecheck's runtime-split globals are the guard for the cause, LADDER CRASH
VISIBILITY for the consequence. A dead `String(resolveMeasurements)` capture
that sat in it looking like evidence is gone.

**Needs one SQL run in Supabase** to make the two new fields durable (everything
else saves without them either way):

```sql
alter table leads add column if not exists held_back_contact jsonb;
alter table leads add column if not exists corpus_read jsonb;
```

**`index.html` changed, so this needs a Netlify deploy.**

---

