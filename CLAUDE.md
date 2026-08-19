# CROJungle Outreach — everything you need to know

One file. Business context, how the system works, what is broken, what to do next,
and how to work here without breaking it. Read it all before touching anything.

---

# PART 1 — WHAT THIS IS FOR

## The business

CROJungle is a marketing and technology agency. Three founders: **Vin** (builds and
owns this system), **Mike Taft** (CEO, takes every sales call), **Muhammad Junaid**.

**What they sell:**

| Product | Price |
|---|---|
| Website rebuild | $50k+ |
| AI Brain | $40–70k |
| Custom AI software | $40–100k+ |
| Revenue/marketing retainer | $10–35k/month |
| Exit/valuation advisory | varies |

Every product is a five-figure engagement. **This matters more than anything else
in this file** — a finding that leads to a $200 fix cannot become a conversation
about a $30k retainer, no matter how true it is.

## Who they sell to

Founder-led businesses, $800k–$15M revenue, 10–200 employees, where **the owner
personally feels the marketing problem and reads his own email**. Home services,
trades, and owner-operated professional practices.

Not corporate. Not committees. One person who can say yes.

## What this system's job actually is

```
Find a business  →  Audit it  →  Write one cold email  →  Send it
                                                            ↓
                                                       HE REPLIES
                                                            ↓
                                                    Mike takes the call
```

**The email's only job is to earn a reply.** Not to sell, not to book, not to
diagnose. Mike does the diagnosis on the call — he asks about goals, growth,
financial constraints. The email exists to make one busy owner think *"how do they
know that?"* and write back.

Judging the email against the standard of a discovery call is a category error. It
is a door knock.

## What a good email looks like

This one earned a reply:

> Michael, I noticed you've built something real here: 341 reviews at 4.9 stars,
> and you're actually responding to nearly all of them. That's rare. Here's what
> caught my attention though — the only way anyone can reach you is a phone call
> during office hours. With cases running several thousand dollars, that's a lot
> of friction for someone trying to take that first step. I've written up three
> things on this. Want me to send them over?

Five moves: **a person who looked → one judgement given freely → the turn → the
cost in human terms → a small ask.**

And a real prospect who replied told us what nearly lost him:

> "If they'd led with 'a business with fewer reviews outranking you for your exact
> local search term' instead of the review count, I'd have opened this in 30
> seconds instead of almost deleting it."

The finding belongs in the first twelve words. Reply rate is decided there.

---

# PART 2 — HOW IT WORKS

## Stack

- `server.js` — ~29,800 lines, Node/Express, Render, auto-deploys from GitHub
  (`Vinnyvinny2/crojungle-outreach-backend`)
- `index.html` — ~10,200 lines, compiled React on Netlify. **`React.createElement`
  only, no JSX, no build step**. It deploys separately and is NOT in this repo —
  see the note at the end of PART 6.
- Supabase for persistence
- Hunter for sending — sequence 859908, `vinny@crojungleteam.com`, 25/day,
  Mon–Thu 8am–1pm ET
- APIs: Google Places (discovery), Firecrawl (site scraping), Apify (review
  mining), Anthropic Haiku (audit + email), Hunter, MyEmailVerifier

## The pipeline

**FIND** — Google Places across ~40 trade categories and 20 metros. Filters before
spending anything:
- Rating band 4.2–4.85 (see PART 5 — the one filter with evidence)
- Franchises and businesses too large are dropped
- No website at all → kept, marked `leadChannel: 'call'`
- Free page builder (`business.site`, `wixsite.com`) → marked `rebuild`
- Multi-market operators get a coverage count; absence is only claimed within 120
  miles of a market they already appear in

**RESEARCH** — resolves the real owner (corroborated across site, business name,
licence records, web search), scrapes their pages, mines up to 150 Google reviews
for repeating complaints, measures local rank twice for stability, reads their
Google profile.

**AUDIT** — the "brain" reads 24,000 characters of their own pages plus every
measurement and writes the narrative. Produces `originalFindings` (quotes from
their actual copy) and a `situationRead`.

**GENERATE** — the harm ladder ranks 39 measured findings, `buildFactualSpine`
assembles one verified sentence, and the writer turns it into an email. A prospect
simulator then reads it as the owner and returns reply / ignore / delete.

**SEND** — Hunter sequence, verify-at-send, 4 touches over 17 days.

## Key components in server.js

- `fetchT` (~line 131) — every outbound call in the system goes through it. See
  the note in PART 6 about why a defect here reads as "that API is flaky"
- `HARM_LADDER` (~line 9300) — 41 rungs, each with `test`, `say`, `costs`, and
  scores for harm / specific / novel / delegable / weFix / sellable
- `resolveMeasurements` — everything the ladder reads
- `rankHarms` — ordering, with adjustments for purchase urgency, referral
  acquisition, Hormozi binding layer, and commercial weight
- `buildFactualSpine` — the one verified sentence
- `buildEmailEvidence` — splits what the writer may **ASSERT** from what is
  **CONTEXT**. This split is the safety: more information without it is more room
  to invent
- `INTERNAL_ONLY_RUNGS` — the seven review-METRIC rungs. Measured, scored,
  ranked, in the audit and on the call sheet; never in an email. Reviews are how
  we read the business, not what we say to the owner
- `plainEnglishFaults` / `readingGrade` — the readability gate over the ladder's
  own sentences. The five sentences retired for being unreadable are kept in
  `READABLE FINDING CHECK` as negative fixtures, so the wording cannot come back
- `verifyBrainEmail` — 26 fabrication families, the last gate before sending
- 145 boot checks at the bottom, each documenting the live failure that caused it

## Key components in index.html

