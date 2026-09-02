# §81 — The meter was under-counting the biggest variable cost, and the tool built to check it was blind — 2026-08-27
Source: CLAUDE.md lines 7584-7800, moved verbatim 2026-09-02 from commit b01d952e4f95d7b69686bc2c4063ca2aa0cb7546 (branch backup/claude-md-monolith). Nothing below this line was edited.

## 81. The meter was under-counting the biggest variable cost, and the tool built to check it was blind — 2026-08-27

Vin: *"why cant we get this overall price way lower? i dont undertsnad we need
to get this cost down a whole lot like to 270 at 50 a day think hard."* Three
consecutive answers from me had carried at least one wrong number, and the
reason turned out to be a defect in the system's own cost meter rather than in
my arithmetic.

**METHOD, because it is the reason anything below is trustworthy:** servercheck
was cloned into a cost probe that dumps the server's own meter lines, and real
leads were DRIVEN through the real research route. Every figure here is either
observed in that run or quoted from source with a line number. The previous
three estimates were arithmetic over CLAUDE.md, which is stale on at least three
lines.

### FC_SCREENSHOT_CREDITS reached three renders of ten

The dial is applied by matching the word "screenshot" in a **hand-typed kind
string**. The three homepage renders carry it. `firecrawlScrape` asks for
`screenshot@fullPage` on **every interior page** and bills `fcNote(true,
'scrape', ...)`, so the seven most-repeated renders on a lead were priced as
plain text reads. One feature, two prices, in one file — the two-hand-kept-copies
disease pointed at the COST MODEL instead of at a claim, which is why no truth
gate caught it.

**And the file contradicts itself about the underlying fact.** Five comments
assert *"Firecrawl bills per page, not per format"* — which is load-bearing for
the `html` format added in §79 and for the batch format list — while the dial's
own comment says third-party guides claim a screenshot scrape bills at 5. Both
cannot be true. If renders are free extras the rate is 1 and the meter is right;
if they cost 5 then format DOES affect billing and a lead reading 17 credits
actually cost ~57.

### The designated way to settle it could not see a single render

§48 built the per-kind split for one stated purpose: *"run one lead, read
`byKind.screenshot`, compare the dashboard."* The label was derived as
`kind.replace(/[^a-z-]+.*$/i, '')`, which cuts at the FIRST non-letter — so
`scrape+screenshot`, `scrape+screenshot (mobile)` and `scrape (text)` all
collapse to `scrape`. **`byKind.screenshot` has never existed.** Executed, not
read: every render variant returns `'scrape'`.

So the largest open cost question in the project had an answering mechanism that
was structurally blind, and a missing bucket looks exactly like a bucket with
nothing in it.

Both are fixed. The price is derived from what the REQUEST asked for (`shot`
passed by the caller, never sniffed from a label — sniffing a label is what went
wrong), renders get their own bucket, and the rate is a PARAMETER with a
production default so the same lead can be priced at two rates. **At the shipped
rate of 1 the rewrite is arithmetically a no-op on every kind this file emits,
and that is the first thing `FIRECRAWL CREDIT MODEL CHECK` asserts** — a cost fix
that quietly moves the numbers is a second unknown, not a fix.

### Three corrections I owed the owner

- **Places is ~$20/month, not ~$50.** Both Places text searches on the research
  path are DataForSEO FALLBACKS. With DFS credentialed a lead makes ONE Place
  Details call, inside the free tier. What is left is DISCOVERY (up to 180
  searches a Find run), not auditing.
- **"Cache the 21 uncached model calls, save $40/month" was wrong.** Haiku's
  `minCache` is 4,096 tokens (~16,000 chars) and nearly every uncached call is a
  Haiku call with a system prompt well under it. Exactly ONE is eligible
  (`critique`, ~$4/month) and it carries high risk relative to that saving. **The
  Anthropic bill has one lever, not two.**
- **That lever is one call.** `situation-read` is **59% of the model bill**
  ($0.148 of $0.27), it runs Sonnet-5 with `{type:'adaptive'}` thinking at
  effort `high` against a 12,000 ceiling, and the answer is ~840 tokens — so
  ~90% of it is thinking tokens billed at the output rate. The whole Anthropic
  line tripled the day §65 moved it there.

