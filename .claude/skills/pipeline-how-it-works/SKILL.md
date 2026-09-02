---
name: pipeline-how-it-works
description: "KNOW: How the outreach pipeline works end to end - Find, Research, Audit, Generate, Send - the stack (Render, Netlify, Supabase, Hunter, Google Places, Firecrawl, Apify, DataForSEO, Anthropic) and where each stage lives in server.js and index.html: routes, key functions, declared tables, with line numbers in map.md. Use when asked how the system works, where a stage or measurement happens, or which function or table to open."
---
# Pipeline — how it works, and where each stage lives

**Goal:** After reading this, Claude can name the stage, the function and the file for any behaviour someone describes.

Copied from CLAUDE.md (commit b01d952) lines 93 to 161 (PART 2), with the stale counts corrected in place on 2026-09-02 — every correction and its original line is listed at the end. `map.md` beside this file carries the line map; line numbers drift, `grep -n` is the truth.

## Stack

- `server.js` — ~79,300 lines, Node/Express, Render, auto-deploys from GitHub
  (`Vinnyvinny2/crojungle-outreach-backend`)
- `index.html` — ~17,400 lines, compiled React on Netlify. **`React.createElement`
  only, no JSX, no build step**. It IS in this repo (tracked since 2026-08-18) and
  still deploys separately, by hand, into Netlify.
- Supabase for persistence
- Hunter for sending — sequence 859908, `vinny@crojungleteam.com`, 25/day,
  Mon–Thu 8am–1pm ET
- APIs: Google Places (discovery), Firecrawl (site scraping), Apify (review
  mining), DataForSEO (real search rankings), Anthropic (Haiku for the audit and
  the mechanical calls, Sonnet for the story synthesis), Hunter, MyEmailVerifier

## The pipeline

**FIND** — Google Places across 53 trade categories and 23 metros. Filters before
spending anything:
- No rating floor any more (a low rating is pain, §94); a rating above 4.85 is
  demoted rather than deleted (see PART 5 — the ceiling is the filter with evidence)
- Franchises and businesses too large are dropped
- No website at all → kept, marked `leadChannel: 'call'`
- Free page builder (`business.site`, `wixsite.com`) → marked `rebuild`
- Multi-market operators get a coverage count; absence is only claimed within 120
  miles of a market they already appear in

**RESEARCH** — resolves the real owner (corroborated across site, business name,
licence records, web search), scrapes their pages, mines up to 90 Google reviews
for repeating complaints, measures local rank twice for stability, reads their
Google profile.

**AUDIT** — the "brain" reads 24,000 characters of their own pages plus every
measurement and writes the narrative. Produces `originalFindings` (quotes from
their actual copy) and a `situationRead`.

**GENERATE** — the harm ladder ranks ~52 measured findings, `buildFactualSpine`
assembles one verified sentence, and the writer turns it into an email. A prospect
simulator then reads it as the owner and returns reply / ignore / delete.

**SEND** — Hunter sequence, verify-at-send, 4 touches over 17 days.

## Key components in server.js

- `fetchT` (~line 1,100) — every outbound call in the system goes through it. See
  the note in PART 6 about why a defect here reads as "that API is flaky"
- `HARM_LADDER` (~line 15,500) — 52 rungs, each with `test`, `say`, `costs`, and
  scores for harm / specific / novel / delegable / weFix / sellable
- `resolveMeasurements` — everything the ladder reads
- `rankHarms` — ordering, with adjustments for purchase urgency, referral
  acquisition, Hormozi binding layer, and commercial weight
- `buildFactualSpine` — the one verified sentence
- `buildEmailEvidence` — splits what the writer may **ASSERT** from what is
  **CONTEXT**. This split is the safety: more information without it is more room
  to invent
- `INTERNAL_ONLY_RUNGS` — the seven review-METRIC rungs. Measured, scored,
  ranked, in the audit and on the call sheet; never in an email. Reviews are how
  we read the business, not what we say to the owner
- `plainEnglishFaults` / `readingGrade` — the readability gate over the ladder's
  own sentences. The five sentences retired for being unreadable are kept in
  `READABLE FINDING CHECK` as negative fixtures, so the wording cannot come back
