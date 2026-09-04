# §121 — The resolver was working; half the press was not callable, and four things were lying about it — 2026-09-04

Written 2026-09-04 for docs/history (one file per round; CLAUDE.md carries no history). Not a moved section: verify-split.sh skips it.

## 121. The resolver was working; half the press was not callable, and four things were lying about it — 2026-09-04

Vin, after the Round 119 build ran on ten leads:

> *"how are we looking overall out of 10 with the quality of leads and the find
> tab — the goal is to get the best leads. i do not like though that call volumne
> per run has dropped. make sure to be meticulous with the logs and the leads, we
> need this all perfect."*

Then: **"fix everything at the highest level."**

### The run, counted lead by lead

| lead | outcome | credits |
|---|---|---|
| Prime Plumbing & Heating | **call** — owner + SMTP-verified address, ICP 89 | 4 |
| Premier Home Pros | **call** — owner, address blocked by the verifier | 4 |
| Oklahoma Foundation Repair | **call** — owner + published mailbox | 4 |
| Austin Hi-Tech Restoration | **call** — name held back (no title), no address | 8 |
| A2Z Construction | no name — owner-run, and the one real miss | 8 |
| American Driveway of Charlotte | no name — layered, nobody named anywhere | **14** |
| System Pavers | no lane — 600+ staff, over the cap, branch network *(correct)* | 0 |
| 1-800 Water Damage KC North | dropped — franchise territory *(correct)* | 4 |
| Delta Solar Power | no name — **no working website** | 1 |
| American Dream Solar & Window | no name — **no working website** | 0 |

**47 credits over 10 leads = 4.7 a lead**, against 7.8 two runs ago and a 6.6
target. (I told Vin 4.3 in chat; 4.7 is the right figure.)

**The resolver was not the problem.** Of the **five owner-run leads it could work
on, four were named — 80%, exactly the target.** Call volume fell because half
the press was businesses that can never be call leads by their shape. So the work
was: put the leads we CAN sell to in front of the rep, stop paying for the ones
we cannot, and stop losing good ones to blips.

### A. The one route left after the ladder fails was switched off on the leads where it failed

`server.js` gated the marketing-lead lookup on `_layers.verdict === 'layered'`
and nothing else. So `findMarketingLeadViaHunter` — **one Hunter credit, zero
Firecrawl** — and the free roster pick both stood down unless the business
happened to have an org chart.

**A2Z Construction is that exactly**: owner-run by its own pages, eight credits
of paid searches, `NO decision-maker found in any source`, and **Hunter was never
asked**. The gate was asking whether THEY are layered when the question that
decides the spend is whether WE have anybody. `bug-classes`' "a guard in the
wrong function".

And `targetFor` threw the answer away even when it had one: an owner-run business
with nobody named returned *"nobody reachable was found"* while holding a name
and a title. It now says what is true — a real human at director level, ask them
who owns it — and PART 3 is untouched: that person cannot sign, and `canBuy`
stays false.

### B. No website, a phone, and hundreds of reviews (Vin's ruling)

Delta Solar Power (232 reviews) and American Dream Solar (305) sat in No-name-yet
where the rep never saw them. They can **never** be named: with no pages the
roster parser, the model read and the regex backstop all refuse on their first
line, and the paid wave sits behind the dead-site return. *"Wait for a name"*
meant *never*.

They go on the call sheet, ranked last, only with a number to dial, and the row
says why nobody is named. The finder already keeps this shape deliberately — its
own comment reads *"a plumber with two hundred reviews and no website is the most
obvious problem in the entire pipeline"* — and Round 112's "the call lane means a
named owner" had been quietly swallowing them. **This press: 4 call leads would
have been 6.**

### C. A dropped connection is not an answer

Three transport failures in one press, none retried, none even told apart from a
result.

`DM/brain failed: request to [the Anthropic endpoint] failed, reason:` lost the
owner for that lead **and** threw away the Firecrawl pages already bought for its
corpus, because the catch returns `null` — indistinguishable to every caller from
"no owner on this page".

`firecrawlSearch error: connect ECONNREFUSED` (twice) returned `[]`, which every
caller reads as *"we asked the web and it has nothing"* — and a total miss then
writes a **fourteen-day negative memory** keyed on `domain|city`. **A blip was
blocking a real business from being searched again for a fortnight.** That is
PART 3 exactly: an absence claim requires that we actually looked.

The classification already existed, inline in `verifyEmailSMTP`'s catch — the
only place in the file that could tell `ENOTFOUND` from `ECONNREFUSED` from a
slow handshake. `transportFailure` is declared once and read by both. A TIMEOUT
is deliberately **not** in the set: it already carries meaning at a dozen call
sites and retrying one doubles a wall clock that is usually already the problem.

`fetchTr` wraps the one outbound door with exactly one extra attempt; `fcCall`
and the model door both go through it. `firecrawlSearch` carries **"we could not
ask"** on a non-enumerable property beside its empty array — so nothing that
iterates a list has to change and nothing that asks *did we look?* gets the wrong
answer — and the negative memo refuses to remember an absence it never measured.

