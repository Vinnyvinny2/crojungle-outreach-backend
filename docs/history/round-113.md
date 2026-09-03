# §113 — The 35-lead run: the redeploy that cut it in half, the guesses that were the rule, and a product company is an email lead — 2026-09-03
Written 2026-09-03 for docs/history (one file per round; CLAUDE.md carries no history). Not a moved section: verify-split.sh skips it.

## 113. The 35-lead run: the redeploy that cut it in half, the guesses that were the rule, and a product company is an email lead — 2026-09-03

Vin ran 35 contact reads on the Round 112 build (contract 20260929 both
sides, Netlify dragged in) and got 9 on the Call list, 6 in the Email
lane, 0 No name yet, 1 Too small, "This run (15): 11 read of 15", a red
"The server is not answering (Failed to fetch)" banner, and a sheet where
7 of 9 rows said *guess*. He moved the 6 in the email lane to Research and
could not see them there. *"Why so many guesses, that is uncalled for … 35
leads and I only have 9 call list and 6 emails … analyze everything very
detailedly, be meticulous."* Every finding below was reproduced by
executing the real function on the run's own strings, or read line by line
off the pasted log.

### What happened to the 35 (the arithmetic was right; the run was cut in half)

| | count |
|---|---|
| asked for | 35 |
| started on the server | 18 |
| finished with an outcome | 12 — 11 kept, Blue Water Plastic Surgery dropped as "a division of Blue Water Spa" (correct, 7 credits) |
| killed mid-read by a redeploy | 6 — Everhart Tree, Larsen Masonry, GID Renovation, Ofilio Tree, Mission Solar, ClearChoice, all with paid searches in flight (~40 credits gone) |
| never started | 17 — the page's three-strike dead-server rule stopped the run after three "Failed to fetch" |
| the panel's "This run (15)" | 11 kept + 1 refused + 3 failures recorded (the other three in-flight failures arrived after the stop and are not recorded, by design) |
| Call list 9 | Diyanni, DMI, Emrick, Bapst, Affordable Foundation, Gervelis, GoSun, Scorpion, Bath |
| Email lane 6 | the five core/upper owner-run rows above (both lanes) + Bradford (layered: CFO, VP, Director of Operations → email only) |
| Too small 1 | RiteRug, $45M per Prospeo → over the ceiling |

**The cut was mine.** Render deploy `dep-dacnvbfqj5pc73b1ttmg` started
14:09:49 UTC and went live 14:11:53 UTC for commit 8abaad1 — PR #106, a
DOCS-ONLY change (the OpenCorporates wording). Render redeploys on every
merge to `main`, docs or not; the old instance was replaced with six reads
in flight and the browser stopped the run exactly as the 2026-08-28 rule
says it should. The 17 unread leads stayed Not-read and the next press
picks them up. Vin's ruling: **the merge rule only** — ask before every
merge and never merge while a batch runs (`ship-round`, the handover
checklist); no Render build filter.

### The defects, each reproduced

1. **Seven of nine "guess" — the Round 112 directory rule was too strict.**
   `sizeBand` on the run's inputs: Bath Remodeling (BBB says 12 employees,
   55 reviews) → *guess*; the same with 160 reviews → *likely*; Diyanni
   and Gervelis (ZoomInfo "11-50" → 31) → *guess*; DMI and GoSun (Growjo
   revenue + headcount agreeing) → *likely*; RiteRug ($45M alone) → *guess*
   (right). The rule let the review count vote, and the review count could
   only agree with *medium* at 150+ reviews, so it disagreed with almost
   every $1.2M–$10M shop; and an exact BBB headcount (the business's own
   filing) was treated like a RocketReach estimate. The other four guesses
   were lookups that found nothing, and two of them never bought the second
   query (2).
2. **The second size query was skipped when the first query's snippets
   merely contained "$" or "employees".** Emrick Services and Affordable
   Foundation Repair got a snippet about somebody else with a price in it;
   the parse returned nothing and the LinkedIn/BBB query was never bought.
