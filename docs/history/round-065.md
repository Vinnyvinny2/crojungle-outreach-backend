# §65 — The funnel became the layout, and the narrator was made to think — 2026-08-24
Source: CLAUDE.md lines 5558-5643, moved verbatim 2026-09-02 from commit b01d952e4f95d7b69686bc2c4063ca2aa0cb7546 (branch backup/claude-md-monolith). Nothing below this line was edited.

## 65. The funnel became the layout, and the narrator was made to think — 2026-08-24

Vin, on the first funnel-walk sheets: *"the info is just not getting condensed
into a story about the company its repetitive on its point... it seems like the
brain doesnt actually think about whats going on it just tells about the
signals i need it to think."* And approving the funnel mock: *"make sure each
finding always goes along with the proper place for the funnel... the biggest
leaks are ranked 1 2 and 3 cuz the goal for the audit is to identify the top 3
biggest things that are damaging the business."*

The repetition was structural: five surfaces (the walk, the verdict paragraph,
the one-thing, the top-3 list, the smaller leaks) each rendered its own copy of
the same measurements, because nothing owned the story. Both fixed at the root.

### Every finding has a declared place on the funnel

`RUNG_FUNNEL_STAGE` places all 48 rungs — found / door / after / work — the
same discipline as RUNG_PILLAR: a rung added tomorrow refuses the boot until a
human places it, both directions checked. `review_pain_pattern`'s stage follows
its THEME through the same classifier that decides its rank (contact → after;
workmanship → work, the context strip), so the stage and the rank cannot
disagree. `paid_traffic_leaks` is filed at the DOOR deliberately — the tag is
the money but the fault it names is where the click lands, Vin's own walk.
Rows carry `funnelStage`; the client falls back to a pillar→stage map for
leads audited before the field existed.

### The top three leaks are numbered 1-2-3, once, server-side

`leakRank` is assigned on the sorted list in buildProblemList — the ONE copy
every consumer reads. Internal review metrics, ambient conditions and
workmanship context can never take a number. The client renders the red
LEAK 1/2/3 badges AT the stages where the rows sit, so the ranking and the
location are one picture; a legacy lead derives the same numbers from the same
predicate.

### One narrator, forced to think

The walk and the ranked leaks now feed INTO the synthesis as labelled evidence
("already printed on the sheet — never restate these lines; your read is what
CONNECTS them"), its thinking effort went medium → high (the one call whose
whole job is judgement), and — because instructional guards do not hold —
`restatedEvidenceLines` is the mechanical half: a read sentence sharing 70%+
of its content words with any evidence line is a restatement, two of them fail
the attempt with the fault named, and the retry knows exactly what to do. Both
directions fixtured: a parroting read fails, a genuinely synthesized read over
the same facts passes. The walk is computed ONCE, before the narrator, and the
response returns the same object — two calls could drift.

### The layout: story → funnel → call → reference

THE STORY is the only prose on the page (background, headline, read, the
sell); the code walk is its fallback when the model read is missing. THE
FUNNEL is the skeleton: a real funnel drawing (one `funnelSvg` for both
surfaces — red only where broken, dashed where NOT MEASURED, drips where the
money falls out) beside the three stages, each finding rendered once as terse
evidence with its badge, money lines only on the numbered leaks, fix-first
from the walk, and the work-itself context strip underneath. The old verdict
card, one-thing card, top-3 list and smaller-leaks section are DELETED from
both surfaces — their content lives at its stage or in the reference (the
model's grouped rows, the system diagnosis, the costliest line). An
unmeasured stage says NOT MEASURED and, for "after", names it as the question
for the call — silence never hardens into a verdict, and `buildFunnelStory`
now returns per-stage `measured` flags so CLEAN and NO READ are tellable
apart.

### And the one boot nobody had capped

fuzz went red on a correct build: its spawn was the ONE boot in the project
without `--max-old-space-size=256`, and this round's additions settled the
UNCAPPED heap at 206MB — over BOOT HEAP CHECK's 200 — while the capped boot
(CI, Render, PART 6's own command) collects to 185MB and is green. Fuzzing a
heap shape production never runs is testing nothing; the spawn carries the
cap now. Found on the way: node's fetch of `http://localhost` was being
intercepted by the environment's proxy (503) while `127.0.0.1` answered 200 —
fuzz addresses the server by number now, as servercheck always did. Heap note:
185MB of a 200MB assertion — the next few hundred lines of boot checks need
the §46 memoisation treatment before they land.

**229 boot checks green.** Eleven falsifications (seven server, four client),
each red alone; the G4 revert went red on a sibling fixture rather than its
own, which is accepted — the guard family caught it.

**`index.html` changed, so this needs a Netlify deploy.**

---

