# §75 — The funnel became the rows — 2026-08-26
Source: CLAUDE.md lines 6592-6633, moved verbatim 2026-09-02 from commit b01d952e4f95d7b69686bc2c4063ca2aa0cb7546 (branch backup/claude-md-monolith). Nothing below this line was edited.

## 75. The funnel became the rows — 2026-08-26

Vin, approving the round-98 mock: *"i like option A but i dont like that its
a boxes its suppose to be a funnel"*, then the one rule that decided the
design: *"the size of the funnel needs to always fit the amount of text to
the right of it."*

**So there is no drawing to keep in sync any more.** The funnel segments and
the stage cards are the SAME grid rows: each tapered segment (a percentage
clip-path, so the taper scales with any height) stretches to the exact height
of its card, and the two can never disagree on any lead, because they are one
row. `funnelSvg` — a fixed 236x474 picture the content beside it outran two
to three times on every real lead — is deleted, along with the `sts` object
that fed it.

Three declarations, one copy each, both surfaces: `FUNNEL_TAPER` (each row's
bottom edge IS the next row's top edge, so the segments join into one
continuous funnel — the "boxes" complaint made structural), `funnelSegClip`
and `funnelSegFill` (red fill only where BROKEN; mixed fills as a working
stage and keeps its red drips; no_read is the faintest fill). The segment and
its card share ONE status string, so the label in the funnel and the label on
the card cannot drift — the same one-source rule as everything else here.
Drips render on broken and mixed rows, and the narrow "booked jobs" spout
closes the shape. Fix-first, the work strip and the reference tail render
full-width under the grid.

`clientcheck` executes the shape contract: row continuity (join and
narrowing), the clamp, red-only-broken fills, the rendered sheet's segments
and spout, and runtime-assembled call-site needles proving both surfaces clip
through the ONE builder. **Four falsifications, each red alone — and the
fourth caught its own first assertion being vacuous**: it looked for the
words "booked jobs", which `LAYER_PLAIN` prints on nearly every sheet as the
CONVERSION translation, so the spout could be deleted and the check stayed
green. It keys on the spout's own class now. The
fixture-that-measures-nothing trap, recorded once more, found only by
running the revert.

The contract is 20260830 on both sides. **`index.html` changed, so this
needs a Netlify deploy.** server.js changed only its contract number.

---