### The retry nobody has measured

The probe showed `situation-read` firing **twice on every lead**. It is a
two-attempt loop with **seven** independent fault conditions, any one of which
re-runs the entire synthesis at full price. The production rate is unmeasured;
`↺ SITUATION READ` is greppable and a 50-lead run answers it. If it fires on half
the leads that is ~$40/month of pure retry on the most expensive call in the
system.

**The right fix is deliberately NOT built yet.** Most faults are LOCAL — a
headline that fails plain-language, a row count, an unsourced figure. Repairing
one field with a cheap call instead of re-synthesising the whole story would take
a retry from ~$0.074 to ~$0.002 AND preserve the parts of attempt one that
passed. It touches the most quality-sensitive call in the file, so it waits for
the measurement and its own round rather than landing the night before a
fifty-lead batch.

### The two paid calls no claim can consume

The DataForSEO Labs reads — a modeled organic-traffic figure and the keywords
that bring it — are the only paid calls on a lead that no rung, no email and no
gate can ever read. Both are labelled estimates everywhere they render. At
~$0.023 a lead they are the largest DFS line item, about **$25 per thousand
leads**. They are **opt-in now** (`DFS_LABS=on`), the skipped value is the same
`checked:false` shape the function already returns when it cannot run, and
gating the parent gates the keyword read with it — asserted rather than assumed,
because "the second one is covered by the first" is exactly the reasoning that
leaves a call site behind. `DFS LABS GATE CHECK`.

### What the recon found and this round deliberately did NOT act on

- **`FC_BATCH` has defaulted to OFF since 2026-08-13** (git-verified) and is not
  in PART 8's knob table, though it is the largest Firecrawl lever: interior
  pages cost 1 credit instead of 0.5, ~3.5 credits a lead. It was switched off
  because a batch tripped the rate limiter and "this run measured 0 of 4" — and
  **that run predates §76, which found the per-endpoint pacing wire was DEAD and
  every Firecrawl call in the process was pacing on one global clock**. Worth a
  measured re-test on one lead. Not worth a blind flip: an abandoned batch is
  billed in full and then bought again individually, so it costs MORE.
- **The homepage is fetched twice, simultaneously, for one page** —
  `Promise.allSettled([askCorpus(target), askFullPage(target)])`, two paid
  scrapes of the same URL in the same instant, against the file's own rule that
  Firecrawl bills per page and not per format. Merging them is worth 1 credit a
  lead, or 5 if renders bill at 5 — which is why it waits on the measurement.
- **The viewport render is a FALLBACK, not a routine call.** It appeared on every
  lead in the probe because the FIXTURE returns no screenshot. Production takes
  three homepage fetches, not four. Recorded because I reported the wrong number
  first: the harness-that-lies class, caught by reading the source.
- **The owner ladder costs ~15 Firecrawl credits and 6 Haiku calls** on leads
  where stage 1 does not settle, and on a COLD CALL the rep asks the receptionist
  for the owner. Largest single saving left; it touches the resolver, so it wants
  its own round.
- **On review-heavy leads we appear to buy 90 reviews and read ~58.** §54's rule
  is that `APIFY_MAX_REVIEWS` and `REVIEW_CORPUS_CHARS` must move together. Do
  not cut blind — on lean leads all 90 are read, so the fraction of leads that
  drop is the measurement, and the run reports drops by name.
- **`findOwnerInReviewReplies` has no caller anywhere in the file**, and
  `scrapeMoreGoogleReviews` is hard-disabled. Dead, not costly.
- **One call is described with three different prices in the source itself.**
  `findSizeViaSearch` is called "4 Firecrawl credits per lead" at one line, "1
  credit" at another, and priced at 2 by `fcCreditCost`. Nobody has reconciled
  them against an invoice.

### The measurement that gates everything

Note the Firecrawl balance, run ONE lead, note it again, and compare against the
`FIRECRAWL SPEND` line. A match means renders are 1 credit and every figure here
holds; a ~3x gap means they are 5, `FC_SCREENSHOT_CREDITS=5` corrects the whole
ledger at once, and every Firecrawl plan estimate in this file is wrong. Until
then, **the honest per-lead Firecrawl figure is a range, not a number** — and
saying otherwise is the failure this file records more than any other.

