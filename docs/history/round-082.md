# §82 — Wave 1 and Wave 2: the seven false statements and the lead-killers — 2026-08-27
Source: CLAUDE.md lines 10655-10836, moved verbatim 2026-09-02 from commit b01d952e4f95d7b69686bc2c4063ca2aa0cb7546 (branch backup/claude-md-monolith). Nothing below this line was edited.

## 82. Wave 1 and Wave 2: the seven false statements and the lead-killers — 2026-08-27

Vin, after the master plan: *"build wave 1 and 2 at the highest quality ever...
fix at the root dont breka anything."* Wave 1 is the seven sentences a caller
would read aloud and be wrong about. Wave 2 is the mechanisms behind one lead in
three dying or auditing near-blind. Every fix below was falsified by reverting it
ALONE against a green baseline — 44 reverts, each red on its own named
assertion — and four of those came back STILL GREEN first, which is the whole
reason for running them.

### Wave 1 — what a caller would read aloud

- **"of the 150 reviews we read" on a run that read 90.** §44 licensed a
  COMPETITOR's measured count so "#1 competitor's 101 reviews" would stop being
  eaten, and that licence was applied to every number in the sentence including
  the DENOMINATOR of "of the N reviews we read" — a claim about the size of OUR
  OWN SAMPLE, which can only ever be the count we read. A window company in the
  ranked pack carried ~150. The profile total was licensed there too, which on a
  90-of-215 lead is a claim about 125 reviews nobody opened. Both gone; the
  numerator keeps every permission it had.
- **Three ages for one company.** Grant Renne: the log measured 14 years, the
  story said 1873, the headline said "143 years behind it". 1873 to 2026 is 153.
  Every other figure family has a gate and a computed YEAR SPAN had none — the
  email's fact-checker carries an INVENTED TENURE flag, and flagging is not
  removing. `stripUnverifiedYears` runs on the audit AND the synthesis: a
  founding year or a tenure span survives only if it matches the measurement, is
  derivable from it, or appears in THEIR OWN COPY. An unmeasured lead with an
  empty corpus strips nothing, and "a 10-year warranty" is not a tenure claim.
  Its own first draft laundered `Number(null)` into year ZERO and cut every true
  age sentence — the recorded trap, caught by executing it.
- **A search nobody types.** `/window-doors` became the query "window door in
  Glen Allen, VA" and shipped as LEAK 1 with a five-figure job value under it;
  `/windows-services` became "windows service in Sheridan, CO". Two mechanisms:
  nothing asked whether a slug is a phrase a person would type, and
  `naturalTrade` — a trade-LABEL singulariser — rewrote the owner's own slug on
  the way to the query. `searchablePhraseFromSlug` refuses three provable
  artifacts (a trailing generic word, a geography slug, every word a product
  line with no verb) and a slug-derived phrase now travels VERBATIM. Executed
  over 106 realistic slugs: one disclosed false refusal ("roof windows"), and
  four that the first version got wrong were found by running it rather than
  reading it. Every refusal is LOGGED by slug and reason, and nothing had ever
  printed the phrases we buy.
- **A market with no state.** "kitchen remodeling contractor in Ashland" — no
  ", VA" — produced a CONFIRMED absence. Ashland exists in about twenty states.
  The comment forty lines above the assembly says "THE STATE IS NOT OPTIONAL"
  and then made it optional the moment the slug did not carry one. It is
  inherited from the lead's own state now, and when neither is available the
  query is not bought at all. The extractor was lifted out of an IIFE to module
  scope so the check EXECUTES it.
- **Two different people named as the owner.** "Chris Brever, Co-Owner" in the
  contact block and "run under Joe Brever's name" in the story. THREE holes, all
  the same idea: `namesConflict` treated one shared word as agreement (a family
  business shares a surname by definition); the ownership stripper's
  corroboration test let any shared token license a claim about a different
  first name; and both ran seven hundred lines BEFORE `situationRead` exists, so
  the one guard against two owners on one sheet could not see the block the
  operator reads. One containment predicate, one ownership vocabulary (the two
  hand-kept patterns both missed "run under X's name"), and the check moved
  whole to where the story exists.
- **The sheet and the log disagreed on every rank number.** Hand-checking those
  digits against Google is the entire trust process. `scanned` is a property of
  ONE DRAW's result list, and the log prints a line per draw while one row
  survives — so the operator was comparing the other draw's window. Two fixes:
  a single `SHEET RANK` line printed from the exact object the sheet renders,
  and the confirmed-absence row now publishes `Math.min` of the two windows,
  because "checked twice" is only proven for the smaller one.
- **"Your newest Google review is 105 days old — your review record is fresh and
  strong."** The model did not invent that. `measureHistory`'s credit branch
  fires on a LIFETIME RATE and never looks at recency, and it hands the model
  "a steady, working machine" with *"credit this"* attached, while the 105-day
  number arrives from a different function in the same prompt. Two hand-kept
  branches of one rule inside one function. The bar is now the business's OWN
  gap — at 15 reviews a year one arrives every 24 days, so 105 days is four of
  them — and the credit says both true things: the record is strong and the flow
  has stopped. `stripStaleFreshClaims` is the mechanical backstop over model
  prose, on both batteries, and strips nothing on an unmeasured lead.

### Wave 2 — the lead-killers

