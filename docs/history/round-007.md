# §7 — The audit was blind on leads where we were holding five pictures
Source: CLAUDE.md lines 482-507, moved verbatim 2026-09-02 from commit b01d952e4f95d7b69686bc2c4063ca2aa0cb7546 (branch backup/claude-md-monolith). Nothing below this line was edited.

## 7. The audit was blind on leads where we were holding five pictures

Claude Reynolds, live: Firecrawl returned the homepage as a **palette PNG**,
`pngscale.js` read only RGB and RGBA, and the caller treated a missing homepage
as fatal — so four already-paid-for interior renders went in the bin with it.
`BRAIN INPUT: 0 image(s)`.

The scaler now reads every shape a renderer emits (palette 1/2/4/8-bit with PLTE
and tRNS, greyscale, greyscale+alpha, RGB, RGBA) and still refuses interlaced and
16-bit by name. A missing homepage no longer discards the interiors; every image
is labelled; and the prompt line claiming a screenshot was attached is computed
from the message actually sent, not from a URL — on that lead it told the model a
screenshot was attached while another line of the same prompt correctly said
there was none.

**And the scaler was already an OOM risk.** Measured peak RSS was **330MB on a
1920x8336 render and 382MB on 1920x11189**, against Render's ~256MB. Buffers live
outside the V8 heap, so `--max-old-space-size` never bounded them and
`BOOT HEAP CHECK` could not see them. Worst case is now 218MB. **If you add
anything that decodes an image, measure RSS, not heap.**

`SCREENSHOT SCALER CHECK` builds eight PNG shapes and pushes them through the
real function. Nothing in this file had ever executed `fitWithin` — the only
guard was a source-regex asserting the call site exists, and it passed on the run
that lost every image.

