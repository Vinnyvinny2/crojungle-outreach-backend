# §115 — The first Round 114 run: the lanes reconciled, a franchise and a chain on the sheet, and the website column back — 2026-09-03
Written 2026-09-03 for docs/history (one file per round; CLAUDE.md carries no history). Not a moved section: verify-split.sh skips it.

## 115. The first Round 114 run: the lanes reconciled, a franchise and a chain on the sheet, and the website column back — 2026-09-03

Vin ran 25 contact reads on the Round 114 build the same evening (contract
20260929 both sides): Call list 19, Email lane 7, No name yet 5, Too small
1. *"I don't like that I can't see the email ones … make sure everything is
flawless … why did the websites get cut from the export? … be meticulous."*
Then, on the diagnosis: *"fix it all."*

### The run, reconciled

The lanes were right. 25 = 19 call + 5 no name + 1 none; all 7 email-lane
leads were also on the call list (owner-run, medium), and no lead was
email-only — nobody layered with a marketing head named, nobody over the
cap — so the Email lane showed the same 7 rows with "also on the call
list" and the CSV, which is the call list by design, had nothing to
separate. 234 Firecrawl credits for 25 leads (about 9 each); the paid owner
wave bought on 16 of 25; leads took 80–316 seconds.

Round 114 fired: ClearChoice was marked a branch network and put on the
call sheet with "ask for the marketing head"; Utah Eye Centers and All
Affordable Insurance were read as layered. But the sheet is sorted by fit,
and the −8 `layeredLast` demotion is a demotion, not a sort: ClearChoice
sat fifteenth of nineteen at 63. My "ranked last" was not true on the sheet.

### The defects, each read off the log

1. **Archadeck of Columbus is a franchise and walked through.** Archadeck
   Outdoor Living sells territories; the franchisee's site is
   archadeck.com/columbus. The name list did not know Archadeck, and the
   chain tells read `/locations/<state>/<city>`, not a city path on the
   brand's own domain. Rob Mitchell was on the sheet as Owner.
2. **ClearChoice, a 100-centre PE-owned chain, read as "medium, owner
   within reach".** The size lookup searched "ClearChoice Dental Implant
   Center - Cincinnati" with the city and found nothing; "locally owned and
   operated" on the location page counted as owner-run; the rep got
   "Owner: Ronald Crume Jr., Lead Prosthodontist", a name the ladder itself
   held back as unable to sign, and the sheet cannot say so since the
   grade letters left it in §109.
3. **Mission Solar, a large panel manufacturer, read as "low, owner within
   reach"** off 37 reviews, and a product company at entry tier got no lane
   at all — filed under "Too small", which it is not.
4. **A stylesheet was read as a contact page** (Cap City Decks):
   `/wp-content/plugins/contact-form-7/…/styles.css` matched the contact
   intent. A wasted fetch whose text went into the owner read.
5. **The size lookup's second query found nothing on 21 of 21 misses**:
   about 42 searches for 0 hits, and with Firecrawl at two calls in flight
   every lead queued behind them. The three sizes found all came from the
   first query.
6. **The website column left the lean file in §109** with the grade
   letters. Vin: *"we need those back."*
7. Hands: the email verifier died mid-run (15 leads unverified, 4 addresses
   blocked as guesses); Apify still 403; DataForSEO $0.26.

### What changed

server.js:
- `GP_FRANCHISE` gains `archadeck`; `readChainEvidence` reads the **"Brand
  of City" territory shape**: a listing named `<Brand> of <City>` whose own
  page is `/<city>` (or under it) on the brand's domain is `kind:
  'franchise'` — Archadeck of Columbus and Overhead Door Company of
  Jacksonville drop; "Roofers of Tampa" on its own site and a brand homepage
  with no city path do not. It also returns `brand` (the name minus the
  " - City" or " of City" tail).
- **A branch network is measured as the brand**: the size lookup searches
  `out.chain.brand` for a network, and the SIZE LOOKUP line says "searched
  as …".
- **A branch network, a PE-owned company or a national operator is layered
  by construction**: the route overrides an owner-run verdict from their
  own page ("locally owned and operated" on a chain's location page), so
  the target is the marketing head when one is named, and the owner is
  "expect not to answer" otherwise.
- **A product company is an email lead whatever the tier guess** (`lanesFor`:
  `prod && t !== 'below_floor'`); measured under the floor still benches.
- **The page picker never fetches an asset** (`FIND_ASSET_RE`: css, js,
  json, xml, images, fonts, pdf, media).
- **The second size query is bought from the medium review band up**
  (`SIZE_SECOND_QUERY_MIN_REVIEWS = 150`), or when the review count is
  unknown; `findSizeViaSearch` takes `{ reviewCount }`.
- Checks: FIND ICP GATE gains the four "Brand of City" cases and the two
  brand assertions; ICP FILTER's must-die list gains Archadeck of Columbus;
  SIZE AND LAYERS gains the product-on-a-guess lane both ways, the asset
  picker fixture, and needles for the brand-name lookup, the layered
  override and the second-query condition.
- `CONTRACT_VERSION` → **20260930**.

index.html (`CLIENT_CONTRACT` → **20260930**, Netlify drag-in):
- `website` is back in the lean CSV / Sheet (17 lean columns).
- The server's `last` flag rides `contactLanes`; `lastRowsLast` sorts those
  rows to the bottom of the Read tab, the CSV and the Google Sheet by one
  rule, stable inside each half.
- The target cell says **"Held back: <name> (cannot sign - ask who owns the
  marketing)"** for a grade-D name instead of "Owner:", and "- ranked last,
  ask for the marketing head" on a hedge row.
- The fourth bucket is **"No lane"** (chip `NO LANE`; `TOO SMALL` only for a
  measured below-floor); its captions no longer say "$30M ceiling".
- clientcheck: the website in the lean set, the last-row order in `rows`,
  `laneOf(...).last`, the held-back cell, the chip, the tab label.

### What the falsification runs found in the checks themselves

Seven reverts, each alone against the green baseline, each RED on the check
named for it, restored byte for byte:

| revert | red on |
|---|---|
| the "Brand of City" kind off | FIND ICP GATE CHECK (Archadeck) |
| archadeck out of the franchise list | ICP FILTER CHECK |
| the asset filter off | SIZE AND LAYERS CHECK (the .css picker) |
| the second query on every miss again | SIZE AND LAYERS CHECK (the needle) |
| the size lookup on the outlet name | SIZE AND LAYERS CHECK (the needle) |
| the layered override off | SIZE AND LAYERS CHECK (the needle) |
| a product company back on the tier rule | SIZE AND LAYERS CHECK (Mission Solar) |

**275 boot checks green.** `bash ci-gates.sh` all stages. **Contract
20260930 on both sides — index.html changed, so Netlify needs the
drag-in**; until then the page shows the stale banner naming both numbers.
Render env: nothing new. Hands: the verifier, Apify, DataForSEO. The next
batch's proof: an "of City" franchisee is DROPPED before the wave; a
"Brand - City" network's SIZE LOOKUP line says "searched as <brand>" and
reads over the cap; the sheet's last rows are the hedge rows; a grade-D
name prints "Held back"; no `.css` in a FIND READ line; fewer LinkedIn/BBB
queries on small shops.