- `leadToRow` / `rowToLead` (~line 200–560) — the ONLY door between Supabase and
  the app. Supabase is the source of truth; localStorage is a convenience cache
  that is deliberately not allowed to take the truth down with it. Every field
  the app needs after a reload must survive `rowToLead`, and this function has
  now produced nine separate duplicate-key collisions, each one silently blanking
  data that had just been loaded correctly

---

# PART 3 — THE RULES THAT ARE NOT NEGOTIABLE

**A sentence he cannot read is not a true sentence.** Eleven gates ask whether a
claim is TRUE and, until 2026-08-18, none asked whether the owner could read it.
The result was a live email whose every phrase had been chosen to survive a
fabrication gate — "set up to track Google Ads clicks", "the first page of the
map results", "a paid position stops the day the budget does" — and which Vin
read as *"jargon, I don't even understand it fully."* Precision nobody can
collect on is not precision: he cannot check a fact he cannot parse.
`READABLE FINDING CHECK` measures reading grade, abstract subjects, dangling
pronouns and agency phrasing on every sentence the ladder can send, scoring OUR
words only — his trade name and the search in quotes are his own vocabulary.
Ceiling is grade 12; the honest build now tops out at 10.2.

**Nothing false may reach a prospect.** Every number in an email traces to a
measurement in `permittedFigures`. Vin's governing principle, in his words:

> "Legit info is everything — NEVER fabricate. I'd rather send nothing than tell
> them something's wrong when it isn't."

**Code assembles facts; the model writes prose around them.** Never the reverse.

**Instructional guards do not hold.** The prompt banned post-submission claims 19
times and every audit produced one anyway. Guards must be mechanical.

**Absence claims require that we actually looked.** `EXISTS BUT UNREAD` exists
because a live email told an attorney with a Reviews page that he had no reviews on
his site.

**The owner is the buyer.** Owner / CEO / President / Managing Partner can buy. VP
and below is blocked. A perfect email to the wrong person is worse than no email.

**A check that cannot fail is not a check.** See PART 6.

---

# PART 4 — WHAT IS ACTUALLY WRONG

The code is not the problem. These are the reasons the system has produced 3
simulated replies and 0 calls.

## 1. Nothing has a clock on it

Every lead logs:

```
[LANE] no job-posting signal — there is NO measured buying window.
```

Thirty-plus leads, zero exceptions. 92.5% of discovery is Google Places.

**Correction, 2026-08-13.** This paragraph used to say Adzuna, BizBuySell, SEC
EDGAR and Google News "produce essentially nothing," and that was wrong about two
of them. It was written from the absence of the LANE line rather than from the
sources' own logs, which is the same mistake as reading a Firecrawl refusal as an
empty page — judging a source by a symptom downstream of it instead of by what it
actually returned.

- **SEC EDGAR works.** Live: `SEC EDGAR: 13 from 39 hits (investment funds
  filtered out)`. Thirteen operating companies per run. Low volume and the high
  end of the ICP — a Form D filer is a business that raised private capital — but
  it is a real lane, not a dead one.
- **TheirStack replaced Adzuna** and returns size-verified SMBs. Adzuna is the
  one that produced nothing; TheirStack is the live source and it is the trigger
  lane worth investing in.

So the gap is NOT "we have no buying-window sources." It is that the sources we
have are not targeted at what we sell, and the signal they return is flattened
into one hardcoded shape before anything downstream can read it. Check a source's
own log line before writing it off.

The distinction the system does not make: **primary pain** is the ongoing condition
(thin reviews, no pricing, slow growth); **catalytic pain** is the event that puts
a clock on it. Every finding here is primary. An email about an ongoing condition
competes with the whole inbox; an email about something that changed last week does
not.

Largest gap. It is a Find-layer problem, not a copy problem.

## 2. The findings sit three levels below what is sold

41 rungs now, classified: 8 reviews (SEVEN OF THEM INTERNAL-ONLY — see the
second correction below), 14 website mechanics and intake, 5 Google listing
fields, 5 search visibility, 4 positioning/offer, 3 operations, 4 money already
committed. Mike sells
revenue and operations. The distance between "your pricing page is missing" and a
$10k/mo retainer is what the owner experiences as *so what*.

**Every reply came from a review rung or from `outranked_by_weaker`. Zero from a
storefront finding.**

**Correction, 2026-08-18 — why the emails kept reading as being about reviews.**
This was diagnosed for weeks as a supply problem (too few business rungs) and it
was mostly two mechanical faults on top of it, both now fixed:

- `outranked_by_weaker` is a RANKING finding and two of its three subject lines
  said "your reviews are broken". A construction company and a plastic surgeon
  received the identical pair on one afternoon. The headline also contradicted its
  own body, whose point is that the business above them has FEWER reviews.
  `SUBJECT REGISTER CHECK` now fails the boot on review vocabulary attached to a
  non-review finding.
- The one-review-touch quota counted rung IDs and DEFERRED extras to the end of
  the array, where they shipped anyway — a no-op whenever the non-review pool was
  empty. It now runs on the four rendered touches. A touch counts as a review
  touch when the finding is about reviews or the subject says so, and deliberately
  NOT when a non-review finding merely cites a review count: "a business with
  fewer reviews than yours is ranking above you" is the sentence Chuck Jenkins
  said would have made him open the email, and an earlier version of this quota
  spent the budget on it and deleted the real review finding behind it.
- And the follow-up pool was sorted by raw harm. `NOT_SELLABLE_OPENER` bars seven
  review rungs from LEADING while `SELLABLE` scores those same rungs 5, so they
  take none of the 44-point penalty, sit at the top of `byHarm`, and take slots
  two, three and four. Barred from the opener, first in line for everything after
  it. Follow-ups now prefer findings we can sell against.

