# §38 — The screen, on launch night — 2026-08-21
Source: CLAUDE.md lines 2466-2534, moved verbatim 2026-09-02 from commit b01d952e4f95d7b69686bc2c4063ca2aa0cb7546 (branch backup/claude-md-monolith). Nothing below this line was edited.

## 38. The screen, on launch night — 2026-08-21

Three complaints from Vin, one functional and two about noise.

**The market filter did not exist before a run.** "theres nothing on the
frontend that allows me to apply the filter for when i find leads for location
based." He was right, and the picker had been built: §32 replaced the single
city dropdown with multi-select chips. It rendered inside a COLLAPSED panel that
only exists when `discovered.length > 0` — below the results list, five hundred
lines down the page. So before the first run there was no control at all, and
after a run you had to know to expand a toggle to find the thing that scopes the
NEXT run.

A control that decides what a run BUYS belongs beside the button that spends the
money. `scopeBar` is one definition on the same `pullFilters` state, rendered
above both the empty state and the list. The two controls were REMOVED from the
collapsed panel rather than copied — one home each — and the panel's helper text
no longer claims to narrow the next pull, because it does not any more.

**Colour had stopped meaning anything.** A Research card could stack seven
filled panels at once: rate limited, reachability, domain match, owner email
match, out of credits, ICP blocked, tone chips. Generate ran a red "Hot Lead"
bar for a GOOD score, a green-or-amber block for which prompt path wrote the
email, and a full-bleed green/amber/red panel around the prospect simulator —
whose own footer says it is "one reading, not a rule".

One rule now: **colour marks a stop, nothing else.** Green is gone entirely,
because a coloured box confirming the ordinary case appears on nearly every lead
and is exactly what drowns the two panels that mean *do not audit this*. The
survivors keep a hairline and lose their fill: `domainMatch === 'no'` (we may be
auditing the wrong business), an owner address belonging to a different person,
and the send-blocker verdict that PART 4 §19 added to stop a fabricated audit
reaching Send.

**What was NOT done, on purpose.** `BucketCard` is defined in ResearchView and
rendered nowhere. Removing it means locating its true closing brace, and the
first attempt cut the wrong one and orphaned the body — caught by the parser in
seconds, but it is precisely the edit that breaks a screen the night before it
is needed. It stays, with a note.

Verified as styling-only rather than asserted: the React element inventory
before and after is identical except for four new `div`s, which are the scope
bar. No `select`, `button` or `option` count changed, so nothing was removed
from the screen — only moved and repainted.

**And the queue is not the pipeline.** Vin: "it only lets me do 3 it says 3
readys" — with 195 companies in the Find queue and 4 leads in the pipeline.
Find fills a QUEUE; the batch audits the PIPELINE; and the only thing that
moved a company between them was `addAndResearch`, one at a time. A fifty-lead
batch meant fifty individual clicks before any research could start, which
would have been discovered at nine tomorrow morning.

The sixty-line lead literal is now `leadFromCompany` at module scope, called by
both the single-add path and a new `addManyToPipeline`. Extracted rather than
copied, and verified by lifting it out and executing it: **all 68 fields the
original inline literal produced are present**, the Find-time payload
(`placeId`, review count, rating, `buyingLane`, `jobPostedAt`, markets) survives,
and two calls get distinct ids. The requirement list is read from the
PRE-EXTRACTION file, because a check whose requirement comes from the code under
test cannot fail — the first version scraped it from the new source, matched
nothing, and reported "all 0 fields present" as a pass.

The bulk bar acts on `filtered`, so the scope bar decides what moves, and its
count is of companies genuinely not in the pipeline yet. Its first draft called
`setToast`, which is declared in the App component and not in FindView — a
ReferenceError on the first click, caught before it shipped.

---