- `verifyBrainEmail` — 26 fabrication families, the last gate before sending
- about 160 named boot checks at the bottom (the verdict counts ~270 printed lines), each documenting the live failure that caused it

## Key components in index.html

- `leadToRow` / `rowToLead` (~line 420 / ~830) — the ONLY door between Supabase and
  the app. Supabase is the source of truth; localStorage is a convenience cache
  that is deliberately not allowed to take the truth down with it. Every field
  the app needs after a reload must survive `rowToLead`, and this function has
  now produced nine separate duplicate-key collisions, each one silently blanking
  data that had just been loaded correctly

## Corrections made 2026-09-02, measured from the code

The text above was copied from CLAUDE.md and these lines were stale; each was corrected in place and the original is kept here so the split proof still finds it.

> - `server.js` — ~29,800 lines, Node/Express, Render, auto-deploys from GitHub

now: - `server.js` — ~79,300 lines, Node/Express, Render, auto-deploys from GitHub — measured: `wc -l server.js` = 79,292 at Round 106

> - `index.html` — ~10,200 lines, compiled React on Netlify. **`React.createElement`
>   only, no JSX, no build step**. It deploys separately and is NOT in this repo —
>   see the note at the end of PART 6.

now: - `index.html` — ~17,400 lines, compiled React on Netlify. **`React.createElement`   only, no JSX, no build step**. It IS in this repo (tracked since 2026-08-18) and   still deploys separately, by hand, into Netlify. — measured: `wc -l index.html` = 17,413; the file is tracked in git

>   mining), Anthropic Haiku (audit + email), Hunter, MyEmailVerifier

now:   mining), DataForSEO (real search rankings), Anthropic (Haiku for the audit and   the mechanical calls, Sonnet for the story synthesis), Hunter, MyEmailVerifier — measured: `BRAIN_MODEL` defaults to claude-haiku-4-5, `SITUATION_MODEL` to claude-sonnet-5; DataForSEO added §52

> **FIND** — Google Places across ~40 trade categories and 20 metros. Filters before

now: **FIND** — Google Places across 55 trade categories and 23 metros. Filters before — measured: `GP_CITIES` has 23 entries; `GP_CATEGORIES` has 53 entries at Round 106; `GP_CITIES` has 23

> - Rating band 4.2–4.85 (see PART 5 — the one filter with evidence)

now: - No rating floor any more (a low rating is pain, §94); a rating above 4.85 is   demoted rather than deleted (see PART 5 — the ceiling is the filter with evidence) — measured: no floor constant exists; the 4.85 ceiling is asserted in the ICP FILTER CHECK

> licence records, web search), scrapes their pages, mines up to 150 Google reviews

now: licence records, web search), scrapes their pages, mines up to 90 Google reviews — measured: `APIFY_MAX_REVIEWS` defaults to 90 (§54)

> **GENERATE** — the harm ladder ranks 39 measured findings, `buildFactualSpine`

now: **GENERATE** — the harm ladder ranks ~52 measured findings, `buildFactualSpine` — measured: `RUNG_PILLAR` declares 52 rungs

> - `fetchT` (~line 131) — every outbound call in the system goes through it. See

now: - `fetchT` (~line 1,100) — every outbound call in the system goes through it. See — measured: declared at line 1,111

> - `HARM_LADDER` (~line 9300) — 41 rungs, each with `test`, `say`, `costs`, and

now: - `HARM_LADDER` (~line 15,500) — 52 rungs, each with `test`, `say`, `costs`, and — measured: declared at line 15,482; 52 rungs in `RUNG_PILLAR`

> - 227 boot checks at the bottom, each documenting the live failure that caused it

now: - about 160 named boot checks at the bottom (the verdict counts ~270 printed lines), each documenting the live failure that caused it — measured: 162 distinct `✓ NAME CHECK` strings in server.js

> - `leadToRow` / `rowToLead` (~line 200–560) — the ONLY door between Supabase and

now: - `leadToRow` / `rowToLead` (~line 420 / ~830) — the ONLY door between Supabase and — measured: declared at lines 420 and 831 of index.html

