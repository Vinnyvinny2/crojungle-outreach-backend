# §72 — Trapped on the audit screen, and the stale rows on top — FIXED 2026-08-25
Source: CLAUDE.md lines 6390-6421, moved verbatim 2026-09-02 from commit b01d952e4f95d7b69686bc2c4063ca2aa0cb7546 (branch backup/claude-md-monolith). Nothing below this line was edited.

## 72. Trapped on the audit screen, and the stale rows on top — FIXED 2026-08-25

Vin, first session on the round-93 board: *"i click on view an audited lead and
i cant get back to the new layout... theres an all leads arrow but it doesnt
worek"* — and *"it needs to filter the just completed audit to the top of the
list theres alot fo stales ones in here."*

**The back button worked; the state had no way back.** The board renders when
no lead is open, and the "All leads" button correctly set the selection to
null — but the lead-loading effect handled only the FOUND case (`if (l)
setLead(l)`), so nothing ever CLEARED the open lead and the operator was
trapped on the audit screen behind a button that looked dead. A null selection
now clears the open lead; a set-but-not-found id still keeps the old behaviour
on purpose. The branch is pinned by a runtime-assembled needle in
`clientcheck`, because the effect lives inside a React component the harness
cannot execute — the recorded honest limit, stated at the assertion.

**And within Audited, the freshest audit now leads.** The board sorted by
status then SCORE, so a just-finished three-lead run sat buried under a week
of stale 97s. Inside the audited status the sort is now most-recent-audit
first, score breaking ties; every other status keeps score order. Executed in
`clientcheck` on the shape that failed live: an older audit with a HIGHER
score must lose to a fresh one.

Two falsifications, each red alone on its named assertion. From the same
screenshot's own log, not a code defect: one audit failed with "Anthropic
credit balance is low" — the account needs a top-up before the next batch.

**`index.html` changed, so this needs a Netlify deploy.**

---