Measured across the three leads of the 2026-08-18 run: 3 review touches of 12,
down from 8 of 12; review-worded subjects 1, down from 7.

**Second correction, same day — reviews are INTELLIGENCE, not copy.** The three
fixes above reduced how often reviews appeared. They did not answer the real
question, which Vin put like this: *"reviews are more of an internal sign for us
into their business. I don't think we should be mentioning them directly
externally — that's like giving our cards away in poker. We should definitely
reference the findings externally, not actually mention where they came from."*

He is describing two jobs the system had collapsed into one:

| | |
|---|---|
| **INTELLIGENCE** | 150 mined reviews, the reply rate, the arrival rate against years traded, the newest date. The cheapest read we get on how a business actually runs, and what Mike should have in front of him on the call. |
| **COPY** | a sentence a stranger reads. Here the same material is actively harmful: there is nothing to sell, it hands over our method, and it asserts a theory of his business that is false. |

So there are now three mechanisms, each closing a route the other two cannot:

- **`INTERNAL_ONLY_RUNGS`** — the seven review-metric rungs (`review_deficit`,
  `not_compounding`, `review_velocity_drop`, `no_owner_replies`,
  `partial_owner_replies`, `stale_reviews`, `low_rating`) are measured, scored,
  ranked, written into the audit and put on the call sheet, and can never reach
  an email. Stronger than `NOT_SELLABLE_OPENER`, which barred only the first
  line and let all seven take follow-up slots two, three and four.
- **The two review-derived findings we DO send were rewritten to state the thing
  itself.** `review_pain_pattern` now leads with the fault — *"quotes that never
  come back — 6 different people have described the same thing publicly"* —
  never with where it was read. Its blind line, reframe and subject fallbacks
  were all naming reviews too and all three were rewritten.
- **`verifyBrainEmail` refuses a review word the MODEL introduced.** The audit is
  full of reviews and should be; this is the only gate between that and the
  inbox. A review word is permitted in the body only if the same word appears in
  something CODE assembled — the spine, the recognition line, or the ASSERT
  list. That keeps the one sentence built on review counts on purpose (see the
  ranking finding below) and refuses everything else.

`REVIEWS ARE INTERNAL CHECK` fails the boot if any of the three drift apart.

**And the system believed reviews drive Google rank.** Vin: *"it seems like the
system believes reviews are what make your rank higher. Google factors many
things — answer rate etc."* He was right and the cause was one clause in the
research brief, sent to the brain on every lead: *"Google reviews are also what
local rank is computed from."* That is false — the local pack weighs relevance,
distance and prominence together, and reviews are one input among many. One wrong
sentence in the brief made every audit downstream read reviews as the lever that
moves rank, which is why four consecutive runs produced review-shaped emails. The
clause now says the opposite and says why: if a business with fewer reviews ranks
above them, the correct conclusion is that reviews are demonstrably NOT deciding
that search — something else is, and naming the gap is the sellable conversation.
`outranked_by_weaker`'s reframe carries the same correction into the email.

Still true, and still the real ceiling: the site-derived rungs all share "did we
look?" absence guards, so a thin Firecrawl scrape silences them together while the
review and rank rungs — fed by Places and Apify, which never fail together — keep
firing. Fix the input supply and the balance improves on its own.

**Two new SPENDING rungs, 2026-08-18**, both from data we already pay for:

- **`paying_for_a_search_they_lose`** (harm 94) — a Google Ads conversion tag in
  their own page source AND a measured map position outside the top three. Vin's
  own framing: *"we see you're running ads and still not in the top 3 — this is
  like flushing money down the toilet."* Bounded three ways: the tag proves an
  ads ACCOUNT, never a live campaign; the position is stated as a BAND, never a
  digit, because the digit moves between runs; and no cause is named for the
  position. Two facts he can check in a minute, and the contradiction does the
  work.
- **`social_spend_no_search`** (harm 70) — Meta pixel present, no Google Ads
  tracking on the pages we read. An absence claim, so it carries two gates: we
  must have actually read the markup, and a Google Tag Manager container must be
  ABSENT — a GTM container can hold an ads tag we cannot see, and telling an
  owner he is not doing something he is plainly doing is the fastest way to lose
  him. `hasTagManager` was added to the site fingerprint for this.

Measurable and not being measured, each closer to the product:
- **Duplicate Google listings** — splits reviews and ranking, invisible to the
  owner, risky to fix alone, and explains the outranked finding.
- **Mobile page speed** — free via PageSpeed API, never called.
- **Careers page** — built, rarely fires, closest available signal to what Mike
  sells.

**What Vin asked for that is NOT built, and why.** Reported honestly rather than
approximated:
- **"Are their ads going to landing pages?"** We cannot see an ad's destination
  URL from anything we buy. `paid_traffic_leaks` covers the adjacent measurable
  fact — they run ads and the only published route in is a phone line or a form.