3. **The market fallback for the city reached the size lookup only.** The
   contact route handed the owner ladder `company.location` alone while the
   size lookup got `company.location || company.market` — a Round 112
   half-fix. "No city could be parsed" on Affordable Foundation (Jacksonville
   FL was on the size search of the same lead), Larsen, Everhart and Ofilio:
   the licence search skipped, the first owner query dropped, and Larsen's
   LinkedIn query bought without a city, found nothing, and wrote a 14-day
   negative memo keyed on the domain alone.
4. **"Larsen Family (Owner)" passed the name door.**
   `ownerNameDoor('Larsen Family', 'Larsen Masonry')` → null (passes); the
   regex backstop read "Larsen Family / Owner & Master Mason" off their
   page and ranked it at authority 100. The lead died in the redeploy before
   it reached a sheet; on a re-read it would have.
5. **Two chain shapes walked past the tells and spent first.**
   `chainLocationPath` on the run's URLs: ClearChoice's
   `/locations/oh/west-chester/…` → '' (the slug set held full state names,
   not abbreviations); RiteRug's `/pages/locations/greenville-sc…` → ''.
   RiteRug is a Places listing named "RiteRug Flooring & Carpet -
   Greenville" whose "home" page is a per-location page — the multi-outlet
   shape — and it cost 12 credits before the $45M figure benched it.
6. **GoSun and Mission Solar came out of a solar category.** GoSun sells
   solar ovens online ($2.3M, 18 staff per Growjo, founder named on their
   own pages with his own mailbox SMTP-confirmed) and the layers ruler put
   it in call + email; Mission Solar is a panel manufacturer, killed mid-read
   before its size was measured. Vin: *"keep them in but these are likely
   email leads right? the reachability is a concern, same with size — but
   verify this claim."* Verified: by the rules of the day GoSun WAS a call
   lead, because the ruler cannot see that the phone on a product company
   is a customer-service line and not the founder's desk.
7. **"Move the 6 to Research" — the code path is sound, the move leaves no
   trace.** `addManyToPipeline` → `leadFromCompany` (status `new`) →
   `saveLeads` → the `cj-leads-changed` event → the Research sidebar files
   them under **"Not audited yet"**, the third section, sorted by ICP score
   among every not-audited lead already there, dimmed, chip "not audited".
   Nothing says they just arrived, and Find drops them the moment they
   move. Vin's ruling: the "from Find, today" marker waits for PR 2; until
   then the sidebar's search box finds them.
8. Hands, not code: the Apify token was rejected (HTTP 403) on every lead
   (no reviews mined); the email verifier ran dry again (Gervelis, GoSun,
   Scorpion, Mission Solar unconfirmed); DataForSEO at $0.26;
   `OPENCORPORATES_KEY` unset (paid).

Not defects: Bradford email-only (layered), RiteRug benched, Blue Water
dropped, Diyanni "no title found" beside the eponymous lift (honest — the
business is named after him and the log says he can sign).

### What changed (server.js only; no contract bump, no Netlify drag-in)

- **The confidence rule (Vin: "yes, that rule").** In `sizeBand`, a
  directory HEADCOUNT — exact (BBB, the Companies API) or a range that sits
  inside one tier ("11-50" is core end to end for a $200k/head trade) — is
  *likely* alone; a range that straddles tiers ("1-10") is a *guess*; a
  directory REVENUE alone stays a *guess* (the $14M gmail roofer); every
  other fact that agrees lifts one step (guess → likely → sure). **The
  review count no longer votes.** The lookup carries
  `directoryEmployeesRange` onto the signals so the rule can see a range.
  Expected on this run: 7 guesses → 3 (the three lookups that found
  nothing).
- **The second size query is bought on a NULL PARSE**, never on the wording
  of the snippets: `findSizeViaSearch` parses the first results, buys the
  LinkedIn/BBB query when the parse found nothing, and parses again (one
  more cheap model call).
