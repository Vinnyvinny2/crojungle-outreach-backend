# Round 142 — the website verdict is read off their code as well as their picture, and can finally separate leads

**Shipped 2026-09-11. Server only. `index.html` untouched, contract stays `20261017` — Round 141's
Netlify drag is still outstanding and this round does not add to it.**

## Why: Round 141 shipped a toggle that could not fire

The toggle Vin asked for went live and, on his own ten-lead run of 2026-09-11, graded **nine of nine
read leads `modern`**. A switch whose job is to hide good websites hid nothing. Two causes, both
mine, both found by reading the run rather than the code:

1. **`agingDesign` was worth 1 point and the `dated` band started at 2.** The eyes said *"the design
   is starting to show its age"* on four leads and the verdict said `modern` on all four. The only
   way to reach `dated` was a fault the model almost never returned alone.
2. **`desktopOnly` was 2 of the 11 available points and could not be answered.** It asked whether a
   page is laid out for a desktop screen — from a **desktop screenshot**. It fired on 0 of 10.

**Correction on the record, because Vin decided against it.** Round 141 was reported as verified: the
render ran, the verdict travelled, the toggle filtered, 14 reverts went red. All of that was true and
none of it asked the question that mattered — *can this scale separate two businesses?* I replaced one
useless bucket (seven of ten "fair") with another (nine of nine "modern") and reported it as working.

## Vin's ruling, 2026-09-11

> *"ok well are we reading the code of the website the code tells us a lot as well and it shouldnt
> cost anything more. 'Starting to show its age' counts as dated"*

Two instructions: **use the markup we already read for free**, and **aging is dated**.

## What changed

**The bands moved to match the ruling.** `dated` now starts at **1** and `bad` at **6**, so a design
the eyes call aging is `dated` by itself, as ruled.

**The free markup read became a second pair of eyes.** `readSiteLooks` now takes the faults the
plain-fetch read already found and scores the ones **a visitor can see** beside what the picture
showed. Nothing new is bought: these faults were measured, printed and thrown away.

```
WHICH CODE FAULTS COUNT      SITE_LOOKS_VISIBLE_GROUPS = ['build', 'converts']

build      datedBuild   5    a visitor meets an out-of-date page
           diyBuilder   3    a visitor meets an off-the-shelf build
converts   noForm       4    a visitor cannot contact them from the page
           noClickToCall 3   a visitor on a phone cannot tap the number

geo / seo  noSchema, noindex, jsOnly, blocksAi, weakTitle, thinAlt
           real, feed the audit, and INVISIBLE to everybody who is not a crawler
```

**The filter lives inside the function, not at the call site.** This round's own new check caught
this: handed a `geo` fault, the first cut of the verdict counted it, because the function trusted
whoever called it to have filtered first. One missing schema tag would have made a website "look bad
to a visitor" — the exact defect Round 141 was asked to remove. The group list is declared once and
`readSiteLooks` filters what it is handed, so the call site cannot get it wrong by forgetting.

**`desktopOnly` left the list.** `readSiteAge` already marks a missing viewport meta as a visible age
marker, read free from markup, and that feeds `datedBuild` — the phone question is answered from
their code instead of asked of a picture that cannot answer it.

**A lead whose picture never came back is now judged on its markup.** `unknown` still exists and still
means what Vin ruled — kept and marked, never hidden — but it now means **both reads came back
empty**, not just the expensive one.

## The drop, found by the full suite on its first run

Once the free read became a second pair of eyes, a lead **dropped as a franchise, a branch or a
chain** started coming back graded `bad` off its own markup. `servercheck`'s drop-discipline
assertion caught it: *"a dropped lead carries a visual verdict nobody bought a picture for."*

The drop now refuses the **verdict** exactly as it refuses the spend. Every other refusal on that
branch is about money and not about the business — the per-lead cap, the switch in Settings, a
missing key, a site that returned nothing — and those all still keep the free read.

## One check re-aimed, on the record

`servercheck`'s Round 141a assertion read *no picture ⇒ `unknown`, measured false*. That was right
while the picture was the only thing that could see a website; this round gave the verdict a second
pair of eyes that costs nothing, so it was **re-aimed, not deleted**: a lead whose picture failed and
whose markup read fine is now asserted to come back **judged**, with a reason naming both halves, and
**carrying no fault the markup read did not find** — a verdict off nothing is the failure that
replaces it.

The invariant it existed to hold — *never-looked must never read as looks-fine* — is unchanged and
proven in three places: the dropped lead on that same live route comes back `unknown`; the boot
asserts both-reads-blind is `unknown`; and `142-e` reddens on it.

## Proven, on Vin's own run data

Executed on the seven leads of 2026-09-11 that were read, their real eye verdicts and their real free
faults:

```
lead                  eyes      free code faults          score  WAS       NOW
Brick and Stone       aging     datedBuild + diyBuilder     9    modern -> bad
Tranquility Place     aging     diyBuilder + noForm         8    modern -> bad
Journey Treatment     current   datedBuild                  5    modern -> dated
Durant Foundation     aging     none                        1    modern -> dated
Minnesota Roof        current   none                        0    modern -> modern
Bloom Reproductive    current   none                        0    modern -> modern
Discovery Village     current   none                        0    modern -> modern
```

**Four of seven flagged instead of none**, and the three that stay `modern` are the three where
neither the picture nor the markup found anything — the toggle separates leads now.

```
node docs/gen-refs.js                 ✓
node build.js --check                 ✓ 88,732 lines, CRLF, byte for byte
GATES=static bash ci-gates.sh         ✓
node servercheck.js                   ✓ exit 0 — 226 assertions over the fake network
boot                                  ✓ GREEN — 304 checks, 1 expected decline, 0 failures
node falsify.js round-142-reverts.js  ✓ 7 of 7 RED on their own named line, tree restored byte for byte
bash ci-gates.sh (all stages)         ✓ ALL GREEN — fuzz: 2,107 emails, every invariant held
```

**No check was deleted or disabled.** One was re-aimed, with the reversal recorded beside the ruling
it reverses.

## Needs your eyes

- **Nothing new to drag.** `index.html` untouched; contract stays `20261017`. **Round 141's drag is
  still outstanding** — the toggle stays dark on the screen until it happens, and this round is what
  makes it worth pressing.
- **Read three of the new verdicts against the actual sites** — Brick and Stone and Tranquility
  Place should now read `bad`, Journey Treatment `dated`. The reason sentence is on the row (hover)
  and in the full CSV. Whether the verdict matches what you see is the accuracy question and it
  cannot be answered here.
- **Watch how many come back `dated` rather than `bad`.** The bands moved on a ruling, not on a
  measurement: `dated` at 1 point is deliberately generous, and if the toggle now keeps almost
  everything the band is the dial to turn, not the faults.
- **`unknown` should get rarer**, because it now takes both reads failing. If it does not, the
  markup read is failing more often than the render is, which is a different bug.
- Carried: Round 141's `FC_SCREENSHOT_CREDITS` settlement (1 vs 5) still needs the Firecrawl
  dashboard on the next run; `hunterFindPersonEmail failed: timeout` is still logged as "their index
  has no address"; `findSizeViaSearch` still crashes twice a run, swallowed; **Round 139's press-side
  rules have still never run**, because they need a Find press rather than a contact read.