- **Traffic → conversion math** (*"x traffic × average conversion × price point
  = x per month"*). We have no traffic source; SimilarWeb and Semrush are paid.
  Any number here would be invented, which is the one thing this system does not
  do. The permitted money move is already in the brief: state the value of ONE
  job in their trade and let him multiply.
- **Google LSA / organic placement** — we measure the map pack only. Adding
  either is a new paid data source, not a code change.

## 3. Deliverability is unproven

One mailbox. 2 hard bounces in ~12 sends. Both from addresses the system itself
labelled "pattern-built, not confirmed" and marked sendable.

A hard bounce is charged to the sending **domain**, not the lead. There is now a
verify-at-send gate but it is untested at volume. Vin has a second domain
available and is not yet rotating.

### The SMTP verifier is NOT broken. Settled from live Render logs, 2026-08-11.

Two earlier explanations were both wrong, and the log line itself is what made
them believable:

- **"It times out on every call."** It does not. `SMTP-verified (mailbox exists)`
  appears all over the logs — Property Masters, Midwest Remediation, Jeffrey D.
  Horn, David L. Leon, Capizzi MD, Jenkins & James, George Plumbing, Rose Hill,
  Karim Ali, Anthony & Sylvan.
- **"Render cannot reach `client.myemailverifier.com`."** It can. `isCatchAllDomain`
  calls the same `verifyEmailSMTP`, and `Catch-all probe [douglasaquatics.com]:
  normal domain (SMTP trustworthy)` requires TWO answered calls seconds apart.
- **A socket leak in `fetchT` starving it.** Ruled out: fresh instances fail on
  their first verify, and other calls on the same instance succeed. The `fetchT`
  leak was real and is fixed, but it was never the cause of this.

What is actually happening: the verifier runs a live SMTP conversation with the
**recipient's** mail server. Some hosts — typically hardened Microsoft 365
tenants — stall or silently drop `RCPT TO` probes specifically to defeat address
harvesting. Those domains hang until our cap fires. It is per-domain and normal.
`jameshardyplasticsurgery.com`, `justindoylehomes.com`, `emilytaylorlaw.com`,
`romoskitchenandbathremodeling.com` and `hannahcustomhomes.com` all behave this
way; most other domains answer fine.

**And it blocks almost nothing.** Across every run visible in the logs, each
`EMAIL RESULT` reads `sendable: true`. `emilytaylorlaw.com` timed out at
22:58:43 and resolved `Verified by Hunter + SMTP | sendable: true` twenty-two
seconds later. The two `BLOCKED` lines in that window are the different
"no pattern resolved on a normal domain" path, not a verifier timeout.

**The real defect here is the log line, not the code.** It ends "Until this
succeeds every address stays T4 and NOTHING can be sent, so this one line is the
whole send path" — which is false in the common case, fires on a routine
per-domain condition, and is the single reason deliverability has been carried at
the top of this file as a blocker. A message that overstates its own severity
costs exactly as much as one that understates it: it bought a rewrite of the
timeout logic and a place on the roadmap that the evidence never supported. If
that line is reworded, say plainly that the address falls back to the other
routes, and reserve the alarm for the case where every route has failed.

## 4. Zero human validation

Twelve emails sent. **No human has ever replied.**

Everything judging quality — the prospect simulator, the ladder ordering, the
sellable weighting — is the system judging itself. The simulator has returned
opposite verdicts on the same lead one build apart, so single verdicts are not
evidence.

At a normal reply rate, twelve sends produce zero replies most of the time. **The
quality question cannot be answered by code review.** 40 sends to one niche is the
smallest number that means anything.

## 5. External services fail silently and look like bugs

- **Apify** returned HTTP 200 with 5 reviews for a 116-review profile. No 402 to
  catch. Read as real it becomes "no repeating complaint" — the strongest finding
  in the system, silently deleted. Now guarded; the class is general.
- **Firecrawl** returns empty on nearly every homepage. Falls back to plain-text
  salvage at ~⅓ of the corpus, which is likely why `originalFindings` survives at a
  low rate.
- **SMTP verifier** times out at 30s on every call.

Both Apify and Firecrawl were out of credits at the end of the last session. **Any
judgement about email quality made on those runs is invalid.**

## 6. The same business measures as two different businesses — FIXED 2026-08-19

The ladder is a calculator: identical measurements produce an identical email
every time. So "email quality varies a lot" was never the ladder. It was four
places where a second look at one business returned different numbers, plus a
writer running at full randomness. All five are closed and guarded by
`MEASUREMENT STABILITY CHECK`, which was falsified against a build with each fix
reverted.

- **The writer had no temperature**, so every model call ran at the API default
  of 1.0. Pressing Generate twice on one lead does not re-research anything — it
  reuses the stored audit — so that call *was* the variance. Worse than wording:
  several gates are properties of the DRAFT (over 150 words, a sentence over 32),
  so the draw decided whether the owner got the written email or the flat
  template. Pinned to 0.4 on the writer and its rewrite. Deliberately not 0:
  `WRITER BRIEF CHECK` records that over-constraining this writer produced "the
  composed email with the punctuation tidied", which is the flatness. The audit
  brain and the prospect simulator are left at the default on purpose.
- **Suppressing an unstable rank removed the traffic damper too.** Eight
  conversion-side rungs scale harm by position; when rank was stripped for the
  copy, `Number(null)` was 0 and 0 is finite, so a null rank read as position
  ZERO and `broken_page` scored **99 against a base of 95**. The care mechanism
  was promoting findings past both ladder floors. Position now travels as
  `rankForScoring`, which no rung sentence may read.
- **Absence was decided on one Places draw.** `absent_from_search` is harm 96 and
  `checkLocalRankStable` returned early whenever the first sample missed, so the
  strongest sentence in the system was the only measurement with no second look.
- **The service-page searches hung on `rank > 5`** — samples of 5 and 6 skipped
  them, 4 and 5 bought them — and those three queries are the only source of
  `service_invisibility`.
- **The Apify truncation guard had an absolute cap of 8 rows**, so 20 reviews
  from a 116-review profile passed as a complete read.

## 7. The audit was blind on leads where we were holding five pictures

Claude Reynolds, live: Firecrawl returned the homepage as a **palette PNG**,
`pngscale.js` read only RGB and RGBA, and the caller treated a missing homepage
as fatal — so four already-paid-for interior renders went in the bin with it.
`BRAIN INPUT: 0 image(s)`.

The scaler now reads every shape a renderer emits (palette 1/2/4/8-bit with PLTE
and tRNS, greyscale, greyscale+alpha, RGB, RGBA) and still refuses interlaced and
16-bit by name. A missing homepage no longer discards the interiors; every image
is labelled; and the prompt line claiming a screenshot was attached is computed
from the message actually sent, not from a URL — on that lead it told the model a
screenshot was attached while another line of the same prompt correctly said
there was none.

**And the scaler was already an OOM risk.** Measured peak RSS was **330MB on a
1920x8336 render and 382MB on 1920x11189**, against Render's ~256MB. Buffers live
outside the V8 heap, so `--max-old-space-size` never bounded them and
`BOOT HEAP CHECK` could not see them. Worst case is now 218MB. **If you add
anything that decodes an image, measure RSS, not heap.**

`SCREENSHOT SCALER CHECK` builds eight PNG shapes and pushes them through the
real function. Nothing in this file had ever executed `fitWithin` — the only
guard was a source-regex asserting the call site exists, and it passed on the run
that lost every image.

## 8. Why every audit reads the same

`originalFindings` are the only thing that differs between two audits, and the
historical survival rate is ~11%. The corpus they are verified against was
`sitePages.rawText || trustedContent` — an **OR**, so the HOMEPAGE dropped out of
the corpus the moment any interior page was scraped. Five of the eight worked
examples in the prompt quote the homepage. A finding quoting their own homepage
tagline was therefore dropped as "does not appear on any page we read".

Mined review evidence is now in the corpus too: a review-derived finding was
being checked against web pages it could never appear on, which is a category
error rather than a threshold. Nothing is loosened — the rule is still "we hold
the words you are quoting".

## 9. Cost — and a correction about the cache

`cacheRead=0` on a BRAIN COST line does **not** mean the cache is broken. That
line's own text says "cache WRITTEN (first call — reads are 10% from here)", and
`BRAIN_STATIC` is 64,000 characters with exactly one interpolation
(`FACT_DISCIPLINE`, itself static), so the cached prefix is byte-identical across
leads and the cache works. Read the whole log line before concluding.

The real cost shape, from a live lead at **$0.1148 across 8 calls**:
- the brain audit is **66%** of it — 31,228 fresh input tokens, of which
  **22,040 is evidence text sent uncached on every lead**
- the other seven calls total ~$0.039

So the lever is the size of the evidence block and the number of calls, not the
cache. Cutting evidence trades directly against audit quality, so it is a
decision to take deliberately rather than a bug to fix.

## 10. The writer was judged on thirteen rules and told about three — FIXED 2026-08-19

On three of the four leads in the 2026-08-19 run the model's draft was refused,
the rewrite was refused too, and the flat composed template shipped. That
template is the output that gets called garbage every time it is seen, so this
was not a tidiness problem. It was the email-quality problem on those leads.

Every refusal named a rule that appeared in neither prompt:

| lead | first refusal | second refusal |
|---|---|---|
| Aire-Flo Heating | RANKING CAUSATION | OWNER SELF-LOOKUP CLAIM |
| Big Ben's Tree Service | a paragraph of 5 sentences | invented the figure "40" |

Two causes, both the recorded disease of two hand-kept copies of one rule:

- **The fact-checker refuses 27 phrasings in 13 families and the brief summarised
  three of them.** The eight families added since the summary was written —
  ranking causation, owner behaviour, owner self-lookup, customer behaviour, the
  unmeasurable "near me" query, the invented timeline, the invented comparison,
  the prospect claim — were enforced in silence. Both briefs are now GENERATED
  from `BACKEND_CLAIM_PATTERNS`, so adding a row adds a line to the brief. The
  banned SAMPLE sentences are deliberately not disclosed: the brief's positive
  examples have come back as copy word for word in live sends, which is what
  `exemplarLeak` exists for.
- **`rewriteEmailWithBrain` has taken `parts` as its first argument for its whole
  life and never read it.** The second attempt received the draft and one
  sentence. The permitted figures, the finding, the ask, the twelve-word opening
  tokens and the banned vocabulary were all sitting in that argument, unused —
  which is why a rewrite asked to fix a paragraph break wrote a plausible "40".
  Its one shape instruction was "50-90 words" against a gate that refuses under
  25 and over 150, so every rewrite was told to cut a correctly-sized email
  roughly in half, on the one path whose entire purpose is to rescue it.

Both prompts are now built by pure functions (`buildWriterBrief`,
`buildRewriteBrief`) that a boot check executes, rather than assembled inside the
API call where the only possible guard is a regex over the source. The compose
route builds ONE brief object that the writer and both rewrite paths read.
`WRITER RULE DISCLOSURE CHECK` fails the boot if any family the gate refuses is
missing from either prompt.

**And two more first sentences that nothing was reading.**

- **The insight line had no readability gate.** It is the first sentence of every
  composed email, and Aire-Flo's opened *"Phone-only intake without an automated
  response or after-hours capture layer"* — grade 14.3, audit prose written for a
  briefing. Eleven gates asked whether the ladder's sentences are true and
  `READABLE FINDING CHECK` asks whether an owner can read them; the line sitting
  ABOVE them in the same email was exempt from both the reading-grade ceiling and
  the shared fabrication table, carrying a private list of eight rules instead.
  It now runs both.
- **The cost-first skeleton opened on a pronoun with nothing behind it.**
  Variant B, live: *"Aaron, right now somebody looking for exactly this is picking
  from the names above you."* Exactly what, which names — both point at the
  finding, which was in the next paragraph. Every cost line in the ladder is
  written as the so-what that FOLLOWS the fact, and eight of the thirty break this
  way, including both SPENDING rungs and `outranked_by_weaker`. The fact goes
  first, as it already does in the other three skeletons.

**And a boot check that cried wolf on every deploy.** `FIRECRAWL GATE CHECK`
reported `gaps were [95, 350, 350, 350, 351, ...]` on a gate that was exactly
right: it timed each job's BODY, one microtask after the gate released it, and
boot starves the first microtask by a quarter of a second. An earlier pass had
added 20% of tolerance and written a comment explaining that the ruler was wrong;
tolerance is not a fix. The gate reports its own dispatch times now and the floor
is the exact setting.

---

## 11. Discovery was costing real money and nothing measured it — FIXED 2026-08-19

Vin's July Google Cloud invoice: **$48.83, SKU "Places API Text Search
Enterprise"**. August was on the same track. He had assumed Places was free and
briefly removed the billing account, which is worth knowing on its own: Maps
Platform requires a billing account **even to use the free allowance**, and
without one the rank check and the profile read both return "not checked" —
silently deleting about eleven of the forty-one measured signals, including both
findings that have ever earned a reply.

**Why it is the Enterprise SKU, and why that is correct.** Asking Places for a
star rating, a review count or a website URL puts the whole call on Enterprise,
whose free allowance is **1,000 calls a month**, not 5,000. All three earn their
place — the 4.2–4.85 band is the one filter with evidence, the review count is
the affordability proxy, and the website read routes a lead to CALL or REBUILD
before a penny is spent. The tier is not the defect.

**The defect was that the grid had no memory.** Every run shuffled 40 categories
against 20 cities and dealt 100 queries at random, plus up to 80 more pages.
Places answers each query with its twenty most prominent businesses *in the same
order every time*, so the twelfth run re-asked a search the third had already
drained, paid full price, and threw every result away as already owned —
`skippedAlreadyOwned` has been in the log line for weeks.

A category+city pair now rests after **two consecutive runs returning nothing
new**, for **30 days**. Four failure modes are closed by construction:

- a query that **errored** is not exhausted ground (one bad network moment would
  otherwise rest a live market)
- a query blocked by **`PER_CAT_CAP`** is not either — it returns nothing new
  from ground that is untouched
- it can **never return an empty run**; if everything is resting the stalest are
  admitted anyway and the log says so
- it does not undo the **stratification** — freshness orders the cities inside a
  category, the round-robin deal across categories is untouched

Supabase unreachable or the table missing produces an empty map and today's
behaviour exactly. **It needs a table:**

```sql
create table places_query_state (
  q text primary key, cat text, city text,
  last_run timestamptz, runs int default 0,
  last_new int default 0, dry_streak int default 0);
```

The run says plainly when the write fails, so a missing table is loud rather
than silent.

**And a meter**, because "what does 50 audits a day cost" could only be answered
with arithmetic from outside the system. It counts the two billed SKUs
separately, at DISPATCH — Google bills a request it received even when we give
up waiting. The RATE is a setting (`GP_RATE_SEARCH_PER_1K`,
`GP_RATE_DETAILS_PER_1K`) and the log says so: published third-party figures
disagree from $17 to $35 per thousand and the only authoritative number is on the
invoice, Billing › Reports › group by SKU.

**The shape of the spend, for planning.** An audit is 2–3 searches and 1 profile
read. One Find run was up to 180 calls. **One press of Find costs about what
sixty audits cost** — hunting is the expensive half, auditing is nearly free.

---

## 12. We paid for 513 businesses and kept 120 — FIXED 2026-08-19

From the live run's own log:

```
Google Places: 514 local owner-operated businesses from 177 queries
After merge: 513 unique
Unique: 513 | Returning: 120
```

Every one of those 513 cleared the rating band, the size gate, the franchise
filter and the pipeline dedupe. **393 were dropped on the floor** because
`MAX_TOTAL` is 120 — a decision about how many rows are useful on a screen,
acting silently as a decision about how many businesses are worth having. Nothing
remembered them, so the next run paid Google to find the same businesses and
threw the same 393 away again.

**The bench** stores the overflow and the next run serves it before spending
anything. One run yielded 120 usable leads; with the bench it yields about 513,
so four runs do the work of seventeen. Three failure modes closed by
construction: stale leads past a 60-day TTL are dropped rather than served (a
bad lead costs a whole research cycle, far more than the search that found it);
the Google budget scales to the shortfall but **never below a quarter of the
cap**, so a bench full of one trade cannot stop us searching for anything else;
and the table is bounded by score. Needs a table:

```sql
create table lead_bench (
  id text primary key, name text, website text, source text,
  score real, payload jsonb, created_at timestamptz default now());
```

**And the correction that matters most about the price.** Google bills per CALL,
not per result, and a call returns up to twenty businesses. From the same run:
2,892 businesses seen across 177 calls, which is **$2.14 per thousand businesses**
at $35 per thousand calls. The Apify Google Maps scraper is $1.50–2.10 per
thousand businesses. **They cost the same**, so moving discovery off Google's API
saves nothing — an earlier estimate of "20x cheaper" compared a per-call price to
a per-result price and was simply wrong. It also follows that filtering results
harder cannot save money: the only way to spend less is to make FEWER CALLS,
which is what the query memory, the bench and the page budget all do.

**Depth is no longer bought for a category that is already full.** `PER_CAT_CAP`
discards every further result on that query by definition, so a second page there
is a paid call bought to produce nothing. 335 businesses hit that cap on the live
run and 77 extra pages were bought in the same run. The page budget also scales
with the run cap now, since a page costs exactly what a query costs.

Whether depth pays AT ALL is now measured rather than argued: `DEPTH YIELD`
reports what a first page returned against what the bought pages returned, and
splits the businesses we paid for and did not keep into band, cap and
already-ours — only the last is a gap a deeper page can fill.

**What was considered and rejected:** taking one local-rank sample instead of two.
It would save roughly $40 a month and it would reinstate a bug fixed the same
day — two samples exist because single draws returned #10 and #1 on one business
minutes apart. The finding at risk is `outranked_by_weaker`, one of only two with
a real reply behind it. Not worth it.

---

## 13. Three cost fixes, and the client's first automated check — 2026-08-19

**The rating band was deleting 61% of every run to protect one finding.** 1,810
of 2,892 already-paid-for businesses were dropped at the band on the live run,
1,766 of them for sitting ABOVE the ceiling. Two measurements, both re-derived at
boot so they cannot rot:

- **Exactly one of the 41 rungs reads the star rating** — `low_rating` — and it
  is `INTERNAL_ONLY`, so it can never reach an email.
- **Running the real ladder over one business and moving only the rating gives
  the same answer at 4.6, 4.9 and 5.0**: two sayable findings, leading on
  `outranked_by_weaker`, one of the two with a reply behind it.

And the band cannot save money, because Google bills per CALL and a call returns
twenty businesses whether we keep them or not. So they are **demoted, not
deleted** — kept, marked, sorted behind every in-band lead, left to fill the
bench. The promise that in-band still goes first is enforced twice: two arrays
concatenated at the source, and a comparator term weighed ahead of tier and
score. The per-category cap is spent only on in-band leads, because results
arrive in prominence order and a slot taken by a 4.9-star business would push out
the 4.6-star one behind it. `GP_BAND_MODE=cut` restores the old delete.

**We bought the same reviews twice on every Places lead.** `fetchGBPHealth` asks
a Place record for photos, hours, category and REVIEWS — it needs the dates for
the staleness finding. Fifty lines later `fetchGoogleReviews` asked the same
record for the same reviews, as a second Place Details call. Both bill on the
Enterprise SKU at 1,000 free calls a month. The memo holds the in-flight promise
rather than only the result, so the day these run in a `Promise.all` the
duplicate does not quietly return.

**What actually stopped fifty leads at a time was memory, not the queue.** A page
render is the only allocation big enough to cross Render's ceiling (330MB and
382MB peak before the scaler was rewritten; 218MB now, which fits exactly once).
The bound is therefore on the DECODE — one gated door, both call sites through it
— so research concurrency can be raised for throughput without touching the
ceiling. Plus a second gate that measures rather than assumes: a lead is admitted
only while resident memory is under `RESEARCH_RSS_CEILING_MB`, and that hold is
bounded so it can never refuse leads forever. **A dyno over its limit does not
throw — it restarts, and that is what "no leads are running at all" looked like.**

