# §28 — Two checklists, four emails, and the price — 2026-08-20
Source: CLAUDE.md lines 1789-1923, moved verbatim 2026-09-02 from commit b01d952e4f95d7b69686bc2c4063ca2aa0cb7546 (branch backup/claude-md-monolith). Nothing below this line was edited.

## 28. Two checklists, four emails, and the price — 2026-08-20

Vin sent CROJungle's own two published assets — the 50-point **Landing Page
Autopsy** and the 28-point **Funnel Leak Ledger** — plus four real outgoing
emails, and asked three questions: what are we missing, are the emails good, and
are we ready for bulk.

### The price, and where it actually is

Vin: *"i dont want anything to get more expensive if anything it needs to get
cheaper."* The audit is back on Haiku. But the model was never the lever, and
the numbers say so:

| line | 50 leads/day |
|---|---|
| Anthropic, audit on Haiku | **$5.10** |
| Anthropic, audit on Sonnet | $9.75 |
| **Google Places** | **$7.35–$8.75, free tier gone by day 5** |
| Firecrawl | 650–700 credits/day — Hobby dies in 4.3 days |

**Google Places is the bigger bill and it is the one nobody was watching.**
Every mechanical call in the system was already Haiku — sixteen of them, all
hardcoded — so there was never a tiering saving to find. The split that matters
is not cheap-versus-good, it is that the audit call does EXTRACTION AND PHRASING
while the separate strategic call does the SYNTHESIS. Haiku is right for the
first. The second was already on a Sonnet, so keeping it there costs nothing.

**And the model swap shipped a correctness bug.** Sonnet 5 runs adaptive
thinking when `thinking` is omitted; Haiku does not; Sonnet 4.6 does not. So the
same request body means three different things depending on which constant it is
pointed at. Worse, `max_tokens` caps THINKING PLUS THE ANSWER — and this file
already carried that warning at its own truncation log line and acted on it
nowhere. A ceiling tuned for one model returns a part-written JSON on the next,
and a truncated audit loses the WHOLE audit rather than its tail. Every call now
states its thinking mode and sizes the budget for both halves.
`THINKING BUDGET CHECK`.

### What the checklists measure that we did not

Five boxes from our own published assets, all readable from markup already
bought, none of them previously looked at:

- **a button that says only "Submit"** — the Autopsy names this one by name
- **an email or phone field typed as plain text**, which hands a mobile visitor a
  QWERTY keyboard to type a phone number into
- **whether a long form was split into steps** — without this, counting fields
  condemns the sites that did the right thing
- **proof sitting in the footer** rather than the first two folds. The Autopsy
  scores WHERE proof is, not whether it exists
- **every published address being a shared inbox** — the Ledger's *"never a
  shared inbox where everyone means no one"*

Fixtured both ways on purpose: a page that got them wrong must be caught AND a
page that got them right must be left alone, because a checklist that flags every
site tells a salesperson nothing. `CHECKLIST SIGNAL CHECK`.

**The larger finding is the triage order.** The Autopsy's own order is message
match first, the five-second fold second, CTA and friction third, proof fourth,
speed and mobile last. Our ladder is ranked by a hand-assigned harm number and
does not follow it — and the finding Vin singled out as the best one
(*"the residential and commercial pages both open with near-identical positioning
language"*) is a MESSAGE MATCH failure, which is first in our own published
triage and near-invisible in our ranking.

### The four emails

One earned a reply, three were deleted, and the split is clean:

- **REPLY** — Gregory S. Young: *"your homepage is tracking ads spend, but when
  someone searches 'personal injury lawyer in Cincinnati' you're ranking 13th
  ... those two numbers have never been on the same screen."* A CONTRADICTION
  between two things he set up on purpose.
- **DELETE** — John Peters: *"my jobs come from Google reviews and word of mouth.
  I've booked out most weeks without a website doing anything."*
- **DELETE** — Donna Krummen: *"price transparency doesn't move the needle when
  demand isn't the constraint."*
- **DELETE** — Jose Barrera: *"they clearly don't know my patients are looking
  for a FACIAL plastic surgeon."* We measured his rank on the generic trade
  phrase, not on what he actually sells.

The three deletes all assert that something the owner does not value is broken.
PART 5 already states the rule in prose — *"a finding lands when it CONTRADICTS
something the owner did on purpose... it fails when it is merely suboptimal"* —
and nothing encodes it. **Deliberately still not encoded**: the evidence is three
real replies and this file's own rule says not to tune the email ladder until
real replies exist to tune against. It is the strongest available lever and it
should be the first thing turned on after a real send.

### Two defects the emails exposed

- **"We found 4 more like these in your market."** The count is of findings on
  HIS OWN site. "In your market" makes it a claim about other businesses, which
  we never counted anything about — attached to the one number in the email
  guaranteed to be true. It came out of the audit prompt's own worked examples,
  which is the recorded `exemplarLeak` failure, so it is refused mechanically now.
- **"Every job starts from zero and ends at the invoice on your site."** The rung
  said *"Nothing on their site sells a plan. Every job starts from zero and ends
  at the invoice"*, and merging the two sentences moved the scope phrase onto the
  invoice. `SCOPE PHRASE CHECK` executes all 33 sendable rung sentences and fails
  on a where-it-is-true phrase sitting in a sentence the writer could merge
  forward. Deliberately narrow: it does NOT demand one sentence per rung, because
  `absent_from_search` is harm 96 with reply evidence behind its wording and
  trading a proven sentence for a tidy one is a bad bargain.

### Are we ready for bulk? Not for the SEND half.

The audit half runs — about two hours for fifty leads, bound by `FC_CONCURRENCY`
at 2, not by `RESEARCH_CONCURRENCY`.

**The send half was never moved onto the job queue.** `/api/send-to-hunter` loops
over every lead the browser posts, the client posts all selected leads in one
call, and "select all" selects all of them. Per lead it can spend 30 seconds on
an SMTP verify plus two 10-second Hunter calls — so fifty leads is a
17-to-40-minute synchronous HTTP request that no timeout survives.

A send above 25 is now REFUSED, not truncated: silently sending the first 25 of
50 and reporting success is how you discover next week that half a batch never
went. 25 is also the daily rate for one mailbox, which until now existed only as
a number in a document. `SEND CAP CHECK`.

**Still open before a real bulk run**: Places will exhaust its free tier on day
five, Firecrawl Hobby on day four, and the send route wants the same job-queue
treatment research already got.

### And a check that encoded a preference

`AUDIT MODEL CHECK` asserted the audit ran on Sonnet, and went red the moment the
owner decided otherwise on price. That was a PREFERENCE written as an invariant,
and a check that fails on a decision somebody is entitled to make is one they
will delete, taking the real assertions beside it. Split: model and pricing moved
to `THINKING BUDGET CHECK`, and what remains is `AUDIT ORDER CHECK` — the
synthesis must run after the evidence exists, which is genuinely invariant.

---

