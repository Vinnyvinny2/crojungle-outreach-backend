---
name: owner-decisions
description: "L1 STRATEGY: The register of every strategic decision the owner (Vin) makes for CROJungle outreach, each with its current value, the date it was last ruled, where the machine enforces it, and what changing it triggers: who we sell to (revenue band, employee gate, the move toward $3M+), price tiers, which trades and metros are searched, the review floors and rating ceiling, the daily budgets, what is bought per lead, the priority order, the sending policy, and what is deliberately not built. Use when a strategic question comes up, when a lever is about to change, or when asked what the current policy is."
argument-hint: "[lever]"
---
# Owner decisions — the register

**Goal:** After reading this, Claude can state the current value of any strategic lever, who ruled it and when, and name the note and the place in the code that must change together when Vin changes his mind.

This is the top of the structure. **Vin makes the decisions in this table; nothing below Level 1 makes them.** Every row names where the decision is enforced, so a change is a two-step act: rule it here (new value, new date), then let the machine follow through the note named in the row, under the Level 3 rules. A value in this table that disagrees with the code is a bug in one of them; the Level 4 job `diagnose-log` treats it as such. Values were measured from the code on 2026-09-02 (line numbers in `pipeline-how-it-works/map.md` and `new-niche-playbook/tables.md`, both regenerated on every push).

## The levers

| Lever | Current value | Ruled | Enforced in | Changing it means |
|---|---|---|---|---|
| **Who we sell to (ICP)** | Founder-led home-services and trades, owner-operated practices; **$800k–$15M revenue**, one person who can say yes. Direction: **moving toward $3M+** | Vin, 2026-09-02 | `business-and-icp`; the affordability band in `server.js` reasons from ~$2.4M (retainer-comfortable) and $5M+ (top tier) | rule the new band here → `new-niche-playbook` §F lists the constants; a `server.js` edit under `editing-server-js` |
| **Size gate** | 10–200 employees pass; 200–500 flagged; 500+ blocked; a verified headcount overrules any name pattern | code, [§14](../../../docs/history/round-014.md) | `server.js` (the ICP employee gate, ~line 4352 and the Find size verdict) | `server.js` edit |
| **What we sell, at what price** | Premium: rebuild $50k+ (floor $35k), retainer **$10k–$35k/mo**, AI brain $40k–$70k, custom software $40k–$100k+, exit advisory. Lower tier never advertised (site from $5k, page $1,600–2,000, retainer from $3,250/mo). Mike takes nothing below premium | Vin, 2026-09-02 | `business-and-icp`; `OUR_PRICE_FIGURES` and `PRODUCT_PRICE_LINE` in `server.js`; the price prose in the audit prompt and in `index.html` (lines listed in `new-niche-playbook/tables.md`) | rule it here → those four places move together (a figure not in `OUR_PRICE_FIGURES` is refused by `AUDIT MONEY CHECK`) |
| **Trades searched** | **53 categories**: 30 tier A, 26 tier B, 1 tier C (C is never searched). Vin knows the niches; a deeper correctness pass is owed | Vin, 2026-09-02 | `GP_CATEGORIES`, `CATEGORY_TIER` and the declared tables in `new-niche-playbook` | `new-niche-playbook` §A, one trade at a time; the boot refuses a half-declared trade |
| **Metros searched** | **23** (Sun Belt plus four cold-weather metros for the winter trades) | code, [§94](../../../docs/history/round-094.md) | `GP_CITIES` + `GP_CITY_COORDS` (move together) | `new-niche-playbook` §B |
| **Review floor** | Base **15** reviews (`GP_MIN_REVIEWS`); **40** for high-volume low-ticket trades; **5** for low-volume high-ticket trades | code, [§94](../../../docs/history/round-094.md) | `reviewFloorFor`, `HIGH_VOLUME_LOW_TICKET`, `LOW_VOLUME_HIGH_TICKET` | env var for the base; the two sets for a trade |
| **Rating band** | **No floor** (a low rating is pain to mine); **ceiling 4.85**, applied as a demotion, never a deletion | code, [§94](../../../docs/history/round-094.md) | `PAIN_BAND_HIGH` in the Find filter | `server.js` edit; the old 4.2 floor is recorded as retired in `evidence-and-priorities` |
| **Review ceiling** | **750** reviews demotes (too big to be founder-led) | code, [§17](../../../docs/history/round-017.md) | `GP_MAX_REVIEWS` | env var |
| **Daily budgets** | Firecrawl **1,500** credits · Places **600** calls · Anthropic **$20** · Apify **150** review pulls; **90** reviews per lead; **300** leads per Find press; queue **1,000** | code defaults | `knobs-and-env` (Render env vars) | set the env var on Render; a ceiling refuses at admission and names itself |
| **What is bought per lead on a contact read** | Free page read first; Firecrawl only on refusal; **paid owner wave ON by default** (Settings switch, ~8–10 credits, skipped without a city); lanes beyond Google Places **OFF by default**; DataForSEO Labs **off** | code, [§95](../../../docs/history/round-095.md) | `find-and-contact-list`; Settings; `DFS_LABS` | the Settings switch for the wave; env var for Labs; `cost-model` before any cut (DO-NOT-CUT list) |
| **Stage in use** | **Find + the contact list for the sales rep.** Research, audit and email are built and not yet run by him | Vin, 2026-09-02 | `find-and-contact-list` | — |
| **Priority order** | The contact list and logged call outcomes first; then, once the rep is set up: top up Apify and Firecrawl → second mailbox and verify every address → 40 emails to ONE niche → read the real replies → only then the business layer | Vin, 2026-09-02 | `evidence-and-priorities` | rule it here; `evidence-and-priorities` carries the reasoning |
| **Sending policy** | Hunter sequence chosen in Settings; from `crojungleteam.com`, **never** CROJungle.com; 25 a day, Mon–Thu 8am–1pm ET; verify at send | Vin, 2026-09-02 | `business-and-icp`; Settings; `SENDING DOMAIN CHECK` (SPF/DMARC) | Settings for the sequence; DNS on a new domain; `deploy-and-accounts` |
| **The email's one job** | Earn a reply. Not sell, not book, not diagnose. Mike diagnoses on the call | standing (CLAUDE.md, PART 3) | every gate in the Generate stage | not a lever — the rule under which every other lever is set |