### D. The reviews we paid for and binned — code, not a Render setting

The log told the operator to raise `REVIEW_CORPUS_CHARS`, and I repeated that to
Vin. **Both were wrong.** `buildReviewCorpus` sized the clip as
`floor(budget/n) − 18`, and the 18 pays for the star prefix and the row separator
and nothing else — while `formatReviewForMining` **appends**, on every review that
has one, `"Response from the owner: "` plus half the clip again. At clip 382 that
is another ~217 characters, more than half a row.

So on any lead whose owner answers their reviews the corpus overshot and the tail
was dropped: **15 of 90 on System Pavers** (replies on 74 of 75) and **9 of 90 on
A2Z** (68 of 81). The clip is solved against the row it actually builds now, with
the reply share **measured** and the constants taken from the row.

**Every fixture in `REVIEW CORPUS CHECK` built its reviews with
`ownerReply: ''`** — including the 90 × 2000-character case, which is that lead
exactly except for the replies. The check was green throughout. Two fixtures that
can reach it were added; reverting the arithmetic now reports *"32 of ninety
reviews were bought from Apify and never shown to the model"*.

### E. A ceiling on one lead (Vin's ruling)

There was none. `FC_LEDGER` recorded spend and every read of it was a report —
no comparison on that field existed anywhere in the file. The only ceiling was
the whole-day budget, checked once at route entry.

`FIND_LEAD_CREDIT_CAP` is **10**, shaped like the day ceiling beside it: it stops
the NEXT purchase and never unwinds one already made, so a lead finishes **early**
rather than half-finished. Both paid doors consult it, the row carries what was
skipped, and the `OWNER WAVE` line says `CAPPED:` with the list.

Two orderings in the same pass:

- The **size wave fired even when the owner wave had already found nobody**. A
  size decides the tier and the tier decides the lane, and a lead with no name has
  no call lane to be sorted into — 4 of American Driveway's 14 credits.
- The **"stop reading once their pages name an owner" rule was gated on the pages
  being FREE**, so it never applied where each page costs a credit. Backwards.

### F. An UNKNOWN catch-all closed a route our own log promised

Premier Home Pros: a real owner, a real domain, and the address shipped as a
blocked guess. The catch-all probe's second sample hit the 30-second cap, so it
returned `null` — UNKNOWN — correctly. But the consumer reads
`catchAll === false`, and that **one gate** wrapped the pattern probes, the
nickname pass, the house pattern, the company-mailbox probe **and the Hunter
email-finder, whose own guard is already `catchAll !== true`** and would have
admitted `null` perfectly well.

And the SMTP timeout line tells the operator, in as many words, that *"it does
NOT block the send: the address falls back to Hunter verification and to the
learned-pattern route."* **That sentence was not true on this path.** A false
sentence about our own system costs exactly what a false sentence about a
prospect costs.

The Hunter finder moved below the SMTP-gated block: on a known-good domain
nothing changes (the free and probed routes still run first and return before
it), and on an UNKNOWN domain it is finally reachable. UNKNOWN is also cached for
ten minutes — it used to return without caching, so every later lead on the same
domain re-paid two probes and up to sixty seconds.

### G. BBB, retired on the condition its own comment set

Round 117 wrote the rule: *"if the next batch is still 403 on every attempt the
rung is retired rather than kept as a line of log noise."* The next batch was
**four attempts and four 403s — eight of eight across two batches**, on the build
that already carries the full Chrome header set. That is BBB refusing Render's
address, not our User-Agent. Off behind `BBB_PROFILE`, not deleted: the parser and
the URL-finder are untouched and still asserted in full, and it says so **once per
process** instead of once per lead.

### What the falsification found in the checks themselves

**Twenty-five reverts, each fix alone against a green baseline, each RED on its
own named check, each restored byte-for-byte.** Three things it caught that
reading could not:

1. **A guard that could not fail.** `if (!l) return false` in the cap refusal —
   its revert stayed GREEN, because `leadCapHit` already answers no without a
   store. Deleted rather than kept, with the reason at the line.
2. **A positional check that could not fail.** The first ADDRESS ROUTE CHECK
   anchored on a comment, and the source it reads has comments **stripped** — so
   the index was −1, `lastIndexOf` searched from zero, and the whole assertion
   passed on a build with the block moved back inside. Two more attempts also
   passed (brace-position matching found the Hunter block's own brace; nesting
   depth counts braces inside strings). What "inside" means in that function is
   **indentation**, and that is the test.
3. **A fix with nothing pinning it** — the free-settle change, until its own
   needle was added.

Boot checks **280**, all gate stages green.

### Still owed by hand

`index.html` did **not** change this round, so there is no Netlify drag-in.
Render redeploys on merge. The email-verifier top-up is still outstanding; the
per-domain probe refusals it was blamed for are handled here.

**Grep the next run for:** `HUNTER MARKETING` (must now appear on owner-run leads
with no name), `LEAD CAP`, `could not ask`, `⛔ REVIEW CORPUS` (must be absent),
and the site verdict on the two website-less shapes. Targets: credits a lead
≤ 6.6, call leads up on 4 of 9, no lead over 10 credits.
