# §37 — The launch sweep — 2026-08-21, the night before the first 50-batch
Source: CLAUDE.md lines 2435-2465, moved verbatim 2026-09-02 from commit b01d952e4f95d7b69686bc2c4063ca2aa0cb7546 (branch backup/claude-md-monolith). Nothing below this line was edited.

## 37. The launch sweep — 2026-08-21, the night before the first 50-batch

A full re-verification before calling starts, with a rule of its own: no new
features, only defects. Three found, all fixed at the root:

- **The last two pushes were never merged.** The clock/call-outcomes and the
  niche library sat on the branch while Render served main without them. The
  usual squash-merge rebase, PR #23, merged. The lesson is procedural: a push
  to the branch is not a deploy, and the sweep now starts by diffing
  origin/main against the tested tree.
- **Two prompts joined their lines with the two-character string `\n`.**
  Inside a template literal `'\\n'` is backslash-plus-n, not a newline. The
  domain-confirmation prompt had sent its known-facts list as one run-on line
  for its whole life; the niche brief's sourced figures did the same. Same
  root cause both times: an escape written for a quoted string, inside a
  template literal that wanted the real character.
- **`door\w*` sat bare in the crew-trades matcher** and filed "Doors of
  Distinction interior design" under crew trades — the recorded garage-door
  lesson back a third time. Removed rather than narrowed: window-and-door
  companies already match on `window\w*`, garage doors have their own
  anchored entry, and a pure door company now gets NO brief, which is the
  designed answer.

Verified clean on the same sweep: every route the client calls exists on the
server; the outcome buttons read the finding id from a spine that survives
both the audits-only path and a reload; the 50-batch export wraps each lead
in its own try/catch, reports broken leads as a visible row, and downloads as
one self-contained file.

---