### A complete answer is not a failed one

The local-finder retry loop recognised only a 40xxx account error, and the two
parse exits that mean COMPLETE AND EMPTY — *"DataForSEO returned no items for
this search"* and *"returned items but none of them were business rows"* —
carry no digit and no "task error", so the pattern could never see them. **A
search that answered and had nothing in it was bought three times for the
identical nothing.** They carry an explicit `settled` flag now rather than being
recognised from their own prose, which is the same defect this round fixed in
the credit meter one screen away. The transient cases keep every retry they had,
and `DFS SETTLED ANSWER CHECK` asserts BOTH directions — the falsification that
mattered was widening it too far, which would have killed the retry the loop
exists for.

### What the recon found that this round deliberately did NOT act on

Six agents read the paid surface and an adversarial pass mapped what must never
be cut. Two findings were vetoed by that map and both vetoes were accepted:

- **The BRAIN GATE runs two paid model calls too late.** A husk audit still buys
  the situation read — the most expensive call on the lead — and the fact-check
  before being 422'd, because both inputs the gate reads exist the moment the
  audit parses and the gate sits ~3,400 lines later. Worth ~$0.15-0.19 plus
  20-40s of the work clock on every blocked lead. NOT done tonight: `brainAudit`
  is not assigned until long after `parsed`, so the honest fix extracts the
  refusal into one function both gates call rather than duplicating it — and a
  control-flow change to the main research route is not a thing to ship the night
  before a fifty-lead batch.
- **The second rank sample on a Places-fallback FOUND business cannot change a
  consumed field**, because an untrusted source may never state a position. It
  looks like free money. The quality map's verdict is DO NOT CUT, in those words:
  *"this is the exact cut sections 6 and 47 are emphatic about, and it is now
  cheap enough to look like free money"*, and the danger is scoping the skip one
  step too wide and reinstating the single-draw bug on `absent_from_search`.
  A ~$0.035 saving against the strongest sentence in the system is a bad trade.
- **The audit cache saves only the audit call.** On a hit the log says "Saved
  ~$0.08" while the vision read, the situation read and the fact-check are all
  re-bought on byte-identical evidence — and the key already proves the
  screenshot bytes are identical. Real, and it wants §19's isolation rules
  thought through properly rather than at speed.
- **The free owner source built for owner-operators can never corroborate.**
  `findOwnerViaReviewReplies` is stage 1 and free, its own prompt says *"A first
  name alone is fine and useful"*, and `rankOwnerCandidates` clusters on a
  surname — so the source that could settle the owner structurally cannot, and
  the paid wave is bought anyway.
- **Three log lines price the owner ladder about 3x above the file's own credit
  model**, including §76's "twelve-credit owner-lookup wave". `findOwnerViaWebSearch`
  fires two snippet-only searches at 2 credits each. Any planning number taken
  from those lines — including the "~15 credits" figure I repeated in a report —
  is inflated.

**The quality map's DO-NOT-CUT list, recorded so a future cost round does not
have to re-derive it:** the second rank sample, DataForSEO credentials, the
finder's depth-100 window, `APIFY_MAX_REVIEWS` below 90, the review-pain mine,
the rendered homepage, the vision call, interior pages below two, the sitemap
map, the Place Details call that supplies the authoritative review count, the
service-page absence second look, `PAGESPEED_KEY`, and `REVIEW_CORPUS_CHARS`.
Marked SAFE to reduce: `SITUATION_EFFORT` (it writes prose, sets no measured
flag, gates no absence claim and produces no figure), the decision-maker web
search, the three service-page rank searches, and the Labs pair already cut here.

**252 boot checks green.** Eight falsifications, each reverted alone and each red
on its own named assertion — including the over-widening direction, which is the
one that proves a cost fix has not quietly eaten a guard.

**And the settled-answer check failed a CORRECT build on its first boot**, on a
needle with one closing paren too many. Eleventh recorded instance of a needle
failing on its own shape rather than on the code; the needle now pins the pattern
alone, because counting parens in a guard is how a green build gets called red.

---

---