**The client sent two different research requests.** `researchViaQueue` was
called from two hand-written bodies that disagreed about seventeen fields.
Pressing "Run Research" sent neither the rating, the review count, the phone, the
multi-market coverage nor the lead channel; the discovery path sent all of those
and none of the browser measurements, the prior verified email or the confirmed
owner. **So which audit a lead got depended on which button was pressed, and a
re-run could come back worse than the original while looking like a refresh.**
`marketsSeen`/`marketsAbsent` are the clearest case — nothing downstream can
recover them, so the coverage-gap finding could not exist on a re-run at all.
One `buildResearchBody` now, and `clientcheck.js` fails the build if a second
appears.

**`clientcheck.js` is the client's first automated check.** index.html is half
the system and the only thing ever run against it was `dupkeys.js`. It parses the
script blocks, follows the builder, and asserts that every call site goes through
it and that no field nothing downstream can recover has been dropped.

**What the falsification runs found in the new checks themselves** — every one of
these booted GREEN with the guard reverted, and only reverting found them:

- **Two assertions were matching their own source text.** A needle written as a
  literal sits in the check's own body, `indexOf` finds it, and the assertion
  passes on a build where the thing it guards is gone. Every source needle is
  assembled at runtime now. This file already recorded the same trap for
  `RANK GATE CHECK` and it came straight back.
