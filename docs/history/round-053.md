# §53 — The blue links, an outdated build, and a meter nobody was reading — 2026-08-23
Source: CLAUDE.md lines 4389-4507, moved verbatim 2026-09-02 from commit b01d952e4f95d7b69686bc2c4063ca2aa0cb7546 (branch backup/claude-md-monolith). Nothing below this line was edited.

## 53. The blue links, an outdated build, and a meter nobody was reading — 2026-08-23

Four measurements, three of them free, all of them in service of the money map.

### The map pack and the organic results are two different rankings

Vin: *"don't we need to know where they rank SEO wise? can't Firecrawl scrape
that?"* Two separate things, and we only ever measured one. A business can sit
fourth in the map and fourteenth in the blue links underneath it.

**Firecrawl cannot do it.** Scraping Google's own results page gets blocked and
CAPTCHA'd within a handful of requests, it is against their terms, and a
blocked scrape returns a page with no results on it — which reads exactly like
*"you do not rank"*, the most damaging false claim this system can make. The
same provider that gives us the real pack gives organic positions at the same
price, so it is one vendor and one auth for both. New rung `organic_invisible`
(harm 84, INVISIBLE): deliberately below `absent_from_search` at 96, because
for a local trade being absent from the MAP is the worse fact and both can be
true at once.

Same honest shape as the pack read: without credentials it does not run and no
organic claim is permitted.

### "Your site looks old" is taste. The markers are facts.

Vin, twice: *"the website is clearly outdated looking, this lacks credibility...
we need the audits to start picking up on outdated websites — it can tell from
the code."*

He is right that it matters and right that the code can see it. The trap was
the sentence: `dated_credibility` said *"the site reads as several years old
next to what their competitors are running"* — an aesthetic judgement naming
nothing, on a rung scoring itself 25 out of 100 for verifiability. This file's
own `weak_positioning` note says an opinion the owner cannot check is worth
nothing in a cold email.

The markers ARE the finding. `readSiteAge` is a pure function reading eleven of
them — table layout, pre-CSS tags, Flash, a 2016-era code library, an XHTML
doctype, a meta keywords tag, a fixed pixel width, a discontinued site builder,
no viewport, plain http, a stale copyright line — and the rung NAMES two of
them. *"On their own site, the page is still laid out with tables, and a phone
gets the desktop page shrunk down"* is not taste, it is two facts. `specific`
goes 25 → 80 for that reason.

**Two is where an impression becomes evidence.** One marker is a quirk and stays
silent; a current responsive page comes back clean; a page we never read
produces no verdict at all. `SITE AGE CHECK` fixtures all four directions,
because a filter that flags every site tells a salesperson nothing, which is the
more expensive failure.

### An ads account is not a conversion, and a click is not a call

`hasGoogleAdsTag` only ever proved an ads ACCOUNT exists. Whether anything is
being COUNTED is a separate marker and we never read it. Two new signatures on
markup we already buy: a conversion LABEL (the `AW-xxx/yyy` form, the conversion
endpoint, a named conversion event) and call tracking (CallRail and the seven
others that do it). New rung `ads_untracked` (harm 89, BURNING): they are
running ads, there is no conversion tracking and no call tracking anywhere on
the site, so the account is optimising on clicks rather than on customers — and
for a trade the customer arrives as a phone call. Both halves are absence
claims, so both ride `adsReadable`, the same did-we-look gate every other
absence in this file carries.

### Secondary Google categories — measured, and deliberately not a rung

`types` was added to a Place Details request we already make, so it costs
nothing. A listing carrying one category surfaces for one kind of search and
drops out of the high-ticket emergency ones.

**It stays on the call sheet.** The Places `types` array is Google's own
taxonomy and it is NOT the list the owner picks from in his Business Profile.
Close enough to be real intelligence for Mike; not close enough to assert
"your listing is missing categories" to the owner — and this is the same day we
spent fixing exactly that class of confident wrong claim about a Google
measurement. It becomes a rung when somebody checks the mapping against a
listing they control.

### What the boot caught

Five declaration tables refused the first new rung by name — no layer, no
commercial weight, no knowability class, no subject line, no ask — which is the
"a rung cannot be added without a human deciding" discipline doing exactly its
job. And two smaller traps:

- **A subject line is capped at 30 characters and a longer one is dropped in
  silence.** Both of the first drafts were 32 and 34, so the rung could win the
  ranking and then no email could be composed. `SUBJECT COVERAGE CHECK` caught
  it, which is what it was written for.
- **`PLACE DETAILS REUSE CHECK` sliced a fixed 3,000 characters from the
  function head.** One comment block added to the field mask pushed the line it
  guards past the end of the window, and the check reported the wire as cut on a
  build where it was intact. A false RED costs the same trust as a false green.
  It reads to the end of the function now.

### The bill, recomputed

The rank searches move to DataForSEO, so Places drops from the second-largest
line to a rounding error:

| | before | now |
|---|---|---|
| Firecrawl Standard (fixed) | $99 | $99 |
| Google Places | ~$105 | **~$31** |
| DataForSEO | — | **~$9** |
| Anthropic | ~$105 | ~$105 |
| Apify reviews | ~$82 | ~$82 |
| Hunter + Render | ~$41 | ~$41 |
| **per month at 1,100 leads** | **~$432** | **~$367** |
| **per 1,000 audited leads** | **$393** | **$334** |

The three lines left that matter are Firecrawl (a step function — cutting
credits saves nothing until we get under 5,000 a month, which is impossible with
page reads), Anthropic (the audit evidence block) and Apify (150 reviews a lead;
a cheaper actor at half the rate is the obvious next cut).

**215 boot checks green.** `index.html` unchanged, so no Netlify deploy.

---

