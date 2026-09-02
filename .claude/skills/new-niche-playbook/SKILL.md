---
name: new-niche-playbook
description: "DO: Add a new trade, category or metro to the app in the right order, or plan a full company swap: every declared table in server.js that must gain a row (GP_CATEGORIES, CATEGORY_TIER, TRADE_CAPACITY_CLASS, TRADE_JOB_VALUE, urgency and referral sets, review floors, LSA eligibility, recurring and financing lists, NICHE_BRIEF_EXPECT and the brief library, GP_CITIES + GP_CITY_COORDS), the boot check that refuses each gap, the three gaps nothing refuses, the questionnaire for Mike, and the DECLARED / SOURCED wall for a niche brief. Use when asked to target a new niche, add a trade or city, write a niche brief, or reuse the machine for another company."
argument-hint: [trade or metro]
---
# New niche playbook — add a trade, a metro, or swap the company

**Goal:** After reading this, Claude can add a new trade or market to the app in the right order, naming every declared table that must gain a row, the business facts Mike must supply for each, and the boot check that confirms it is done — and say what a full company swap would add.

New text (2026-09-02), from a line-by-line survey of the declared tables in `server.js` at commit b01d952 (`tables.md` beside this note has every one with its line and its check). **Filling these tables is a `server.js` edit and every rule in `editing-server-js` applies** (CRLF, needles, the gates). The honest end state is one data file per niche so this playbook becomes a form; that extraction touches the server and is a later round. Today the tables are inside the file, and the boot is the form: it refuses to start until each declared table has its row, and says which.

## A. Add a trade (one Google category)

Work in this order; after step 1 the boot goes RED and names steps 2-5 by table until they are done ([§50](../../../docs/history/round-050.md), [§94](../../../docs/history/round-094.md)).

1. **`GP_CATEGORIES`** — the Places search query and its label. The query is what Places is asked; the label is what every other table keys on. Pick a query that returns owner-operated businesses, not handymen or one-man LLCs ([§94](../../../docs/history/round-094.md)).
2. **`CATEGORY_TIER`** — A, B or C: does the retainer maths work for this trade at all; C is never searched (`TRADE TABLE COVERAGE CHECK`).
3. **`TRADE_CAPACITY_CLASS`** — solo / mixed / crewed: can the work be done alone. An unknown trade returns null, never crewed, so a one-man band is never promoted to a premium call ([§94](../../../docs/history/round-094.md)). `SOLO_TRADE_RE` is the text fallback.
4. **`TRADE_JOB_VALUE`** — "a job in this trade runs about $X-$Y", public knowledge, never "your job". It is the ONLY figure a money sentence may carry, licensed by `AUDIT MONEY CHECK` ([§36](../../../docs/history/round-036.md), [§94](../../../docs/history/round-094.md)). If no honest single value exists (contingency law), declare it in `TRADE_MONEY_EXEMPT` instead — the check fails in both directions, so an exemption that excuses nothing is also refused.
5. **Purchase urgency** — add the label to `EMERGENCY_TRADES` (bought under duress) or `CONSIDERED_TRADES` (weeks of research), or declare it in `TRADE_URGENCY_MIXED` if it genuinely has neither (roofing, home care). `URGENCY_ADJUST` is worth ±26 points in the ladder — the largest business-type rule ([§94](../../../docs/history/round-094.md)).
6. **`NICHE_BRIEF_EXPECT`** — which brief this category receives, or `null`. Undeclared categories inherit whichever brief's stems happen to match, which is how flooring stores got the roofers' brief ([§50](../../../docs/history/round-050.md)). Add a live trade string to `NICHE_BRIEF_LIVE_CASES` too.

