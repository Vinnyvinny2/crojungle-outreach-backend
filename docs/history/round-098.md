# §98 — The score could not see what the read produced, and a product name was the buyer — 2026-08-31
Source: CLAUDE.md lines 8838-9040, moved verbatim 2026-09-02 from commit b01d952e4f95d7b69686bc2c4063ca2aa0cb7546 (branch backup/claude-md-monolith). Nothing below this line was edited.

## 98. The score could not see what the read produced, and a product name was the buyer — 2026-08-31

Vin ran the Find contact button again and sent the panel, a five-row CSV and the
whole Render log. Two asks and one question: *"this section is still messy and
unorganized it needs to look professional"*, *"analyze veyr metickousoly fix fom
root work hard and build sat the highest quality"*, and **"can we trsut the
ratiings on these as well?"**

Every finding below was reproduced by extracting the real functions and
**executing** them. And the first one is not a code defect at all.

### Zero: eight commits were sitting unmerged, so Render was serving §95

The live log printed a format string that does not exist in this tree. Netlify
had the new client. The branch was pushed and **`main` stopped at PR #88** — so
§96 and §97 had never reached the server, and the app was running a new client
against an old one. Vin: *"yes nothing pushed to github thats y."* He was right
about the consequence and I had answered the wrong question, having checked only
that the PUSH succeeded. §37's own rule: **a push to the branch is not a deploy.**

### The ratings could not be trusted. Three reasons, each executed.

- **The score was frozen before the lead was known.** `out.icp =
  findIcpScore(signals)` ran ~370 lines ABOVE the owner lookup and the address
  lookup. So a lead where we found a named buyer and an SMTP-confirmed personal
  address scored **identically** to one where we found neither — the two things
  that decide whether a rep can work the row, structurally invisible to the
  number he sorts by.
- **The denominator moves and the bare number sorts.** The score is a percentage
  of what could be MEASURED, so a lead scored on three signals and one scored on
  seven are divided by different totals. `why` said so; nothing read it.
- **It measured marketing maturity, not fit.** Five terms: size 35, ads 25,
  hiring 20, demand 12, rating 8. Four reward organisational maturity and only
  `rating` is fit-shaped. From the live rows: **Castellano 45** (a real owner, an
  SMTP-verified personal address, textbook ICP) against **DHI Roofing 75** (no
  owner, no address, location pages in six states). The business that already
  has what we sell won, because that is what four of the five terms measure.

**The fix reuses the derivation that already existed.** §94 built
`affordabilityBand` as *"one derivation, three consumers — the Find score, the
card's tier label, and the contact list's own ranking"*. `contactRankFor` reads
it. **`findIcpScore` never had**, which is how three surfaces came to hold three
verdicts about one business.

The scoring moved below the lookups (`signals` stays exactly where it is — the
chain read depends on its position and is deliberately ahead of the paid wave),
and two terms were added beside Vin's three rather than taken from them:
**`afford`** from `affordabilityBand`, and **`reach`** from what the read
actually produced — a decision-maker who cleared the buying floor, and an
address read from its TIER, never from prose that happens to contain the word
"verified". Both leave the denominator when unmeasured, and a lead dropped as a
chain never reached the lookups, so `reachMeasured` is false there rather than
scoring a confident 1. The card and the sort now carry the denominator: it
prints on the face of the number, and it breaks a tie, so a thin read cannot
outrank a full one.

**No `independent` term.** §97 settled that: with chains dropped outright it
could only score on the ABSENCE of chain evidence, which this file forbids.

### A product name was the decision-maker, and it settled the lookup

Floor Daddy shipped **"Vinyl Plank", "Affiliate Partner"** as the buyer. Three
independent causes, all executed:

- **`looksLikeRealName("Vinyl Plank")` is true.** Both name checks are purely
  shape-based; the only defence is a closed list, and *vinyl, plank, laminate,
  carpet, hardwood, tile* are in none of it. Adding flooring words is the list
  that rots.
- **`titleKind("Affiliate Partner")` returned `owner`.** `OWNER_TITLE_RE`
  matches the bare trailing word, so `after` is empty and `ownershipIsHead`
  returns true before anything asks what "Affiliate" modifies. Executed across
  the family: **Channel, Referral, Delivery, Technology and Installation Partner
  all read as owner**, identically to Managing, Founding and Senior Partner.
- **And it SETTLED stage 1.** `rosterConfident` requires `ranked.authority >=
  DM_AUTHORITY_FLOOR`, and `authorityScore('partner')` is **85** against a floor
  of 75 — while the same log line printed **`score 45 | low`**. The gate
  consulted a number the operator never sees and ignored the one he does, so a
  single uncorroborated roster row stood down every paid source.

Three fixes: the affiliation modifiers are **DECLARED** (grammar cannot separate
"Affiliate Partner" from "Managing Partner" and never will, so the modifiers are
written down where a reviewer sees them, the way the deputy list beside them
already is), the label stays a TITLE so it cannot become a person on the next
pass, and `dmConfidenceFor` is one derivation the gate and the log both read.
The list is deliberately NARROW: a small law or accounting firm is squarely in
this ICP, and **Tax, Audit and Advisory Partner are real equity partners who can
buy.** Both directions fixtured, all nineteen strings.

