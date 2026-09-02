# §110 — Size for the rep, layers pick the target — 2026-09-02
Written 2026-09-02 for docs/history (one file per round; CLAUDE.md carries no history). Not a moved section: verify-split.sh skips it.

## 110. Size for the rep, layers pick the target — 2026-09-02

Vin, from the rep: *"he needs to be able to understand how established a
business is so the pitch can be adjusted properly, low / medium / high ...
for the high established ones we need to not target CEO because they're
almost impossible for reachability ... target people high up in marketing,
CMO, marketing manager."* Then, when the first draft measured size: *"high
established businesses' reachability is tough because there's receptionists,
the owner's out of office, CEO, there's a million layers ... we need to drop
down a level but we need to make sure we grade them right. A well
established business doing $5M doesn't have to be corporate, it could be an
owner who just got really lucky and is doing very well. In that case there
is no CMO or C-suite, just a guy named Darrel. Those are fantastic leads
because reachability is high and they're high ticket and we can get the
owner."* And: *"the rep just needs to know high established, medium and
low."* Interviewed through the question widget; every ruling below is his.

### What was found

- The score had no notion of layers. `TITLE_AUTHORITY` scores CMO 65, VP or
  Head of 50, Director 35, Manager 20, so every marketing title sat below
  the 75 floor by design (PART 3: "the owner is the buyer"). Worse,
  `titleKind` returned null for "Marketing Director" and a bare "CMO", so
  those roster rows were dropped before authority was ever consulted.
- The buying floor had three hand-kept literal copies (`>= 75` in the
  settle rule, the ranker and the cached-contact path) beside the declared
  `DM_AUTHORITY_FLOOR`.
- The contact request never sent the multi-market count discovery already
  measures, nor the Hunter key.
- Research (2026-09-02): vendor cold-email benchmarks put director-level
  reply rates three to four times C-suite (Belkins, Instantly, Warmer);
  at $10M+ the marketing plan and budget sit with the marketing head
  negotiated with the CEO (Planful); at PE platforms marketing tech and lead
  routing are centralised at corporate (WolfPack, Catalyst for the Trades);
  franchisees market inside the franchisor's fund and vendor approvals (MSA
  Worldwide, Amplified Digital); family-owned multi-location HVAC and
  roofing firms do post Marketing Director roles (Indeed, Glassdoor, Built
  In). Revenue per employee sits in one band across our trades, roughly
  $150k–$300k, and $250k–$400k per truck (MarginPlug, Tradesly, Service
  Autopilot, LeanLaw, Covetrus), so the size cuts already in
  `estimateScaleBand` are on the money. Hunter's domain search takes
  `department=marketing&seniority=executive,senior` at one credit per
  address returned (hunter.io API reference). Apollo's people search has
  the best filters but no API on the free tier — deferred.

### Vin's rulings

- Size is what the rep sees: low / medium / high plus a confidence word
  (sure / likely / guess / unknown). No "why" column. Ruler: headcount,
  fleet, locations, markets; sophistication nudges one step; *"age and
  reputation can be done with any guy who's been around in trades forever"*
  — never alone.
- Layers pick the target: the owner when within reach, at any size; the
  marketing decision-maker at director level or up when layered. *"If they
  can't sign then what's the point"* — Marketing Manager and Coordinator
  are never shown.
- Both found on a layered lead → the marketing head is the target, the
  owner stays on the row for the second call. Their email is found and
  checked when they are the target.
- HIGH stays in the list, ranked below MEDIUM; the "too big" marks are
  lifted only when the reachable marketing head was actually found.
- The filter loosens only where a reachable buyer exists: franchises,
  PE-owned, national brands, nonprofits stay blocked; an independent may
  trade in up to three states.
- The Owner grade, Email grade and Safe-to-send columns leave the export.
- The PART 3 line is written in his words.

### What changed

- **`sizeBand(signals)`** over the declared `SIZE_TERMS` (verified employees
  60/10, published staff 60/10, fleet 40/10, locations 6/2, metros 3/2):
  the strongest fact decides, *sure* when two facts agree, *likely*
  otherwise; two of (department heads, commercial work, financing) nudge
  low to medium; reviews alone give a *guess*; nothing gives `null` /
  *unknown*, shown as "not measured".
- **`readLayers(signals)`**: *owner* when the owner is named on his pages,
  answers his reviews, has a founder phrase or a personal mailbox — and
  fewer than two corporate titles; *layered* on two or more corporate
  titles, a marketing or HR function on the roster or careers page, or
  nobody named as owner at a medium/high size; *unmeasured* when nothing
  was read.
