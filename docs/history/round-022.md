# §22 — The three roadmap builds — 2026-08-20, shipped but unproven live
Source: CLAUDE.md lines 1148-1183, moved verbatim 2026-09-02 from commit b01d952e4f95d7b69686bc2c4063ca2aa0cb7546 (branch backup/claude-md-monolith). Nothing below this line was edited.

## 22. The three roadmap builds — 2026-08-20, shipped but unproven live

Built at the end of the night, each falsified at boot, none yet run against a
real lead. Distinguish accordingly.

- **Sender rotation is a settings entry.** One mailbox has carried every
  bounce, and a hard bounce is charged to the DOMAIN. A second Hunter sequence
  (same Hunter account, sender on the second domain) pasted into Settings
  splits sends across the two. The pick is a **stable hash of the lead id** —
  never a counter — because a re-sent lead landing in the other sequence puts
  one person inside two campaigns, which reads as spam from two strangers.
  Every send stamps `sentVia` into the attribution snapshot so a bounce is
  chargeable to the domain that earned it, and the outcome sync reads BOTH
  sequences. One configured sequence behaves exactly as before.
  `SEND ROTATION CHECK`.
- **Duplicate Google listings are measured.** One extra Places name search per
  research lead (the audit's fourth call). A duplicate is claimed only when a
  different place ID carries the **same website domain or phone** AND the
  **same street address** — a similar name proves nothing, and the same domain
  at a different address is a second location, not a defect. New rung
  `duplicate_listing` (harm 86, LEADS): the split is invisible to the owner,
  checkable in ten seconds, risky to fix alone, and explains
  `outranked_by_weaker` with no theory about ranking at all.
  `DUPLICATE LISTING CHECK`; clientcheck flagged the missing client merge line
  the moment the server returned the field — the executable merge check doing
  its job.
- **The lab mobile score finally lands.** `measureRealWorldSpeed` extracted
  the Lighthouse mobile score on every lead and nothing read it, while five
  consumers read `pageSpeed.mobileScore` — fed by a browser call that was
  REMOVED. Instance nineteen of computed-but-not-passed. The one rule that
  makes it honest: **the lab score is a simulation and loses to the field
  data** — a lab 45 against real-visitors-fine displays with the contradiction
  stated but cannot flag `slow_mobile`, cannot count as a confirmed issue, and
  cannot feed the brain a claim the fact-checker refutes from the same
  response. `LAB MOBILE SCORE CHECK`.

