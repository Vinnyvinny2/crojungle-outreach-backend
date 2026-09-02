# §15 — A stem with a word boundary after it matches nothing — FIXED 2026-08-20
Source: CLAUDE.md lines 871-908, moved verbatim 2026-09-02 from commit b01d952e4f95d7b69686bc2c4063ca2aa0cb7546 (branch backup/claude-md-monolith). Nothing below this line was edited.

## 15. A stem with a word boundary after it matches nothing — FIXED 2026-08-20

`\bplumb\b` cannot match "plumbing", because the g is a word character. A stem
written that way matches only itself, and "plumb" on its own is not a word
anybody puts in a business name. **`RECURRING_NORMAL_TRADES` failed on 22 of the
34 trade words it exists for — including plumbing, roofing, electrical and
landscaping, our four largest categories** — so `recurring_revenue`, a whole
rung, had never fired for a plumber, a roofer, an electrician or a landscaper.
Nothing said so, because a regex that matches nothing is silent rather than wrong.

Found from one live line: `BLOCKED [Chiropractic Family Healthcare]: large health
system (name)`. `chiropract` could not match "chiropractic", so the small-practice
exemption never fired and the enterprise filter took the lead. The same defect was
in five lists, pointing both ways — `hospital` could not match "Hospitals" either,
which lets a real enterprise through.

**This file already recorded the bug once**, in the jargon gate: "`synerg` used to
sit bare inside `\b(...)\b`... `synergy`, `synergies` and `synergistic` all sailed
through the most notorious entry on the list for the life of that gate." The lesson
was written down and never generalised.

`STEM MATCH CHECK` now holds two mechanisms, because they fail on different days:

- **Fixtures** — the real words each list exists to catch, run through the live
  regex. Covers today's lists; blind to the term added next month.
- **A declaration** — every bare string one of those lists can END on must appear
  in `STEM_COMPLETE_WORDS`. A new stem cannot be added without writing it down as
  a word, where a reviewer sees it. Both directions fail: a word no list uses any
  more cannot sit there looking checked.

**A generic detector was written first and deleted.** Sweeping every `\b(...)\b`
in the file for an alternative that is a strict prefix of another beside it flagged
68 entries; excluding plural pairs still left 49, because `the|them|their`,
`you|your`, `pick|picking` and `rank|ranked` are ordinary word lists where the
prefix relation means nothing. There is no dictionary in this process and no
mechanical way to tell "plumb" from "pest". A check that cries wolf is a gate the
next person switches off, so it demands the declaration instead of guessing.