- **A map timeout deleted a website.** Grant Renne was audited on ONE page while
  fifteen internal links harvested from his own markup sat in memory, free. The
  rescue that reads them lived INSIDE the try, on the map-answered-empty branch,
  and the timeout catch could not reach it — its own comment claimed "the
  harvested-links path below already covers the gap" and that path is ABOVE it.
  FIVE exits returned an empty list without ever looking. One `_mapFallback`
  that every failure path returns through, a cache entry marked as a FAILURE
  rather than as a measured zero, and the free `cachedSiteMap` reader obeying
  the same rule. A host we have never read still yields nothing rather than a
  guess.
- **A real practice killed by the wrong-company guard.** "Dr. Levi Young -
  Advanced Cosmetic Surgery" against advancedcosmeticsurgerykc.com, in its own
  market, discarded on a model's "no (high)" after the whole research cycle was
  paid for. The PRIMARY cause is that the model is shown 3,000 characters — on a
  practice that is nav, hero and services, so the practitioner the prompt's own
  escape hatch looks for is below the cut and the hatch could never fire. It is
  the whole page now. The backstop is code-checked: a model NO is downgraded to
  UNCLEAR (never to yes) when the domain SPELLS the lead's own name — three
  words, twelve letters, so "ramjack" does not clear it — AND the page names our
  market or prints the listing's own phone number. Ram Jack Durham is still
  discarded, and the honest limit is stated: a two-word business keeps the old
  behaviour, because widening to two re-admits the franchisor.
- **Pictures of another business, and a message naming the wrong cause.** The
  wrong-company discard nulled ONE of the three renders, so the full-page
  capture and the phone capture — both photographs of a DIFFERENT company's
  homepage — reached pageShots, the model's image evidence and the audit screen
  under this owner's name. The in-flight phone render is no longer collected
  either. And "Their website returned nothing. We fetched it twice" printed for
  a site that returned 52 internal links: the reason a corpus is empty now
  travels, and the sheet says which of the two it is.
- **The browser cap sat at 10 on a plan that allows 25.** The cap took the most
  restrictive endpoint of ALL, and every number in the tier table is a SCRAPE
  per-minute figure — so feeding it any other endpoint reads the plan off the
  wrong meter, and on one account `/v1/map` answers 500 while `/v1/scrape`
  answers 5000. The cap is derived from `/v1/scrape` alone: `batch` is excluded
  even though its pages render, because the batch STATUS POLL writes that same
  key and a polling endpoint must never decide how many browsers we hold. Until
  a scrape has answered, the cap does not move at all. `map` joins the slotless
  set — five map calls a lead were each holding a slot the renders queued
  behind — and its standing is stated honestly: no formats requested, one credit
  however large the site, a 20s timeout against a render's 45-90s. Good
  evidence, not proof, and the 429 gate-wide hold is the backstop if it is
  wrong. The existing boot check asserted the cap was sized from the SEARCH
  limit — the defect written down as an invariant — and that assertion is
  flipped.
- **Doomed retries into a host that had already stopped answering.** Three paid
  scrapes timed out on one lead after that host had already timed out once, and
  Firecrawl bills the submit. A per-lead host stand-down after two timeouts, on
  `FC_LEDGER` so it dies with the lead — a process-wide latch is the §43
  deadlock where no probe can ever run — read in the CALLER's own frame, because
  §51 records that the ambient store at the gate's dispatch belongs to whichever
  lead's continuation freed the slot.
- **A lead with no place ID lost eleven measurements and the log named three.**
  The recovery itself already exists and works; what was missing was an honest
  account of the cost, including the trade word every search query is built
  from — which is why the same run also logged "rank check skipped: no
  industry" and nobody connected the two lines.

### What the falsification runs found in the checks themselves

Four reverts came back STILL GREEN, and each was a fixture that could not see
what it named:

- **One needle covering two call sites.** Reverting the service-page search left
  it green, because the CONFIRMING search still carried the same text. Two
  needles now, one per site.
- **A fixture that licensed its evidence twice.** The year fixture handed the
  founding year in as a MEASUREMENT as well as putting it in the corpus, so
  deleting the corpus licence changed nothing. The fixture that guards it is now
  a year on their own site with nothing measured.
- **Two over-widenings invisible behind a length bar.** The Ram Jack fixture is
  refused on twelve letters, so neither the market half nor the three-word floor
  was ever exercised — both were reverted green. Each now has a case only IT can
  refuse: a national brand whose domain DOES spell its name, and a two-word name
  long enough to clear the bar.
- **And a needle written with an EMPTY half**, which joins to one contiguous
  literal sitting in the check's own source and matches itself. Written by me,
  caught before falsifying. Fourteenth recorded instance.

Three more checks went RED on a CORRECT build and were re-aimed rather than
worked around: two closed needles that pinned the END of an argument list (both
grew a parameter this round), and a probe that set a pace for an endpoint a
later assertion asserts was never given one — a check that leaves state behind
fails its neighbour and the neighbour gets the blame.

**253 boot checks green**, every gate green: tdz, dupkeys on both files,
scopecheck on both files, fetchtest, pngscale, clientcheck, batchcheck,
auditfuzz over 5,000 vectors, fuzzcore over 20,000 cases, servercheck's 31
assertions over a fake network, and 2,048 emails composed over HTTP.

**HONEST SHAPE, stated rather than implied.** None of this has run against a
live lead — the last live run is the one these defects were read out of. The
C6 mechanism was NOT reproducible from source: the log and the sheet agree on
every branch when both are measured, so the fix makes them one fact by
construction rather than by diagnosis. And W4 is the smallest item here: the
place-ID recovery already existed, and only the log's account of the cost was
wrong.

**`index.html` changed (the honest empty-corpus message), so this needs a
Netlify deploy**, and the contract is 20260904 on both sides.

---

