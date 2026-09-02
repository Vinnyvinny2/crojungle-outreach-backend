---
name: evidence-and-priorities
description: "KNOW: What is actually proven by real human replies (the 4.2-4.85 rating band; review pain wins but say the fault, never the source; a finding lands when it contradicts something the owner did on purpose) and the ordered list of what would move the reply rate. Use when deciding what to work on next, or whether a filter, rung, finding or email change has evidence behind it or is inference."
---
# Evidence and priorities — what is proven, and what would move it

**Goal:** After reading this, Claude can tell a proven fact from an inference before anything is tuned, and pick the next move in the proven order.

Copied verbatim from CLAUDE.md (commit b01d952) lines 10361-10383 (PART 5) and 10527-10543 (PART 7). "Working with Vin" from PART 7 stays in CLAUDE.md.

## What is proven (PART 5)

Only two things have real evidence behind them. Everything else is inference.

**The rating band.** Across 14 audited leads, every business at 4.9 stars returned
"no pain repeating across 2+ reviews" — at that average almost no negative reviews
exist to find. Every lead where the miner found a repeating complaint sat between
4.3 and 4.8, and both emails that earned a reply came from inside that band.

**Review pain wins — but say the fault, never the source.** All three replies
came from `review_pain_pattern` or `outranked_by_weaker` — a complaint in the
owner's own reviews, or a named competitor above him. Emails opening on missing
pricing, no guarantee or no lead magnet get deleted, and the owners say why:
*"that's not how I get customers."*

Read that carefully, because it is the finding that is proven and not the
wording. What earns the reply is an operational fault several of his customers
walked into — a quote that stalls, a callback nobody makes. Reviews are where we
READ it. From 2026-08-18 the sentence states the fault and never the source, and
the seven rungs that are only review METRICS never leave the building at all.

The wider pattern behind both: a finding lands when it **contradicts something the
owner did on purpose** — his customers said it twice, two things he set up
disagree, or he built a page that reaches nobody. It fails when it is merely
suboptimal.

## What would actually move it (PART 7)

In order:

1. **Fix the input supply.** Top up Apify and Firecrawl. Several recent audits ran
   starved and produced weak emails that looked like copy failures.
2. **Second mailbox, rotate, verify every address before it enters the sequence.**
   Nothing else matters if it does not land. The `fetchT` fix removes one mechanism
   that could have been starving the verifier; the next live run tells you whether
   it was the mechanism.
3. **Send 40 to one niche** — home services, 4.2–4.85 stars. That is the only
   filter with evidence behind it.
4. **Read the replies.** Not the simulator. The replies.
5. Only then: turn on the business layer. **Review velocity first** — the data is
   already in hand and never computed.

Nothing in 1–4 is a code change. That is the honest shape of this project right
now: the build is far ahead of the evidence, and the next real gain comes from
sending, not from editing.
