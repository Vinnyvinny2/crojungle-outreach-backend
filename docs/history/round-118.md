# §118 — Stop paying for the search that never worked, and score the website we already downloaded — 2026-09-04

Written 2026-09-04 for docs/history (one file per round; CLAUDE.md carries no history). Not a moved section: verify-split.sh skips it.

## 118. Stop paying for the search that never worked, and score the website we already downloaded — 2026-09-04

Two things Vin raised straight after Round 117 went live:

> *"ok we are usuing a lot of firecrawl credits lowkey."*

> *"a high quality prospt is a bunch of things — a compnay that raised a lot of
> moeny — a company wioth a bad or poor wbesite — a company with a bunch of
> marketing jobs theyre hiring for — not neccessary a comapny with just a lot of
> revenue."*

and then, on what the website read should actually look at:

> *"how good the website converts … how clen is the code on the back end … how
> well the wbeistes build is — is it outdated — is it set up to rank for GEO
> (ai) — is it set up for SEO in geenral. this stuff is vital for businesses
> websites."*

Ruling: **"yes lets just go full push on pushing all of this we will worry about
the email later lets vcredit cut andf get the wbeiste audit in there now at the
highest quality build meticlously."** Turning any of this into an email finding
is deliberately out of scope for this round.

### What the money was doing (measured off the 2026-09-04 run)

A Firecrawl **search costs 2 credits**; a **page read costs 1**. The 25-lead run
spent 195 credits:

| | credits | share |
|---|---|---|
| searching for owners (84 searches × 2) | **~168** | **86%** |
| reading the businesses' own websites | ~27 | **14%** |

That single split decided the whole round. **The website audit Vin wants is
free** — it reads pages that are already the cheap seventh of the bill, with no
model call and no new fetch except two plain-HTTP text files. All the money is in
the owner hunt, where the paid wave returned nothing usable on **9 of 25 leads
(108 credits)**.

He asked directly whether the paid failures were the non-Places leads. They were
not: **all 25 leads in the run came from Google Places**, and zero from
TheirStack. The paid search fails on leads whose owner is not on the public web,
whatever lane they arrived in.

### A. The one query that never worked

`findOwnerViaLicense` built two queries — a trade/professional-licence query
chosen by industry, then a **chamber-of-commerce query appended
unconditionally**. The executor runs query 0, evaluates, and returns early when
it names somebody, logging *"resolved on the trade query — skipped the chamber
search"*. That early exit fired on 6 leads, so the chamber query is bought
**only on leads where everything else has already failed**. In the run it was
bought **11 times and produced zero names** — 22 credits for nothing — and it
was the one thing in the whole owner ladder that **no boot check pinned**.

It is now behind `DM_CHAMBER`, default **off**, exactly mirroring the
`DM_REGISTRY` precedent that is already off with its evidence in the log line.
Off, the query is **not built at all**, so nothing downstream can spend on a
string that does not exist. `DM_CHAMBER=1` on Render puts it back.

Gating it exposed a second defect. The executor evaluates `r0` and then
evaluates the accumulated `hits` again at the bottom. With the loop gated out
`hits` is unchanged, so the second call re-ran **the identical Haiku call on the
identical corpus for the same null**. The trailing evaluate now runs only when
the loop actually added hits (`hits.length === _before` → return).

And `DM_SOURCE_WEIGHT` had ONE key, `license_or_chamber`, for both queries, so
nothing downstream could say which one earned a name — which is why answering
"does the chamber query work?" needed a hand-grep of a log. The executor now
records `licenseQuery: 'trade' | 'chamber'` on the result.

### B. Which searches earn their keep, printed once a run

`fcKindLabel` buckets every search as `'search'`, so `byKind` cannot answer
"which of the five searches is worth its 2 credits". `firecrawlSearch` now takes
a `tag`, and a per-source tally rides in the `FC_LEDGER` store — **not** by
re-labelling `byKind`, which a boot check pins. The `OWNER WAVE` line gained one
appended clause:

```
| searches: owner_directory×3, license_trade×1 (8 of the 11 credits)
```

Round 119 therefore cuts the remaining four searches **on data**, without anyone
grepping a log again.

### C. The website read, on HTML we already hold

The largest finding of the exploration: **most of Vin's list was already
written**, on the audit path, and Find had never called it.

| already built | what it gives |
|---|---|
| `readSeoSignals` | noindex; schema **classified** (`businessSchema` vs `boilerplateOnly` — it already solves the trap that Wix auto-injects boilerplate); title quality; canonical; alt coverage |
| `readSiteAge` | table layouts, pre-smartphone code, Flash, old jQuery, XHTML doctype, keywords tag, no viewport, plain http, stale copyright — each with its plain-English sentence already written |
| `detectPlatform` | the Wix / GoDaddy / DIY-builder fingerprint |

The Find preamble's own rule is **"NOTHING HERE IS A SECOND IMPLEMENTATION"**,
and `what-not-to-do` records two hand-kept copies of one rule as the disease this
file produces most. So the new `readSiteBuild({pages, links, website,
companyName, city, trade, robots, llms})` **calls those three** and writes only
what grep proved was missing: `/robots.txt` was never fetched anywhere in the
file (every `robots` hit was the `<meta>` tag), `/llms.txt` did not appear at
all, and nothing measured a JS-painted shell or whether there is a form or a
tappable phone.

Ten faults, 34 points of raw gap, capped at **25**:

| group | fault | pts |
|---|---|---|
| SEO | `noindex` · `weakTitle` · `thinAlt` | 5 · 2 · 1 |
| GEO / AI | `noSchema` · `jsOnly` · `blocksAi` | 5 · 4 · 2 |
| BUILD | `datedBuild` · `diyBuilder` | 5 · 3 |
| CONVERTS | `noForm` · `noClickToCall` | 4 · 3 |

Booking and chat are read for the sheet's sentence and **deliberately not
scored**: `invests` and `ads` already consume `scheduler`, `liveChat`,
`callTracking`, `analytics` and `tagManager`, and the table's own rule is *"one
fact must not sit in two terms of the same denominator"*.

**Two free fetches**, `/robots.txt` and `/llms.txt`, over plain HTTP with an 8s
timeout; a refusal is one log line and nothing else (the Round 116 BBB
precedent). `robotsBlocksAi` is a real per-agent robots.txt parser — consecutive
`User-agent:` lines group, and `Allow` overrides `Disallow` — because a regex for
`GPTBot` next to `Disallow` would have called half the web AI-blocked.

**The honest limit, written into the code and repeated here:** we measure whether
a site is **built to convert**, never whether it **does** convert. The row says
"no form, no tap-to-call, no schema, DIY build" — facts we read in their markup —
and never "your site converts badly."

#### Three defects the fixtures caught before the code shipped

1. **500 raw bytes let an unreadable page claim "no schema".** The Floor Gurus
   fixture (a 258-character page) is the standing model, and its lesson had to be
   re-learned one level down. Absences now need BOTH floors: `anyMarkup` (500 raw
   bytes) **and** `FIND_ABSENCE_TEXT_FLOOR` (800 readable characters).
2. **Gating everything on the text floor then suppressed `jsOnly`** — a
   JavaScript shell has no readable text *by definition*, so the one fault that
   describes it could never fire. Split `need: 'markup'` (positives: a tag IS
   there) from `need: 'home'` (absences: a tag is NOT there), which is the same
   sentence `readFindIcpSignals` already carries at its head.
3. **An unreadable page reported "nothing wrong with their site."** `judged`
   is now `homeRead || faults.length > 0`, so silence is silence.

### D. The eleventh term, and the rep's column

An eleventh `FIND_ICP_TERMS` term, **`sitegap`, max 25** — level with `ads` and
`founder`, below `size` (35). Vin's two rulings, executed rather than written
down:

- **a good website scores 0 and is never penalised** (a business with a strong
  site still buys the retainer or the AI brain), and
- **the gap weighs 25**, equal to the biggest term below size. A knob, revisited
  after one run.

Unmeasured returns `null`, so an unreadable site leaves the denominator instead
of marking a lead down for our own blindness. The term is **strictly typed**:
`Number(true)` is 1 and 1 is finite, so a stray boolean would have scored a point
off a measurement that never happened — a check now fails on exactly that.

The denominator moving from 195 to 220 points moved `servercheck.js`'s
end-to-end threshold from 80 to 75: the fixture lead now scores 78 where it
scored 81, because the term contributed 14 of the 25 it added. The comment says
so at the line, so the next reader does not think a bar was quietly lowered.

The sheet gains one short cell inside Round 117's 44-character cap — `poor (DIY
build, no schema)` — plus a why column and a CSV column, contract **20261003**.

### The checks

- **`WEBSITE BUILD CHECK`** (the 277th), six sections: the worst site we can
  build scores **exactly 25**; a modern one scores 0 and is not demoted; an
  unreadable page asserts **nothing**; a JS-painted home page beside a readable
  contact page keeps the JavaScript fault and is **never** charged with having no
  form (the script we did not run may draw it); robots.txt reaches the read; and
  the gap reaches the score table.
- The chamber gate pinned on **the condition**, not on the log sentence — the
  recorded trap is a needle aimed at a message that went green on an `if (false)`
  build — plus `typeof DM_CHAMBER !== 'boolean'`, so an unset env var cannot read
  as truthy.
- The duplicate `evaluate`, the licence attribution, the query tags and the
  search tally each pinned.
- Client fixtures asserting `poor (DIY build, no schema)`, `strong`, `not read`,
  and refusing any "converts badly" claim.

**Thirteen falsifications, each fix reverted alone against a green baseline, each
RED on its own named check, each restored byte-for-byte.** One of them
(`jsFormGuard`) came back **green first time**: the `!jsOnly` guard on `noForm`
was unreachable for a pure shell, because with no readable text `noForm` was
already `null`. The guard was real but no fixture could reach it, so a fixture
that can — a JS-painted home page beside a readable contact page — was added, and
only then did it go red. A check that cannot fail is not a check.

### What the next run proves

| what | where | pass |
|---|---|---|
| credits a lead | `📇 FIND CONTACT` | below **6.6** (the post-117 baseline is 7.8) |
| the chamber query | `grep 'chamber of commerce'` | **zero** |
| which searches earn their keep | the new `searches:` clause | printed, so 119 cuts on data |
| the site score | `🖥 SITE` / the sheet | a verdict on every readable lead, nothing claimed on an unreadable one |
| AI-readiness | `grep 'robots.txt'` | read free on every lead with a website |
| nothing invented | the sheet | facts only — no "converts badly" anywhere |

### Still owed by hand

`index.html` at contract **20261003** must be dragged into Netlify, or the site
column is dark while the server half is live. Vin still owes the Apify token
(403), the email-verifier top-up and the DataForSEO balance.
