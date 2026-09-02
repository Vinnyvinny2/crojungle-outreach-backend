# §103 — Read the likeliest page first, and score for the business we can sell — 2026-09-01
Source: CLAUDE.md lines 9786-9948, moved verbatim 2026-09-02 from commit b01d952e4f95d7b69686bc2c4063ca2aa0cb7546 (branch backup/claude-md-monolith). Nothing below this line was edited.

## 103. Read the likeliest page first, and score for the business we can sell — 2026-09-01

Vin, about to run seven more contact reads: *"i need the lead quality and overall
whole read thing at a 10/10 how do we get it there from here?"* Four decisions
came back, and two of them needed research before a line was written.

### The verifier: we already own a second one and have never called it

- **Self-hosting is impossible, not merely expensive.** Render blocks outbound
  port 25 on **every** plan, free and paid, because it runs on EC2. A free
  route is off the table for structural reasons, not budget ones.
- **MyEmailVerifier is already the cheapest on the market** — $0.0025 a check,
  $4 per 1,000, credits never expire. ZeroBounce, NeverBounce, Kickbox and
  Bouncer are $0.008+, i.e. **3.2x more**. Switching vendors costs more.
- **The outage was the free daily allowance**, not a bad vendor. 100 free
  credits a day; a contact read spends a catch-all probe **plus** a verify per
  lead, so 25 leads is 50+ and 50 leads is well past it. $4 covers about a year
  at 25 sends a day.
- **`api.hunter.io/v2/email-verifier` is never called anywhere in server.js.**
  Only domain-search, email-finder, account, campaigns and leads are. Hunter's
  verifier is **included in every Hunter plan** at 0.5 credit, and we already
  pay Hunter to send. A second verifier we own, unused, whose one job is exactly
  the case that hit 42% of the 2026-09-01 run. Recorded here and NOT built this
  round: it wants its own falsification against the latch, and the run in front
  of us needed the owner half more.

### Firmographics: no free per-company source exists for local SMBs

Checked and refused. **Financial Modeling Prep** is free and SEC-filing based,
so it covers public companies and no local trades at all; Crustdata, Bright Data
and the LinkedIn headcount APIs are paid with no usable free tier. The one
free-to-us option is **Hunter Company Enrichment** at 0.2 credit, charged only
when it returns company size — recorded for a later round, opt-in and measured,
because Hunter is built around B2B domains and its coverage of a two-truck
plumber is likely thin.

### Reading twenty pages buys nothing on its own

Vin: *"read as many free pages as they will give us of course if they give us 20
read 20. dont excute paid wave unless we have to."* The fetch is a plain GET and
costs nothing — and the arithmetic says the page count was the least important
part of it:

- Each page is sliced to **6,000 characters** and the corpus caps at **22,000**.
  That is the homepage plus about three interior pages, the third two-thirds
  read. **The cap was already binding at the old budget of four:** the careers
  page contributed **zero bytes**, and in the ROSTER corpus the page truncated
  was the **second team page** — the one `want: 2` was added specifically to
  fetch, and the one most likely to name the owner.
- The loop was **sequential at 10s a page**, so twenty pages is **+160s per
  lead** against leads already running 40-275s, and up to **+640s and +16
  credits** on a site that refused the plain fetch.
- There was **no content dedupe on the Find path** — only URL dedupe. A soft
  404, a redirect to the homepage or an unrendered single-page app passes every
  check and eats a full 6,000-character block. At twenty pages every block could
  have been the homepage.

So five things, and the page count is the last of them:

- **The table is now ordered by owner-likelihood** — team/about first, careers
  last — and that ONE declaration drives the fetch order, the early exit and the
  corpus order. `FIND_INTENT_RANK` is derived from it, so the judgement lives in
  one place rather than three.
- **The corpus is sorted before it is truncated.** Nothing did this: the fetch
  order was ranked and the corpus was then built in plain arrival order, so
  whichever page happened to arrive first decided what the parser and the model
  ever saw.
- **Read the likeliest first and stop when we have him.** Vin's own instinct —
  *"cant we make it so the less likley pages are read first to sopeed it up?"* —
  and it beats a flat time budget. `parseTeamRoster` is pure and free, so asking
  it after each wave costs nothing and a site that plainly names its owner skips
  every remaining page AND the ~10-credit paid wave.
- **A bounded parallel pool with a 120-second ceiling on the whole read**, not
  per page, because a per-page timeout multiplied by twenty is the number that
  made the sequential version impossible.