- **The decode-gate assertion counted call sites** and could not tell a
  production decode from the ones the boot checks make on purpose — it reported
  five correct calls as unbounded. Replaced with one door that can be verified.
- **The headroom assertion added a small render's cost to the admission
  ceiling.** A real render is several times those pixels, and the cost does not
  scale with pixels anyway because the scaler caps its own inflate output.
- **One assertion was non-deterministic.** Resident memory never falls back, so
  the same decode measured 31MB on one boot and 0MB on the next. A check that
  fails at random is one somebody eventually deletes, and it takes the real ones
  beside it.
- **And the client check passed vacuously the moment it worked.** It read keys
  off the object literal at each call site; when both became one builder there
  were no literals left and it reported a clean pass while seeing nothing.

---

# PART 5 — WHAT IS PROVEN

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

---

# PART 6 — HOW TO WORK HERE

## Run these before proposing any change

```bash
node --check server.js                  # syntax
node tdz.js server.js                   # reads before declaration — MUST be 0
node dupkeys.js server.js               # duplicate object keys — MUST be 0
node dupkeys.js index.html              # MUST be 0
node scopecheck.js server.js            # a name used outside the block it was declared in
node fetchtest.js                       # the one helper all 60 outbound calls use
node fuzzcore.js 20000                  # 11 gates, in-process
node fuzz.js 500                        # composes emails over HTTP
node pngscale.js --selftest             # 21 assertions on the screenshot scaler
#   This was NOT in the gate list for the life of the project, and nothing in
#   server.js ever executed fitWithin either — the only guard was a source regex
#   asserting the CALL SITE exists, which passed on the run that lost every
#   image on a lead. SCREENSHOT SCALER CHECK now runs the real function at boot.
PORT=4000 timeout 200 node --max-old-space-size=256 server.js   # 145 boot checks
#   The heap cap is not optional. Render's ceiling is near 256MB and on
#   2026-08-18 a build that booted fine here crash-looped there — 47 boot
#   checks had each grown a private readFileSync of this 2.9MB file. Every
#   gate was green on a build that could not start. BOOT MEMORY prints the
#   settled heap; BOOT HEAP CHECK fails the build above 200MB.
```

