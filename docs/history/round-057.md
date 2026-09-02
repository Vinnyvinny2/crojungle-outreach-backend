# §57 — The money map grew four signals, and the bill came down — 2026-08-24
Source: CLAUDE.md lines 4855-4945, moved verbatim 2026-09-02 from commit b01d952e4f95d7b69686bc2c4063ca2aa0cb7546 (branch backup/claude-md-monolith). Nothing below this line was edited.

## 57. The money map grew four signals, and the bill came down — 2026-08-24

Vin: *"quote to close is huge... #4 is a big one... lets mitgate the cost per 1k
leads as much as phsycially possible... we need this to be 244 or cheaper."*
Three cost moves, four new signals, and one ranking rule he signed off on.

### The bill, recomputed again

| move | per 1k leads |
|---|---|
| §53–54 baseline | ~$305 |
| duplicate-listing search moved off Places onto DFS pack rows we already buy | **−$30** |
| Firecrawl annual billing (Vin action, no code) | −$15 |
| traffic estimate added (DFS Labs, ~1¢/lead) | +$15 |
| **after this round** | **~$275** |
| `APIFY_ACTOR` flipped to a cheaper Google-reviews actor (Vin action, unproven) | −~$22 → **~$253** |

The remaining distance to $244 is inside the Anthropic line, and the meter that
§54 labeled is how it gets found: run one live lead, read `💰 ANTHROPIC TOTAL`
sorted by cost, and cut the named call that earns it least. Guessing ahead of
that read is the disease this file records.

**The duplicate-listing read no longer buys a Places search.** The DFS maps
endpoint returns the same candidate rows at ~$2 per thousand against $35, and
the matcher's proof standard is unchanged — same domain or phone AND same
street address. Places remains the fallback so a lead without DFS credentials
measures exactly as before.

**The traffic estimate is INTERNAL and says so on its own row.** DFS Labs'
domain overview is a MODEL of organic visits, not a measurement — he has
Analytics, we have an estimate, and being confidently wrong about his own
visits is the §52 class. It lands on the audit screen and the call sheet
labelled "third-party estimate — internal only", reaches no email, licenses no
figure, and a domain the index has never seen reports as a fact about the
INDEX, never as "no traffic".

### The four signals

- **`no_financing` (ROTTING, harm 74)** — the quote-to-close signal that needs
  no review. In a trade where the job routinely costs more than people pay at
  once (the declared `BIG_TICKET_TRADE_RE` list, kept NARROW on purpose), a
  pay-over-time option is standard, and its absence is measurable from pages we
  already hold. Presence anywhere kills it; the absence claim requires 2,000
  characters of markup or 3,000 of text actually read — the same look-first
  rule every absence in this file carries. A locksmith with no payment plan is
  a normal business, and the check asserts that direction too.
- **`no_retargeting` (BURNING, harm 72)** — Vin's "#4". Deliberately NARROW:
  Google's own tag can re-reach past visitors, so "you cannot retarget" would
  be false on any site with a Google tag. What is measured and true is the
  Facebook half: Google ads tag present, Meta pixel absent, markup readable,
  and no GTM container — a container can hold a pixel we cannot see, the exact
  rule `social_spend_no_search` already carries.
- **Ops buckets** — the review complaints split into the four kinds an operator
  sells to (nobody responds / quotes take too long / scheduling breaks down /
  work has to be redone), counted from the miner's own "N of M reviews"
  arithmetic, most-mentioned first BECAUSE the call-sheet chip reads row zero.
  INTERNAL, like every review-derived thing.
- **Unanswered negatives** — counted over the mined set, on the call sheet as
  the cheapest fix a call can open with. INTERNAL.

**`intent_mismatch` was deferred, not built.** Measuring whether the pages
match what customers actually search needs per-service DFS organic queries —
about a penny more per lead — and the head-term-only read we hold today cannot
support the claim. Building it on today's data would be the §30 failure again:
measuring him on a search he does not sell on.

### The check caught a dead rung before it ever ran

`MONEY SIGNAL CHECK` executes every predicate both ways, and its first boot
found `BIG_TICKET_TRADE_RE` matching NOTHING: the leading `\b` had been
corrupted to a literal backspace byte (0x08) by the editing pipeline — the
recorded §15 trap in a new costume, invisible in every terminal print of the
regex. `no_financing` was dead on arrival and nothing would ever have said so.
The same byte sat in `FINANCING_RE`'s affirm/klarna entries. A sweep found all
five bytes; zero remain, in either file.

**Two first-version fixtures measured nothing, and only falsification found
them.** The bucket-order fixture put the most-mentioned bucket FIRST in
declaration order too, so removing the sort left it green — rewritten so the
5-mention bucket is declared LATER than the 1-mention one. And the
called-back fixture said "never called", which the old regex also matched, so
reverting the widening left it green — the fixture is now "no one ever called
back", the exact phrasing the first fixture missed on. Seven falsifications,
each red alone.

**225 boot checks green.** `index.html` changed (the merge, the persistence,
and the review-intelligence chips on the summary card), so this needs a
Netlify deploy.

---

