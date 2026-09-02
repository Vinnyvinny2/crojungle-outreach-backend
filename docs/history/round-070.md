# §70 — The board, and the bar that finally follows along — 2026-08-25
Source: CLAUDE.md lines 6172-6237, moved verbatim 2026-09-02 from commit b01d952e4f95d7b69686bc2c4063ca2aa0cb7546 (branch backup/claude-md-monolith). Nothing below this line was edited.

## 70. The board, and the bar that finally follows along — 2026-08-25

Vin, with a screenshot: *"it does not show audited leads anymore like i ran
irwin and it didnt pop up in the audited seciton this is a bug and we need a
whole redeign of this tab anyway... id like to know if its in progress
something to follow along. just show me mockups first before build."* He
picked Direction B from the mockups: the whole Research tab as a full-width
board with status tabs, clicking a row opening the audit exactly as it exists.

### The "bug" was a burial, and the burial was real

Irwin WAS in the sidebar — under Audited, which rendered BELOW the entire
not-audited section: on a 202-lead pipeline that is over a hundred rows down,
past sticky headers that replace each other as you scroll. A section a person
cannot find is a section that does not exist. Two fixes: the sidebar (which
survives, as the rail beside an open audit) now orders Audited ABOVE
not-audited, and the BOARD replaces buried sections with tabs — All / Auditing
/ Audited / Not audited — where `boardRowsFor` is the ONE place that decides a
lead's tab, executed by clientcheck, because the old section filters lived
inline in the render where nothing could run them. Running beats audited (a
re-run must not look finished), the anchor leak-1 sentence rides each audited
row, and the sidebar's lead rows render only while a lead is open — two lists
of the same leads is the repetition this file keeps recording.

### And the search box was quietly poisoning Export

The find-a-lead box REPLACED `allLeads` with the filtered subset — the store,
not a view. "Export all audits" while a search was typed silently exported
only the matches. The store stays whole now; the sidebar, the board and the
export all read it through a non-destructive filter.

### The follow-along is milestones, not a simulation

The status route has shipped `job.phase` since the queue clock landed and
nothing ever wrote a milestone into it, so "what is this lead doing" could
only be answered with an elapsed-time guess. Five real milestones now —
reading their pages / reading their Google listing / reading their reviews /
running their search / writing the audit — each set when that stage's code is
actually reached, attached through the job wrapper's setter (the sync route
gets none, so it costs that path nothing). The poll loop hands the phase
outward, the batch reports it as a `lead-status` event, and the reducer keeps
a per-lead detail that is cleared THE MOMENT the lead finishes — a done chip
still claiming "writing the audit" is a stale claim about ended work,
fixtured in batchcheck. The bar itself: one segment per lead (done, running,
queued as three visible states, proportional past sixty), a chip per running
lead with the server's milestone and its worked clock, and "next:" naming who
is queued. `PHASE MILESTONE CHECK` pins the setter, all five milestones and
the route delivery.

### What the falsification runs found

Eight falsifications — two server, six client — each red alone on its named
assertion. CF8's first run was a NO VERDICT twice over: `node batchcheck.js`
ran from the falsification directory (module not found — an exit 1 that
proves nothing, the recorded harness rule) and the restore `cp` wrote into
that same directory instead of the repo, leaving the revert LIVE in the tree.
Both caught by checking the log's first line and diffing the tree after
restore — a falsification harness is judged by what actually ran, never by
its exit code alone.

**232 boot checks green, all gates green.** The contract is 20260827 on both
sides. **`index.html` changed, so this needs a Netlify deploy** — the board,
the follow-along bar and the search fix are dark until the file lands.

---