Every one of these now **exits non-zero on failure**, so they can be chained and
they can fail a script. That was not true before: `tdz.js` and `dupkeys.js` printed
a red ✗ and exited 0 for their whole lives.

`node --check` passing means almost nothing. Three live outages in one week were
valid syntax.

## The duplicate-key baseline is 0, and that is the point

It used to read "baseline 3" and "baseline 9". Those numbers were treated as a
score to match rather than a list of bugs, and four live collisions were sitting
inside the accepted baseline of 9 — in `rowToLead`, blanking `flaws`, `richData`,
`homepageContent` and `screenshotUrl` on every single app load, after each had
been read back from Supabase correctly a few lines earlier.

The cost: `hasResearch` reads `flaws`, so a researched lead could render as
un-researched; and the full-evidence email prompt fell back to
`"General marketing underperformance"`, `"No research data available"` and
`"Not available"` on leads whose real measurements had just been loaded. The
screenshot stopped rendering after a reload.

An earlier pass had removed four other keys from that same line and described it
as "the last of five such collisions". It was not the last. **Never set a baseline
above zero on this check.** A number you are allowed to match is a number you stop
reading.

## The bug classes that actually happen

**Computed but not passed.** Five fixes shipped dead because a value was calculated
and never reached the thing that consumes it. `rankHarms` reads `m.<field>`;
`_harmInputs` is assembled by hand; the gap is invisible in every log.
`MEASUREMENT DELIVERY CHECK` guards this — extend it, don't work around it. The
`rowToLead` collisions above are the same disease on the client: measured, saved,
reloaded, then dropped one line before use.