## Deliberately not built, and why (so nobody re-decides it by accident)

- **Splitting `server.js` into modules** — blocked by the self-source boot checks (`what-not-to-do`).
- **One data file per niche** — the right end state for the trade tables; a later round because it touches `server.js`.
- **Per-stage notes for research, audit, email, send** — written when those stages are run for real; paraphrasing 11,000 lines of history early is where errors come from.
- **Tuning the email prompt** — not until real replies exist (`what-not-to-do`).
- **Replacing the code with a Claude agent driven by skills** — ruled out by Vin, 2026-09-02 (Mike had asked whether "JavaScript is still needed"). A skill is a note Claude reads, not a thing that runs: the code runs a Find press unattended, enforces the budgets, and serves the rep's screen, and a contact read costs about $0.0076 of model time in code against $0.10–0.30 when a chat drives it by hand — roughly $8 versus $100–300 a month at 1,100 reads. The top rule, "instructional guards do not hold", is why the 274 mechanical boot checks exist; skills are instructions, not enforcement. What Mike is right about: nobody writes the JavaScript by hand any more — Claude does, under the Level 3 rules. Revisit only if volume falls under ~50 leads a month.

## How to change a decision

1. Say the new value. It is written into this table with today's date and your name.
2. The row's "enforced in" column names the note and the place in the code; the change is made there under the Level 3 rules and proven by the Level 4 jobs (`gates`, `falsify`).
3. The round is closed with `ship-round`, which files the note and lists what needs your hands (Render env var, Settings, Netlify drag-in).
