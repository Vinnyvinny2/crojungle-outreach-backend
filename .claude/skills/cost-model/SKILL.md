---
name: cost-model
description: "L1 STRATEGY: What a lead, an audit, a Find press and a contact read cost, from MEASURED meter lines (ANTHROPIC TOTAL, FIRECRAWL SPEND, GOOGLE PLACES, FIND CONTACT, OWNER WAVE), which single model call dominates the bill, and the DO-NOT-CUT list of measurements that must never be traded for savings. Use when asked what something costs, how to lower the bill, whether a cut is safe, or which meter line to read."
---
# Cost model — what a lead costs, measured

**Goal:** After reading this, Claude can give a per-lead cost from a meter line, and refuse any cut on the DO-NOT-CUT list.

New text (2026-09-02), distilled from the rounds cited; every figure below was measured on a live lead in the round named. Numbers drift with every change, so **before repeating one, run one lead and read the meter lines listed here.**

## The rule

Three separate sessions proposed cuts to a bill nobody had measured, and each carried at least one wrong number (docs/history/round-081.md). The meter is the authority; this file only says where the meter is and what it said last time.

## The meter lines to read

- `💰 ANTHROPIC TOTAL` — every model call on the lead, named, sorted by cost (round-054 made all 24 call sites name themselves; a call added later fails the boot until it is named).
- `FIRECRAWL SPEND` and `GET /api/spend` → `byKind` — renders have their own bucket, so `byKind.screenshot` is how `FC_SCREENSHOT_CREDITS` is settled against the dashboard (round-081).
- `GOOGLE PLACES` — every billed Places call named (`find-discovery`, `place-id-recovery`, `place-details`, the two fallbacks); a mystery search shows up here by name (round-084).
- `📇 FIND CONTACT` — per-lead credits and dollars on the contact route; `💸 OWNER WAVE` says whether the paid owner search was bought and what it produced (round-100, round-104).
- A day ceiling refuses at admission and names the setting that raises it (see `knobs-and-env`).

## The audit path, per lead (last measured)

- **Anthropic:** about $0.19 on a first lead, about $0.12 steady state once the cached prompt prefix is warm. **One call is ~59% of it:** `situation-read`, on Sonnet with thinking effort `SITUATION_EFFORT`, ~$0.15 of a $0.27 lead (round-081, round-083). It also runs TWICE on some leads because seven fault conditions re-run the whole synthesis; the rate is unmeasured — grep `↺ SITUATION READ` across a batch (round-081).
- **Firecrawl:** about 16 credits on the audit path (round-046). Honest shape: a RANGE, not a number, until renders are priced against the invoice — set `FC_SCREENSHOT_CREDITS=5` if the balance drop is ~3x the meter (round-081).
- **Google Places:** one Place Details call per lead once DataForSEO is credentialed; both text searches on the research path are DataForSEO FALLBACKS (round-081).
- **DataForSEO:** about $9 per 1,000 leads for the pack and organic reads; the Labs traffic/keyword pair is opt-in (`DFS_LABS=on`, ~$25 per 1,000) because no rung, email or gate can consume it (round-053, round-081).
- **Apify:** 90 reviews a lead, billed per review, so `APIFY_MAX_REVIEWS` IS the Apify line — and it must move together with `REVIEW_CORPUS_CHARS`, or reviews are bought that the model never reads (round-054).
- **Per 1,000 audited leads:** ~$334 after the DataForSEO move (round-053), ~$253–275 after round-057's cuts. Both are arithmetic over measured calls, not an invoice.

## The Find and contact path, per press (round-100, measured)

- **A Find press:** 60 Places queries = **$2.10**; four presses a month sit inside Google's free 1,000-call allowance, so Find is effectively free per month.
- **A contact read:** **6.33 Firecrawl credits and $0.0076 of model**, averaged over nine leads. At 50 a day, 22 days a month, that is ~6,970 credits — the Standard Firecrawl plan, and **Firecrawl is ~75% of the contact bill.**
- **Newest live measurement (round-106, twenty leads):** owner settled on the free read on 5 of 10 Places leads and 4 of 10 other-lane leads; the paid wave was bought on the rest (35 and 46 credits); **3.5 credits per Places lead, 4.6 per other-lane lead** — well under the 6.33 of the nine-lead run above, because the R102–R104 roster fixes had landed (docs/history/round-106.md).
- **The one number that moves it is the free-settle rate:** the share of leads whose owner is found on their own pages without the ~10-credit paid search wave. At 22% the month is ~6,970 credits; at 60% it is ~3,520 (the $16 plan). Owner-parser fixes are therefore cost fixes (round-099, round-100). The Firecrawl free tier is 1,000 credits ONE TIME, about 150 contact reads, ever.

## DO NOT CUT — round-081's quality map, kept so no cost round re-derives it

The second rank sample · DataForSEO credentials · the finder's depth-100 window · `APIFY_MAX_REVIEWS` below 90 · the review-pain mine · the rendered homepage · the vision call · interior pages below two · the sitemap map · the Place Details call that supplies the authoritative review count · the service-page absence second look · `PAGESPEED_KEY` · `REVIEW_CORPUS_CHARS`.

Each of these feeds a finding that has a real reply behind it or gates an absence claim. Cutting one saves cents and reinstates a bug already recorded in the round that added it.

## SAFE to reduce (same map)

`SITUATION_EFFORT` (it writes prose, sets no measured flag, gates no absence claim, produces no figure) · the decision-maker web search · the three service-page rank searches · the Labs pair (already opt-in).

## Known and deliberately not done

- `FC_BATCH` has been OFF since 2026-08-13 and is the largest Firecrawl lever (~3.5 credits a lead). It was switched off for a rate-limit failure that predates the per-endpoint pacing fix; worth ONE measured re-test on one lead, never a blind flip (round-081).
- The homepage is fetched twice in the same instant (corpus text + full-page render): 1 credit a lead, 5 if renders bill at 5 — waits on the render price (round-081).
- The audit cache saves only the audit call; the vision read, the story and the fact-check are re-bought on identical evidence. Real, and it needs the cross-lead isolation rules of round-019 thought through first (round-083).