**The three gaps nothing refuses** (verified: no boot check covers them per category) — do them anyway, and say you did:
7. **Review floor** — `HIGH_VOLUME_LOW_TICKET` (many cheap reviews: raise the floor) or `LOW_VOLUME_HIGH_TICKET` (a $6M builder has nine reviews: floor 5). Unlisted trades keep the base floor, which deletes the richest leads in a high-ticket trade ([§94](../../../docs/history/round-094.md), [§96](../../../docs/history/round-096.md)).
8. **`LSA_ELIGIBLE` / `LSA_TRADE_ALIASES`** — can this trade run Google Local Services Ads; if yes the sponsored block is read for it ([§74](../../../docs/history/round-074.md)).
9. **Also consider:** `RECURRING_NORMAL_TRADES` (is a maintenance plan standard, anchored stems only — a bare `tree` matches "Palm Tree Motel", [§74](../../../docs/history/round-074.md)), `BIG_TICKET_TRADE_RE` (is missing financing a gap), `REFERRAL_TRADES` (does work arrive by relationship, not search), `TRADE_WORDS` / `TRADE_MODIFIERS` / `TRADE_SYNONYM_GROUPS` (so the rank search and the marketplace guard understand the trade, [§30](../../../docs/history/round-030.md), [§77](../../../docs/history/round-077.md)). Any new STEM must be declared in `STEM_COMPLETE_WORDS` or `STEM MATCH CHECK` refuses ([§15](../../../docs/history/round-015.md)).

## B. Add a metro

`GP_CITIES` and `GP_CITY_COORDS` move TOGETHER (`COVERAGE RADIUS CHECK` reads `Object.keys(GP_CITY_COORDS)` as the searched set). A metro is chosen by population per search dollar, and cold-weather metros exist so basement, insulation and frozen-pipe trades have ground ([§94](../../../docs/history/round-094.md)). The Find picker reads the list from `/api/find-options`, never a copy ([§32](../../../docs/history/round-032.md)).

## C. Write a niche brief (optional, and the part Mike owns)

A brief in `NICHE_BRIEFS` is split by SHAPE and the boot enforces the wall ([§36](../../../docs/history/round-036.md)): **DECLARED** (unit of business, who buys, vocabulary, which software to ask about, where margin leaks, the questions worth asking — **no digit anywhere**) and **SOURCED** (figures, each with source and date, **no "you / your / they / their"**), so a segment fact can never become a claim about the company in front of us. Neither half reaches an email. A brief must not match a business MODEL it was not written for (store, supplier, franchise — the shared `BRIEF_MODEL_DISQUALIFIERS`, [§50](../../../docs/history/round-050.md)); a retailer with no brief is the designed answer. Budget 2-4 hours per brief; never estimate a number that could be sourced.

## D. The questionnaire for Mike (one trade)

1. What is one job worth, low to high, for a typical customer? (→ `TRADE_JOB_VALUE`)
2. Can one person do this work alone, or does it take a crew? (→ capacity class)
3. When somebody needs this, do they call the first name that answers, or research for weeks? (→ urgency)
4. Does work mostly come from referrals rather than search? (→ `REFERRAL_TRADES`)
5. Is a maintenance plan or membership normal in this trade? (→ recurring)
6. Does a job routinely cost more than people pay at once? (→ financing)
7. What does a customer actually type into Google, and what do they call the trade in their own words? (→ query, modifiers, synonyms)
8. What is the unit of business, who buys, what software do they run, and what is the one question that opens a conversation? (→ the brief's DECLARED half)
9. Any industry figure you would quote — and its source and year? (→ SOURCED, or leave empty)

## E. After the tables: prove it

`bash ci-gates.sh` green (the coverage checks are the proof the rows exist), one real Find press on the new category, then read `DEPTH YIELD`, `📉 FIND YIELD`, `ICP` blocks and the review-floor deletions in the log. Add the trade string to the live-case fixtures so the next person cannot silently un-declare it. Then `ship-round`.

## F. What a FULL company swap would add (later)

Everything above, plus the identity that is currently prose and constants: the `business-and-icp` note (products, prices, ICP); the product catalogue and its licensed figures (`OUR_PRICE_FIGURES`, `PRODUCT_PRICE_LINE`, `PRODUCT_FAMILY`, `OUR_PRODUCT_WORDS`, and the price prose inside the audit system prompt `BRAIN_STATIC`); the client's own product block and pillar map in `index.html` (`PILLAR_PRODUCT`, `LAYER_PLAIN`, the BRAIN prompt); the affordability constants (`$800k` / `$15M` / 200 employees, at ~15 sites); the ~66 hard-coded "CROJungle" strings across both files; the sending identity (the `crojungleteam.com` user agent, the Hunter sequence chosen in Settings, the never-cold-email-from-CROJungle.com warning) and the DNS check on the new sending domain; and `KEY_SOURCES`. `tables.md` lists the lines. That swap is the argument for extracting all of this into one niche/company data file — which is the later round.