**Line order is not scope.** Twice an out-of-scope reference was "fixed" by
checking the declaration appeared earlier in the file. Both times it was declared
inside a block that had already closed. Walk braces, or run the code.

**Unmeasured treated as zero.** `(m.photoCount || 0) < 5` fired on every lead where
photos were never counted, then stated "0 photos" as fact. Require
`Number.isFinite()` before comparing against any measurement.

**A guard in the wrong function.** "Never describe our own work" lived in the audit
checker for weeks while the email path had no such rule, so it reached live emails.
Check which function actually runs on the text you mean.

**A test harness that lies.** Both fuzzers have produced false failures by calling
functions with hand-built objects that do not match production. When a test fails,
check the harness before changing the code.

**A shared helper is 60 bugs at once.** `fetchT` wraps every outbound call —
Anthropic, Places, Firecrawl, Apify, Hunter, the verifier. It raced `fetch()`
against a `setTimeout` and never cancelled the request it abandoned, so every
timeout leaked a socket, and never cleared the timer on success, so a call
answering in 200ms pinned a 30s timer. A defect there presents as "these APIs are
flaky", never as a bug in our code. `fetchtest.js` covers it now.

While fixing it, the obvious ordering was wrong: `ac.abort()` rejects the fetch
**synchronously**, so aborting before rejecting let an `AbortError` win the race
and silently changed the error message that call sites all over `server.js` branch
on. Reject first, then abort. The test caught it; review would not have.

## What NOT to do

**Do not refactor for its own sake.** 30,000 lines in one file is hard to work in
and caused none of this week's failures. The 145 boot checks and the comments above
them are the asset — each records a specific live failure and why the fix is shaped
as it is. A rewrite loses that and re-earns the bugs.

**Do not add or reorder ladder rungs.** Done repeatedly; each fix revealed the next
gap in the same layer. The ladder is not the constraint.

**Do not tune the email prompt further** until real replies exist to tune against.
It has been rebuilt four times in two days on the evidence of a simulator that
contradicts itself.

**Do not buy precision with words he cannot read.** Every unreadable phrase in
this system was written to satisfy a truth gate, and each one was a correct local
decision. Three of them in one sentence produced an email its own author could
not explain. When the exact wording is unsayable in plain English, the honest
move is a plain sentence with the uncertainty stated out loud — "you're paying
for clicks the three names above you get for nothing, **if those ads are live**"
— not a vaguer sentence that hides it. The conditional is also a reply: it asks
him something only he knows.

## index.html IS in this repo now (2026-08-18), and still deploys by hand

It was locally ignored for the life of the project — half the system with no
version history. It is tracked here from 2026-08-18, so `dupkeys.js index.html`
always has something to read and every change is reviewable.

It still deploys to Netlify BY HAND. Nothing about tracking it changes that, so a
client-side fix is dark until the file is dragged into Netlify — and the server
half of the same fix will already be live, which is the shape that makes a bug
look intermittent. When a change touches both, say so plainly in the handover.

---

# PART 7 — WHAT WOULD ACTUALLY MOVE IT

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

## Working with Vin

He catches real bugs by reading live output, not by auditing source. When he pastes
a log, the answer is usually in it.

He wants root-cause diagnosis, not patches — and says so bluntly when he gets a
patch. He is right about that more often than not.

Distinguish clearly between "unit-tested and proven" and "shipped but needs live
validation." Reporting the second as the first is the fastest way to lose his
trust, and he will catch it.

His product instinct has been right on every call this week — the rating band, the
CTA problem, the audits reading alike, the review sample being too small. When he
says an email is flat, it is flat, and the cause has been upstream every time.

He does not read code. Explain findings in terms of what the system does to a
lead, not in terms of which line changed.