- **Content dedupe** through `pageFingerprint`, the audit path's own rule.

The wider budget applies to the **free path only**; the Firecrawl fallback keeps
the small one, because there every page is a credit.

### The score: spending and dissatisfied, or moneyed and untouched

Vin's shape, and he asked for it to be backed rather than assumed. It is:
**45%** of small businesses were dissatisfied with the agency they hired (Clutch
2024) and a 2026 study puts dissatisfaction inside the first year at **67%**;
**48%** switch over failure to deliver; **68% admit they are paying for
marketing they already know is not working** — almost word for word his *"they
dont know if theyre preforming well"*; and the average agency relationship lasts
**2.5 years** across **3-5 agencies**.

**Five signals that measure "somebody competent is already here" were already
regexes in this file, already tested against markup the Find read was ALREADY
HOLDING, and never asked.** `readFindIcpSignals` tested three of the eight keys
in `AD_TAG_SIGNATURES` and ignored `hasAdsConversion`, `hasCallTracking`,
`hasAnalytics`, `CHAT_SIGNATURES` and `SCHEDULER_SIGNATURES`. Zero extra
requests. And `tagManager` was measured free, sat on `signals`, and was read by
no term at all — computed-but-not-passed again.

- **Spend intent stays the heaviest measurable positive** and gets broader: an
  ads tag, a tag manager or analytics all say they invest.
- **Greenfield stops being punished.** `adsCode === false` scored **5 of 25**, so
  a moneyed business nobody has marketed to lost twenty points to one already
  committed elsewhere — backwards for the second archetype he named. It is 18
  now: proven spend still beats assumed spend, because it is evidence rather
  than inference, but the gap is the size of that difference and not a
  disqualification.
- **`alreadyDialledIn` marks down a business already in competent hands** —
  conversion tracking AND call tracking AND a real booking tool, all three or
  nothing, because any one alone is a plugin default. -12, read from the same
  declared `CONTACT_RANK_TERMS` table the contact ranker reads, and applied
  after the ratio for the reason written at `demotionPenalty`: a negative max
  would change the denominator.

**HONEST NAME AND HONEST LIMIT: this measures whether their marketing is
INSTRUMENTED, not whether it performs.** We are reading markup. We cannot see
their cost per lead, and neither can the audit — that is inside their ads
account. So it marks a lead down; it never refuses one.

### And the Re-read button spent on every stale lead at once

Found while checking what a 7-lead re-run would actually do. After a parser fix
every previous read is stale by contract number, so on the live queue that
button was **one confirm for 53 leads of Firecrawl and model spend**, with the
number box directly above it ignored. It obeys that number now.

### What 10/10 actually requires

Everything above is inference. The only thing that makes a quality number real is
**call outcomes logged against the finding that opened the call**.
`/api/call-outcome` has existed since §35, its row-write bug was fixed in §80,
and **it has never recorded a single row**. Forty logged conversations would be
more evidence than this project has accumulated in its life, and no code produces
it. Realistic ceiling without that: about **8/10**.

### What the falsification runs found

**Twelve reverts, each applied ALONE against a baseline the harness proves green
first, each red on its own named assertion.** Three things are worth recording:

- **A killed falsification run left a revert applied**, and the next pass refused
  to start with `BASELINE NOT GREEN` rather than reporting a colour. That is the
  §74 rule doing its job from inside the proving machinery: a harness whose
  baseline is already red proves reds too cheaply.
- **A needle written across two lines failed a CORRECT build.** `_src` is the
  LF-normalised, comment-stripped copy, so a needle carrying `\r\n` can never
  match. Single-line halves only. Twenty-first recorded instance of a needle
  failing on its own shape rather than on the code.
- **The Re-read fix went in before its needle did**, so `ci-gates` went red on
  the assertion that the old unbounded button still existed — the check was
  right and out of date. Re-aimed rather than worked around, and the fix kept:
  one confirm for 53 leads of spend is a real footgun.

**HONEST SHAPE: none of this has run against a live press.** The reader and the
score are executed at boot; what a real 7-lead press returns is settled by the
next run, and the numbers to read are `Read 0 name/title pair(s)` (21 of 25 last
time) and the free-settle rate in `💸 OWNER WAVE` (8 of 30 last time).

**The contract does NOT move this round.** The reader and the score are
server-only; the Re-read fix is client-only. `index.html` changed, so it still
needs a Netlify deploy.

---