- **One `leadLocation`** (`company.location || company.market`) for the
  owner ladder and the size lookup in `runFindContactRead`; the web-search
  negative memo is keyed on domain + city so a city-less miss does not block
  the search for 14 days after the city arrives.
- `ORG_TOKEN_RE` gains family | families | team | crew | staff | brothers |
  bros | sons: "Larsen Family" and "Smith Brothers" are refused, "Ray
  Diyanni" lives.
- `chainLocationPath` accepts state ABBREVIATIONS (`CHAIN_STATE_ABBRS`,
  minus the two-letter codes that are English words: in, or, me, ok, hi,
  id, la, de, pa, ma, co); `readChainEvidence` takes the listing `name`
  and reads a **"Brand - City" listing whose own page sits under
  `/locations/`** as one outlet of many — "Joe's Plumbing - Raleigh" whose
  listing points at its homepage lives.
- **A product company is an email lead (Vin's ruling).**
  `readProductCompanyTells({ pages, links })`, pure, same shape as
  `readOwnershipTells`: a positive needs TWO product tells (add to cart,
  free shipping, best seller, wholesale, find a dealer, we manufacture,
  contact sales, a /cart /collections /products /shop /contact-sales path…)
  and NO service-area language; `signals.productCompany`; `lanesFor` gains
  `product` and treats it like `layered` (email only, never on the rep's
  sheet, never dropped, the size ladder still applies); the `🎯 TARGET`
  line says "product company (…)". GoSun and Mission Solar are fixtures; an
  HVAC company with a filter shop and a service area stays a service
  business.
- `ship-round`: ask Vin before every merge; never merge while a batch runs.
- Checks: `SIZE AND LAYERS CHECK` gains the Round 113 block (Bath 12 exact →
  likely, Diyanni 11-50 → likely, a 1-10 range → guess, RiteRug revenue
  alone → guess, a headcount with a fleet agreeing → sure, the review count
  silent, the product lane, the three product-tell fixtures) and six
  call-site needles plus a negative needle on the old snippet trigger;
  `OWNER CORROBORATION CHECK`'s name-door cases gain Larsen Family, Smith
  Brothers and Ray Diyanni; `FIND ICP GATE CHECK`'s chain cases gain
  ClearChoice, RiteRug, Joe's Plumbing - Raleigh, a city-only page and a
  neighbourhood page under a two-letter English word, and its
  `readChainEvidence` needle carries the name.

Deliberately NOT done (Vin's rulings): a Render build filter for docs-only
merges; the "from Find, today" marker on the Research tab (PR 2, with the
two-lane tables); any change to index.html.

### What the falsification runs found in the checks themselves

Seven reverts, each alone against the green baseline, each RED on the
check named for it, restored byte for byte (CR count = line count
throughout):

| revert | red on |
|---|---|
| a directory figure alone is a guess again | SIZE AND LAYERS CHECK (Bath's 12 on BBB) |
| the second size query bought on the snippet's wording again | SIZE AND LAYERS CHECK (the null-parse needle and the negative needle) |
| the owner ladder back on `company.location` alone | SIZE AND LAYERS CHECK (the leadLocation needle) |
| the family tokens out of the name door | OWNER CORROBORATION CHECK (Larsen Family) |
| state abbreviations out of the chain path | FIND ICP GATE CHECK (ClearChoice) |
| the "Brand - City" outlet tell switched off | FIND ICP GATE CHECK (RiteRug) |
| a product company back in the call lane | SIZE AND LAYERS CHECK (the product lane) |

**275 boot checks green.** `bash ci-gates.sh` all stages. **The contract
stays 20260929 on both sides; index.html is untouched, so nothing for
Netlify.** Render env: nothing new. Hands: the Apify token, the verifier
top-up, DataForSEO. The next batch's proof: `📏 SIZE LOOKUP` shows two
queries on every double miss, `🎯 TARGET` reads likely or sure on every
directory headcount, no "no city could be parsed" on a Places lead, no
chain reaches the owner wave, and a product company prints "lane email".