- **`pickMarketingLead`** from the roster through `MARKETING_BUYER_RE`
  (CMO, chief growth/revenue officer, VP / vice president marketing, head
  of marketing, director of marketing, marketing director), through the
  name door; **`findMarketingLeadViaHunter`** with Hunter's marketing
  filter, only on a layered lead whose pages named nobody, zero Firecrawl.
  `titleKind` pairs `JOB_MARKETING_OWNER` titles as staff instead of
  dropping the row.
- **`targetFor`**: marketing when layered and one is named; owner when the
  owner is within reach or when layered with nobody else; none otherwise.
  The marketing head's address goes through `findEmailFireproof` (one
  verifier check, no Firecrawl). The `reach` term reads the target. New
  per-lead line `🎯 TARGET`; `📇 FIND CONTACT` carries size and target.
- **Demotions**: `aboveSize` and `aboveScale` lifted when
  `marketingLeadFound`; new `sizeHigh` −6 through `CONTACT_RANK_TERMS`.
  `CHAIN_STATE_ONLY_MIN` 3 → 4. The three literal 75s read
  `DM_AUTHORITY_FLOOR`.
- **index.html**: the request sends `marketCount` and `hunterKey`; the
  merge carries size, confidence, layers, target, the marketing lead and
  their email; `FIND_CSV_COLUMNS` loses `ownerGrade`, `emailGrade`,
  `emailSafeToSend` and gains `size`, `sizeConfidence`, `target`,
  `marketingLead`, `marketingLeadTitle`, `marketingLeadEmail`; the lean set
  is icp, company, size, target, owner, ownerTitle, marketingLead,
  marketingLeadTitle, email, marketingLeadEmail, phone, bestTime,
  payingForAds, hiringMarketing, exported; `sizeCell` / `targetCell` are
  pure and lifted by clientcheck. The card keeps the grade chip.
- **CLAUDE.md PART 3** gains the dated sentence in Vin's words;
  `owner-decisions` gains the lever; `find-and-contact-list` the paragraph.
- **`SIZE AND LAYERS CHECK`** executes all of it both ways, including the
  Darrel test, and pins the call sites and the single floor with a needle
  assembled at runtime (the first draft's literal regex found itself).

Deliberately NOT done: a LinkedIn-scoped Firecrawl search for the
marketing head (Vin: *"no point wasting credits"* — Hunter first, and the
next run's `🎯 TARGET` lines will say how often the roster and Hunter
miss); Apollo (paid API tier); loosening the discovery employee gate
(it already passes up to 500; the loosening lives in the demotions, where
the marketing head is known).

### What the falsification runs found in the checks themselves

Nine server reverts and one client revert, each alone against the green
baseline, each RED on the check named for it, restored byte for byte:

| revert | red on |
|---|---|
| reviews alone read as "sure" | SIZE AND LAYERS CHECK |
| layers ignore corporate titles | SIZE AND LAYERS CHECK (two titles beside a named owner) |
| managers picked as the buyer | SIZE AND LAYERS CHECK |
| a marketing head beats a reachable owner | SIZE AND LAYERS CHECK (the Darrel test) |
| roster drops marketing titles again | SIZE AND LAYERS CHECK |
| "too big" marks never lifted | SIZE AND LAYERS CHECK |
| high size ranks like medium | SIZE AND LAYERS CHECK |
| a literal 75 back in the settle rule | SIZE AND LAYERS CHECK (runtime-assembled needle) |
| Hunter asked without its marketing filter | SIZE AND LAYERS CHECK |
| the owner grade back in the lean set | clientcheck.js |

What the checks caught in the round's own work: the first "no literal 75"
needle was a literal regex and found itself (`check-writing-traps`, the
self-matching needle); two size-confidence fixtures asserted "likely" on
facts that agreed; the marketing lead's email lookup read a `siteConfirmed`
declared in another block (SCOPE CHECK); the cached-contact needle still
expected the literal it was written against; and five clientcheck
assertions read the grade and safe-to-send cells the export no longer has
— they now read the card grade, the address cell's own "do not send"
marker, and the target cell's provenance. With Safe-to-send gone, the
address cell itself carries "(do not send - unconfirmed)" so a rep reading
one column cannot mail a guess.

**275 boot checks green.** `bash ci-gates.sh` all stages. **The contract is 20260927
on both sides.**

**`index.html` changed, so this NEEDS the Netlify drag-in.** Until it is
dragged in, the server answers with size and target and the old page ignores
them; the stale-client banner says so. Render env: nothing required. The
Hunter key in Settings is what turns the marketing-head lookup on.