**Deliberately NOT done: refusing a roster row read off a whole page.** The
plan called for it, and reading the code says it would delete real leads — a
homepage that says "John Smith, Owner" is good evidence, and most small
businesses in this ICP put their team there. The composite-confidence bar is
the mechanism; the page-intent rule would have been the guard-too-tight failure.

### The company's own name was six people's job title

Auto Insurance Specialist's footer produced **Office Location, All Rights
Reserved, Agency Office** and **Great Rates**, each with the company's own name
as their title. Reproduced exactly by executing the real `parseTeamRoster`.

One word does it: `titleKind`'s junior test contains `specialist`, and the
business is CALLED "Auto Insurance Specialist" — so its own name tested as a real
staff title, and a truthy kind is all the lookahead needs. `personFromRun` has
refused a NAME made only of the company's own words since it was written;
nothing ever asked the same question of the TITLE. A guard in the right function
on the wrong half of a pair.

They are **not one predicate**, because they are not one question: a name of only
company words is refused outright, while a title may legitimately carry the
company name after a real job word. "Owner, Auto Insurance Specialist" is a
roster line and survives; the shared part is the normaliser and the word set.

### The chain read could not see a locations index

`chainLocationPath` required `/locations/<state>/<city>`. DHI Roofing publishes
`/locations/missouri`, `/locations/kansas`, `/locations/minnesota`,
`/locations/iowa`, `/locations/nebraska`, `/locations/wisconsin` — **one segment
each, and executed against their real sitemap every one returned nothing.**

And it would not have mattered: `links` is built only from the homepage's own
navigation. The 165 URLs `findOwnerViaBrain` maps are a local that **never
leaves the function**, so the sitemap has never once been in scope for the chain
read. Instance twenty-eight of computed-but-not-passed.

Both halves fixed. The one-segment form is accepted at a bar of **three distinct
states** — one state page is ordinary and a two-branch independent inside one
state cannot reach it, while a per-CITY page under a state stays at one, because
that shape is a branch network by construction. And the mapped list is kept
(same key, same TTL and same cap as the leadership-length memo beside it, for
the same reason: two businesses with one name run concurrently by design) and
handed to a **second** chain look. The first look stays where it is and stays
cheap — it caught Truly Nolen on the first page we read, before a credit could
move; the second runs after the owner wave and still saves the address lookup.

### The panel: four bands, not twenty-two blocks

It rendered a heading, five paragraphs of prose, three stat tiles, about fifteen
controls and four boxes in **one flat vertical stack with the prose interleaved
between the controls**, so there was no way to tell what a press would do from
what had already happened.

Four bands in the order the questions get asked — **what this is / what the next
press covers (Scope) / what to press (Read, Export) / what came back (Result)**
— using the file's own `.btn-p`, `.btn-g` and `.btn-sm` instead of recolouring
inline. Prose became captions under the control it describes. **Every control
survives**: this is the button that spends real credits and §39's rule holds,
and `clientcheck` now names each spending and destroying control individually so
a layout change can never quietly delete one.

Three counts went with it:

- **"68 of these 68 reads"** — the stale banner printed the stale count twice.
  True by accident on a queue where every read is stale, false the moment one is
  re-read. My own bug, from §97.
- **The tally read the whole filtered queue while every stat above it read
  `_scoped`**, so with "This run" selected the header and the tally described
  different sets of leads on one panel.
- **The primary button's pool is named rather than forced.** It draws from the
  whole queue and the stats describe what is on screen; those are genuinely two
  populations, so each says which it is instead of one being bent to fit.

### What the falsification runs found in the checks themselves

Four failures on the FIRST boot after the fixes, every one mine:

- **`dmConfidenceFor(null)` returned 'low'.** `Number(null)` is 0 and
  `Number.isFinite(0)` is true — the null-laundering trap, inside the function
  written this round to close a different one, caught by its own fixture.
- **The self-matching needle, twice.** My assertion that exactly one place
  computes the contact score was written as a regex literal, so it sat in
  `_src`, **found itself**, and failed a correct build. And the needle guarding
  the roster settle was written with an EMPTY second half, which joins to one
  contiguous literal in the check's own body — it passed on a build with the
  guard removed, and only the falsification run found it. Nineteenth and
  twentieth recorded instances in this file.
- Two blocks used `_src` and `_n` above the lines that declare them.

And three reverts did not prove what they named on the first pass:

- **`rosterConfidence` (the empty-half needle above).**
- **A check that does not assert its call site is half a check.** The
  dropped-lead fixture hands `reachMeasured` in as false, so it proves the TERM
  reads the flag and nothing about the line that WRITES it — reverting that
  write to a bare `true` left every fixture green.
- **A revert with two anchors is NO VERDICT, not a pass.** The tally was
  computed twice, once per branch of a ternary, so the anchor matched twice and
  the harness said so rather than reporting a colour. One call now, with the
  branch choosing only the words in front of it.

And one fixture asserted a number I had assumed rather than measured: the
no-website lead scores on **three** signals, not four — with no industry there
is no trade tier and no capacity class, so the affordability band correctly
declines to speak. Corrected to the measured value, with the reason written at
the assertion.

**273 boot checks green**, every gate green, and every fix reverted ALONE
against a baseline the harness proves green before it starts.

**`index.html` changed, so this needs a Netlify deploy**, and the contract is
**20260920** on both sides.

---

