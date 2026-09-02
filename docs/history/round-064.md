# §64 — The audit learned Vin's own funnel walk — and the tracking measurement had never once run — 2026-08-24
Source: CLAUDE.md lines 5442-5557, moved verbatim 2026-09-02 from commit b01d952e4f95d7b69686bc2c4063ca2aa0cb7546 (branch backup/claude-md-monolith). Nothing below this line was edited.

## 64. The audit learned Vin's own funnel walk — and the tracking measurement had never once run — 2026-08-24

Vin picked apart Breck's Paving by hand and asked for audits that consistently
reproduce that analysis: social ads are the low-intent side and Google search
the high-intent side; no landing page and an 8-field form is a broken bottom of
funnel ("Ranking higher won't pay off if it dumps into the same form"); nobody
can see ad ROI without tracking; slow-callback complaints beside open ops roles
mean a team at capacity; quality complaints are not a leak ("we have no control
over the quality they produce"); and above all: "the brain and these audits
dont know the true goal... theres no cohesive overall story." Five recon agents
mapped the mechanisms and an adversarial agent verified the design before a
line changed. Eleven falsifications, each red alone. 228 boot checks green.

### The worst finding was not in his list: "no conversion tracking" had never been measured

`mergeAdSignals` has computed the conversion-label and call-tracking markers
since they were added — and the call site copied back only the three markers
that predate them. `builtWith.hasAdsConversion` was never assigned anywhere,
so `_harmInputs.adsConversion` read `undefined === true` = false on every
confirmed lead. **`ads_untracked` (harm 89) asserted "no conversion tracking"
off a wire that had never carried a measurement** — a confident false absence
of exactly the class PART 3 forbids, live on the Breck's sheet Vin was reading
when he asked "are we 100% sure?" We were not. The two copy lines exist now,
AD WIRE fixtures run the label through the real merge both ways, and a second
defect fell in the same sweep: all six ad fields null-gated on the PLAIN
fetch's `confirmed && !blocked` while the merged `adsRead` was the real
did-we-look — so a bot-challenged site with a perfectly readable rendered
homepage lost every ad finding. Both prompt lines that told the model "make NO
claim" off the same stale gate were re-aimed at the merged read.

### A complaint we cannot fix is context, not a leak

Breck's "quality control issues — drainage, uneven surfaces... 3 different
people" ranked as money leak #2 because the `writtenContact` promotion counted
mentions and never asked what the complaint was ABOUT. `contactShapedTheme`
now classifies the dominant theme POSITIVELY against the three contact buckets
(nobody responds / quotes take too long / scheduling breaks down) — never by
the absence of quality words, and contact wins on a mixed theme. It reads
`reviewPainTop`, the SAME string the rung's say() prints, so the ranking basis
and the printed sentence cannot diverge. A workmanship-dominant theme now
moves the row to TAXED at rank 6 — past the client's top-3 floor of 5, with
zero client edits — and its money line becomes the reputation line instead of
"each one was one of those jobs", a loss claim its evidence does not support.
The `work_quality` bucket vocabulary was widened (drainage, uneven, cracked,
workmanship, quality control...) because Breck's own phrasing matched NO
bucket. The EMAIL side is untouched: review_pain_pattern has a real reply
behind it and the rung, the spine and rankHarms did not move.

### The funnel, walked in order, by code

`buildFunnelStory` reproduces Vin's walk on every lead: money out (with the
three-state answer to "does anything count what a click becomes" — counted /
could-not-see-inside-GTM / blind, scoped to the pages we read because Google
can count conversions without site code); who finds them (bands and two-miss
absence only); what a click lands on (booking, form size, price, financing);
after they reach out (contact complaints with their own arithmetic, and the
capacity read — "signs of a team at capacity" only when the complaint AND an
open ops role are both measured, present tense because an undated posting
buys no clock); what repeats (workmanship as context, by name); and fix first,
read from the SAME bottleneck variables the one-thing reads, never re-derived.
The Facebook-versus-Google join needs all five gates — including
`tagManager === false`, because a GTM container can hold a Google tag we
cannot see — and states its conditional out loud: a pixel proves wiring,
never spend, so "if those ads are live" is both honest and a question only
he can answer. A stage whose inputs were not measured is omitted, never
zeroed.

It is the story's SPINE on the sheet and the screen — the model's headline
and read stay as colour below it — and because a code block attached after
the model's JSON parsed bypasses all seven strippers, `FUNNEL STORY CHECK` is
its whole gate: every branch executed both ways, and **every sentence it can
emit scored by the same plain-English rules the ladder's sentences pass.**
That gate caught its own first wording at boot (a clause opening on
"conversion") — the §10 insight-line class, refused before it ever shipped.
The walk is walled out of the email path by the same source assertion that
walls the niche library.

### The goal, finally stated where the models read it

The audit brain's mission was "find the single most expensive problem." It is
now the funnel walk itself, with the three rules: channel intent (Facebook
names, never "channels" — the abstract wording is a retired negative
fixture), measured-both-halves before the mismatch may be said, fix-order
bottom-up, and workmanship-is-context. The five-area AUDIT TASK carries the
same reasoning per area. `buildSituationRead` gets the money goal, the walk
and both world-knowledge rules in HOW TO THINK. And the headline — whose
entire positive spec was six words, which is why Vin read "The ad budget is
chasing Facebook" as broken grammar — now runs `plainEnglishFaults` as a
HARD fault with a retry, plus a positive spec: a plain subject doing a plain
verb, no metaphor.

### "Is DataForSEO still not working" is now answered on the sheet

`rankSource` was computed at resolveMeasurements and consumed nowhere — the
recorded computed-but-not-passed class. It now travels into `_harmInputs` and
`buildAuditFacts.searchSource`; the facts strip says "search read on the
fallback — no position possible this run" whenever Places answered instead of
DataForSEO. The definitive log greps remain: `DFS AUTH PROBE` (no line at all
= credentials never reached the instance) and `LOCAL PACK [` ("DataForSEO
returned" vs "Falling back to Places").

### What the falsification runs found in the checks themselves

The rework money-line fixture passed on a broken build: it asserted the
lost-jobs phrase ABSENT, and the fixture passes no job value, so the rung's
no-value line lacked the phrase either way. Rewritten as a positive assertion
on the reputation line. And the funnel story's did-we-look revert stayed
green until a corrupted-input fixture existed, because the field contract
upstream already guarantees the clean case — defence in depth has to be
tested with dirty inputs.

**`index.html` changed, so this needs a Netlify deploy.** The story spine,
the ROI chips and the search-source note are dark until the file lands.

---

