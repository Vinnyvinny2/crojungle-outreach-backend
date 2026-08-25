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
- 227 boot checks at the bottom, each documenting the live failure that caused it

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

## 14. The size gate was blocking the businesses we sell to — FIXED 2026-08-20

From the first run on the rebuilt discovery, in the log's own numbers: the size
gate blocked 15 leads, **9 on a verified headcount and 6 on a name pattern**. All
nine headcount blocks were right. **Five of the six name blocks were wrong**, and
wrong in our hardest trades:

```
Twin Sisters Construction Company LLC          "construction company"
Vineyard Construction Company LLC              "construction company"
Louisville Paving & Construction Company       "construction company"
Audrey Echt Dermatology & Skin Cancer Center   "cancer center"
South Carolina Skin Cancer Center              "cancer center"
```

A dermatology practice named after the dermatologist is the most owner-operated
business there is. "Construction Company" is a legal suffix on a two-person
builder, not a size signal. Tested against twenty-five realistic owner-operated
names from our own trade list, the old pattern refused **thirteen** — including
"National Roofing & Sheet Metal" on *national*, "Federal Way Plumbing" on
*federal* (Federal Way is a city in Washington) and "Municipal Plumbing Supply"
on *municipal*.

**Why.** The list mixed three kinds of signal and applied one rule to all of them:
INSTITUTION words (university, county of, housing authority), which are reliable;
SCALE words (enterprises inc, holdings inc, fulfillment center), which are
reliable; and words that are merely **common in small-business names**, which are
not, and which were doing all the damage. Only the third kind was cut, and
`ICP FILTER CHECK` asserts both halves — the seventeen names that must survive
and the seventeen institutions that must still be refused, because a filter
loosened until it catches nothing is the more expensive failure.

**And there were two copies of it.** `looksLikeEnterpriseByName` decided whether
to spend a Companies API credit sizing a business; the size gate three hundred
lines later decided whether to keep it. Both refused "construction company", so a
two-person builder was **never sized AND then blocked for having no size** — two
copies of one wrong rule reinforcing each other. One shared filter now.

**Health is owned by one rule.** `ICP_BIG_HEALTH` is the only one of these
carrying a small-practice escape, and the same terms were duplicated in the
institution list *without* it — so a dermatology practice survived the rule
written to spare it and was then refused by a copy of that rule. The recorded
name for this is a guard in the wrong function.

**A measurement beats a guess about a name.** A verified headcount under 200 now
overrules the name pattern entirely. On this run that gate was right nine times
out of nine while the name pattern was wrong five times out of six.

**What the first version of the check got wrong.** It pulled the regexes back out
of the file text and found the WRONG COPY — the older filter sat earlier in the
file — then failed to compile what it grabbed and reported that it could not
check anything. Which was true, and which is exactly how a duplicate rule stays
invisible: a check that reads source cannot tell you there are two of the thing
it is reading. It executes the real constants now, and asserts there is exactly
one definition of each.

---

## 15. A stem with a word boundary after it matches nothing — FIXED 2026-08-20

`\bplumb\b` cannot match "plumbing", because the g is a word character. A stem
written that way matches only itself, and "plumb" on its own is not a word
anybody puts in a business name. **`RECURRING_NORMAL_TRADES` failed on 22 of the
34 trade words it exists for — including plumbing, roofing, electrical and
landscaping, our four largest categories** — so `recurring_revenue`, a whole
rung, had never fired for a plumber, a roofer, an electrician or a landscaper.
Nothing said so, because a regex that matches nothing is silent rather than wrong.

Found from one live line: `BLOCKED [Chiropractic Family Healthcare]: large health
system (name)`. `chiropract` could not match "chiropractic", so the small-practice
exemption never fired and the enterprise filter took the lead. The same defect was
in five lists, pointing both ways — `hospital` could not match "Hospitals" either,
which lets a real enterprise through.

**This file already recorded the bug once**, in the jargon gate: "`synerg` used to
sit bare inside `\b(...)\b`... `synergy`, `synergies` and `synergistic` all sailed
through the most notorious entry on the list for the life of that gate." The lesson
was written down and never generalised.

`STEM MATCH CHECK` now holds two mechanisms, because they fail on different days:

- **Fixtures** — the real words each list exists to catch, run through the live
  regex. Covers today's lists; blind to the term added next month.
- **A declaration** — every bare string one of those lists can END on must appear
  in `STEM_COMPLETE_WORDS`. A new stem cannot be added without writing it down as
  a word, where a reviewer sees it. Both directions fail: a word no list uses any
  more cannot sit there looking checked.

**A generic detector was written first and deleted.** Sweeping every `\b(...)\b`
in the file for an alternative that is a strict prefix of another beside it flagged
68 entries; excluding plural pairs still left 49, because `the|them|their`,
`you|your`, `pick|picking` and `rank|ranked` are ordinary word lists where the
prefix relation means nothing. There is no dictionary in this process and no
mechanical way to tell "plumb" from "pest". A check that cries wolf is a gate the
next person switches off, so it demands the declaration instead of guessing.

## 16. The log line named the one thing that was fine — FIXED 2026-08-20

The query memory failed to save and the run printed **"Check that the
places_query_state table exists."** The table existed. Row-level security was
refusing the write. The one instruction printed sent whoever read it to inspect
the only healthy part of the system.

Five different problems arrive as the same `return null` and each needs a
different action: create a table, add a policy, add a column, fix the key, fix
the network. Supabase names which one in its response body every time, in a
documented code. The line guessed, and a guess printed as an instruction reads
exactly like a measurement.

This is the SMTP lesson in the other direction. PART 4 §3 already says: "The real
defect here is the log line, not the code... A message that overstates its own
severity costs exactly as much as one that understates it." Naming the wrong cause
costs the same again.

The reason is now READ from the error code, kept per table, and **cleared the
moment that table answers** — a stale cause reported after the fix is the same lie
pointing the other way. `SUPABASE FAILURE CAUSE CHECK` runs the diagnoser against
the real PostgREST bodies and asserts the permission case says the table EXISTS and
never says "does not exist".

**Two of its own assertions were wrong on the first run and only running them
showed it.** A 401 "permission denied" and a 403 "row-level security" are ONE
problem with ONE fix, and demanding they produce different sentences was noise —
so fixtures now carry the cause they belong to, and only different causes may not
collide. And the assertion banning the old sentence was written as a literal, so it
matched **its own source text** and failed a correct build. That trap is recorded in
this file twice already. It comes back every time somebody writes a needle the
natural way.

## 17. The review ceiling was deleting 282 paid-for businesses a run — FIXED 2026-08-20

`GP_MAX_REVIEWS` is 750, and 282 businesses a run were deleted on it. The argument
that demoted the rating band applies word for word: **Google bills per CALL and a
call returns twenty businesses, so deleting a result cannot save a penny**, and
nothing remembered them, so the next run paid to find the same 282 and delete them
again.

There is a second reason the band did not have. Twenty lines above the ceiling this
file states, from its own reading: *"Review count measures whether a business ASKS,
not how big it is."* The ceiling then uses review count to measure how big a
business is. Both cannot be right — a pest control company running 40-60 jobs a day
and asking each time crosses 750 while still being fifteen people and one owner; a
surgeon at 750 really is a large multi-provider practice. `reviewFloorFor` already
raises the FLOOR for exactly those high-volume trades. The ceiling was never given
the same treatment.

**No number was invented to fix that, because there is no measurement behind one.**
The ceiling keeps its value and stops DELETING: a business above it is returned
behind every other lead, sorts last, and fills the bench. It is still never audited
while a better lead exists, which is all the ceiling was ever doing. `GP_SIZE_MODE=cut`
restores the delete.

Both demotion reasons now feed **one** flag, so no gate can be fixed for one and
left open for the other — falsified by pointing the per-category cap and the final
comparator back at the band alone, and both went red.

## 18. Eleven measurements the server pays for never reached the lead — FIXED 2026-08-20

The research merge — 200 lines of "which value wins" — lived inside a React
function, so auditing fifty businesses at once meant writing it a second time. Its
own comment says why that must not happen: *"Two implementations of one operation
is the same mistake as the two fabrication lists and the two merge paths in this
file's history. The second copy is always the one that rots, because it only runs
in the case nobody tests."* A batch runner is precisely a case nobody tests one
lead at a time.

It is `applyResearchResult` at module scope now, pure, and **`clientcheck.js`
EXECUTES it**: it lifts the function out of index.html with its helpers, builds a
synthetic response where every field carries a unique marker, runs it, and asserts
each marker comes out on the lead.

**The requirement list is parsed from the SERVER's own `res.json`, not from the
client.** The first version read it off the merge itself — so deleting the `lsa`
assignment deleted the `data.lsa` read with it, the list got one shorter, and the
check reported a clean pass on the broken build. A check whose requirement comes
from the code under test cannot fail.

Driven from the server it found **eleven fields measured, paid for, returned, and
dropped one line before use.** `leadToRow` persists them FROM THE LEAD, so they
were stored as null and reloaded as null — not dark until refresh, gone. Five are
rendered by the UI today:

| | |
|---|---|
| `fullPageUrl`, `pageShots` | the full-page renders. The audit view says "above the fold only" without them, on every lead |
| `verifiedCEO`, `verifiedCEOTitle` | the confirmed decision-maker on the call sheet. `leadToRow`'s own comment calls verifiedCEO "the costly one" |
| `rateLimited` | the banner saying Firecrawl was REFUSED rather than finding nothing, and to re-run the lead |
| `phoneSource` | whether the number came off their Google listing |

The other six — Google's real-world speed field data and the early-channel
decision — were measured with nowhere to go. All eleven land now and the check
requires all 68, with **zero declared exceptions**.

Two more found on the way out:

- **The merge overwrote the server's `richData` with a dead browser measurement.**
  The browser PageSpeed call was removed weeks ago (it ran with no key and returned
  429 on every lead, recorded as a measurement), so `pageSpeed` has been `{}` ever
  since and those lines wrote "Not checked" over whatever the server sent. Fallback
  now, not override.
- **A re-research cleared three fields of the previous email and the writer sets
  eleven** — and the two it left behind, `subject` and `pitch`, are the two the
  send path reads. Nothing could ship it alone (approval goes false), but the
  comment above it promises the draft is dropped and the batch relies on that.
  Found by running fifty leads through the batch with a blocked composer.
  `clientcheck.js` now reads BOTH lists off the code and fails if they drift.

**And one more the batch made urgent.** The browser's poller gave up ten minutes
after SUBMITTING a lead. The server's clock starts when the WORK starts —
deliberately, because a job that waited six minutes for a slot used to have two
minutes left to do five minutes of work and was killed with the credits already
spent. So a lead that queued for five minutes and then worked for five was
abandoned **by the browser** at the moment the server was about to answer,
reported as "did not finish within 10 minutes", and the paid-for audit thrown
away. One lead at a time nothing ever queued and this was invisible. Fifty at a
time it is the normal case. Two clocks now, both from the server's own report:
ten minutes of WORK, and a wall-clock backstop for a server that never replies.

**And the bulk audit itself.** `runBatchAudit` reuses the shared request builder,
the shared merge, the shared compose body and the shared email commit — it
reimplements nothing. Audits only by default, because that is what Mike asked for;
"also write the email" is a tick box. `batchcheck.js` runs 50 leads through the
real runner with a fake network under it and proves seven things, each because the
opposite has happened here: the shared builder and merge are used, audits-only
costs zero compose calls, emails-on produces an actually sendable subject+body+arm,
a fact-check refusal is reported AND leaves no stale draft, no more than eight
leads are ever in flight, every job id is written to disk so a closed tab does not
lose paid-for work, and Stop keeps what finished. All four of its central
assertions were falsified by reverting the code they guard.

## 19. One lead was served another lead's audit — FIXED 2026-08-20, the worst bug this system has had

Donna Krummen, a Cincinnati plastic surgeon, received an audit asserting **"176
reviews at 4.8 and #3 of 20 in Indianapolis"**, a homepage that **"promises
upfront pricing and no hidden fees"**, a Google Ads conversion tag **"confirmed
on your site"**, and John Peters Roofing's pattern sentence spliced verbatim
into her outgoing email. Every one of those is John Peters Roofing — the lead
that ran three minutes earlier. Her own fact-checker caught it ("it was written
about a different prospect or a different market"), but the Approve button sat
under that verdict, enabled.

**The cause was the audit cache's key.** It hashed "the evidence text", and the
variable feeding it took the FIRST text block of the request — which is the
constant image caption, *"IMAGE 1 — THE HOMEPAGE, rendered full page, top to
bottom."* The real evidence rides in a later block. So **every lead with a
homepage render hashed to the same key**, and the cache became a machine for
handing each lead the audit of whoever wrote first. The BRAIN INPUT meter read
the same variable, which is why it priced a 28,000-token call as "evidence text
15 tok" — the same wrong variable, caught by nobody because the meter and the
key agreed with each other.

Three walls now, each falsified by reverting it:

- **The key covers everything the model sees** — every text block plus a
  fingerprint of every image.
- **The cache entry remembers which company it was written for**, and a read by
  any other company is refused by name. Even a future key bug cannot cross two
  businesses again.
- **Under 2,000 characters of keyed text disqualifies the cache entirely** —
  the real evidence block alone is tens of thousands, so a small key means the
  assembly upstream is broken.

`AUDIT CACHE ISOLATION CHECK` runs two synthetic leads through the real key and
the real cache at boot. Two smaller cross-lead leaks found in the same sweep:
the leadership-page text length was a single module-level number (now keyed by
company), and a CRITICAL fact-check verdict now **blocks the Approve button**
in the client instead of decorating it — the fabricated audit above was one
click from Send.

## 20. The byte ceiling deleted the render the pixel ceiling had just saved — FIXED 2026-08-20

Jose Barrera's homepage rendered at 1920x9544, the scaler brought it under the
7,800px vision ceiling — the log celebrated "the model is reading the whole
homepage top to bottom" — and one line later the byte check found 9MB and threw
the image away: *"Screenshot too large (9MB) — skipping image, auditing from
text."* Two ceilings, and only one knew how to shrink. A photo-heavy page
compresses badly, so clearing the pixel limit says nothing about the byte
limit, and the audit ran blind on a picture we were holding.

`fitPngToBudget` is now the one fit against BOTH ceilings, for the homepage and
every interior render: bytes over budget scale the image smaller (edge ×
√(budget/bytes), up to three passes from the original buffer), and only below a
1,200px floor is refusing honest. Every decode still goes through the single
gated door. `RENDER BYTE BUDGET CHECK` forces the second pass at boot with a
real PNG. And the interior renders are now **labelled by their own path**
instead of the word "page" — five leads logged "booking, page, page, page,
page", and Vin read a run that HAD rendered every page as "it's clearly not
taking pics of the other important pages." A label that hides what was bought
reads exactly like the thing not having been bought.

## 21. Four more from the same five-lead run — FIXED 2026-08-20

- **A successful write reported as a failure.** Every Supabase write sends
  `return=minimal`, so success is a 201 with an EMPTY body — which parsed to
  the same null as a failure. The query memory wrote 91 rows successfully and
  the log printed "BUT THE WRITE FAILED... Supabase gave no reason". No reason
  because there was no failure: the night's one fixed problem reported as the
  night's one remaining problem. An empty 2xx body now returns a distinct
  success value.
- **The quote in the email was three spliced fragments of her FAQ.** The
  extractor's sentence boundaries required a space directly after the
  punctuation — «?”&nbsp;» is not that — and its tail trim used `search()`,
  which returns the FIRST punctuation in the span, before the phrase, so the
  after-the-phrase guard refused it and nothing trimmed. Donna's email opened
  mid-question and closed on a comma. `phraseAround` is module-scope now,
  boundary-aware of closing quotes, and `QUOTE INTEGRITY CHECK` runs her exact
  FAQ shape. My first fix broke two other shapes (the window-edge word trim ate
  the last word of a correctly trimmed sentence; the orphan-quote stripper ate
  apostrophes) — only running the fixtures found either.
- **The ladder tiebreak was a narrator.** Jose Barrera: two findings tied at
  23, the measured constraint LEADS, the winner in CONVERSION — and the ⛔ that
  said search_absence "should have taken the tie" changed nothing. The
  binding-layer preference is now a term in `rankCandidateFindings` (ties
  within the 2-point noise band go to the measured binding layer; a 4-point
  deficit is still never promoted) and the override block completes the
  rewrite. The first fixture for this passed with the fix reverted — the
  winner it chose was already preferred by the leverage tiebreaker — which is
  the fixture-that-measures-nothing trap, caught by falsification.
- **A wrong-company site's measurements survived the discard.** Ram Jack
  Durham resolved to the national franchisor, the discard branch fired, and
  the audit still opened on "their contact form asks for 10 pieces of
  information" — measured on ramjackusa.com, a page the same audit said it had
  discarded. `htmlSignals` is extracted BEFORE the domain check runs, and
  blanking the page alone left it alive. It is blanked with everything else
  now, and Places website URLs are stripped of `?utm_campaign=gmb`-style
  params, which is what dragged that lead to the franchisor domain looking
  authoritative.

**And research concurrency is 3, up from 2.** "Three at once is what made two
runs stop mid-way" was true, and the cause was never the queue — it was two
page-render decodes landing in the same instant. The decode door and the RSS
admission gate carry that risk now. Five leads took ~15 minutes at 2 slots;
fifty at that rate is over four hours, and at 3 it is under two. The cap is
`RESEARCH_CONCURRENCY`, and it matches the batch client's own pool of 3.

## 22. The three roadmap builds — 2026-08-20, shipped but unproven live

Built at the end of the night, each falsified at boot, none yet run against a
real lead. Distinguish accordingly.

- **Sender rotation is a settings entry.** One mailbox has carried every
  bounce, and a hard bounce is charged to the DOMAIN. A second Hunter sequence
  (same Hunter account, sender on the second domain) pasted into Settings
  splits sends across the two. The pick is a **stable hash of the lead id** —
  never a counter — because a re-sent lead landing in the other sequence puts
  one person inside two campaigns, which reads as spam from two strangers.
  Every send stamps `sentVia` into the attribution snapshot so a bounce is
  chargeable to the domain that earned it, and the outcome sync reads BOTH
  sequences. One configured sequence behaves exactly as before.
  `SEND ROTATION CHECK`.
- **Duplicate Google listings are measured.** One extra Places name search per
  research lead (the audit's fourth call). A duplicate is claimed only when a
  different place ID carries the **same website domain or phone** AND the
  **same street address** — a similar name proves nothing, and the same domain
  at a different address is a second location, not a defect. New rung
  `duplicate_listing` (harm 86, LEADS): the split is invisible to the owner,
  checkable in ten seconds, risky to fix alone, and explains
  `outranked_by_weaker` with no theory about ranking at all.
  `DUPLICATE LISTING CHECK`; clientcheck flagged the missing client merge line
  the moment the server returned the field — the executable merge check doing
  its job.
- **The lab mobile score finally lands.** `measureRealWorldSpeed` extracted
  the Lighthouse mobile score on every lead and nothing read it, while five
  consumers read `pageSpeed.mobileScore` — fed by a browser call that was
  REMOVED. Instance nineteen of computed-but-not-passed. The one rule that
  makes it honest: **the lab score is a simulation and loses to the field
  data** — a lab 45 against real-visitors-fine displays with the contradiction
  stated but cannot flag `slow_mobile`, cannot count as a confirmed issue, and
  cannot feed the brain a claim the fact-checker refutes from the same
  response. `LAB MOBILE SCORE CHECK`.

## 23. Five renders that all looked like the homepage — FIXED 2026-08-20

Vin, reading the audit screen: *"the screenshots are 4-5 screenshots of the
homepage, it's clearly not taking pics of the other important pages — that may
be why most audits are dry."* Two separate defects behind one symptom, and only
one of them was the capture.

**The display was showing the header band of every page.** The renders WERE the
other pages — about, booking, services — captured correctly and keyed correctly
per URL. Each is a full-page image at 1920 x 6,000-9,500px, and the audit view
put it at `width:100%` inside a 380px box: **the visible strip is the top 7-12%
of the page**, which on every website ever built is the masthead. Five correct,
different, paid-for renders rendered as five copies of one nav bar. Two columns
at half width now show 15-23% each, side by side where the difference is visible
without scrolling, with the page name as a chip instead of grey micro-text.

**And the backfill really was reading the wrong pages.** `NOISE` catches content
by its FOLDER — /blog, /posts, /news — and plenty of sites publish articles
straight off the root, where the shallowest-path sort finds them first. Jose
Barrera: eight URLs mapped, one intent match (/contact), and the other **six
reads went to procedure explainers** — `/how-is-rhinoplasty-for-wide-noses-different`,
`/latera-nasal-valve-implant`, and three more. Six credits of what the business
KNOWS, and nothing about how it SELLS, on the lead whose findings came back thin.

`ARTICLE_SLUG` reads the shape of the slug rather than the folder: four or more
hyphenated words, a question or listicle opener, a date folder, or a joining
word (`-in-`, `-for-`, `-vs-`, `-to-`) that only survives slugifying a title.
Articles are used **last and capped at two**, and a page the site links in its
own navigation is never filed as one whatever its slug looks like — the owner
put it in his header, which outranks any guess from a URL.

**And nothing could tell whether two renders were the same page.** Pushed back
on the display explanation, Vin was specific: *"the screenshots on the front end
were 4 screenshots of the same page — the homepage."* The honest answer was that
this system could not answer him either way. We ask Firecrawl for six URLs, it
returns six responses, and we had never once checked whether those were six
DIFFERENT pages. Three ordinary things return the homepage for a URL that is not
the homepage — a redirect from a retired page, a single-page app whose router had
not run when the render was taken, and a soft 404 — and in all three the markdown
comes back byte-identical, as does the picture.

The corpus is the expensive half. Four copies of the homepage in the evidence
makes an audit that read two pages look like it read six, which is the shape of a
dry audit that appears to have had plenty to work with. Interior pages are now
fingerprinted against each other AND against the homepage, duplicates are dropped
from both the corpus and the renders, and the run says so by name. `DUPLICATE
PAGE CHECK` uses exact equality on normalised text on purpose: a similarity score
would collide on the nav and footer every page shares, and a false positive here
DELETES a page we read correctly. Its first fixture had the two pages differing
in their opening words, so hashing a 40-character prefix still told them apart
and the falsification run passed on a broken build — real Firecrawl markdown
begins with the same header on every page, and the fixture now does too.

`PAGE SELECTION CHECK` runs Jose Barrera's real sitemap plus twenty-two real
navigational URLs from our own trades. The second list is the more important
one: a filter tuned until it catches everything stops reading the pricing and
services pages the whole audit rests on, and falsifying it by widening the
regex one step went red on `/cosmetic/african-american-rhinoplasty`.

---

## 24. Ten faults from one live log, and the two worst were silent — FIXED 2026-08-20

Vin, on the 14:21 UTC run: *"ive ran an audit on ram jack like 6 times it always
pops up in the find section... gregory and donna both have replicated images...
i need you to analyze eveyrhting very indepth analyze evry single letter of eveyr
audit and of the log i need eveyrhting running perfect because we are going to
running bulk soon."*

Fourteen falsification runs, one per fix, every one red with its fix reverted.
186 boot checks green.

**The two nobody had reported, because nothing said anything.**

- **One variable was holding two different measurements.** `visualAnalysis` is
  what the EYES saw — a vision model reading the rendered homepage and answering
  `hasVisibleCTA`, `hasHeadline`, `heroIsBlank`, `hasVisibleSocialProof`,
  `socialProofUncertain`. Six hundred lines later the BRAIN's audit was assigned
  over the top of it, and the brain returns none of those fields. So every read
  after that point got `undefined`, and the reads that matter most were the ones
  affected: the fact-checker's prompt is handed *"headline present = ${'$'}{...}"*
  under the label **"this is a MEASUREMENT, not a guess"**, and it has been
  receiving the word `undefined` for all four on every lead. Worse, the guard
  whose own comment says *"we never manufacture a no-social-proof claim from a
  scrape that simply did not capture it"* tested `!visualAnalysis.hasSocialProof`
  — a field that does not exist — so `!undefined` was true and the claim was
  manufactured exactly as forbidden. Two names now. `VISION HANDOFF CHECK` reads
  the vision prompt's own JSON keys and asserts that every `visualAnalysis.<field>`
  anywhere in the file is one of them; it immediately found a tenth,
  `pageFullyLoaded`, which the audit prompt has read since it was written and
  which the vision model was **never asked for**, so that safeguard had never
  fired either. It is asked for now.
- **The strongest finding in the system was understating itself by up to 75%.**
  `outranked_by_weaker` is one of only two findings with a real reply behind it.
  Its sentence said *"and 2 others above them have fewer too"* on a lead where the
  measurement was eight, and its own fact-checker caught it. `weakerAbove` counts
  over the whole field; `weakerNames` was built from `above`, which is truncated
  to three rows on purpose for a different consumer. Reading a display list as if
  it were the measurement. The worse half is not the digit: when none of those
  three happened to be weaker, the named form was unavailable and the finding fell
  back to the unnamed sentence — on leads holding seven qualifying names, and a
  named competitor is roughly double the reply rate of the same body without one.
  The businesses that qualify now travel as their own list, and the count is read
  from the measurement.

**Ram Jack, and why a list of brand names cannot hold.** Ram Jack is a national
foundation-repair franchise and it is not in `GP_FRANCHISE`, which is a hand-kept
list of brands somebody remembered. The pipeline dedupe could not stop it either:
each outlet is a different business name in a different metro, so "we already own
Ram Jack Durham" says nothing about Ram Jack Raleigh. Adding one name is the
band-aid and the next franchise repeats the whole thing.

The evidence was already in hand and free. A Find run searches 39 categories
across twenty metros hundreds of miles apart. A single owner-operated business
does not trade in three of them. **A brand appearing in three or more metros in
one run is a chain**, caught by its franchisor's website when the outlets share
one and by its brand when they do not. It needs no storage and never goes stale,
because the detection is recomputed from each run's own results. Both halves are
asserted at boot: three unrelated "All American" businesses, a genuine two-market
operator (Charlotte to Raleigh is 140 miles and that is a GOOD lead) and one
business found by three searches all survive — falsifying it by dropping the
generic-word stoplist went red on exactly those.

**589 seconds was two numbers added together.** `JOB ... done in 589.1s` printed
`finishedAt - startedAt`, which is queue time PLUS work time. The kill clock
measures WORK, the client's poller measures WORK, and the one line anybody reads
measured neither — so a five-lead run through a three-wide queue reported the
queue as though it were the audit. That is how "our research takes ten minutes"
gets believed. It reports both now.

And nothing measured **where** the seconds went. Every outbound call goes through
`fetchT`, so the answer is measured at that one door: seconds inside each service,
per lead, plus separately the seconds spent **waiting for a Firecrawl browser
before the request was even sent**. That last figure is the one that decides
whether the wall clock is our throttle or their latency. `⏱ TIME` prints it beside
`FIRECRAWL SPEND`, and says plainly that the times overlap and do not add up to
the wall clock.

**And the throttle probably is ours.** `FC_CONCURRENCY` defaults to 2 — the Free
tier's concurrent-browser cap — because it is the only number that is safe without
knowing the plan. One lead makes ~14 paid Firecrawl calls, seven of them fanned
out at once, and `RESEARCH_CONCURRENCY` is 3: three leads contend for two
browsers. Raising the constant would be a guess, so the plan is **read** instead
— Firecrawl states the per-minute limit in a header on every response. The log
says which half is which: the per-minute figure is MEASURED, the browser cap is
INFERRED from their published tiers, and we never take the full published cap. An
explicit `FC_CONCURRENCY` wins outright in both directions. Two other things were
taking gate capacity for nothing: a batch **status poll** held a browser slot
(a batch is polled every three seconds for as long as it runs, and a status read
renders nothing), and the gate captured its cap at construction so a plan learned
at minute two would have applied to nothing.

**The audit invented prices and the fact-checker only watched.** John Peters
Roofing, live: *"a customer cannot tell what is different between a $5k gutter job
and a $50k roof replacement."* Its own fact-checker said the figures were not in
evidence, and the sentence shipped anyway, because flagging and removing are
different things. Every figure in an EMAIL has traced to a measurement for weeks;
the AUDIT — what Mike reads before the call and repeats on it — was ungoverned.
Three legitimate sources and nothing else: their own published figures, the trade
table (`TRADE_JOB_VALUE`, which is the permitted money move and is declared in
code), and our own prices. The sentence carrying an unlicensed figure is removed,
not the figure alone — a sentence with the number cut out still asserts the
comparison it was built to make.

**Two things the first version of that gate got wrong, both found by running it:**
it pulled individual tokens out of every trade row, so `$8k-$40k` quietly licensed
a bare `$8k` anywhere — which is exactly how `$5k` survived. The unit of
permission is the RANGE as written; half of it is a different claim and nobody
declared it. And `$50k` is our rebuild floor AND a plausible invented roof job, so
our own prices are permitted only in a sentence that is about our own work.

**A precaution recorded as a finding.** `⛔ CLAIM VERIFY: 1 unverifiable
assertion(s) in the generated copy ... do NOT send without checking` fired on
John Peters because a CTA could not be matched in the markdown — while the same
response reported `VISION: CTA=true`. The vision model looked at the rendered page
and saw it. Nothing in the copy mentioned the CTA. Hero text is an image on a
large share of home-services sites, so this fired constantly, and a session report
in which nearly every lead is flagged cannot be used to find the three that are
really wrong. This is the SMTP lesson a third time: a message that overstates its
own severity costs exactly what one that understates it does. The note now
survives only where the eyes did NOT confirm it, and it lives in its own list as a
scope note rather than as an assertion found in the copy. `_quoteUnverifiedNotAbsent`
was set here and read by nothing at all for the life of the field — instance
twenty of computed-but-not-passed.

**A demotion log inventing its own reason.** `SELF-FIXABLE, NOT LEADING` filtered
on `selfFix` alone and announced the result as *"N finding(s) scored higher on
harm"*. Live, it named a harm-64 finding against an opener at harm 76. It also
named INTERNAL_ONLY rungs, which are held out of the email by a different and
stronger rule that the same run reports on its own line — two explanations for one
omission, only one of them true, is how a reader stops believing both. It is the
only record of why a finding lost the opener and it was making the reason up.

**The replicated images.** The page fingerprint compares what a page SAYS and
already drops a duplicate. Two URLs can differ by a canonical tag or a breadcrumb
and still render the identical picture, and nothing compared the pictures. The
bytes are already downloaded to be sent to the model, so hashing them costs
nothing and is exact — a similarity score would collide on the header every page
of a site shares, and a false positive here DELETES a render we paid for. The
duplicate leaves the model's evidence AND the audit screen, which is the half Vin
was looking at. The comparison also no longer stops at the image cap: renders past
it are shown on the screen even though the model never sees them, so a duplicate
in that tail used to survive.

**And a false positive waiting to happen at the top of the ICP.**
`duplicate_listing` shipped the night before and its first live firing was on a
plastic surgeon. Google publishes the rule: a licensed practitioner may hold a
personal listing at the practice address. Telling a surgeon he has a duplicate
splitting his reviews would be wrong, and wrong where the ticket sizes are. A
second listing whose name carries a practitioner credential is refused by name and
by reason; a genuine duplicate at the same address is still caught, so the
exemption narrows the finding rather than deleting it. Only unambiguous
credentials are listed — bare "DO", "OD", "DC", "PA" and "NP" are ordinary words
or legal suffixes and appear only in dotted form, so "Do It Right Plumbing" does
not trip it.

**What the falsification runs found in the checks themselves.** `AUDIT MONEY
CHECK` failed on its first real boot and was right to: the range-token leak above.
`VISION HANDOFF CHECK` failed on its first boot and was right to: `pageFullyLoaded`.
`FIRECRAWL PLAN CHECK` printed **nothing at all** on its first two boots — it
released the gate's held jobs in a single pass, and releasing one lets the gate
start the next on a microtask, so the last jobs held forever and `Promise.all`
never settled. A check that hangs is quieter than one that fails. And the vision
needle matched **its own explanatory comment**, which quotes the broken assignment
verbatim — the fourth recorded instance of a needle finding itself, so comment
lines are stripped before every source test in it.

**Nothing in `index.html` changed this round**, so there is no Netlify deploy in
this one.

---

## 25. Four findings that were false, and a diagnosis that was never published — 2026-08-20

Vin, on one audit: *"it gives a bunch of issues which is good but doesn't seem to
nail the What is actually worth selling them."* And, verifying one finding:
*"sells only by phone, shows no price, offers no guarantee — I see this a lot,
just want to verify that this is accurate."*

It was not accurate. Two of those four fire on businesses where the claim is
false, and the reason the audit reads as a checklist is that the system computes
three separate one-change diagnoses and renders none of them.

**"The only way to reach you is a phone call" — to businesses with online
booking.** `measureBookingPath` is the input to `no_after_hours`, which is
SELLABLE **5**, the maximum in the ladder. Three defects, all sending:

- **Order.** The `tel:` and form checks ran ABOVE the scheduler check, so a trade
  site that embeds Calendly or ServiceTitan AND prints its number in the header —
  which is most of them — returned `phone_only`. Falsified against the real
  function: seven of sixteen realistic booking shapes came back `phone_only`, and
  removing the `tel:` link alone flipped the same page to `online_booking`.
- **Input.** It was handed the INTERIOR pages only. The homepage is excluded from
  that corpus deliberately and correctly — for the PRICE read it was built for —
  and it is also the one page carrying the BOOK NOW button. PART 4 §8 records this
  exact shape in the function next door; nobody checked what else read the same
  corpus.
- **Format.** It was handed markdown. Its `<form>`, `<textarea>` and `href="tel:"`
  branches have been dead for its whole life, and **a scheduler embed is an
  `<iframe>`, which markdown deletes entirely** — so the most common shape of real
  online booking was invisible whatever the order. Reordering alone would not have
  fixed it.

It reads the rendered homepage SOURCE now, which is already fetched and already
paid for. The same cascade decides `form_only_no_booking` ("someone ready to hire
cannot book a time"), so both false claims came from one function; a boot check in
the file records them as the two most frequent fixed-string rungs after the offer
trio, at 4 of 20 and 6 of 20.

And `no_after_hours` asserted *"finds nothing to start with until the office
opens"* **with nothing checking that they close**. `regularOpeningHours` was in
the Places field mask all along and only its existence was kept. Emergency trades
are the ICP, 24/7 is normal in them, and `URGENCY_ADJUST` adds 26 points to this
rung on exactly those trades — so it was most confident where it was most likely
to be false.

**A street address where a city belongs.** `readMarketClarity` was handed the
lead's `location`, which is Google's `formattedAddress`. The needle became
`"w th st overland park ks usa"` and matched nothing on every lead ever run, so
every lead collected the gap *"their own city barely appears in their copy"*.
Falsified: identical copy naming Overland Park five times reads `partial` with a
clean town and `undifferentiated` with the production address.

The blast radius is why this is not one false sentence. That gap decrements the
score, which sets the band, which sets `isConstraint`, which is the MARKET branch
of `measureGrowthConstraint` — and `BINDING_LAYER_BONUS` then adds 10 to every rung
in the binding layer. A street address in a city slot could move **which layer the
whole email is built on**. The gap text also reaches the situation read verbatim
and the email's MY READ block. A correct parser was 27 lines away.

**`namedOffer` was inverted at both ends.** It was `!genericOnly`, and the truth
table is backwards: *"Get a quote. $500 off our fall special"* scored FALSE, so
`no_offer` fired on a business plainly making an offer; a page with **no call to
action at all** scored TRUE, so it went silent on the only case it exists for.
Both falsified against the real function. A named offer is read from positive
evidence now — a dated promotion, something free or financed, or a specific ask —
all three of which `readOfferStrength` was already measuring and discarding.

Its sentence also claimed more than its test: *"nothing tells a stranger why to
pick them instead of the next name on the list"* is a claim about
DIFFERENTIATION, and the test measures two absences. A business can be plainly
differentiated and trip both, and that owner argues with it. It says the two
things measured now.

**We fetch the homepage twice and read the ads off the worse copy.**
`checkBuiltWith` does a plain no-JavaScript fetch inside the SAME
`Promise.allSettled` as the rendered Firecrawl scrape of the identical URL. The
three advertising markers — the only live ad signals in the system, gating both
SPENDING rungs — were read from the plain copy, which returns all-nulls the moment
a site challenges bots. PART 4 §13's "we bought the same reviews twice", with the
twist that the duplicate we kept is the lower-quality one. Positives now merge up
from either copy; an unreadable page still reports null rather than false.

One limit, stated because the absence direction rests on it: the scrape sets
`blockAds`, so a tag injected purely at RUNTIME may be missing from the rendered
copy. Every marker matched is inline in the source, so this is strictly better
than a fetch that executes no JavaScript at all — but it is not proof of absence,
which is why `adsReadable` still gates every absence claim.

---

**The one-change diagnosis was never missing. It was unpublished.** Three of them,
all code-assembled from measurements, all rendered nowhere:

| | |
|---|---|
| `measureGrowthConstraint` | which layer is binding, **why** it is binding and not a cheaper one below it, and what that layer is worth selling. Reached the screen as four words in 11px grey — and its `why` was **stripped by the server** before it left, while the only client render for it sat behind a condition that could never fire. Two bugs compounding, so neither could be seen. |
| `measureValueEquation` | the interested-to-book-to-close friction Vin describes as wrong with ninety per cent of these sites, as sentences the owner can check, plus `earnedButBlocked`. Returned, persisted, rendered **nowhere at all**. |
| the bottleneck cascade | the FIRST broken link in the revenue chain, each branch naming what must be fixed before anything downstream is worth buying. **Never left the server** — it existed only as a string inside a prompt. It is the only dependency model in the system; every ladder rung is otherwise independent. |

They are assembled into one `theOneThing` block and rendered above the findings,
because the findings are its evidence and not a menu. No model writes any of it,
so it carries no new fabrication surface.

**And the findings were ordered by the wrong question.** `buildProblemList` sorted
by `opener` — the EMAIL's cold-open score, which carries a 44-point penalty for
anything an owner could fix himself. `rankHarms` already computes `byHarm` and its
own comment calls it *"what is actually costing them most"*; nothing rendered it.
So the heading "worst first" was not true, it was "most likely to earn a reply,
first". This file's own TWO LADDERS block says these are different questions with
different answers, and the audit was reading the email's answer.

**The conclusion was a menu, and its own prompt taught it.** `whatHeNeeds` is the
paragraph under "What is actually worth selling them". Its entire specification
was eleven words, it was the only field with no validation of any kind, and one of
the two worked examples in its prompt reads *"The two honest openings are..."* —
the prompt demonstrated the failure it needed to prevent. Live on John Peters it
named three things. The example is rewritten and the output is measured, because
instructional guards do not hold.

**The strategic read was destroyed on every page reload.** Two different values
are called `situationRead`: the audit brain's ONE SENTENCE, and the separate
synthesis OBJECT carrying the headline, the 3-5 sentence read, the character rows,
the closing recommendation and **the only diagnostic question the system generates
for a salesperson**. `rowToLead` read the sentence first, and `??` only falls
through on null, so the summary replaced the real thing on the first reload of
every lead ever audited. The screen still rendered, which is why it survived.

This one matters beyond itself: the line Vin singled out as the good one —
*"almost obsessively engaged with his reputation"* — lives in `situationRead.rows`.
Adding more owner-behaviour facts before fixing this produces a line he sees once.

**And the only finding with a date on it was filed as timeless.** AMBIENT means
"true of nearly every business like theirs, so it explains nothing about why THIS
one is behind". `hiring_marketing_now` is harm 90 and novel 15, and the rule keys
on novel alone — so the system's single catalytic signal was demoted below every
storefront observation. PART 4 §1 names the absence of a clock as the largest gap
in the pipeline.

---

**Exporting fifty audits without making a second copy of the audit.** Vin: *"when
we audit bulk 50 we need to be able to export just the audits easily so nothing
gets ruined."* The obvious build is a formatter that walks a lead and writes out
the sections, and that is a SECOND implementation of what an audit is — the copy
that rots, because it only runs in the case nobody tests. So: `auditRecordFor`
turns a lead into plain data and is the one place that says what an audit
contains; `auditExportHtml` turns that data into a page and knows nothing about
leads. `clientcheck.js` lifts both out and RUNS them against a lead whose every
field is a unique marker, then looks for all 28 markers in the rendered page.

One self-contained HTML file: no assets, no network, opens anywhere, prints to PDF
from the browser, one page per audit and a clickable index. Deliberately not a
spreadsheet — an audit is prose with structure and a CSV destroys it. The company
name is escaped, because a business called "Smith & Sons <Roofing>" silently
corrupts everything after it, and the check falsifies on that too.

---

**What the falsification runs found in the new checks themselves.** Every fix was
reverted individually; three checks passed on the broken build first time and only
falsification found it:

- **Two checks tested the callee and the caller separately, and missed the wire
  between them.** BOOKING PATH CHECK exercised the assembly function and the rung;
  blanking the homepage argument at the CALL SITE left every fixture green. CITY
  PARSE CHECK ran the positioning read directly; reverting the one caller that
  hands it an argument left every fixture green. OFFER MEASUREMENT CHECK did the
  same on the delivery line, which is where the inversion actually lived. All
  three now carry a call-site assertion, needles assembled at runtime with comment
  lines stripped — because a literal needle finds itself, and because these
  comments quote the broken calls verbatim.
- **One falsification was not a revert at all.** Swapping the preference order
  inside `pickSituationRead` changed nothing, because in production one side is
  always a string and the shape test decides. The real revert is the original
  `??` precedence, and only that turns it red. A falsification that does not
  reproduce the original defect proves nothing.
- **The export's self-containment assertion was too wide** and flagged a plain
  text link as a network dependency. It matches actual resource loads now —
  script, link, img, iframe, `@import`, CSS `url()`.

**`index.html` changed this round, so it needs a Netlify deploy.** The server half
is live on merge; the one-thing block, the export button and the reload fix are
dark until the file is dragged in.

---

## 26. Where the ad clicks land, what the owner cares about, and the model — 2026-08-20

Tier 2 and 3 of the plan. Built before running leads, deliberately: *"i want
everything perfectly in place before we start doing 50 audits a day."*

**The two lists of pages could never see each other.** The page backfill ranks
sitemap URLs by whether the site links them in its own navigation, and it keyed
BOTH sides on the full URL string. The sitemap publishes `https://www.`; the nav
is resolved against the stored website, which this file's own comment says is
recorded as `http://`. One scheme mismatch and **every** sitemap page reads as
unlinked — which breaks the backfill and the article filter silently and in the
same direction, and would have given a landing-page detector a 100% false-positive
rate. `pageKey` is host plus path now, and the log prints the match count either
way so this cannot go quiet again.

**Where do their ad clicks land.** Vin: *"really wish we could find their landing
pages and if they're running ads, that would be HUGE, like the most important
thing in the whole system."* Most of the answer was already bought.

A landing page's defining property is not its words, it is that **the site does
not link to it** — it exists to be arrived at from an ad. We buy a full sitemap
(1 credit) and harvest the site's own navigation from markup we already hold. The
set difference is the answer, and it costs nothing.

What it may conclude, and what it may not:

- **POSITIVE, safe** — "these pages exist and nothing on the site links them."
  Checkable by the owner in one click, true whatever they turn out to be for.
- **NEGATIVE, forbidden** — "you run ads with no landing pages." A purpose-built
  campaign page is routinely noindex, off the sitemap, on a subdomain or on
  another domain, and `firecrawlMap` does not request subdomains. A false zero
  here is the EXISTS BUT UNREAD failure in a new costume.

So it is INTERNAL, and the honest outward form is a question, never an assertion.
The floor is three navigation links: a site whose menu we failed to read makes
every page look unlinked, which is the same false zero pointed the other way.

**Seven pages bought, one page's markup read.** The interior scrapes asked for
markdown and a screenshot and never `rawHtml` — so the ad markers, the navigation
harvest and the booking read all ran on the homepage alone. Firecrawl bills per
PAGE, not per format; this file says so two lines above the format list. Six more
pages of markup cost nothing and were simply not taken. The markup is consumed
and dropped at the point of receipt: retaining it would be megabytes against a
256MB ceiling, and the derived facts are a few booleans and a link list.

**Google Ads Transparency Center.** The recorded refusal of `checkGoogleAds()` is
right and refutes a RAW FETCH of a JavaScript app — not the source. The identical
problem is solved for Meta thirty pages below with *"the Ad Library is a JS app so
plain fetch fails; Firecrawl renders it."* So it renders instead of fetching, and
carries the discipline the old one had none of: positive-only (only VERIFIED
advertisers appear, so "not found" can never become "no ads"), no parsing of
numbers that are not on the page, and **off by default**. It costs a credit per
lead and has never been run against a live advertiser from this codebase.
Shipping it ON would report an unproven read as a measurement.

**And the Facebook read was reporting a certainty the endpoint cannot give.**
`confirmed: true` on an empty answer put *"No Facebook ads attributable to them"*
on the call sheet. `/ads_archive` is scoped to political and issue ads, so a zero
is true of every business we will ever audit. A find is still a find; a miss is
now "not checked".

---

**What this owner demonstrably cares about.** The line Vin singled out —
*"almost obsessively engaged with his reputation"* — came from ONE behavioural
fact plus one worked example of interpreting it. Nothing anywhere asked for it,
so it happened once.

The raw material was far richer than what reached the audit, and it died at
schema boundaries rather than data ones. **The full text of every owner reply is
scraped and then collapsed to `.length`** — the one place in this system where the
owner speaks in his own words about his own business, reduced to a count. Two
prompts hold that text and both ask a narrow question of it: one extracts a
signature, the other looks for complaints. Neither may notice what the man cares
about.

A short sample now travels, with his own words from his About page, what he is
hiring for, and the unlinked-page count. `whatHeCaresAbout` is asked for
explicitly, read from BEHAVIOUR ONLY — things he did, that we measured — never a
guess at his personality. It goes on the call sheet ABOVE the recommendation,
because knowing what a man cares about changes how you open and the
recommendation is what you arrive at afterwards.

---

**The file said Sonnet and the code said Haiku.** Six lines above the assignment,
the comment block reads *"Default stays Sonnet. Changing it is a quality
decision."* The code said Haiku, and had for months. Two comments in one file
disagreeing about the default means nobody could tell which decision had been
taken.

From the live meter, not an estimate: Haiku audit $0.0467, lead $0.1019, fifty
leads $5.10. Sonnet: audit ~$0.14, lead ~$0.195, fifty leads $9.75. **Four
dollars sixty-six a day**, against engagements that start at thirty-five
thousand. Both the audit and the synthesis run on `claude-sonnet-5` now.

**And the smartest call in the system was the least informed thing in it.**
`buildSituationRead` ran BEFORE the audit on ~35 summary bullets: no page copy,
no screenshots, no findings, no knowledge of what the audit concluded. Meanwhile
the audit received 33,000 tokens of evidence and was asked to fill a 26-field
schema. Read-everything and think-about-it were split across two calls and
neither half got both — which is the structural reason a chat with a large model
outperforms this. The facts are still assembled where they are; only the CALL
moved, to after the audit, with their own homepage copy and the audit's findings
appended.

**What was deliberately NOT done.** `pitchAngle`'s field spec is 32,086
characters — half the system prompt — for one email line that a separate 400-token
call rewrites from scratch. Moving it would buy attention and no money (that
block is cached and bills at 10%). It was left alone: it is copywriting guidance,
and this file's own rule is *"do not tune the email prompt further until real
replies exist to tune against."* Splitting the ~14,000 uncached tokens out of the
audit's user block was also left: it is a 56,000-character template with 92
interpolation slots, the win is about $2 a day, and the risk is a degraded audit.

---

## 27. A question, or a page — and whether the answer would be readable

Vin: *"i want to make sure ctas that are questions are better than sending
recipients to a landing page."* Every CTA this system has ever sent is a question,
on one prospect comment and no measurement, and **nothing has ever recorded which
ask produced a reply.**

Two things had to be said before building it:

- **Deliverability.** A link in a first cold email is a spam signal and this
  domain has two hard bounces in twelve sends. Mitigated as far as a link can be:
  exactly ONE link, no shortener, no tracking pixel, no redirect chain, and it
  must sit on a domain CROJungle owns. **Without `PAGE_BASE_URL` the arm cannot
  run at all** — a raw `onrender.com` link in a cold email costs more than the
  test is worth.
- **This is not one of CROJungle's landing pages.** It is a page generated from
  the lead's own audit, built from the same ranked findings the email is built
  from so it can never claim more than the email could. That is a fair test of
  link-versus-question and it is NOT a test of what a hand-built page would do.
  Reporting it as the latter would be the "unproven reported as proven" failure.

The arm is a stable hash of the lead id, never a counter: a re-composed lead that
changed arms makes the result unreadable. It is returned by the compose route,
stored on the lead, cleared on a re-research (otherwise the next send links a
stranger to the PREVIOUS audit — caught by `clientcheck`), and frozen into the
send snapshot, because a reply arrives days later and by then the lead may have
been recomposed.

**The token is letters only.** A hex token puts digits inside the one sentence
that has to survive `verifyBrainEmail`'s figure gate, which refuses any number not
tracing to a measurement.

**The page arm is also the only arm that is readable at 25 sends a day.** Replies
are rare enough that a reply-only comparison needs hundreds of sends per arm; page
visits are far more common, so this arm produces a signal in a week where the
other needs months. `pageVisits` was already a field the UI displayed and nothing
ever wrote to.

Needs a table:

```sql
create table lead_pages (
  token text primary key, company text, payload jsonb,
  visits int default 0, last_visit timestamptz,
  created_at timestamptz default now());
```

---

**The rule this session earned.** Four separate checks passed on a build with
their own fix reverted, every one for the same reason: they exercised the
function and never the CALL SITE. Booking (the homepage argument), the city
parser (the one caller), the offer measurement (the delivery line), and the
unlinked-page read (the navigation argument). A fixture supplies its own
arguments and therefore cannot see a caller.

**A check that does not assert its call site is half a check.** Needles assembled
at runtime, comment lines stripped — a literal needle finds itself, and these
comments quote the broken calls verbatim.

Two more found only by falsification: one "falsification" did not reproduce the
original defect at all (swapping a preference order that could never matter,
because one side is always a string) and proved nothing until rewritten; and the
ask-arm safety assertions could not fire in any configuration, because the two
settings were read as globals rather than taken as parameters — so the check only
ever exercised the configuration where both are off and nothing can go wrong.

**`index.html` changed, so this needs a Netlify deploy.**

---

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

## 29. Ranking by what it would have cost him to know — 2026-08-20

The opener was chosen by HARM, a hand-assigned guess at what a fault costs. That
is the right sort for the AUDIT. Four real sends say it is the wrong sort for the
EMAIL:

- **REPLIED** — ads spend tracked on his homepage while he ranks 13th organically.
  He owns both halves and had never seen them on one screen.
- **DELETED** ×3 — no plan or agreement, no published prices, a nine-field form.
  All three are things he looks at weekly and decided.

And both findings behind every real reply this project has had —
`review_pain_pattern` and `outranked_by_weaker` — share one property: they
required **work he has not done**. He has read his reviews one at a time and
never tabulated them; he has never run the search and compared the listings.

So `OWNER_KNOWS` declares, for all 42 rungs with a recorded reason, what it would
have cost the owner to know the finding:

| | |
|---|---|
| **CANNOT_KNOW** | a JOIN of two sources he uses separately, an AGGREGATE of N things he has only seen one at a time, or a RECORD he has no view of |
| **HAS_NOT_LOOKED** | his own surface, but a fault rather than a choice |
| **DECIDED** | he looks at it and chose it |

Sendable split: 10 / 13 / 12, so it is not a placebo.

**It is not a second copy of `novel`.** novel is a hand-assigned 0-100 guess worth
**at most 7 points against a harm range of 63** — it could never change an
outcome. This is derived from what the finding's own `test()` has to read, and it
is declared where a reviewer can audit each call.

**Three things the first version got wrong, and only executing it found them.**

- **It was a complete no-op in production.** The per-lead stand-down read
  `!!URGENCY_ADJUST[profile]`, and that map's third key is `UNKNOWN: {}` — an
  empty object, which is **truthy**. Every lead stood down, every rung scored
  zero on the new dimension, and every fixture passed, because the fixtures
  called the function directly and never the call site. Fourth instance this
  session of the recorded "a check that does not assert its call site is half a
  check", and the second of "the check only exercised the configuration where
  nothing can go wrong". The check now recomputes the flag exactly as the scorer
  does, for every value `purchaseUrgency` can return.
- **Deleting the novelty term created seven ties**, and `byOpener` is a stable
  sort over an array pushed in ladder-declaration order — so a 1,300-line
  literal's layout was deciding which finding opened the email, against this
  file's own rule that a tie must not be broken by emission order. The worst pair
  put `duplicate_listing` and `review_pain_pattern` both on 86, and the second is
  one of only two rungs with a real reply behind it. novel is **demoted, not
  deleted**: coarse class first, fine tiebreak after.
- **The magnitude was too big.** At a spread of 36 it out-bid every business-type
  rule in the file — `REFERRAL_ADJUST` at −30 (David Leon deleted an email about
  his search ranking) and `URGENCY_ADJUST` at ±26 (a flooded basement does not
  compare quotes). A GENERAL rule must not outrank a SPECIFIC one. The spread is
  22, level with a two-step `SELLABLE` gap and the self-fix penalty, and there is
  now a ceiling assertion — inflating it to ±40 left every check green until that
  assertion existed.

**And the stand-down is per LEAD, not per rung.** The per-rung version failed
`URGENCY CHECK` by a single point, and the obvious patch — adding a negative
urgency entry for the review pattern — would have been wrong: a complaint that
nobody calls back is *more* relevant to a 2am emergency, not less. A
business-type rule is a statement about what matters for that business; when one
is in force it owns the ordering for that lead.

**One formula, not five.** The opener base lived in the real scorer and four boot
checks, each hand-writing `harm + (novel / 100) * 7`. Adding a term to one and
not the others would have left four checks asserting orderings that no longer
happen — the recorded two-hand-kept-copies disease, with the copies inside the
guards.

**Two classifications corrected by the adversarial pass**: `no_after_hours` reads
the booking route on his *site*, not his opening hours, so it is HAS_NOT_LOOKED;
`dated_credibility`'s recorded reason described badges while its test reads table
layout and missing viewport tags.

**Honest limit.** At a spread of 22 this changes CLOSE CALLS, not blowouts. It
will not lift a harm-48 finding over a harm-76 one. On the four real leads it
would have changed nothing: Gregory already led on the right finding, Jose's
problem was the search term, and Donna and John had nothing better available —
which is a SUPPLY problem, not an ordering one.

---

## 30. The search we measured him on was not the one he sells on

Jose Barrera, on why he deleted a true email: *"they clearly don't know that my
patients find me because they're looking for a FACIAL plastic surgeon in San
Antonio."*

We searched "plastic surgery practice in San Antonio" — the `GP_CATEGORIES`
bucket we happened to DISCOVER him under. That bucket is chosen so a Places query
returns lots of plausible businesses, which is a different job from naming what a
customer types. On a generalist the two coincide. On a specialist they do not,
and the specialists are the top of this ICP.

The correction costs nothing and is not a guess: **he named his own business.** A
modifier in the registered name is his own statement of what he sells and the
same word his customers type. Bounded four ways — the modifier must be DECLARED,
it must be in the NAME rather than somewhere on the site, the category must not
already carry it, and the head noun has to be nearby so "Mobile Home Park
Management" does not narrow "plumber".

**The stem trap, for the third time in this file.** A trade appears in a name
under a different ending every time: dentist/Dentistry, plumber/Plumbing,
roofer/Roofing. Matching the category word literally found none of them, and
"Bright Pediatric Dentistry" failed to narrow "dentist" — caught by this check's
own fixture before it shipped.

**And a floor that was never there.** "You are not in the top three" is a finding
when twenty businesses compete and arithmetic when five do. Below six results the
rank read now refuses rather than claiming a position. That matters most on a
narrowed phrase, which is exactly where a field goes thin.

`TRADE PHRASE CHECK` fixtures both directions: four specialist names must narrow,
seven generalist names must not, and "Coral Springs Plumbing" and "Moral Fiber
Landscaping" must not trip the `oral` modifier.

**`index.html` is unchanged this round, so no Netlify deploy is needed.**

---

## 31. The audit became a call sheet — 2026-08-20

Vin: *"we need to make sure the audits are 10/10 because we will be making cold
calls to the batches of 50 a day."*

That is a different artefact from an email input. Fifty calls a day is about sixty
seconds of preparation each, and three things that only matter on a phone were all
being computed and thrown away.

**Nothing recorded WHEN the audit was measured.** Not a field anywhere. On an
email that is survivable, because it goes out the same day. On a call it is not: a
rank, a review count and a set of opening hours all move, and asserting a
three-week-old number to an owner who has since fixed it ends the call and the
relationship. Every audit is now stamped, and the sheet says plainly when the
figures are old enough to re-check before saying out loud.

**Their published opening hours were reduced to a boolean.** `hasHours` was kept
and the weekday text discarded — the same discard that let the after-hours finding
fire on a business that never closes. The text is kept now and read as a calling
window against the trade: an owner on a roof is reachable in the first half hour
and late afternoon, a practice owner between patients and over lunch, and the
person who answers a practice line is front desk. A listing that publishes no
hours produces no window rather than an invented one.

**And the objection was already written.** The prospect simulator reads the email
as the owner and produces, in his register, exactly what he will say ninety
seconds into the call — on John Peters, *"my jobs come from Google reviews and
word of mouth."* That sentence was used as a pass/fail signal and discarded. It is
the most useful thing we hold for a cold call and it costs nothing, because the
call has already been made and paid for.

Deliberately NOT built: a scripted rebuttal. Writing Mike's answer for him is
copywriting against a simulator that has contradicted itself one build apart, and
this file's rule is not to tune copy without real replies. He gets the sentence
and prepares his own answer. A REPLY verdict is labelled as encouragement rather
than evidence, because twelve sends have produced zero human replies.

**The export drops the how-we-checked column.** Provenance is useful while
debugging the machine and noise on a sheet somebody is holding while dialling. The
values stay, because "176 reviews at 4.8, third of twenty" is what gets said.

---

## 32. Markets, and the second list that would have drifted

The Find picker held its own hardcoded array of the twenty cities the server
searches — a copy of `GP_CITIES` typed out again. A market added on the server
would never have appeared in the picker, and a market picked in the picker that
the server does not search returns nothing at all, which reads as "Find is broken"
rather than "two lists drifted apart".

`/api/find-options` serves both lists from the constants themselves, and the
picker is now multi-select: the server has always accepted an array and filtered
`GP_CITIES` against it, and only the single dropdown was the bottleneck.
`clientcheck` refuses a hardcoded "City ST" list coming back.

---

## 33. The half of deliverability that needs no replies

PART 4 §3 has carried "deliverability is unproven" for weeks and treated it as
something only sending can answer. Most of it is. Whether the sending domain is
CONFIGURED to be trusted is a DNS lookup — free, definitive, and never once
checked.

A domain with no SPF record, or one ending `+all`, is the ordinary reason cold
mail lands in spam, and it is invisible from inside Hunter, which reports the send
as successful either way.

- **SPF and DMARC** are definitive and parsed here, including the split-string
  form DNS returns for anything over 255 characters. A long SPF is the normal case
  for a domain using more than one sender, and reading only the first chunk would
  misreport a strict record.
- **MX matters too**: a sending domain with no MX cannot RECEIVE the reply this
  whole system exists to earn.
- **DKIM is not checkable** without the selector, which is chosen by whoever set
  the mailbox up. Guessing selectors and reporting "no DKIM" on a miss would be a
  false absence about the most important of the three, so it says it did not look.
- **A resolver failure is never a missing record.** Reporting "no SPF" because a
  lookup timed out would be the false-absence failure aimed at the one setting
  that decides whether anything arrives at all.

**Was unproven against a live domain. RUN FOR REAL 2026-08-21 and it came back
clean.** `crojungleteam.com`: SPF present (`v=spf1 include:_spf.google.com ~all`,
soft fail, normal and fine), DMARC present at `p=quarantine`, MX present so the
domain can RECEIVE the reply this whole system exists to earn. No blockers, no
warnings. DKIM correctly reported as not checked rather than guessed.

That matters beyond one lookup: PART 4 §3 has carried "deliverability is unproven"
for weeks as though the whole of it needed real sends to answer. Half of it never
did, and that half is now measured and healthy. What remains unproven is the part
only sending can settle — inbox placement, reputation at volume, and whether one
mailbox at 25 a day holds. The two hard bounces in twelve sends are still the only
send evidence this project has.

DNS is blocked from the BUILD environment, so the boot check still says the lookup
has never run there and only the parsing is exercised. That wording stays accurate
and should not be loosened on the strength of one live call from Render.

**And a fifth self-matching needle.** The assertion guarding the resolver-failure
branch was written as a literal, sat in the check's own body, and passed on a
build with the guard removed. Assembled at runtime now. This trap has now been
recorded five times in one session.

---

## 34. The clock, at last — and the honest limit on it — 2026-08-21

PART 4 §1 has carried *"nothing has a clock on it"* as the largest gap in this
pipeline for weeks. Every finding is an ongoing condition. The reason is not the
ladder and it was never going to be fixed by writing better rungs:

**One look at a business cannot see a change.** A rank, a review count, an
advertising tag — each is a photograph. You cannot get *"he started running ads
six weeks ago"* out of a photograph however good the photograph is. Exactly one
rung in the file reads a date, `hiring_marketing_now`, and its inputs arrived
only from TheirStack — so on the 92.5% of leads that come from Google Places, no
rung in this file could say when anything happened.

Two things were built, both costing nothing.

### The hiring clock now works on a Places lead

A business that wants its openings in Google Jobs must publish `JobPosting`
structured data with a `datePosted`, and that markup is sitting in the page
source we ALREADY buy and already read for advertising tags. Same page, same
credit, no model, no prose parsing: **a machine-readable date the owner published
himself.** Harvested in `harvestInteriorMarkup`, which every scraped page already
passes through, so a posting on the homepage, the careers page or a services page
all count.

It refuses far more than it keeps, because a WRONG clock is worse than none —
telling an owner he posted a role eight months after he filled it is the sort of
checkable error that destroys every true sentence beside it. No `datePosted`, a
date in the future, a passed `validThrough`, or no title, and there is no clock.
An undated opening still reports "they are hiring right now" — present tense,
true, and on the call sheet only.

**And the date is paired to the MARKETING role specifically.** A dispatcher
posted yesterday must never date a marketing manager posted eight months ago:
true role, true date, false sentence. Which titles are marketing is decided by
`signalsFromTitles`, the one function that owns that question, because a second
copy of that rule here is the disease this file keeps recording.
`HIRING CLOCK CHECK`.

### The observation ledger — the only true event this system can ever measure

Two looks CAN see a change. And this system has been taking a second look at the
same businesses for weeks and throwing the comparison away every time: the bench
re-serves 393 overflow businesses a run, the query memory rests exhausted ground
so old ground comes back, and Vin re-audits leads by hand (*"ive ran an audit on
ram jack like 6 times"*). Every one of those was a free observation against an
earlier one, discarded.

So: one small row written per research, one row read back. **No API costs a penny
more.** Needs a table:

```sql
create table business_observations (
  id bigserial primary key,
  biz text not null, company text not null,
  at timestamptz default now(), snap jsonb not null);
create index business_observations_biz_at on business_observations (biz, at desc);
```

**HONEST SHAPE, STATED FIRST: on a business we have never seen before this
produces nothing, and says so.** It is a recorder before it is a finder. The first
audit of a lead is the price of the second one being able to speak. There is no
way to buy this outcome without either paying for a data source (Vin: *"if
anything it needs to get cheaper"*) or waiting — and waiting is free.

What it may say, and what it may not:

| | |
|---|---|
| `rank_slipped` | **sayable.** Their position on the same search dropped. |
| `ads_started` | **sayable.** A Google Ads tag appeared that was not there before. |
| review pace, `weaker_above_grew`, a tag that went away, two searches that cannot be compared | **internal.** On the call sheet, never in an email. |

`rank_slipped` carries four gates, and every one of them exists because of a bug
already in this file:

- **the same search phrase both times.** §30 made the phrase depend on what their
  own name says they sell, so two runs can legitimately measure DIFFERENT searches
  on one business. Comparing "plastic surgeon" against "facial plastic surgeon"
  would manufacture a collapse out of two correct readings. When the phrases
  differ the log says the positions are not comparable rather than going quiet.
- **two agreeing samples on BOTH dates.** §6: one business returned #3 and #12
  minutes apart. A drop measured against a draw we already refused to state is
  noise with a date on it. Passed through RAW so an unmeasured stability is null,
  not "they agreed" — writing `!== false` here would have licensed the strongest
  new claim in the file off a single service-page draw.
- **a move bigger than that noise**, and at least a fortnight and at most a year
  between looks.
- **only a DROP.** Climbing is a compliment, not a finding.

**It sits BELOW `outranked_by_weaker` on purpose.** It is the more surprising
sentence and almost certainly the stronger one. It also has zero evidence behind
it, and `outranked_by_weaker` is one of only two rungs with a real human reply.
PART 6: do not trade a proven sentence for a better-looking one. Harm 88 against
92, which with novel 96 against 72 lands the opener scores at 94.7 and 97.0 — the
proven sentence keeps the lead on any business where both fire. That was reasoned
out on paper first, and §29 says paper arithmetic is exactly what to distrust, so
the check EXECUTES the real ranker and asserts the order. Raise it when a call
outcome says to, and not before.

**The isolation rule is the whole risk here.** §19 is the worst bug this system
has had: a colliding cache key handed Donna Krummen John Peters Roofing's audit.
This table is the same danger pointed at TIME — a snapshot read under the wrong
key would state another business's search position as this one's, *with a date on
it*, which is the most confident possible way to be wrong. So the row remembers
which company it was written for and a read by a different company is refused by
name. A legal suffix is not a different company: Google's `displayName` and our
stored name disagree about "LLC" constantly, and refusing a business its own
history over a suffix is the guard-too-tight failure §14 records. A practitioner
credential (MD, DDS) is deliberately NOT stripped — §24 already turns on telling
those apart.

`OBSERVATION LEDGER CHECK`, thirteen guards, every one falsified individually.

### What was deliberately NOT done

- **`ads_started` is not a rung.** A tag appearing is an observation, not a
  fault; the FAULT version is `paying_for_a_search_they_lose`, which already
  exists at harm 94. Adding a second unproven rung to compound the first is how
  two levers become one unreadable result. It reaches the audit and the call
  sheet and stops there.
- **No existing rung's sentence was changed** to carry a date. Every one of them
  would read better with `ads_started` attached; each is also a working sentence,
  and one of them has a reply behind it.
- **Google Ads Transparency stays off.** It is dated and it is built, and it costs
  a credit per lead and has never been run against a live advertiser from this
  codebase. Shipping it on would report an unproven read as a measurement.

**`index.html` changed, so this needs a Netlify deploy.** The ledger's server half
is live on merge; the "What changed since we last looked" block on the call sheet
and in the export is dark until the file is dragged in.

---

## 35. The first evidence this project will ever have — 2026-08-21

Twelve emails, zero human replies, and every quality judgement in this file is
the system grading its own homework. Fifty cold calls a day answers in thirty
seconds with a reason attached — but only if somebody writes down WHICH FINDING
opened the call, because the outcome without the finding is a diary.

`POST /api/call-outcome` stores seven states against the finding id, the
prospect-model prediction frozen at the time of the call, and — the most valuable
field — **what he actually said.** The outcome says which findings work; only his
own words say why one did not.

Four rules, each because the opposite is how thin numbers get believed:

- **Rates are over CONVERSATIONS, not dials.** A finding cannot be blamed for a
  voicemail, and mixing the two is how you conclude the copy is broken when the
  phone list is.
- **Under twelve conversations is marked UNREADABLE**, out loud, on the report.
- **The outcome is stored HERE before any CRM sees it**, and the webhook is
  fire-and-forget: a CRM being down must never lose a call or block the person
  logging one.
- **A free-text status is refused.** A column you cannot group is a list.

The CRM is a **webhook** rather than a native integration, deliberately: Mike has
not picked one yet, and a HubSpot adapter written today is wasted if he buys
Close. `CRM_WEBHOOK_URL` reaches HubSpot, Close, Pipedrive, GoHighLevel, Zapier,
Make or a spreadsheet with no code from us. Needs a table:

```sql
create table call_outcomes (
  id bigserial primary key, lead_id text, company text, outcome text not null,
  finding_id text, finding_text text, said text, follow_up_at date,
  next_step text, predicted text, at timestamptz default now());
```

`GET /api/call-outcomes` returns the report grouped by finding, `?format=csv` for
a spreadsheet. `CALL OUTCOME CHECK`, seven guards, all falsified.

**This is the lever, and it is the only one that is not inference.** PART 5 has
two proven things and three replies behind them. Forty conversations logged
against findings would be more evidence than this project has accumulated in its
whole life, and it needs no code to produce — just somebody pressing a button
after each call.

---

## 36. The niche library, and the wall between it and an inbox — 2026-08-21

Vin, after hand-researching a brief on independent hotels for Mike: *"why dont we
have info like this for every single niche we are taregting so we can come in pre
audit knowing all the big issues of these niches."*

He is right, and the warning he was given elsewhere is right too: **a static niche
library is a fabrication engine if it is not bounded.** "Restaurants lose 30% to
DoorDash" sent to a restaurant that does not deliver is a confident false claim,
and PART 3 has exactly one rule that cannot bend.

**This is not a new mechanism.** `TRADE_JOB_VALUE` has been a niche library for
weeks — public knowledge about an industry, declared in code, deliberately
conservative — and its own comment already states the rule: *"The claim is 'a job
in this trade runs about this', never 'your job'."* `AUDIT MONEY CHECK` already
enforces it and was already falsified. So this extends a working gate rather than
inventing a second one.

### The boundary is structural, not instructional

PART 3 again: *"the prompt banned post-submission claims 19 times and every audit
produced one anyway."* So "use this as framing, never as a claim" written into a
prompt is worth nothing. Every brief is split into two halves the boot check
enforces by SHAPE:

| | |
|---|---|
| **DECLARED** | the unit of business, who buys, the vocabulary, which software to ASK about, where margin leaks in the segment, the questions worth asking. **No digit is permitted anywhere in it**, so none of it can be a wrong number about a business. |
| **SOURCED** | figures. Each row carries the figure, its source and its date or it does not exist — and **no row may contain "you", "your", "they" or "their"**, so a cited segment fact is structurally incapable of becoming a claim about the company in front of us. |

Where each half may go: DECLARED and SOURCED both reach the call sheet, the export
and the audit prompt. **Neither reaches an email**, and that needs no new gate —
nothing here is added to `permittedFigures`, so a stray figure is already refused
by the trace that has run for weeks, and the wordless version is caught by the
generalisation gate below.

### The gate that already existed, widened

`INDUSTRY_SUBJECT` catches a plural trade noun in front of a NEGATIVE verb —
Emily Taylor's *"Estate planning attorneys in Phoenix aren't showing up"*. A niche
brief introduces the positive half of the family and it is just as false:
*"roofers typically give up a quarter of every job"*, *"most contractors your size
are running the same setup"*, *"businesses like yours usually see this"*.

Keyed on a trade or business noun **next to** the generality marker, never on the
marker alone: `PATTERN_GENERALITY` REQUIRES "usually" in the review-pattern
sentence, and "six people usually wait a week for a quote" is a fact about his
customers. The check asserts both directions — five intruders refused, two
legitimate sentences untouched, and a CONTROL email that must pass, because a
fixture refused for its word count would tick green on a build with the gate
deleted.

**Its first run found the gate missing the singular.** "The average practice loses
money here" passed, because the noun list held only plurals.

### The money extractor had a defect the library exposed

`TRADE_MONEY_UNITS` flattened the sentence and THEN matched, and `flatMoney` strips
every space, so the `[a-z]*` that exists to catch the "k" in `$40k` ran on into the
next word — `$519directagainst`. It never showed on the trade table because every
row there ends on its figure. The first sentence with a figure in the MIDDLE
exposed it. One extractor now, used by both.

### Nine briefs, and eight of them have an empty SOURCED half

That is deliberate and it is the honest shape. Vin's own framework budgets 2-4
hours a brief and its rule four is *"never estimate a number that could be
sourced."* Filling them from memory would be the exact failure. The DECLARED half
needed no research because none of it is a quantity, and on a phone call it is most
of the value: knowing a roofer quotes in squares, that his real number is
estimate-to-job close rate, and that the question is *"when you're up on a roof,
who picks up?"* beats a benchmark he will argue with.

**Independent hotels is the worked example** — nine sourced rows, every one cited,
because Vin did the work. Stated plainly: hotels are NOT in `GP_CATEGORIES`, so
that brief cannot attach to anything the pipeline currently finds. It fires the day
hotels are added as a target category.

### What was deliberately NOT built

- **No ranking hook.** The obvious next move is letting a brief re-order the
  findings for its segment, the way `URGENCY_ADJUST` and `REFERRAL_ADJUST` already
  do. Two unproven ranking levers shipped in the same week is how two levers become
  one unreadable result, and the call-outcome capture is the thing that will say
  which order is right. PART 6: do not tune without evidence.
- **No brief content reaches the writer.** The check reads the source of
  `buildWriterBrief`, `buildRewriteBrief` and `buildEmailEvidence` and fails if any
  of them so much as mentions the library.

`NICHE BRIEF CHECK`, ten guards. Nine falsified individually; the tenth
falsification found a hole in the check itself — pointing the forbidden-function
list at three names that do not exist made the assertion evaporate and the whole
check pass. It says so out loud now instead of skipping.

**And the Measured signals table is gone from the export.** The provenance column
left last round; what remained was a grid of "Not checked" rows beside a handful of
numbers the prose sections say better. The signals are still computed and still on
the audit screen, where reading a grid is what you are there to do.

**`index.html` changed, so this needs a Netlify deploy.**

---

## 37. The launch sweep — 2026-08-21, the night before the first 50-batch

A full re-verification before calling starts, with a rule of its own: no new
features, only defects. Three found, all fixed at the root:

- **The last two pushes were never merged.** The clock/call-outcomes and the
  niche library sat on the branch while Render served main without them. The
  usual squash-merge rebase, PR #23, merged. The lesson is procedural: a push
  to the branch is not a deploy, and the sweep now starts by diffing
  origin/main against the tested tree.
- **Two prompts joined their lines with the two-character string `\n`.**
  Inside a template literal `'\\n'` is backslash-plus-n, not a newline. The
  domain-confirmation prompt had sent its known-facts list as one run-on line
  for its whole life; the niche brief's sourced figures did the same. Same
  root cause both times: an escape written for a quoted string, inside a
  template literal that wanted the real character.
- **`door\w*` sat bare in the crew-trades matcher** and filed "Doors of
  Distinction interior design" under crew trades — the recorded garage-door
  lesson back a third time. Removed rather than narrowed: window-and-door
  companies already match on `window\w*`, garage doors have their own
  anchored entry, and a pure door company now gets NO brief, which is the
  designed answer.

Verified clean on the same sweep: every route the client calls exists on the
server; the outcome buttons read the finding id from a spine that survives
both the audits-only path and a reload; the 50-batch export wraps each lead
in its own try/catch, reports broken leads as a visible row, and downloads as
one self-contained file.

---

## 38. The screen, on launch night — 2026-08-21

Three complaints from Vin, one functional and two about noise.

**The market filter did not exist before a run.** "theres nothing on the
frontend that allows me to apply the filter for when i find leads for location
based." He was right, and the picker had been built: §32 replaced the single
city dropdown with multi-select chips. It rendered inside a COLLAPSED panel that
only exists when `discovered.length > 0` — below the results list, five hundred
lines down the page. So before the first run there was no control at all, and
after a run you had to know to expand a toggle to find the thing that scopes the
NEXT run.

A control that decides what a run BUYS belongs beside the button that spends the
money. `scopeBar` is one definition on the same `pullFilters` state, rendered
above both the empty state and the list. The two controls were REMOVED from the
collapsed panel rather than copied — one home each — and the panel's helper text
no longer claims to narrow the next pull, because it does not any more.

**Colour had stopped meaning anything.** A Research card could stack seven
filled panels at once: rate limited, reachability, domain match, owner email
match, out of credits, ICP blocked, tone chips. Generate ran a red "Hot Lead"
bar for a GOOD score, a green-or-amber block for which prompt path wrote the
email, and a full-bleed green/amber/red panel around the prospect simulator —
whose own footer says it is "one reading, not a rule".

One rule now: **colour marks a stop, nothing else.** Green is gone entirely,
because a coloured box confirming the ordinary case appears on nearly every lead
and is exactly what drowns the two panels that mean *do not audit this*. The
survivors keep a hairline and lose their fill: `domainMatch === 'no'` (we may be
auditing the wrong business), an owner address belonging to a different person,
and the send-blocker verdict that PART 4 §19 added to stop a fabricated audit
reaching Send.

**What was NOT done, on purpose.** `BucketCard` is defined in ResearchView and
rendered nowhere. Removing it means locating its true closing brace, and the
first attempt cut the wrong one and orphaned the body — caught by the parser in
seconds, but it is precisely the edit that breaks a screen the night before it
is needed. It stays, with a note.

Verified as styling-only rather than asserted: the React element inventory
before and after is identical except for four new `div`s, which are the scope
bar. No `select`, `button` or `option` count changed, so nothing was removed
from the screen — only moved and repainted.

**And the queue is not the pipeline.** Vin: "it only lets me do 3 it says 3
readys" — with 195 companies in the Find queue and 4 leads in the pipeline.
Find fills a QUEUE; the batch audits the PIPELINE; and the only thing that
moved a company between them was `addAndResearch`, one at a time. A fifty-lead
batch meant fifty individual clicks before any research could start, which
would have been discovered at nine tomorrow morning.

The sixty-line lead literal is now `leadFromCompany` at module scope, called by
both the single-add path and a new `addManyToPipeline`. Extracted rather than
copied, and verified by lifting it out and executing it: **all 68 fields the
original inline literal produced are present**, the Find-time payload
(`placeId`, review count, rating, `buyingLane`, `jobPostedAt`, markets) survives,
and two calls get distinct ids. The requirement list is read from the
PRE-EXTRACTION file, because a check whose requirement comes from the code under
test cannot fail — the first version scraped it from the new source, matched
nothing, and reported "all 0 fields present" as a pass.

The bulk bar acts on `filtered`, so the scope bar decides what moves, and its
count is of companies genuinely not in the pipeline yet. Its first draft called
`setToast`, which is declared in the App component and not in FindView — a
ReferenceError on the first click, caught before it shipped.

---

## 39. The first live run, read line by line — 2026-08-21

Vin ran three leads for real and sent the screen, the export and the whole
Render log. He asked for three things on the front end. The log carried three
more that nobody had reported, and two of those were costing paid-for work.

### The gate learned the plan and paced as if it had not

Eleven `FIRECRAWL RATE LIMITED` lines on a **three-lead** run, and Gregory S.
Young finished with **five of his seven pages missing** — "this lead's audit is
INCOMPLETE". Two causes, both the same disease this file is mostly a record of.

`FC_LIMIT_PER_MIN` is read off Firecrawl's own `x-ratelimit-limit` header on
every response, stored, and used for exactly one thing: choosing a CONCURRENCY.
The gap between starts stayed at its 350ms default — **171 requests a minute, on
every plan they sell.** A measurement taken correctly and never delivered to the
thing that acts on it, instance twenty-four. The gap is now derived from the
limit with a quarter of headroom and never falls below the configured floor.
Deliberately NOT gated on `FC_CONCURRENCY` being set: those are two different
settings, and letting one govern the other would mean an operator who pinned the
browser cap silently lost pacing altogether.

And both retry loops treated a 429 as a fact about ONE request. While one caller
slept its 4s, 8s, 12s, the gate started the next one 350ms later into the same
closed door — a backoff that is individually correct and collectively a
thundering herd with politeness bolted to one of its members. A 429 now holds the
WHOLE gate, using Firecrawl's own `Retry-After` where they send one and our
backoff where they do not, capped at 60 seconds so one bad header cannot stop
every Firecrawl call in the process.

**A third rate-limit branch was found while fixing the two.** The homepage read
counted the hit and held nothing — and it is the FRONT of a seven-page fan-out,
so the six interior reads behind it were about to walk into the same door. All
three branches go through one holder now. `FIRECRAWL PACING CHECK`, six
falsifications, every one red alone.

### The last gate before a prospect did not run on half the audits

Two of four audits: `FACT CHECK DID NOT RUN — the critique call failed
(timeout)`. That call is the only thing between a composed email and somebody's
inbox, and one slow answer removed it for the whole lead. There was **no retry
anywhere in twenty-three Anthropic call sites.**

`max_tokens` on that call is 1600 and Haiku writes roughly a hundred a second, so
a full answer is about sixteen seconds of writing before the first token and
before a long prompt is read. The ceiling was 25 seconds. It is 45 now — but the
number is inferred from the call's own shape, not measured, and **the retry is
what makes this reliable**; a ceiling can always be one second short of the next
slow afternoon.

Only the word "timeout" is retried, and only where it was asked for. A refusal, a
4xx and a bad key all fail identically the second time, so a blind retry across
all twenty-three sites would double the bill on exactly the failures that cannot
be helped. The transport is a parameter, so `FACT CHECK RELIABILITY CHECK`
EXECUTES the loop rather than reading it — and its first falsification printed
`COULD NOT RUN — timeout`, which reads as an infrastructure problem at boot
rather than as the missing retry. Named properly now: a message pointing at the
wrong cause costs exactly what one naming no cause costs.

### The three the screen needed

- **"i had to chekc the logs to know" where the run was.** The only progress on
  screen was `now: <one name>` in 10px grey inside a 200px sidebar, and it held
  ONE name while the runner runs three leads at once — so it showed whichever
  started last and changed under you for no visible reason. A bottom bar now
  reports finished of total, a progress line, the leads actually in flight, the
  elapsed clock, the outcome tally as it lands, and any lead that needs a human
  by name. The only derived figure is the time remaining: it says out loud that
  it is an estimate, appears only once two leads have finished, and is computed
  from this run's own wall clock, which is what makes it right at any
  concurrency. The sidebar's copy of all this was REMOVED rather than left
  beside it — one home each.
  Its reducer is at module scope and pure, so `batchcheck.js` folds every event
  of a real fifty-lead run through it: a name added on start and never removed on
  done is invisible on three leads and puts fifty names on the screen on fifty.
  Falsified both ways.
- **The three tier filters are gone.** "Likely reachable", "Named after a
  person" and "Size verified" were three views of `reachPredict` and
  `sizeVerified`, and both of those already decide the ORDER of the list — the
  strongest leads are at the top whether anything is pressed or not. The
  prediction itself is untouched; only the three ways of looking at it are.
  A tab id selected before the removal now falls back to All, because without
  that it drops through to a source comparison that can never match and the
  screen shows an empty list with no way to tell why.
- **The bulk panel says what it will do.** A number box, a bare count, two
  lowercase checkboxes and a button whose label changed shape depending on a tick
  box. Every control survives — this is the button that spends real credits — but
  each now says in plain words what it does, and the count is of the pool as well
  as the limit, because "50 ready" against a pipeline of 4 and against a pipeline
  of 400 are different situations the old line could not tell apart.

### "It said export 4 audits" after a three-lead run

It was right, and it read as a miscount: the fourth lead was audited in an
earlier session and is still in the pipeline. The button was not wrong; its label
was silent about its own scope. On a fifty-lead day that silence is a file handed
to Mike with last week's leads mixed into it and no way to tell which is which.
The sidebar button now says it covers the whole pipeline, and the run's OWN set
is offered separately in the progress bar, where the run is.

### And a boot check that was wrong about a live server

`BATCH MEMORY CHECK` went red on Render and green locally. Render's boot is about
2.7× slower under contention — `FIRECRAWL GATE CHECK` measures 12,900ms there
against 4,824ms here — so a 12-second liveness budget was measuring the dyno, not
the code. Raised to 60 seconds, with the reasoning written at the assertion: a
genuinely leaked slot never resolves at ANY budget, so the number only decides
how much slow boot it tolerates, and a check that fails on a slow afternoon is
one somebody switches off, taking the real ones beside it.

**`index.html` changed, so this needs a Netlify deploy.**

---

## 40. The harm ladder had been dead on every lead — 2026-08-21

Vin ran five leads and sent the whole Render log. Three lines in it, repeated
once per lead:

```
harm ladder failed — location is not defined
▶ COMPOSE TRACE step 3: _harmsForResponse=false
```

`observationKeyFor({ placeId, website, company, location })` used `location` as
a shorthand property. There is no `location` in that scope — the lead's city
arrives as `req.body.location` — so the line threw on **every lead, on every
run, since the observation ledger shipped**, inside the ladder's try.

The cost is not one field. It is all 43 rungs: no factual spine, no problem
list, no subject lines, no opener verdict. **Both findings with a real human
reply behind them are rungs.** On that run Bret Rodgers had BOTH measured —
`DEEP PAIN: 2 verified repeating patterns` and `RANK ROW: 1 of the 7 above them
have FEWER reviews` — and neither reached his audit. Every audit in the run was
written by the model with nothing under it. The observation ledger has also
never written a single row: both its calls sit below the throwing line, so §34's
clock has been recording nothing and every future look will also be a first look.

**This is the third time one out-of-scope name has killed the whole ladder**
(`deepPain`, `reviewPainFound`, now `location`), and both guards written for it
missed this one:

- **`scopecheck.js` shared ONE globals list between server.js and index.html**,
  and that list whitelists the browser globals — `window document navigator
  location history localStorage`. None of them exist in Node. The gate written
  for exactly this class reported the file clean. It is three lists now, chosen
  by the file's runtime, with a self-test asserting they stay disjoint and that
  `location` in particular stays browser-scoped. A sweep with the fixed walker
  found `location` was the only one.
- **`LADDER SURVIVAL CHECK` is a denylist of three names somebody remembered** —
  `deepPain|reviewPainFound|painSummary` — inside one argument slot. The new
  crash was a fourth name in a different call ninety lines away. A hand-kept list
  is exactly what nobody updates; the general guard is scopecheck.

**And a crashed ladder looked exactly like a clean business.** One grey log line,
and the audit shipped normally to the screen and the export. Those are opposite
facts. The failure is now recorded rather than only logged, named outside the
guard that goes false when it happens, carried in the response literal, and
rendered as a red block on both the audit screen and the exported sheet.
`LADDER CRASH VISIBILITY CHECK`, four falsifications.

---

## 41. What one live run and eight parallel investigations found — 2026-08-21

Vin: *"analyze evyrhting very detailedly - eveyr single word in the log every
single word in the audit."* Eight agents read the code behind each symptom and an
adversarial pass tried to refute every finding: 29 confirmed in code, 1 refuted.

### Nothing false may reach a prospect — four ways it could

- **"Michelle Musacchio, Owner" was a `||` default.** The resolver printed
  `"no title found" (authority 30) is below the buying floor. HELD BACK`, and the
  merge read `decisionMaker.title || verifiedCEOTitle || 'Owner'`. Nobody read
  that word anywhere. The resolver computes `canBuy` and `blockReason` and the
  caller consulted neither — the whole authority gate survived as a
  `console.log`. A held-back candidate is now kept separately as
  `heldBackContact`, labelled as unverified on the sheet, and an absent title
  prints as "(no title found)".
- **And the brain was quoting us back to ourselves.** The audit prompt was handed
  `Michelle Musacchio (Owner) — found in public search results` on a run whose own
  log said `DM/websearch: no owner found in web results`. The model echoed it and
  the echo was logged as `Brain extracted decision-maker ... [high]`, which reads
  like a second source agreeing. One source, three lines of agreement, no
  evidence. The brain may now ADD a name we did not have; it can never overrule
  the resolver and it can never supply a title.
- **A vague claim was made precise about a page nobody opened.**
  `narrowAbsenceToPagesRead` rewrites "nothing anywhere on their website" to
  "your homepage" when only the homepage was read — and `pagesRead` counts
  INTERIOR pages, so zero and one were the same case, and zero is the blind case.
  Stanley Schultze's homepage was refused twice with HTTP 402 and the narrowing
  fired anyway. It now takes `homepageRead` and DELETES the sentence when we read
  nothing, because a sentence with the scope word swapped still asserts the
  absence.
- **The audit could quote anything.** `SOURCE VERIFY` covers two fields;
  `verifyOriginalFinding` covers one list. Every other prose field could put
  quotation marks around a sentence nobody wrote — and those are what Mike reads
  down a phone to the person who owns the page. `stripUnverifiedQuotes` removes
  the whole sentence, on the same corpus as the money gate, with an empty corpus
  removing nothing (that is the read-limit case, not the fabrication case).
  `QUOTE PROVENANCE CHECK`, both directions falsified.

### The audit contradicted itself in its two headline blocks

On two of four leads: *"The one thing — THROUGHPUT: demand is not the problem,
delivery is. More leads here makes it worse"* directly above *"Fix this first —
DEMAND: the constraint is demand generation."*

Two engines over disjoint vocabularies. OPERATIONS is unreachable from review
evidence — its branches need a verified headcount and revenue-per-employee, and
this ICP almost never has either — so THROUGHPUT-versus-DEMAND was structural,
not incidental. The DEMAND tail also asserted two things nothing measured ("the
site is functional", "nothing is driving qualified traffic") and printed verbatim
on three of four leads.

They were never rivals: the binding layer is WHAT holds the business back, the
bottleneck is the FIRST BROKEN LINK on the way to fixing it. The cascade defers
to the layer, a funnel we could not read reports as unread instead of being
diagnosed, and `diagnosisConflict` refuses the one pairing a reader cannot act
on. Deliberately narrow — THROUGHPUT + CAPTURE is not a conflict, both say "do
not buy traffic yet". The prescription branches were the worse half: the `else`
sold ads management to a business whose customers say it cannot keep up.

### The money, at fifty leads

- **A process-wide flag reset by every incoming request.** `FIRECRAWL_OUT_OF_CREDITS
  = false` ran at the top of each research request while three run concurrently,
  so a lead that ran blind could report that credits were fine. The latch stays
  process-wide (an empty balance is an account fact); it is cleared by a paid
  call SUCCEEDING, and a timestamp answers per-request.
- **The queue admitted leads after the money was gone.** Stanley Schultze queued
  at 14:38:49, was admitted at 14:40:28, and paid for Places, a review pull and
  four model calls to produce an audit built on zero pages. On five leads that is
  one wasted lead; on fifty it is dozens. The queue now refuses before spending
  and says what to do.
- **`fcAsk` was the one Firecrawl door with no fail-fast.** The other four have
  it. Two doomed paid requests per lead, each holding a browser slot.
- **The bulk run re-submitted leads already running.** `status` is written by the
  MERGE, so an in-flight lead still reads 'new' and was still picked. The
  `duplicate request ignored` line is the server catching one of them; it dedupes
  on the display name and cannot catch them all.

### Research started without anybody pressing anything

Vin: *"i added 5 to pipeline most certiantly didnt hit run research and some of
the leads started running research."* Three call sites can submit, and a
`useEffect` keyed on the selected lead re-entered the whole research cycle on
mount, on every sidebar click, and on the automatic navigation after each add.

The fix is not to find the one path. **`researchViaQueue` now refuses to SUBMIT
unless the caller names the human gesture behind it**, from a closed set — a
caller that names nothing does not spend, and says so with a stack. Collecting a
job already paid for needs no gesture and cannot submit. In-flight records are
stamped with a per-tab id, so one tab never re-enters another's run.
`batchcheck.js` executes the refusal.

### The last gate before a prospect did not run on half the audits

`FACT CHECK DID NOT RUN — the critique call failed (timeout)` on two of four.
There was no retry in twenty-three Anthropic call sites. Ceiling 25s → 45s,
inferred from the call's own shape, and a single retry on the word "timeout"
only — a refusal, a 4xx and a bad key fail identically the second time.

### The sheet Mike dials from

- **"Do not say" was silently empty on every lead that had been through
  Supabase.** Three readers each hand-wrote the two-place read of the fact-check
  and the newest one — the EXPORT — read only the lead top level. `_criticalFactCheck`
  is written ONLY onto `brainAudit`, so the export has **never once printed a
  claim the prospect could disprove**, and `sec()` renders nothing for an empty
  body, so a dropped fact-check printed no heading at all. One accessor now, and
  an audited lead with nothing flagged says so out loud.
- **It quoted the regex match, not the sentence.** Stanley Schultze's entire
  entry read `states the visitor disappears — unobserved — "disappears"`. A
  one-word pattern produces a one-word quote by construction; `phraseAround`
  already existed for this.
- **Every entry was an engineering rationale.** Three sentences of "this
  overstates our evidence" for a man holding the page while a phone rings. The
  section stays — it is what stops a false sentence being said out loud — but the
  sheet gets the instruction and the screen keeps the reasoning.
- **A blind audit printed as a normal one.** `corpusRead` now travels on every
  response and one sentence says how much of the business was actually read.
  A warning on every sheet is one nobody reads, so it appears only when the read
  was genuinely short — falsified in both directions.
- **`_readLimits` was computed, named, shipped and rendered nowhere.** It has its
  own section now: what we could not check, which is a different thing from a
  claim we cannot stand behind.
- **An absence read off a measurement that never ran.** `NO PHONE ON THAT PAGE`
  fired when `htmlSignals.checked` was false — from two measurements that never
  happened — and printed "we measured NONE there" beside "booking read: unknown".
  It refuses to speak when it did not look, and the note moves to read limits.

**Five new boot checks, 191 green.** Every fix falsified individually; every one
red on its own.

**`index.html` changed, so this needs a Netlify deploy.**

---

## 42. The second live run: the fixes held, and the export read them out loud — 2026-08-21

Vin ran a second batch on the freshly-deployed build and sent the screen, the
export and the log. The big picture: **the ladder is alive** — David Price,
Joseph Jensen and McCormick Law all carry real measured problem lists, and
McCormick's sheet names the competitor above him with both review counts. The
blind-corpus banners fired on every lead Firecrawl starved. The old audits
(Bret, Fit Money, Binh, Stanley) still show the pre-fix contradictions because
they are STORED text from the dead-ladder run — re-run them, do not read them.

Seven defects surfaced, one of them self-inflicted that same day:

- **Two new row fields killed every save.** `held_back_contact` and
  `corpus_read` were added to `leadToRow` with no matching Supabase columns, and
  PostgREST refuses the ENTIRE payload on one unknown key — the red NOT SAVING
  banner, HTTP 400, on launch night. The root fix is that this class can never
  do that again: on a 400 the client reads Supabase's own body, which names the
  missing column, strips that ONE key, retries so everything else lands, and
  prints the exact `alter table` that fixes it permanently. The parser is
  executed by `clientcheck.js` against the real PGRST204 body, with a 500 and an
  RLS refusal asserted NOT to match — misreading either would strip fields
  forever instead of naming the real problem.
- **One sidebar list held three different kinds of lead.** A finished audit, a
  lead mid-research and an untouched lead were identical score-sorted rows, and
  "Export 7 audits" after a five-lead run read as a miscount. Three sections
  now — **Auditing now / Not audited yet / Audited — what Export covers** — one
  row renderer for all three, in-flight membership read from the same records
  the resume path uses.
- **The blind guard sat one branch too low.** McCormick's sheet said "We never
  read a single page of their website" and then "Fix this first — FOUNDATION:
  the site cannot convert". `_siteConverts` is false when nothing was read, so
  an UNREAD site satisfied "cannot convert" before the NOT-MEASURED guard could
  fire. The guard now sits above every absence-built branch — everything above
  it rests on positive evidence, which proves we looked. The order is asserted
  by `DIAGNOSIS AGREEMENT CHECK` and falsified by moving it back.
- **The deferral repeated the block above it.** David Price's "Fix this first —
  OFFER" restated the whole "one thing — OFFER" paragraph directly beneath
  itself. One sentence now, pointing up.
- **"15 reviews at 3.5" against a measured 150.** The unsourced-number check
  exempts anything ≤ 20 so "3 things" is not flagged — and a DROPPED DIGIT
  produces a small number by construction, so the exemption protected exactly
  the error. A sub-floor number is now flagged when it is a measured number with
  one digit missing or added. Executed against Jensen's exact sentence.
- **The checker's own approval reached the sheet as a warning.** The merge into
  `_claimRisks` ran on the RAW flag list, 25 lines above the cleared-entry
  filter, so McCormick's "Do not say" carried the literal item "fact-check: No
  flagged claims." Moved below the filter; a clearance can never render as a
  caution again.
- **Register polish that is really accuracy:** "1 other above them have fewer"
  → has/have by count on the flagship finding; a CPA's call window no longer
  says the owner is "with patients"; the export deduplicates a flag that
  arrives both as a critical entry and as a prefixed claim risk.

And `LADDER SURVIVAL CHECK`'s green line now states its honest limit: it builds
its own arguments, so it cannot see a bad name at the live call site —
scopecheck's runtime-split globals are the guard for the cause, LADDER CRASH
VISIBILITY for the consequence. A dead `String(resolveMeasurements)` capture
that sat in it looking like evidence is gone.

**Needs one SQL run in Supabase** to make the two new fields durable (everything
else saves without them either way):

```sql
alter table leads add column if not exists held_back_contact jsonb;
alter table leads add column if not exists corpus_read jsonb;
```

**`index.html` changed, so this needs a Netlify deploy.**

---

## 43. One 402 shut Firecrawl down for the life of the process — 2026-08-21

Vin: *"when auditing in bulk they all come back saying firecrawl out of credits
even tho its not out of credits - when i ran one singular lead it worked and
audited so its a bug."* Two defects, both introduced by §41's own credit fix,
and each is enough on its own.

### What tripped it: a throttle read as an empty balance

`isCreditError` matched the phrase **"upgrade your plan"**. Firecrawl appends
that to several different errors, and their CONCURRENCY limit message is one of
them — which returns **429, not 402**.

A bulk run is three leads each fanning out seven page reads against a
two-browser cap, so it meets that message constantly. A single lead never
reaches the cap. That is the whole bulk-versus-single asymmetry: the same
account, the same balance, and only the concurrent run latched itself broke.

`fcAsk` also tested credits BEFORE throttling, so the throttle never got a
hearing. Fixed at the predicate rather than by reordering call sites: the two
are mutually exclusive now and a throttle always wins, so the verdict cannot
depend on which one a caller happens to test first. A 402 is still definitive
and short-circuits ahead of everything. "upgrade your plan" is gone from the
credit test entirely — on its own it is marketing copy attached to whatever went
wrong, not a statement about the balance.

### What made it permanent: a latch with no way back

§41 moved the reset off "a request started" — where three concurrent leads
cleared it for each other — and onto "a paid call SUCCEEDED". That half was
right and the consequence was not thought through:

- every Firecrawl door fails fast while the latch is set
- the queue refuses the lead before it starts
- so **no paid call can ever be made**
- so `fcNote(true, …)` can never run
- so the latch can never clear

A circuit breaker built without its half-open state. One 402 — or, given the
defect above, one concurrency throttle — shut Firecrawl down for the whole
process until Render restarted it. Vin topped the account up and the server had
no way to find out.

It re-tests now: after a cooldown, exactly ONE call is let through to find out
whether the balance is back. If it answers, the latch clears for every lead; if
it is refused again, the clock restarts. Only one probe per window, so a
fifty-lead batch cannot hammer a closed door.

Time-based on purpose. An in-flight flag would have to be released on every exit
path — success, credit error, timeout, 429, throw — and the one path somebody
forgets is a second deadlock wearing different clothes. A clock cannot be
forgotten.

And the queue **holds** rather than refusing instantly. Refusing in one second
turned a five-lead batch into "4 audit failed" on an account that had credits;
an empty balance is usually a top-up away, and a lead that waits two minutes and
then runs properly is worth more than a lead failed immediately. The wait is
bounded, so a genuinely empty account still ends the batch rather than hanging
it, and nothing is spent while it waits.

`CREDIT BREAKER CHECK` — five falsifications, every one red alone. Its own first
run failed on a false positive of its own making: it counted the CLEAR inside
`fcNote` as a door, because that clear also reads the latch. A check that cries
wolf is one somebody switches off, taking the real assertions beside it, so the
exclusion is what the branch DOES (assigns false) rather than a line number.

### And the screen said the same thing four times

Vin: *"this page is just very busy still."* The audit-integrity strip rendered on
every audited lead, and on a healthy one it read "Confirmed: auditing
https://x.com" **with the same URL repeated on the line beneath it** — under a
header already reading "✓ real domain resolved", beside a Website field carrying
it a fourth time.

Same rule the colour pass established in §38: a panel confirming the ordinary
case appears on nearly every lead and is exactly what drowns the two that mean
DO NOT AUDIT THIS. It speaks only when the domain is wrong, unconfirmed, or no
site was read at all — and the second line carries the REASON, never an echo of
the URL already in the line above it.

**`index.html` changed, so this needs a Netlify deploy.**

---

## 44. The safety gates were auditing our own facts, and killing the lead — 2026-08-21

Vin ran five leads. **Four of the five audits failed**, each after a full paid
research cycle. *"nto sure why the numbers are off i clealry added 5 into the que
abnd hit audit 5... this was a very sloppy run it took forever and none of the
auidts worked... these wasted firecrawl creidts and anthropic as well i htink this
cant happen when we are doing 50 at a time this could drain our moeny."*

He is right about the money and the cause is one design error repeated in three
places: **a gate written to police the MODEL was pointed at the whole response,
which by then also held everything CODE had assembled.**

### The quote gate deleted the factual spine

`stripUnverifiedQuotes` removes a sentence that puts quotation marks round words
appearing nowhere in what we read. It ran four hundred lines below where the
ladder attaches its output, so by the time it ran `parsed` also carried
`factualSpine`, `problemList`, `subjectOptions`, `harmsRanked` and
`composedEmail` — code-assembled from measurements, every figure already traced,
every sentence already gated. The walker cannot tell those from model prose.

Live on Thrive Dental, it deleted this:

> Fusion Orthodontics | Dallas shows up above them on Google for **"orthodontist
> office in Dallas, TX"**, with 492 reviews against their 540

That is our own spine, and the quoted span is **the search we ran**. It is not a
sentence on their website and it never could be. §8 already records this exact
category error — a review-derived finding checked against web pages it cannot
appear on — and this is the same error a third time, with the corpus missing the
one thing that is entirely ours.

The stripper's own comment claimed it *"skips anything we assembled"*. It skipped
underscore-prefixed keys, and not one of those fields is underscore-prefixed. A
comment declaring an intent the code does not implement is the two-hand-kept-copies
disease with only one copy real.

Three fixes, all structural:

- **It runs before anything of ours is attached**, and walks only the key set
  captured at the moment the model's JSON parsed. "What the model wrote" is now
  decided by construction, so there is no list to keep in step.
- **It runs on every lead.** It sat inside `if (_harmsForResponse && parsed)` —
  false exactly when the harm ladder crashed, which is when the model wrote the
  whole audit with nothing under it. §40 is a whole section about the ladder
  having been dead on every lead for weeks: the last gate before Mike's phone
  call was absent on the leads that needed it most.
- **The corpus holds what we hold.** The search phrase, the competitor names
  Places returned, the city and the trade word. Strings only, never numbers,
  because the same corpus licenses a FIGURE in the money gate and a review count
  dropped in here would quietly license "$492" in a sentence about their money.

And one rule, asked of two different claims. The strippers ask *"did ANYONE we can
point to write this?"* — the search phrase qualifies, we typed it. `originalFindings`
asks *"is this read off THEIR OWN COPY?"* — our search phrase emphatically does
not, and that finding can be promoted into the factual spine by the sharper-claim
swap, so a false one reaches the EMAIL and not just the sheet. So the second keeps
the pages-and-reviews corpus it has always had. The boot check asserts the split by
building both and requiring the same quote to fail against one and verify against
the other — a fixture that only refuses proves nothing, because a quote that
verifies nowhere refuses everywhere.

### The money gate deleted our own price out of the field built to hold it

BVA: `⛔ INVENTED MONEY: removed 3 sentence(s)... $40k, $70k, $10k, $35k. First
one: "$40k-$70k implementation, variable ongoing"`. That is our AI Brain price in
`recommendedPrice`.

Our own prices are licensed only when the SENTENCE is about our own work, because
"$50k" is ours in *"a rebuild starts around $50k"* and invented in *"a $50k roof
replacement"*. A price fragment has no sentence to be about anything. The
fact-checker prompt has carried the exemption in words for months — *"this and
its price are shown to our own team... do NOT flag the product or its price"* —
and the gate that actually DELETES had never been told. **A guard in the wrong
function**, which is a named class in this file.

`recommendedPrice` and `topThreeProducts[].price` are now exempt by field, and
still bounded: only a figure in `OUR_PRICE_FIGURES` is licensed. An invented
`$275k` in a catalogue field is cut exactly as before.

### And one blank field destroyed the whole lead

The BRAIN GATE required `pitchAngle` to be over twenty characters. That was a
fair proxy for "the response was a husk" on the day it was written, and it stopped
being one the moment the quote gate started running over the audit.

> `⛔ BRAIN GATE [Jones Kahan Law]: the audit parsed but is EMPTY — pitchAngle="",
> product=Revenue Growth / CRO Retainer, candidates=3. Blocking.`
> `JOB job_mt3c57gr [Jones Kahan Law]: error in 310.9s of WORK (HTTP 422)`

A recommended product, three candidate findings and a fact-check that came back
**9 out of 10**, thrown away because one field was blank — and the 422 returns
almost nothing, so 310 seconds of Firecrawl, Places, Apify and eight Anthropic
calls went in the bin. Four times in one batch. At fifty a day that is the
money Vin is talking about.

The gate now asks the question it means — is there anything in here at all —
across the fields rather than at one of them, as a pure function the boot check
executes. The 31 Jul husk (every field null) is still refused, and so is a bare
product name with no findings and no prose.

**And a gate can no longer empty a field in silence.** Whatever the cause, a
field that goes from prose to nothing now says so by name: either the model
fabricated a whole field, or our corpus is missing something we hold. Both are
things somebody must be told. What it must never be again is a blank field four
hundred lines away, read by a different gate as "the audit is empty".

### "We read 150 reviews of 8"

BVA again, and it looks like a cosmetic log line. It is not: an impossible
measurement refuses the factual spine, `composeFullEmail` returns null, and the
lead falls through to the model writing the whole email from scratch — the
highest-invention path in the system, reached by a number that was never about
them.

The review mine reads the exact place ID, so 150 reviews exist. The **8** came
from the rank-search row. `checkLocalRank` finds our business in the search
result by place ID, else by domain, else by an exact normalised NAME — and the
third is a guess that can land on another business.

Two things were sharing one number, and they want different sources:

| | |
|---|---|
| `ourReviews` | compares us against the businesses in ONE search result. Both sides must come from that same search or the comparison is meaningless. Unchanged. |
| `reviewCount` | a FIGURE we state about the business and check other measurements against. The authority is Place Details, read on the exact place ID. |

So the figure now comes from Google's own record of that place, and **how we
matched travels with the result**: a row matched only by NAME whose review count
contradicts Place Details is refused as a different business — and `weakerAbove`
and the named competitor go with it, rather than being built on someone else's
numbers. An exact place-ID match is never questioned, and a two-review index lag
is left alone, because a filter that fires on the normal case is one somebody
switches off.

### One busy minute threw away a whole paid research cycle

Not from this run, but it is the same money and it is the thing that will bite a
fifty-lead day: **the audit call had no retry.** 429 rate limited, 529 overloaded,
500 api_error — Anthropic's guidance for all three is "retry in a moment", and
this file's own error branch says exactly that in those words and then throws the
lead away. The audit is the call the BRAIN GATE depends on, so one busy minute
returns 422 and discards the Firecrawl, Places and Apify spend already made.
Fifty leads through a three-wide pool is precisely where a per-minute limit is
met.

It is asked once more now, honouring their `Retry-After` where they send one and
capped at twenty seconds so one bad header cannot stall a run. Separately opted
into from the timeout retry, so the two stay separately falsifiable, and a 400,
401, 403 or 404 is never retried: a malformed request, a bad key and a credit
balance too low all fail identically the second time, and a blind retry doubles
the bill on exactly the failures that cannot be helped.

### The batch panel had no word for "waiting"

*"i clearly added 5 into the que abnd hit audit 5"* — and the panel read
**"2 of 2 waiting will run"** directly above a button reading **"Stop — 0 of 5
done"**. Both numbers were correct answers to questions nobody asked.

"N of M waiting will run" is a statement about what the NEXT press would pick,
and its own filter deliberately excludes leads that are already running. Left on
screen during a run it counts down as leads start.

Underneath that: three leads run at a time, so a run of five has two leads
picked, paid for and not started for most of it — and the batch had no name for
that state. That is why *"the not audited yet section ws not used at all"*: the
sidebar could only ask "is this running" and "is this audited", both false, so
those two sat among leads nobody had chosen at all.

Three states now, named and adding up to the total at every moment: **queued in
this run / running / done**. The run emits its own roster before a single lead
starts, the bottom bar reports all three plus who is next, the sidebar has a
**Queued in this run** section, and while a run is on the control panel describes
THAT RUN instead of the next press. `batchcheck.js` folds a real fifty-lead run
through the reducer and fails if the three ever stop adding up — checked at every
event, because a panel that is only right when the run is over is exactly the one
nobody can read while it matters.

### A dead Apify token is one fact, not fifty

Apify answered 403 on every lead. The message was correct and it was in the
Render log, one grey line per lead, under a heading that reads like something
about the prospect ("REVIEW MINE: NOT MEASURED"). Nothing on the screen or the
call sheet said the review mine had not run at all.

`review_pain_pattern` is one of only two findings in this system with a real
human reply behind it. A run with a dead token loses it on every lead while
Firecrawl, Places and Anthropic are still paid in full. Same shape as the
Firecrawl credit latch: the token and the balance are facts about the ACCOUNT, so
they are held once, cleared the moment a call succeeds, and surfaced on the lead
as a **read limit** rather than as a fault of the business. Only 401/402/403
latch — a timeout is a per-lead event and must not be reported as a dead account.

### What the falsification runs found in the checks themselves

Five of the new assertions passed on a build with their own fix reverted, and
only reverting found it.

- **A fixture that could not reach the branch it named.** The catalogue-price
  test handed the OBJECT in with the path already set, so the key made it
  `recommendedPrice.recommendedPrice`, the field exemption could never match, and
  the assertion reported a clean pass on a build where the exemption licensed any
  figure at all.
- **A regex that cannot see across a newline.** `BRAIN GATE CHECK` looked for the
  old field name near the gate name on one line. The reverted gate spanned two
  lines and walked straight through. It names the decision itself now — there is
  exactly one right-hand side, and anything else fails however it is spelled.
- **The self-matching needle, twice more.** The same BRAIN GATE assertion, written
  as one literal, matched the line it was written on and failed a CORRECT build —
  and splitting it with a runtime join is not enough, because both halves still
  sit on one line. And the Apify assertion searched for the clear as a plain
  string when the DECLARATION is that same string, so deleting the clear left it
  green; it counts two now. Seven recorded instances of this trap.
- **Two fixes that hid each other.** Reverting the review-count precedence left
  every assertion green, because the wrong-row guard was catching the same
  fixture. A falsification that another fix silently covers proves nothing about
  the one under test, so there is now a case only the precedence can fix: a row
  matched on the exact place ID whose search-index count lags Google's own record.
- **A falsification detector that could not detect.** The first client sweep
  reported all three reverts GREEN, because it looked for `⛔` and `batchcheck.js`
  prints `✗`. A harness that cannot see a failure proves the opposite of what it
  appears to prove.

**Fifteen server falsifications and three client falsifications, every one red
alone.** 195 boot checks green, plus every gate in PART 6: 20,000 cases per
in-process gate with no leaks and no drift, and 2,065 emails composed over HTTP
with every invariant holding.

**`index.html` changed, so this needs a Netlify deploy.**
---

## 45. Five leads, read line by line — 2026-08-21

Vin ran five and sent the screen, the export and the whole log. *"we need
eveyrhting fixed at the highets level i dont want a single bug."* Every audit
completed this time — the gates from §44 held — and the log carried six defects,
three of which put something false or unusable in front of Mike.

### The last gate died on our own sentence

Two of the five: `⛔ FACT CHECK: FACT CHECK DID NOT RUN - the critique response
could not be parsed`. The payload:

```
{ "confidenceScore": 9, "flaggedClaims": [ "The pitch angle claims 'Slater &
Zurz LLP shows up above them on Google for "personal injury lawyer in
Cincinnati, OH", with 83 reviews against thei…
```

The model put a quoted phrase inside a JSON string. We have a repair pass for
exactly that, and its rule is *"a quote followed by structure is a real closing
quote"* — with a comma counted as structure. Here the inner quote after `OH` is
followed by a comma, so the string was ended there and everything after it parsed
as garbage.

**The trigger is our own sentence.** The factual spine is always shaped
`for "<the search we ran>", with N reviews`, so any critique reproducing an
`outranked_by_weaker` spine hits it — and both leads that lost their fact-check
led on that finding, which is one of only two with a real human reply behind it.

A comma cannot decide it; what comes AFTER the comma can. In real JSON the next
thing is a new key or value — a quote, a brace, a bracket, a digit, `true`,
`false`, `null`. A bare word means the comma was inside the sentence and so was
the quote. `CRITIQUE JSON CHECK` runs the live payload.

### "Delivery is the problem" on four of five, word for word

The one-thing block came back **THROUGHPUT** on four leads with an identical
paragraph — the generic-audit complaint that created that section in the first
place. It is also the most commercially consequential sentence we write: it tells
Mike **not** to sell this business more leads, and it is tested FIRST, above every
other layer.

The test was `if (opsPainCount >= 2)`, and `opsPainCount` was
`publicPainSignals.length` — the number of mined review themes **of any kind**.

Twenty lines away, a correctly filtered version of the same idea already existed
and was being used for a log line nobody acts on. Two hand-kept notions of one
thing, and the consequential one read the wrong one. On Thrive Dental the two
themes were *aggressive upselling* and *missed pre-appointment confirmations*: the
first is a sales-practice problem, not a business drowning in work, and it was
counted as evidence of one.

It is a SHARE question too. Jones Kahan's evidence was **4 mentions in 150
reviews** — 2.7% — under a sentence claiming their customers describe them
struggling to keep up. One shared reading now, `readOperationalPain`, and the bar
is both: at least two DELIVERY themes, and enough people saying it to be a pattern
in the record rather than a pair of bad days. **The measurement travels in the
sentence**, so four leads can no longer read identically and Mike can see what the
claim rests on. All three leads that wrongly got it are refused; a genuine case —
15 complaints across 40 reviews — still binds.

### An address that cannot exist, on a call sheet

Jones Kahan's sheet printed the contact as:

```
%20mailclerk@jklawoffices.com
```

Their page carries `<a href="mailto:%20mailclerk@…">`. `%20` is a URL-encoded
space and none of the three mailto scanners decoded it — and the strict address
pattern does not save you either, because `%` and digits are both legal in a local
part, so `%20mailclerk` IS syntactically an address.

A hard bounce is charged to the sending **domain**, and this project has two
bounces in twelve sends on one mailbox. One decoder now, used by all three
scanners. `MAILTO ADDRESS CHECK`, and it caught its own first version doing
`+` → space: that rule belongs to form-encoded query strings, and in a mailto a
plus is literal, so `bob.smith+jobs@example.com` was being rewritten into
`jobs@example.com` — a real address turned into somebody else's, which is worse
than dropping it. Found by running the function, not by reading it.

### "Do not say", full of true sentences

Two of five sheets told Mike not to say something the checker had just confirmed
was TRUE:

> Pitch angle states '…with 337 reviews against their 379' — **this is correct per
> measured evidence, but** the phrasing 'shows up above them' could imply recency
> or activity comparison, which is not measured.

That is a note about connotation, not a claim a prospect can disprove, and
"Do not say" is the section that stops a false sentence being read down a phone.
Filling it with true ones is how an operator learns to skip it — the same cost
this file records at the CTA precaution that fired on nearly every lead. Cleared
only when the entry AFFIRMS the claim and objects to wording alone, and never when
the critical pattern matches: *"the claim is correct but the number is wrong"* is
not a wording note.

### Two names for the owner on one sheet

Thrive Dental's header said **Nathan Coughlin (no title found)** — a name the
brain read off their pages because the resolver found nobody. The narrative said
**"The owner, Dr. Shen, personally replies to nearly every review"** — a name the
brain read off the review replies. Two model-derived names, two sources, one
sheet, and Mike has to ask for one of them.

Neither is provably wrong, so picking one would be inventing certainty. The sheet
says so instead. A first name against a full name shares a word and is not a
conflict, or every sheet would carry the caution.

### And a heading that claimed pages we never read

Three of the five audits open with *"We never read a single page of their website
on this run"* and then carry a section headed **"What we found by reading their
pages"**. The findings were real — §8 deliberately put the mined review text into
the corpus those are verified against, because a review-derived finding checked
against web pages it can never appear on is a category error. The heading never
caught up. It says **"in their own words"** now, which is true of both.

### What the falsification runs found in the checks themselves

- **A falsification that did not reproduce the defect.** Reverting the JSON rule
  by putting the comma back in the first test changed nothing, because the new
  look-past-the-comma block still ran and recomputed the answer. Proving a check
  works requires reproducing the ORIGINAL defect, not editing a line near it.
- **An empty part is not a split.** The throughput assertion searched for the old
  condition using `_needle(x, '')` — joining to the whole literal, so the check's
  own line contained the string it was hunting and it failed a correct build. The
  eighth recorded instance of a needle finding itself.
- **Counting call sites was wrong twice over.** The mailto assertion counted
  parenthesised calls; the definition does not contain one, and one scanner passes
  the function by REFERENCE inside a `.map`. It reported two of three and failed a
  correct build. Each scanner is asserted by name now.

**`index.html` changed, so this needs a Netlify deploy.**
---

## 46. The verify-at-send gate had never once executed — 2026-08-21

Vin, on the free Firecrawl tier: *"make sure other than that that's the only
issue... I want you to work extremely hard to identify issues we are close to the
finish line."* A ten-dimension adversarial sweep found the biggest defect this
send path has ever had, and it was hiding behind a green check.

### The gate reads a field that does not exist

```js
const _tier = Number(lead.emailTier || (lead.emailMeta && lead.emailMeta.tier) || 0);
let _verified = lead.smtpVerified === true || _tier === 1 || _tier === 2;
if (_tier > 2 && !_verified) {   // ← never true
```

`emailTier` and `emailMeta` appear **nowhere else in this system**. The tier lives
on `emailResult.tier` — `EMAIL_TIERS` declares it (1 published on their site,
2 SMTP-verified, 3 pattern-learned, 4 pattern-inferred, 5 none) and index.html
reads `L.emailResult.tier` when it builds a research request. So `_tier` was 0 on
every lead, `_tier > 2` was false on every lead, and **the SMTP check at the send
boundary has never run.**

PART 4 §3 has carried *"there is now a verify-at-send gate but it is untested at
volume"* for weeks. It is not untested. It is inert, and it has been since the day
it shipped.

The cost is precisely the failure it was built to prevent. Both hard bounces this
project has had came from addresses the system itself *"labelled 'pattern-built,
not confirmed' and marked sendable"* — tier 3 — and a hard bounce is charged to
the sending **domain**, the one asset here that cannot be rebuilt in an afternoon.

**And `SEND VERIFICATION CHECK` was green the entire time**, because it declared
its own `_ok` reading its own `emailTier` fixtures and tested THAT. Two
implementations of one operation, with the second copy inside the guard — and
both copies read the same non-existent field, so they agreed perfectly and were
both wrong. The check now runs the real functions against the real lead shape,
and restoring the shipped expression verbatim turns it red on the first
assertion: *"the tier is not being read from emailResult.tier."* It would have
caught this the day it shipped.

**An unknown tier now verifies rather than waving through.** The old rule read
`if (!t || ...) return true` — no measurement meant no check. "We did not measure
it" has never meant "it is fine" anywhere else in this file.

### The concurrency default assumed the smallest plan and the pace assumed the largest

`FC_CONCURRENCY`'s own comment says *"Default 2 — the Free tier's concurrent-browser
cap, so this is safe on the smallest plan Vin could be on."* The gap between
starts defaulted to 350ms, which dispatches **171 requests a minute against a free
tier that allows ten**. Two settings describing one plan, one conservative and one
maximally aggressive.

And the limit can only be **learned from a response**. A lead's first fan-out is
seven page reads dispatched inside two and a half seconds, long before any answer
comes back to teach us anything. So on a small plan the burst is refused, the
retries are spent, and the audit runs blind — while Places, Apify and the model
have already been paid for that same lead. Live 2026-08-21: three of five leads
read ZERO pages, each with `FIRECRAWL THROTTLED 3x` and one second of gate wait,
which is the 350ms default having applied throughout.

Assume the smallest plan they sell until their header proves otherwise, and let
the measurement RELAX it. Wrong the safe way costs one gap interval, once per
process. Wrong the fast way costs a blind audit plus every other API already spent
on that lead. `FC_GAP_AT_START` is captured before anything can move it, because
the boot fixtures set the live pace by hand and the starting value would otherwise
be unobservable — and the starting value is the whole point.

**The measured price of a lead, from that run's own log:** 16 Firecrawl credits,
4 Places calls, $0.095 of Anthropic. At fifty a day that is **800 Firecrawl
credits a day, 24,000 a month**. The free tier is 500 credits ONE TIME, which is
31 complete leads, ever — not one fifty-lead day.

### A judgement about a page we never opened

`positioningScore` reads `content` and `visualAnalysis` in every one of its terms.
On a lead Firecrawl refused, content is empty and visualAnalysis is null, so the
scorer runs over nothing and returns 0-2 out of 10 — and **0 is not "we did not
look", it is "we looked and it is terrible"**. Three consumers then acted on it: a
`weak_positioning` flaw was pushed, the audit prompt was told *"Dunford
positioning: 0/10"*, and the rule-based product fallback declared `isBroken` and
recommended a rebuild because *"Homepage has critical conversion failures"*.

Three of five leads on 2026-08-21 were in exactly that state. It is the recorded
unmeasured-as-zero class pointed at the softest, least defensible judgement in the
system — and the bucket text for `weak_positioning` already says it is *"our
opinion, not a measured fact, and the owner cannot verify it"*.

null, not zero, and every consumer asks `Number.isFinite` first. The product
fallback's catch-all also stopped naming a homepage it may never have opened: the
product does not change, because a business with no readable site is still a
rebuild candidate — the REASON stops claiming we saw something.

### A product no model chose, shown exactly like one that was

Two branches stamp `fromBrain: true`. Nothing in server.js or index.html has ever
read it, so a product the AUDIT chose and a product a five-line rule guessed are
indistinguishable everywhere they are shown — including the handoff brief's
`BRAND + OFFERING FIT`, which is what Mike walks into the call with. Live: Thrive
Dental's audit returned no product at all (`Brain audit complete: null`), the rule
picked Website Rebuild, and the sheet showed it like a choice.

### The boot was eleven megabytes from Render's crash ceiling

`selfSource()` is memoised to ONE copy for the reason `BOOT HEAP CHECK` records:
47 checks each grew a private `readFileSync`, boot settled ~140MB over, and a
build that was green locally crash-looped on Render.

The comment-stripped view never got the same treatment. **Fourteen checks each
wrote `selfSource().split('\n').filter(...).join('\n')`** — a 55,000-element array
AND a fresh multi-megabyte string, every time. Adding five more this session
pushed the settled heap from 184MB to 211MB and `BOOT HEAP CHECK` went red, which
is the check doing exactly its job on the same disease one level down. One
memoised copy: **211MB → 171MB**.

The blanket rewrite of the fifteen call sites caught the new function's own body
too, and every check died on *"Maximum call stack size exceeded"*. The boot found
it in one run.

### What the falsification runs found in the checks themselves

- **A falsification that went red by CRASHING.** Poisoning the property access
  instead of restoring the shipped expression made the check die on a TypeError.
  That proves the check runs the real function; it does not prove the assertion
  fires. Redone with the original expression verbatim, which trips the assertion
  cleanly — the difference between "it broke" and "it caught it".

**200 boot checks green.** Every fix falsified individually and every one red
alone; the full gate list green, 20,000 cases per in-process gate, and 2,035
emails composed over HTTP with every invariant holding.
---

## 47. Twenty-six from a ten-lens adversarial sweep — 2026-08-22

Vin: *"make sure nothing else is broken analyze meticulously work hard scoarer
everything I want you to work extremely hard to identify issues we are close to
the finish line brother."* Ten hunters read the code behind ten separate failure
modes; every finding was then verified against the live source before anything
was touched, and every fix was falsified individually — 43 reverts, each red
alone. 203 boot checks green.

The whole sweep sorts into four sentences, and each of them is a rule this file
already had.

### One: a gate cannot judge our own facts

- **The throttle test read the page we had just bought.** `isRateLimited` matched
  `rate.?limit|slow down|concurren\w*|browser limit` against the SCRAPED
  MARKDOWN as well as the error field. Every one of those is ordinary English on
  the sites this system audits — a builder listing "concurrent projects", a
  clinic saying "we limit the rate of". A homepage carrying one was refused as a
  throttle, `FIRECRAWL RATE LIMITED` printed for a request nobody throttled, the
  WHOLE gate was held four seconds on it, and the audit ran blind on a page
  already paid for. Whether we were throttled is a fact about THEIR answer, never
  about the document they handed us.
- **`permittedFigures` admitted every digit in the ASSERT block** under the
  comment *"Everything in it is measured by construction; that is what the A list
  IS"*. One line of that block is the audit model's own sentence, and
  `verifyOriginalFinding` checks only that its QUOTE appears on a page we read —
  never the numbers around it. The writer still sees that line; it no longer
  licenses a figure.
- **`SHARPER CLAIM` licensed its own digits.** The comment above it promised
  *"this can sharpen the claim; it cannot introduce a number"* while
  `permittedFigures` read `opts.spine` — the sentence it had just been replaced
  with. And it mutated the wrong object: `parsed.factualSpine` is a SPREAD COPY
  whenever a LOCAL_ONLY rung forced the swap, so on those leads the log said
  "Using X instead of Y" and X reached nothing.
- **The gate stopping the model raising his reviews was a no-op on every lead.**
  It consulted `evidenceAssert`, and `buildEmailEvidence` writes *"214 Google
  reviews at 4.6 stars"* into that block on every lead with a review count. So
  the word was always present. It reads what CODE wrote into the email now — the
  spine, the recognition line, the count, the money — which is exactly what the
  writer's own brief already said: *"Do not mention his reviews… unless the FACT
  above already does."* **The boot fixture omitted the field entirely**, which is
  the recorded trap of a check that only exercises the shape where nothing can go
  wrong; it is built by the real function now.

### Two: an absence claim needs a look, and a look is not a draw

- **`no_offer` and `no_lead_magnet` claimed a whole site off 200 characters.**
  `readRecurringOffer` forty lines away demands 3,000 characters AND two pages
  before it will say a business does not offer something, and its own comment
  says why. These two made the identical class of claim with no page count at
  all. On a starved Firecrawl run 200 characters is a nav bar and a tagline.
- **`absent_from_search` (harm 96) was claimed off ONE Places draw.**
  `pickRankRow` PROMOTES an absent service-page row over every found row, on
  purpose — and those rows come from the raw checker. The head term has bought a
  second sample since one business returned #3 and #12 minutes apart, and the
  comment that bought it says absence *"is the one finding that cannot be
  softened into a band if it turns out to be wrong"*. One extra search now, only
  on the row that can be promoted, and the rung requires two misses. When the
  second look FAILS the note already said the absence was unconfirmed and nothing
  read it.
- **The phone-mismatch finding was measured against markdown alone.** A number
  published as an icon-only `tel:` link — how most trade sites put it in the
  header — exists in the source and not in the markdown, so we told owners their
  site never mentions a number that is on every page of it.
- **A hedge bought a finished event.** Two gates apply the opinion-marker rule
  and only one implemented the half that matters: a marker can never buy a
  COMPLETED EVENT or a CLOCK, because both say we were watching. The other had
  that rule written in its own comment four lines above the code it was missing
  from, and its OPINABLE list is full of completed events. *"My read is they've
  already gone with somebody else"* shipped.

### Three: the door between the app and its data had never been run

`leadToRow`/`rowToLead` have produced nine duplicate-key collisions and nothing
in this repo had ever executed them. `clientcheck.js` runs the pair on five real
lead shapes now and sweeps permanently for the write-only class. Five defects at
once:

- **A lead added from Find lost every Find-time measurement on save.** The
  `brain_audit` ternary had a hundred-and-eleven-field branch and a five-field
  branch, and a lead with no audit yet took the short one — so `placeId`,
  `industry`, `reviewCount`, `rating`, `marketsSeen`, `buyingLane`,
  `reachPredict` were dropped on exactly the leads about to be researched, and
  `placeId` is what locates their Google reviews. Add fifty from Find, reload the
  tab, run the batch, and every one is researched without its own place id.
- **`problemList` was written back unconditionally as `[]`, which is truthy**, and
  six places asked "is this audited?" as a bare truthiness test on it. After one
  reload EVERY lead read as audited: filed under Audited in the sidebar,
  pre-ticked in the export, counted in "Export N audits", and handed to Mike as a
  call sheet with nothing on it.
- **The research-time template outranked the model-written draft** on every
  reload, and pressing Generate afterwards recomposed from the template.
- **`callOutcome` had no key at all** — the bar's own comment says it exists "so
  the same call is not logged twice", and the server stamps a fresh id per POST
  with no dedupe.
- **Six fields were written to Supabase and never read back** — `marketsSeen`,
  `marketsAbsent`, `marketCount`, `noWebsite`, `builderSite`, `leadChannel`. All
  six are read by the research request builder. The coverage-gap finding could
  not exist on a re-run at all.

**And an unreadable cloud was treated as an empty one.** `sbLoadLeads` returned
null for both, and boot answers null by pushing the entire local cache up as a
first seed. On a genuinely empty table that is right; on a read that FAILED it
writes this browser's stale copy over every row the cloud actually has, last
write wins. It is the one failure in this file that cannot be undone from the
browser. `sbFetch` already told the two apart.

### Four: the bulk path spent on things it had not counted

- **Moving fifty companies to the pipeline saved ONE.** `saveLeads` pushes only
  what it is told changed, and it was handed `added[added.length - 1]`.
- **`batchCandidates` refused any lead with an in-flight record and never asked
  how old it was.** A tab closed mid-run leaves up to three behind, and the resume
  path collects only records from its OWN tab — so those leads were excluded from
  every future batch permanently, and nothing said why.
- **The bulk panel counted `allLeads`**, which the Search box directly above it
  REPLACES with a filtered subset, while `startBatch` spends on the whole
  pipeline. Typing three letters made the button read "3 ready" and audit fifty.
- **The homepage read was the only Firecrawl door with no retry on a throttle**,
  and it is the FRONT of a seven-page fan-out — so one 429 threw away the whole
  website half of an audit while Places, Apify and every model call were paid in
  full.
- **The salvage path recovered `htmlSignals` and the navigation and left
  `homepageHtml` empty.** Same markup, and it is the variable the advertising
  tags, the phone read and `bookingSourceFor` all take. PART 4 §25 is a whole
  entry about the last one — a scheduler embed is an `<iframe>`, which markdown
  deletes — and `bookingMeasured` is stamped true regardless.
- **The per-lead "pages were refused, re-run this lead" banner was a delta over a
  process-global counter**, and three leads research at once. On a small plan
  that flagged every lead in a batch.
- **`paid_traffic_leaks` (harm 93) was handed an object without `booking`**, so
  two of its three sentences could not be produced on any lead.
- **The audit lost its findings whenever no EMAIL could be written.**
  `problemList`, `subjectOptions` and `harmsRanked` were attached inside the spine
  block, so a lead whose every finding is INTERNAL_ONLY got none of them — while
  `rankHarms` had just logged *"the audit and the call sheet still carry every one
  of them"*. That is the case the internal-only rule exists for. The spine decides
  what the EMAIL may say; it has never decided what the AUDIT knows.

### And four on the send path

- **A send could go out with nowhere to put the email.**
  `ensureHunterAttribute` returns null when Hunter's API is down, and every use of
  the result was guarded with `if (slug)` — so a null one was silently skipped,
  the lead was pushed anyway, reported in `results.sent`, and the sequence step
  delivered its own static text to the prospect. No first-email attribute, no
  send, for the whole batch.
- **The rotation and the subject A/B were one experiment wearing two names.**
  Both hashed the same lead id with the same construction and took it mod 2, so
  with two sequences every variant-A email went out on domain 1 and every
  variant-B on domain 2. The first fix salted the hash and the boot check caught
  it at exactly 0% agreement — perfect ANTI-correlation, just as confounded. The
  reason is arithmetic: each step is `a * 31 + c`, 31 is odd, so the low bit is
  the parity of the character sum and a fixed prefix can only leave the split
  alone or invert it. **A split has to come from a different function, not the
  same one with more input.**
- **The ask arm recorded what we intended, not what shipped.** `_ctaMode` became
  `'page'` the moment the page saved, and the model path rewrites the closing
  sentence — the one carrying the URL. A page arm recorded on an email with no
  link makes the comparison unreadable in the direction that looks like failure.
- **The "Send again" button could not finish the job its own dialog describes.**
  The already-emailed block is right and stays absolute for every automatic path,
  but the operator's deliberate re-send after clearing Hunter by hand had no door.
  One door now, opened only by that confirmation and closed the moment the push
  succeeds.

**And two log lines naming the wrong cause**, which this file already records
twice (the SMTP timeout, the Supabase table that existed). *"Re-run Generate on
this lead and push again"* was the wrong advice for a lead whose next findings
sit under the harm floor — the composer DECLINES those deliberately, and it is
deterministic, so the operator loops forever. And the duplicate-run guard keyed
on the lowercased company NAME: two different businesses share a name constantly,
and the client polls by job id, so the second request was handed the first one's
audit. That is PART 4 §19 through a different door; it keys on the place ID now,
then the domain, then the name, and the deduped response says which company it
handed back so the client can refuse it.

### What the falsification runs found in the checks themselves

- **Ninth instance of "a check that does not assert its call site is half a
  check."** The hedge fixtures ran the PREDICATE and not the gate, so reverting
  the gate left all three green.
- **A check that reported a green line ahead of a failure it did not know about
  yet.** The Supabase-read assertions need an `await`, and `clientcheck.js`
  printed its ✓ lines synchronously first. The report waits for them now.
- **A falsification harness that could not detect.** Four "reverts" earlier in the
  session reported GREEN because the port was invalid and the process died before
  a single boot check ran — a harness that cannot see a failure proves the
  opposite of what it appears to prove.
- **An executed fixture that proved a premise rather than the fix.** The per-lead
  throttle test exercises `AsyncLocalStorage`'s isolation, not our write to it.
  It says so at the assertion, and the write has its own guard.

**`index.html` changed, so this needs a Netlify deploy.** The server half is live
on merge; the persistence fixes, the bulk-path fixes and the deduped-job refusal
are dark until the file is dragged in.

---

## 48. The three tiers: money that can say stop, a build that cannot ship red, and the seams finally walked — 2026-08-22

Vin: *"build 1 2 and 3 at the highest level diagnose at the root and build from
the groundup... Make sure the bill is perfectly flawlessly a 10 out of 10."*
Tier 1 is money, Tier 2 is bugs, Tier 3 is results. Everything below was
falsified individually — 30 reverts this session, each red alone — and the
build ends at **207 boot checks green** plus two whole new gates.

### Tier 1 — never waste money

**Nothing anywhere could say STOP.** A loop, a mistake, or one bad afternoon
ran the accounts to zero with every individual line item correctly logged. Now:

- **One UTC-day ledger, fed by the same four doors the per-lead meters already
  use** — `fcNote`, `notePlacesCall`, `meterAnthropic`, the Apify dispatch — so
  nothing can reach one meter and miss another. Ceilings per service
  (`FC_DAILY_BUDGET` 1500 credits, `PLACES_DAILY_BUDGET` 600 calls,
  `ANTHROPIC_DAILY_BUDGET_USD` $20, `APIFY_DAILY_BUDGET` 150 pulls), enforced
  at ADMISSION — research queue, Find, compose — and never mid-lead, because a
  half-lead is everything spent for an audit nobody gets. A refusal names the
  exact setting that raises it. 0 turns a ceiling off, loudly at boot. HONEST
  SHAPE: this is a safety net, not accounting — the day is UTC, a restart
  resets it, the invoice is the authority.
- **`/api/spend`** answers "what has today cost" with the ceilings beside it
  and a per-operation-kind split — which settles `FC_SCREENSHOT_CREDITS` at
  last: run one lead, read `byKind.screenshot`, compare the dashboard.
- **`leadSpend` rides every research response**, the client merge carries it
  (the executable contract check demanded that the moment the server returned
  it), the pure batch reducer sums it, and the batch bar prints *"this run:
  ~800 Firecrawl credits · 200 Places calls · $5.00 model"*.
- **The preflight gate.** The Apify-403 day is the shape it exists for: fifty
  leads burning at full price around one dead Settings field. Refused before a
  penny moves: a website that cannot be a URL, a missing Anthropic key, a
  missing Firecrawl key on a lead that has a site, a server with no Places key
  (eleven of forty-one signals dark, including both reply-earning findings —
  the §11 silent state). A missing Apify token WARNS once an hour instead of
  refusing or going silent. Deliberately NOT refused: a dead domain —
  `siteConfirmedDown` is a real lead and the pipeline already fails cheap on
  it; and an unreachable-but-existing site — refusing on reachability deletes
  bot-hardened leads, the §14 guard-too-tight failure.
- **The re-run doors carry the price.** The re-run confirm names the audit's
  age and what a cycle costs; the batch's re-audit tick box says what fifty
  re-runs multiply to.

### Tier 2 — a build that cannot ship red

- **`BOOT VERDICT` — one machine-readable fact for "did the checks pass"**,
  instead of three greps that could disagree. A console recorder brackets the
  boot window, counts the same two glyphs boot.sh always counted, allowlists
  the one expected decline BY NAME, settles on the recorded last check plus
  five quiet seconds (180s cap that makes a hanging check LOUD — a check that
  hangs is quieter than one that fails), then uninstalls itself so a lead's own
  ⛔ lines can never flip the build's health. A GREEN verdict counting almost
  nothing reads as broken, never as healthy.
- **`/healthz` serves that verdict**: 503 while checking or red, 200 on green.
  Point Render's health check at it (PART 8) and a red boot stops being a log
  line nobody reads and becomes a deploy that visibly did not land, with the
  previous build still serving.
- **CI: every gate on every push.** `ci-gates.sh` is the gate list made
  executable — ONE copy; PART 6 documents it, this runs it, and
  `.github/workflows/gates.yml` runs it on every push and PR. It keys on EXIT
  CODES only (the recorded harness failure grepped for one glyph while the
  tool printed another), runs every gate even after one fails, and judges the
  boot by the BOOT VERDICT line — the same fact /healthz serves.
- **`netlify.toml` ends the hand-deploy** the day the repo is connected (PART
  8). It publishes `dist/` and never the repo root, because the root would
  serve server.js and every check as public files. Inert until connected; the
  drag-in keeps working meanwhile.
- **`servercheck.js` — the research route DRIVEN, not read.** The server had
  200+ boot checks, every one exercising a FUNCTION, and nothing that ever
  drove a request start to finish — and the seams BETWEEN functions are where
  every computed-but-not-passed has ever lived. fetchT — already the one door
  for every outbound call — gained a test seam: `FAKE_UPSTREAM` rewrites
  non-local hosts to a local fixture server, provably inert without the env
  var (fetchtest asserts both directions). The harness boots the real
  server.js, waits for /healthz to go green (asserting the recorder over real
  HTTP on every run), and drives six scenarios: the golden lead (ladder alive,
  spine built, Place-Details review count, composed email, spend counted), a
  preflight refusal with ZERO network calls, a dead Apify token that thins the
  audit instead of deleting it, a brain husk that 422s, a 402 day (latch, no
  further Firecrawl spend, corpusRead at zero, the cause named in the log),
  and — on a second boot with `FC_DAILY_BUDGET=5` — the lead that crosses the
  ceiling FINISHING while the next one is refused naming the setting.

  **What its first runs caught, in order:** my own invocation masking its exit
  code behind a pipe; FIRECRAWL PACING CHECK correctly refusing the harness
  for configuring a pace faster than the free tier — the guard was right and
  the harness was wrong, so the fake now teaches the gate through its own
  x-ratelimit header instead of overriding it, which means the harness proves
  the pacing relaxation too; and its own assertions aimed at the response's
  top level while the client reads those fields off `brainAudit` — an aim
  error found by the trace it prints for exactly that case.

### Tier 3 — top tier results

- **A real quote no longer dies on an ampersand or an accent.** Two truth
  gates held two identical local copies of the quote normaliser — the
  two-hand-kept-copies disease inside the gates themselves. One module-scope
  canonicaliser now, and it decodes HTML entities (markdown holds "Smith &amp;
  Sons", the model quotes the rendered "Smith & Sons", and the old norm made
  the entity a WORD that split the match) and folds accents (José became
  "jos", Jose became "jose", one letter, whole drop). The rule has not moved:
  the span must exist in what we read, a fabricated sentence still matches
  nothing, and the falsification proves the loosening direction on every boot.
  The sliding window already healed one-word breaks in LONG quotes — the first
  falsification proved my fixtures worthless at that length — so the fixtures
  are the SHORT shape, which is where the recorded live drops were ("BOOK MY
  STRATEGY CALL", four of five words).
- **Every dropped quote names its nearest miss.** "Does not appear on any page
  we read" is true and unactionable; "0 of its 9 words run consecutively in
  the corpus" is the fabrication shape, "8 of 9" is a boundary problem, and
  the difference is the next tuning decision made on evidence.
- **The call-outcome report is finally reachable.** `/api/call-outcomes` has
  grouped every logged call by the finding that opened it since §35, with a
  CSV mode — and nothing in the client could open it, so the one report the
  entire quality question waits on was invisible. A button now, beside Export.
  PART 5 still stands: forty logged conversations is more evidence than this
  project has accumulated in its life, and no code produces it — the button
  after each call does.

### Two doors the refuters would have found, closed first

Found by asking what the new gates do NOT cover, before any independent
verification ran:

- **The synchronous `/api/research` route bypassed both admission gates.** It
  is the same worker with no job wrapper, kept because the client falls back
  to it when `-async` 404s on an old server — and a lead posted there started
  spending with no preflight and no day ceiling. It now clears the SAME gates
  with the same refusal sentences. servercheck drives it live in scenario B:
  refused by name, zero network calls.
- **A lead worked during the ~20-second boot window could flip the verdict.**
  The recorder counts every check glyph the process prints, and a lead's own
  refusal lines (a fact-check refusal, a credit latch) are the same glyphs. The
  root fix is not a cleverer filter: a server that has not settled its own
  checks is not ready to take work. Every POST under `/api/` answers 503 until
  the verdict settles; GETs (healthz, spend, job polls) stay open; a settled
  build — green or RED — takes work exactly as before, because refusing work on
  red would brick a build one flaky check turned red. With Render's health
  check on /healthz, production traffic never sees the window at all.
  `BOOT WINDOW GATE CHECK`, and fuzz.js now waits for the green verdict
  instead of sleeping nine seconds at a door that is deliberately closed.

### What was deliberately NOT built

- **No spend persistence to Supabase.** A safety net pretending to be a ledger
  adds a failure mode to every request; the invoice is the authority.
- **No DNS preflight.** NXDOMAIN is a real lead (`siteConfirmedDown`), and the
  pipeline already fails cheap on it — the map returns empty, so the interior
  reads are never bought.
- **No ranking or copy changes.** PART 6's rule holds: no tuning until real
  replies exist to tune against. Tier 3 here raises the SUPPLY of unique
  material and the visibility of evidence; it does not touch the ladder.

---

## 49. What the refuters found — 2026-08-22, the round after the tier build

Seven adversarial agents were pointed at the tier build's own mechanisms with
instructions to break them, and a completeness critic at everything they were
not pointed at. Twenty-nine findings survived into code changes; every fix was
falsified individually (twenty reverts this round, each red alone), and the
whole sweep held to one discipline: verify the refuter's claim against the live
source before touching anything.

**The truth gate had four ways to verify a fabrication, all executed.** The
quote canonicaliser's catch-all DELETED any `&Word;` entity, so
"Insured&Bonded; crews" normalised to "insured crews" — two never-adjacent
words made consecutive, and a quote of a page that does not exist verified. The
corpus was one soup, so a word run could START on a page and FINISH inside a
review theme ("Call us today, no one ever calls back" assembled itself across
the join). The short-quote floor accepted any generic 4-gram, so an invented
"Claim your free estimate today" rode "your free estimate today" — trade-site
filler — into a verified quote. And matching was bare substring, so
"rate the craftsmanship" verified inside "celebRATE THE CRAFTSMANSHIP". Fixed
at the root: unknown entities pass through (deletion can join, a space cannot),
the corpus is SEGMENTS and a match must live inside one, the short path may
shed filler words but never content words, and every match is word-aligned.
Two tightenings against real quotes were paired with two loosenings the same
sweep found: a letter entity now DECODES (`Jos&eacute;` was still becoming
"jos" — the José bug through a second door), and the mining model's PARAPHRASE
left the verify corpus (only the verbatim review snippet remains — "the words
are theirs" must not verify against another model's words).

**The business-model filter licensed evidence that merely existed.** A
hallucinated B2B claim carrying the real quote "for Dallas homeowners. Family
owned since 1998" verified — evidence stating the OPPOSITE of the model it
licensed — and silenced twelve rungs including reply-proven
`outranked_by_weaker`. The quote must now contain a term from a small declared
vocabulary for the claimed model; a real institutional quote behind a model
preamble also now verifies (the window slides instead of anchoring at the
front).

**The boot gate had three doors around it.** Express routes are
case-insensitive and the gate was not, so `POST /Api/research` walked past it
(verified against the installed Express); the gate and /healthz answer before
the CORS middleware, so the browser saw an opaque "Failed to fetch" instead of
the retry JSON; and an async check's late red — BATCH MEMORY's leaked-slot
branch fires at 60s, ~40s AFTER the verdict settles — was invisible: GREEN,
/healthz 200, CI green, failure on screen. The path is lowercased, the gate
carries its own CORS headers, and every async check holds the verdict open
(bootHold/bootRelease) until it has reported, with the 180s cap still the loud
backstop. The client retries a 503 {booting:true} submit for up to a minute —
a restarting server is a delay, not a failure — and the cron route no longer
reports a boot-window refusal as a successful empty discovery.

**Three spending doors had no gate.** `/api/scrape` spent Firecrawl through no
meter and no ceiling (a live client path); `/api/claude` and
`/api/linkedin-drafts` were metered but never gated, so a spent model budget
kept spending a nickel a press; and Find's for-sale lane spends Firecrawl and
a Haiku call that its Places-only admission gate never checked. All four now
refuse (or skip, with the reason logged) at the same ceilings, the sync
research route also fails fast on the credit latch via the READ-ONLY predicate
(refusing must not consume the recovery probe), and two boot checks that
charged phantom probe spend to the real day ledger now restore what they
touched.

**The harness lied in three small ways.** servercheck's review-count fixture
used the same number in the search row and Place Details, so the authority
assertion could not detect the regression its message names (the search row
now says 999 against the authority's 4); scenario C's "a dead token reports
null" was vacuously true because reviewsRead was never in the response at all
— instance twenty-one of computed-but-not-passed, found by asserting the
OPPOSITE on the golden lead, and `ownerReplyCount` was dark the same way; and
the fake ignored every request header, so the one header whose absence
silently deletes measurements (X-Goog-FieldMask) is now asserted present.
FAKE_UPSTREAM — which redirects every API call, keys included — now refuses to
boot when Render's own environment is visible, mechanically, because
"never set it in production" is an instruction and instructional guards do not
hold.

**And the send path keeps a durable record.** A 25-lead send is one
synchronous HTTP request whose response is the only copy of "what went" the
client gets, and the in-memory dedupe maps die with the process. One
fire-and-forget row per ACCEPTED recipient now lands in `send_log`, so a lost
response or a restart no longer erases who was sent what. Needs a table:

```sql
create table send_log (
  id bigserial primary key, lead_id text, company text, email text,
  sequence_id text, at timestamptz default now());
```

A schema probe runs once after the verdict settles and names every expected
table or column that does not answer, with sbRest's own per-table diagnosis
above it — so a missing table is discovered at boot, not at its moment of
first use.

**Known and deliberately NOT rebuilt tonight** (the launch-sweep rule: no new
features the night before calling starts): the send route still wants the job
queue research got — the cap holds it to 25 and the send_log makes a lost
response recoverable, and that is the mitigation, not the fix. The batch
client's 30-minute job TTL and the operations-vs-pacing tension on the kill
clock are documented open items, not silent ones.

---

## 50. Why a five-lead run took an hour — 2026-08-22

Vin ran five leads on the freshly-merged build: *"these 5 leads took way way too
long... it also seems like the audit for each company is taking longer than
usual."* He also asked whether three-at-a-time is a design decision or a
Firecrawl limit.

Neither. Two mechanisms were taxing every lead, both of them numbers that were
correct when they were written and had quietly stopped being true. The slot
count was never the constraint, which is why raising it earlier would have
bought nothing.

### One endpoint's rate limit was pacing every other endpoint

Three lines from that run's own log, minutes apart:

```
FIRECRAWL PACE: their header says 10 request(s)/minute   ... 350ms  → 7500ms
FIRECRAWL PACE: their header says 5000 request(s)/minute ... 7500ms → 350ms
FIRECRAWL PACE: their header says 500 request(s)/minute  ... 7500ms → 350ms
```

Firecrawl publishes a **different limit for each endpoint** and reports it in
that endpoint's own response header. §39 correctly made the measured limit set
the pace — and set ONE pace, globally, from whichever endpoint answered last.
So a 10/minute endpoint spaced every **scrape** 7.5 seconds apart on a plan
allowing five thousand a minute, and the two numbers thrashed against each
other all run. One lead makes about fourteen Firecrawl calls.

The pace is per endpoint now, which is the thing Firecrawl actually limits. The
BROWSER cap still takes the most restrictive endpoint we have been told about,
because browsers are an account-wide resource and that one should be
conservative — the two rules point in opposite directions on purpose, and the
log says which is which. A 429 still holds the whole gate: that is a real
account-wide signal. The endpoint is read off the request URL, so a new call
site is paced correctly without anyone remembering to label it.

### The memory ceiling was below the process's own weight

`RESEARCH_RSS_CEILING_MB` is 205, written from a boot that settled at ~145MB.
The live process reports `BOOT MEMORY: ... rss 320MB` — the 209 boot checks
allocate, and resident memory does not hand itself back. So the admission test
`rss > 205` was true on **every lead forever**: each one printed HOLDING, slept
the full 90-second bound, and started anyway with a warning. Three slots means
a flat ninety seconds per wave — about twenty-five minutes of pure sleep in a
fifty-lead run, buying nothing, while the guard it was supposed to be protected
nothing either.

The rule was never wrong, only the constant. What it wants to say is "do not
start another lead when this process has grown well past its own settled size",
so the baseline is now MEASURED once the boot verdict settles and the ceiling is
that baseline plus room for a page render. A boot that really does settle at
145MB keeps the configured 205 and behaves exactly as before.

**And it corrects something this file has assumed throughout:** the process runs
steadily at 320MB without Render restarting it, so this container's limit is NOT
the ~256MB stated all over these comments. That is one observation, not a
measurement of the plan, so nothing was raised on the strength of it — but stop
treating 256 as known.

### Only then, the slot count

`RESEARCH_CONCURRENCY` 3 → 6, and the client's `BATCH_CONCURRENCY` 3 → 6 with
it. Those two must move together: the client pool decides how many leads are
ever in flight, so a server raised on its own changes nothing for a batch. Six
rather than more because each lead holds page buffers — and because the memory
gate is now calibrated well enough to hold leads at the door if that genuinely
climbs, which is the honest way to find the ceiling rather than guessing it in
a constant.

`ENDPOINT PACING CHECK` and `MEMORY CEILING CHECK`, four falsifications, each
red alone. `FIRECRAWL PACING CHECK` was RE-AIMED rather than deleted: it went
red on the new build because it asserted the global gap moves, which is the
behaviour that was removed. Its underlying rule — a limit we measured must
actually reach the pacing — is unchanged and now tested per endpoint.

**The call-outcome CSV button is gone from the sidebar** at the owner's request.
The route stays: `/api/call-outcome` still records an outcome against the
finding that opened the call and `/api/call-outcomes` still serves the grouped
report to anyone who opens the URL, because that pairing is still the only
evidence in this project that is not the system grading itself.

**`index.html` changed, so this needs a Netlify deploy.**

### What the same run's call sheets carried — fixed 2026-08-22

Two leads of the five were killed at the eight-minute WORK clock with every
API already paid for, and the log proves the cause was the pacing above: seven
to fifteen seconds between every paid Firecrawl call, and Factory Surplus's own
line reading *"138s of that was spent WAITING for a free Firecrawl browser"* —
a third of that lead's entire working time. The three that survived exported
correctly; "Export 3" after a five-lead run was the button being right about a
run in which two leads died.

**The kill message named the wrong cause.** It said *"the usual cause is
several leads researched at once on a single free-tier instance — run them one
at a time and this will not happen."* That was a guess, it was wrong, and
acting on it makes a fifty-lead day take all day. It now points at the run's
own `⏱ TIME` line and says how to read it: mostly gate wait means the throttle
is ours, mostly inside their calls means the site is slow. Third recorded
instance of a message naming the wrong cause.

**"Do not say" was carrying true sentences again.** Platinum Series Homes:
*"The email states '…19 reviews against their 26' — this is measured and
correct."* No objection in it at all, sitting in the section that exists to
stop a FALSE sentence being read down a phone. §45's rule required the word
"but", so the confirm-BUT-wording case was cleared correctly while the entry
with nothing wrong survived — the clearer case was the one that leaked. Factory
Surplus carried two `VOICE FAILURE:` notes as well: critiques of the pitch's
register, which are reasoning for the screen and not warnings for the sheet.

The filter existed as two hand-written copies, one in production and one inside
its own guard, which is why they agreed with each other and were both missing
the same two shapes. One `factCheckNoteKind` now, classifying real / wording /
style / clean, with anything `CRITICAL_FACT_RE` matches never cleared — so "the
claim is correct but the number is wrong" is still a warning. The live Platinum
sentence is the fixture, and reverting the widening turns it red.

**JLWinter arrived with no city**, so `LOCAL RANK: skipped — no city could be
parsed` cost it four rungs: a data gap on the lead, not a defect in the read.

### A brief describes a business MODEL and was matched on a trade WORD

Factory Surplus and Akin Bros. Floor Stores are flooring RETAILERS, and both
received the crew-trades brief — *"the unit of business is one job from the
phone ringing to the invoice"*, *"an idle truck costs the same as a working
one"*, and on the call sheet, for a warehouse showroom: **"when somebody calls
and you are up on a roof, who picks up?"**

Vin: *"why are flooring companies getting a roofers brief we need to make sure
we never run into this problem again... prevent this from happening with any
niche in the future."*

The cause is structural rather than a missing word. Each brief matched on a stem
list — `floor\w*` here — while the brief itself asserts a MODEL. "Floor" belongs
to an installer AND to a shop, and so do pool, window, kitchen, sign and garage
door. A stem can never tell those apart, so no amount of adding stems fixes it.
That is exactly why the per-brief `notWhen` list, which already held supply,
wholesale, manufacturer, distributor and franchise, still let "store" through: a
denylist somebody remembered is the disease this file records most often.

Two mechanisms, because they fail on different days:

- **One shared disqualifier**, applied to every brief in the library instead of
  kept per brief: words that name a DIFFERENT model — store, shop, showroom,
  retail, outlet, warehouse, surplus, gallery, dealer, supply, wholesale,
  manufacturer, distributor, franchise, rental, school, academy, association,
  marketplace. A brief written FOR one of those models declares `claimsModel`
  and is exempt; none is today. Deliberately model-naming ONLY: "center",
  "clinic", "practice" and "group" are not in it and the check asserts they
  never will be, because §14 records a size gate that refused a dermatology
  practice for containing "cancer center". A filter widened until it catches
  the ICP is the more expensive failure.
- **Every searched category declares its brief.** `NICHE_BRIEF_EXPECT` maps all
  46 `GP_CATEGORIES` queries to the brief they must receive, or null, and
  `NICHE BRIEF COVERAGE CHECK` runs the REAL matcher over every row — failing
  the boot on a disagreement, on a declaration for a category we no longer
  search, and on any category with no declaration at all. So a target added
  tomorrow cannot silently inherit somebody else's vocabulary: the build refuses
  until a human writes down which brief it gets. Same shape as
  `STEM_COMPLETE_WORDS` in §15, and for the same reason — a rule nobody has to
  declare is a rule nobody maintains. Twenty-six live trade strings are fixtured
  alongside, because the text a lead arrives with is Google's own category or a
  phrase read off their homepage, never our query.

Falsified three ways, each red alone: removing the disqualifier puts the
flooring stores back on crew trades, adding a category without declaring it
fails the boot by name, and widening the disqualifier to "center" goes red on
the dermatology and LASIK rows.

**A retailer now gets NO brief, and that is the deliberate answer.** The
matcher's own comment already stated the trade: a business we cannot place costs
a paragraph on a call sheet, while a business placed in the wrong bucket gets a
page of confident vocabulary about somebody else's trade. Writing a retail brief
from memory is what the library's DECLARED/SOURCED discipline exists to prevent
— it is 2-4 hours of research, and it is the honest next step if flooring stores
are a segment worth keeping.

---

## 51. The clock charged every lead for our own queue — 2026-08-22

Vin ran five leads on the merged build. **Four died at "passed 8 minutes of
WORK"** — Lyons Roofing, Nicholson Builders, The LASIK Vision Institute,
Burbank Electric — each after a full paid research cycle. One audit survived.
*"its never fucking endnign with these bugs and issues these leads are taking
forveer to run and the logs look horrible."*

**The cause was the previous session's own speed fix.** `RESEARCH_CONCURRENCY`
went 3 → 6, and the kill clock counted a lead's wait in OUR Firecrawl gate as
work. The arithmetic is in that run's own ⏱ TIME line: at 3 concurrent, one
lead measured 409s of work of which **138s was queued in our gate**, so 271s
was real. Double the slots and the queueing roughly doubles: 271 + 276 = 547s,
past a 480s budget. Every lead died at exactly that boundary. The leads were
fine, the sites were fine, and the clock was charging them for our own
politeness — the Doc Tony failure one level down, where the queue in front of
the GATE replaces the queue in front of the WORKER.

Four things had to move together, because a browser that gives up first throws
away everything the server already paid for:

- **The budget is WORK NET OF GATE WAIT**, and a separate 30-minute wall
  ceiling catches anything genuinely stuck. Two numbers because they answer two
  questions: is this lead still doing something, and has it been alive too long
  whatever the reason. Gate wait can excuse the budget; it can never make a
  lead immortal.
- **Overlapping waits are ONE wait.** The existing `gateWaitMs` SUMS every
  request's queue time and a fan-out puts seven in the gate at once, so seven
  concurrent 60-second waits report as 420 seconds against 60 of wall clock.
  Subtracting that number would have made the budget unreachable and the hang
  guard would never have fired again. The clock reads a UNION — a counter with
  a start stamp, opened when the first request queues and closed when the last
  is dispatched — and it reads it LIVE, because the lead about to be killed is
  precisely the one still waiting.
- **The ledger is captured in the caller's own context**, not read from the
  async store at dispatch: the gate runs a queued job from whichever lead's
  continuation freed the slot, so the ambient store there belongs to somebody
  else. That is the audit-cache cross-lead failure pointed at time.
- **One verdict serves the timer, the poller and the browser.** The job timer
  kept its own private eight minutes as a fixed `setTimeout`; it re-arms
  against the shared rule now. The poller sends its budget to the browser
  (`workBudgetMs`) so the browser cannot hold a stale copy — the
  two-hand-kept-copies disease across a network. The stale sweep is derived
  from the wall ceiling rather than hardcoded, and the browser's outer abort is
  asserted by `clientcheck` to sit above both.

`QUEUE CLOCK CHECK` grew eight assertions and three call-site needles;
`batchcheck` executes the browser's poller against a server that says its
budget is twenty minutes. Fourteen falsifications, every one red alone.

### Three more from the same log

- **A number written in WORDS walked past every figure gate.** CTR's call sheet
  said *"forty-six dozen reviews"* about a business with **461**. Five hundred
  and fifty-two, said out loud to an owner, past eleven gates, because the
  sentence contained no digit — `permittedFigures`, the unsourced-number check
  and the money gate all match digits. `stripSpelledQuantities` refuses exactly
  two shapes, both fabricated scale by construction: a vague plural quantifier
  ("dozens of", "hundreds of") and a spelled number times a scale word
  ("forty-six dozen", "three hundred"). It deliberately does NOT touch a bare
  spelled number — "twenty-five years" is how a real fact gets written, and
  refusing it would need a corpus of every measurement rather than of every
  page. "one hundred percent", "twenty-four seven" and a scale genuinely in
  what we read all survive, because a gate that eats true sentences is one
  somebody switches off.
- **The altitude line asserted a rank it had never read.** The audit prompt
  hands the model one sentence under the words "THE FIRST SENTENCE STARTS HERE
  — THIS EXACT ALTITUDE", chosen by the binding LAYER. For LEADS it always said
  *"their name sits near the bottom of it"*, and the layer says nothing about
  where they rank — LEADS also binds on a thin profile or a service page nobody
  finds. CTR measured **#4 of 20**. It reads the measurement now: a confirmed
  absence says so plainly, #4 states the three names above them, and #1, #2, a
  suppressed position, an unmeasured one and a five-result field all produce
  **nothing** rather than something vaguer — a softer sentence that still
  implies a low position is the same false claim with the evidence hidden.
- **"We never read a single page of their website" sat above a confident
  description of the site.** Both were true, of different reads: the page TEXT
  was empty and the page SOURCE was not, and the source is where the tags, the
  forms, the phone link and the booking route are all measured. `corpusRead`
  reports both now and the banner says which half we hold. A reader handed a
  flat contradiction stops believing the whole sheet, which costs exactly what
  the missing warning cost.

### And the logs

- **The boot froze the process for eight seconds in one place.** `SCREENSHOT
  SCALER CHECK` builds eight 9000x300 PNGs, deflates, decodes, scales and
  decodes each again, and every millisecond of it blocked the event loop —
  about twenty seconds on Render, which is exactly what its "No open HTTP ports
  detected" line was reporting. It yields between shapes now, held open by
  `bootHold` so a late failure is still counted. Local boot 21s → 16s, and the
  process answers throughout.
- **A boot check is not a lead.** A clean boot printed fifteen copies of
  "INTERNAL ONLY: partial_owner_replies" about businesses that do not exist:
  the boot checks run the real ladder over fixtures and the ladder's
  diagnostics are written for somebody reading a LEAD. Not a filter over the
  text — a filter is a list somebody has to keep — but the one question that
  separates the two cases, which is whether a lead is being worked on at all.

**212 boot checks green.** Fourteen server falsifications and three client
falsifications, each red alone.

**`index.html` changed, so this needs a Netlify deploy.**

---

## 52. The audit had no goal, and the rank was never the rank — 2026-08-23

Two things changed. The second one invalidates every rank sentence this system
has ever sent.

### The rank we reported was not the rank anybody sees

Vin checked four live audits against Google by hand:

| | we said | Google shows |
|---|---|---|
| Thrive Dental and **Orthodontics** | #2 of 20 | 12th |
| Tailor Made **Pest** and Wildlife | #1 of 20 | 4th |
| Rothchild **Law** Office | #5 | 14th |
| CTR Cleanup & Total Restoration | #4 | 2nd-3rd |

Three of the four carry the trade word inside the business NAME, and that is
the whole mechanism. **The Places `searchText` endpoint is a LOOKUP**: it ranks
by text relevance to the query, so a business whose name matches the words is
boosted up the list. We read that list's order as the local pack for the life
of this project. It never was, and no amount of location biasing or double
sampling fixes it, because it is not a noisy measurement of the right thing —
it is a clean measurement of a different thing.

Worse: §30's `narrowTradePhrase` deliberately builds the query out of words
taken from the owner's own business name. **The sharpening added to help
specialists was feeding the exact bias that broke them** — `orthodontic` is in
`TRADE_MODIFIERS` by name. And the file already contained the correct caution,
in a comment about DISCOVERY: *"Places returns results in ITS OWN prominence
order"*. The rank path never inherited it. Fifth recorded instance of a lesson
written down and not generalised.

**The real pack is also 15-50x cheaper.** DataForSEO's Google Local Finder
endpoint returns the actual "more places" list with rank, review counts, and
**paid rows separated from organic** — at roughly $0.60-2.40 per thousand
against Places Text Search Enterprise at $35 per thousand. So the fix for the
accuracy problem is also the largest available cut to our biggest variable
cost, and the paid flag settles a second complaint: Criswell sits first as a
SPONSORED result, which our audit could not see and reported as "not in the
top 3". `adsLiveInPack` is now the only direct proof we can buy that a
business is advertising TODAY — a tag on their own page only ever proved an
account existed.

**What survives an untrusted source, and why the two halves split.**
Presence-at-a-position does not. **Absence does, and is arguably stronger than
before**: a lookup that BOOSTS name matches and still fails to return them for
their own trade in their own city is better evidence of obscurity than a
neutral ranking would be. So a Places-sourced answer may still say "you are not
in this list at all"; it may never say where in it they sit, nor who sits above
them. `outranked_by_weaker` — one of only two rungs with a real human reply —
goes silent without a real pack. That hurts, and a named competitor read off a
relevance lookup is a sentence the owner disproves in one search, which costs
more.

Two walls, both falsified: `checkLocalRank` refuses to return a position from
an untrusted source, and `resolveMeasurements` nulls `rank`, `weakerAbove` and
`weakerNames` again at the one place every rung reads from. Gated there rather
than at each of the six consuming rungs, because a gate applied per consumer is
a gate somebody forgets to apply. `LOCAL PACK TRUST CHECK`.

**HONEST SHAPE: the DataForSEO path has never run against the live endpoint.**
The parser is fixtured at boot and the shape is validated at runtime; without
credentials the system falls back to Places and states no position at all. Set
`DATAFORSEO_LOGIN` and `DATAFORSEO_PASSWORD` and the flagship finding comes
back. Until then it is off, deliberately.

### The audit had no goal, so the ladder ranked by a feeling

`harm` is a hand-assigned guess at how bad a fault FEELS, and nothing in the
file said what the audit was FOR. So the model received forty unranked
observations and had to invent a point for itself, and every email fix for a
month was polishing a decision already made wrong upstream.

Vin: *"we need to pivot the goal of the audits to finding the biggest money
leaks, not finding the most problems."* And on the frame: people are moved more
by losing money than by earning it, so everything that leaves the building is
written as a LOSS.

**Seven buckets, ordered by loss aversion, every one of the 43 rungs placed.**
BURNING (money leaving now) · UNCAUGHT (they tried to reach him and could not) ·
INVISIBLE (they never found him) · LEAKING (arrived and lost) · ROTTING (in
hand, then lost) · TAXED (reputation) · MISPRICED (wrong buyer — Mike's call
sheet, never an email). The bucket is not a label: it decides which arithmetic
prices the finding and whether it may leave at all.

**UNCAUGHT sits above INVISIBLE deliberately.** A person who rang and got
nothing is a named event rather than an abstraction, and both human replies
this project has earned came from that bucket.

`RUNG_PILLAR` is declared in one table, the same discipline as
`STEM_COMPLETE_WORDS` and `NICHE_BRIEF_EXPECT`: a rung added tomorrow cannot
inherit a bucket by accident, because the build refuses until a human places
it. `MONEY PILLAR CHECK`.

**And `worst` was `byHarm[0]` over an UNFILTERED list**, so an internal-only
review metric could win it — and one did. *"Stop the recency bleed first"*
became THE ONE THING on a live call sheet, built on a finding we are barred
from ever mentioning to the owner. It reads `byMoney[0]` now, drawn from the
sayable set, because "what he should be buying" has to be something we are
willing to say out loud. `byHarm` is untouched — the audit and the call sheet
still carry every internal rung, which is the point of them.

### The benchmark table, and the wall around it

Cited figures are the one new class of number in this system and the one new
way something false could get out, so they carry the niche library's structural
wall: a row is a fact about a SEGMENT, it carries its figure, its source and
its date or it does not exist, and **no row may contain a second-person word**.
That last rule is what makes a statistic structurally incapable of becoming a
claim about the owner. Ten rows, from Harvard Business School on review ratings
to Deloitte and Google on mobile speed, and two are marked **self-serving**
because they come from companies selling the fix.

### Three false sentences, traced to their actual sources

- **"Ten photos"** on a listing with about thirty. The Places API returns **at
  most 10** photos, so we were reporting our own API ceiling as a measurement,
  to an owner who can open his listing and count. `photoCount` is null when the
  array saturates, `photosSeen` carries what we received, and every consumer
  was corrected — including the one that would have printed the literal word
  "null" into the fact-checker's own "do not flag claims that match these"
  block, which the recon caught in my half-finished fix.
- **"The newest review is 668 days old, which signals to a prospect is this
  place still active."** Vin: nobody checks the date on a review and concludes
  a business has closed. The model did not invent that framing — **it copied
  ours**: the audit prompt's own REVIEW RECENCY block said exactly that and
  ended *"Safe to state as fact."* Corrected at all three server sources. The
  measurement stays and is worth having: it says they have stopped ASKING for
  reviews, which is real intelligence for the call and not a leak we can price.
- **The guard that stops the model calling ten photos "thin"** read the field I
  had just nulled, so silencing the count would have silenced the guard on the
  only case it exists for. It reads `photosSeen` now.

### What this round did NOT build

Stated plainly rather than implied. The spec is agreed and this is the
foundation, not the whole of it. Still to come: the five free measurements
(outdated-site detection, secondary GBP categories, mobile speed as a ranked
rung, ads-with-no-landing-pages, missing conversion/call/retargeting tracking,
the unlinked page that 404s, the price anchor, intent mismatch, review-text
classification into operational buckets, unanswered negative reviews); the
three-slot email shape; the "at least $X you can count" floor; the loss-frame
gate over every rung sentence; and a claim-family gate over the AUDIT narrative,
which today has three strippers where the email has thirteen families and can
therefore not see a false CLAIM that contains no quote, no figure and no
spelled quantity.

**214 boot checks green.** Seven falsifications, each red alone — and the first
version of one of them passed on a broken build because the needle matched its
own source line. Ninth recorded instance of that trap in this file, and the
first I wrote myself; it is an executed predicate now, not a source search.

**`index.html` did not change this round, so no Netlify deploy is needed.**

---

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

## 54. The bill could not be read, and half the reviews were never read — 2026-08-23

Vin: *"continue building at the highest level build flalwessly done right the
first time and we need to mitigae that cost a lot more theres no reason it
should be that exepnsive."*

Three things, and two of them are the same shape: a thing we PAY for that
nothing downstream actually consumes.

### We were buying reviews the model never saw

Apify was asked for 150 reviews. The pain miner built one string out of them and
sent `md.slice(0, 22000)` to the model. A trade review runs about 300 characters
once the star prefix and any owner reply are counted, so **the model read about
seventy-three of the hundred and fifty.** The pull is newest-first, so the half
that was binned was always the older half.

Apify bills per review scraped. That is not a saving to find, it is a bill for
nothing.

**And it made the most-travelled number in the system false.** Every sentence
built on this reads "N of the 150 reviews we read say it" — the pain finding's
own denominator, the share that decides the THROUGHPUT diagnosis (*"demand is
not the problem, delivery is"*, which tells Mike **not** to sell this business
more leads), and the floor that dismisses a thin finding. The model never read
150. It read what fitted. So that number described a PURCHASE rather than a
READING.

One rule fixes both: **every review is seen, long ones are clipped.** A repeating
complaint is named in the first lines of a review — an owner writing six hundred
words about a countertop says "nobody called me back" up front like everybody
else — so the budget is spent on breadth, which is what a pattern actually needs,
and the denominator becomes true by construction rather than by a second field
somebody has to remember to deliver. The clip ADAPTS: if the natural clip does
not fit, it shrinks to the per-review share of the budget, floored so it can
never be too short to hold a complaint. Only below that floor does anything get
dropped, and a drop is now reported by name instead of happening on every lead
in silence.

The corpus is built where the SAMPLE is decided, not in the miner. Split across
two functions, the miner cut its own string while owner replies, negatives and
the text count were taken over the whole scrape — so "40 owner replies out of the
150 we read" was a ratio whose halves were measured on different sets.

**150 → 90, and it is more evidence, not less.** Ninety fully read beats the
seventy-three we were actually getting, and Apify bills per review, so it is also
**forty per cent cheaper (~$82/mo → ~$49/mo at 1,100 leads)**. Every rung reading
this sample needs ten to fifteen reviews to fire. If the deeper pull is ever
wanted back, both halves have to move together: `APIFY_MAX_REVIEWS` buys the
reviews and `REVIEW_CORPUS_CHARS` decides how many are read. Raising one alone is
what produced this.

**Considered and rejected: sorting by lowest rating.** It would surface every
complaint a business has, and it would break three things at once — the review
velocity windows, the recency count and the owner-reply rate all assume a
newest-first contiguous sample, and re-scoping four rung sentences to a
negative-biased sample is a large truth surface for a gain nothing here can
measure yet. `REVIEW CORPUS CHECK`, four falsifications, each red alone.

### Nineteen of twenty-four model calls were anonymous in the meter

`meterAnthropic` takes a short name per call and `reportLeadSpend` prints them
sorted by cost. Its own comment says why: *"any call visible in the log but
absent from this line is the leak."*

Five call sites passed a name. The other nineteen printed as the word
`anthropic`, so the one line built to say WHICH call is expensive listed nineteen
indistinguishable rows — and three separate sessions have proposed cuts to the
Anthropic bill without one of them being measured. A meter that covers a fifth of
the thing is worse than none, because it invites confident decisions about the
wrong number. This file already records that sentence, about a different meter.

All twenty-four are named. `ANTHROPIC LABEL CHECK` computes the inventory from
the file's own call sites — not a hand-kept list — so a call added tomorrow fails
the build until somebody names it, and two calls sharing a name fails too,
because a report that cannot tell them apart has the same defect one level down.

**And the one call site that had bothered to name itself did it in a shape the
meter cannot print.** `rewriteEmailWithBrain` passed `{ label: 'email rewrite',
company }` into a parameter that is a plain string, so it rendered as
`[object Object]` — the single most useless row in a report whose whole job is
naming things. The meter now refuses a non-string label out loud.

**What this buys: one live lead now answers the cost question outright.** Read
the `💰 ANTHROPIC TOTAL` line, sorted by cost, with every call named. That is the
next cost decision made on evidence instead of arithmetic.

### The only measurement of his actual customers could never be said

Google's CrUX field data is a 28-day record of what real phones experienced on
their site. It is free, it has been measured on every lead since
`measureRealWorldSpeed` was written — and it was only ever a `flaws` string,
which cannot be ranked, cannot be priced and can never open an email. **Every
other rung in the ladder is something WE looked at. This is the one thing we
measure that happened to THEM**, and it was structurally unable to compete for a
single opener. Instance twenty-two of computed-but-not-passed.

`slow_mobile` is a rung now: harm 83, pillar **LEAKING**, `cannot_know` on the
knowability table — and that last one is the clearest case in it. The only phone
he ever sees his own site on is his own, already cached, on his own wifi.

**The FIELD data only, and that is not a detail.** The same PageSpeed response
carries a Lighthouse LAB score, and a lab score is a simulation that moves
between runs — §6 is an entire entry about two looks at one business returning
different numbers. The field figures are a 28-day aggregate: stable, and he can
open PageSpeed Insights on his own site and read the same number we did.

Three silences, all executed on the predicate itself: a site that performs fine,
a site with too little traffic for Google to hold a record (that is a fact about
TRAFFIC, never about speed), and a lab score with no field data behind it. The
sentence states the seconds and never the word "slow" — the seconds he cannot
argue with, the adjective he can.

**And the key had nowhere to come from — which I documented as a Settings field
without ever looking.** Vin: *"this is the second time youve told me the pagespeed
api was in settings and its not what else have u been lying about."* He is right,
and the failure is the one this file is mostly a record of, committed by me: I
inferred the answer from the variable's NAME, wrote it into PART 8's knob table
as fact, and then repeated it. An inference reported as a measurement.

The sweep it earned found nothing else of the kind — the eleven keys this server
consumes are otherwise all real Settings fields the app really sends — but it
should never have taken a person noticing, so the class is now mechanical. `clientcheck`
reads `KEY_SOURCES`, a declaration in server.js of where every key comes from, and
fails the build on a key that is read with no row, a row naming an environment
variable server.js never reads, or a 'client' row with no Settings field behind it.
The boot EXECUTES the resolver for an `env:` row, which is the half a source scan
cannot see.

**Two versions of that check passed on a broken build first, and only falsification
found either.** The first inferred env support from any similarly-named variable
appearing anywhere in the file — so reverting the fix left it green, because the
boot check that sets `PAGESPEED_KEY` still mentions the name. The second checked
only the keys it could find by scanning: after the fix the key is resolved inside a
helper, so `req.body.keys.pageSpeedKey` no longer appears literally, the key fell
out of the scan entirely, and the check reported a clean pass while not looking at
it at all. The declaration is the authority for WHICH keys exist; the scan is only
what catches one that is read and never declared. Its first run also reported the
word "Falls" as a missing setting, off the prose *"The model's own keys. Falls back
to..."* — the needle-finds-a-comment trap, tenth recorded instance.

**And the key had nowhere to come from.** `measureRealWorldSpeed` read
`req.body.keys.pageSpeedKey` for its whole life, and there is no `pageSpeedKey`
field anywhere in `index.html` — not in Settings, not in the request builder,
nowhere. Vin, looking for it: *"no where to add pagespeed api."* He was right.
The key was always empty, the function always returned `{checked:false}`, and
the only measurement taken from the prospect's own visitors has been dark on
every lead of this project's life, silently.

It belongs on the SERVER anyway: it is a Google Cloud key from the same project
as `GOOGLE_PLACES_KEY`, and putting it in Settings would need a Netlify deploy to
reach anybody and would put a Google credential in a browser for no reason. It is
`PAGESPEED_KEY` in Render now, resolved through one door, with the client slot
kept as a fallback. A lead running without it says so once an hour and names the
variable, instead of leaving a whole rung dark in silence.

**What the falsification runs found in the check itself.** Two of the four
reverts passed on a broken build: widening the test to fire on a lab score, and
deleting the field-says-fine half of it, both left every ladder fixture green —
because a rung whose sentence comes out empty is DROPPED before it reaches the
list, so the silence I was asserting was being produced by something other than
the guard under test. The predicate is what decides whether a simulation may ever
become a sentence, so the predicate is what gets asserted. Only running them
found it.

**218 boot checks green.** Eleven falsifications, each red alone.
`index.html` did not change this round, so no Netlify deploy is needed.

---

## 55. The first live run after the pivot, read line by line — 2026-08-23

Vin ran TriStar Concrete on the freshly-merged build and sent the screen and the
whole Render log: *"try to fix eveyrhting so next run we are flawless... analzye
eveyr word in the audit and the logs."* The audit itself is the best this system
has produced — the message-match finding, the review-complaint-matches-the-
booking-path synthesis, six genuinely different page renders. The log carried
one RED and the sheet carried three defects.

### The boot went RED on Render on a correct gate

`⛔ FIRECRAWL GATE CHECK: 10 calls did not finish in 15s — a slot is leaking`,
at 22:22:20. No slot was leaking. The check's 15-second wall-clock deadline ran
while `SCREENSHOT SCALER CHECK` was blocking the event loop in multi-second
chunks of synchronous PNG work — Render's own port scanner could not connect at
22:22:09, which is the proof the loop was frozen, not the gate. Five of ten jobs
had dispatched and progress was still being made; the deadline expired anyway
and printed three failures with three different wrong causes.

Two recorded classes at once: a wall-clock ruler on a shared-CPU dyno measures
the dyno (BATCH MEMORY CHECK earned this at 12 seconds), and a message naming
the wrong cause costs what a missing one costs (recorded three times).

**The deadline now measures STALL, not wall clock.** A genuinely leaked slot
stops both dispatch and settlement forever, so it always produces 20 seconds of
zero progress; a starved loop keeps making progress every time it unblocks, so
it never can. Proven both ways in one experiment: the old ruler goes RED on a
correct gate under a synthetic 2.2s-block starver, the new ruler rides through
the identical starvation green, and a leaked slot still goes RED under the new
ruler — with a message that now names the leak signature (all released, one
never settled) instead of guessing. The post-throw probe moved 3s → 30s on the
same argument, and the cascade assertions ("5 dispatches for 10 jobs") are
guarded on the stall verdict so one event can no longer print as three causes.

This RED mattered doubly: with PART 8's health-check step done, a false RED
blocks every deploy.

### Render cuts traffic over a minute before the boot settles

"Your service is live 🎉" printed at 22:21:24; the verdict settled around
22:22:40. Render switches traffic at PORT-OPEN, so every POST in between
answers 503 {booting:true} — and the client retried a booting submit for only
60 seconds. A submit pressed after a deploy therefore failed right before the
door opened, reading as "research is broken" on a healthy build. The retry is
36 × 5s now, and `clientcheck` computes the window from both sides' own code —
shrink the retry or slow the boot and the build fails, not the next deploy.

### "Do not say" warned about one sentence twice

TriStar's sheet carried two entries both quoting *"Nothing answers."* — two
different rules, one sentence, and for the person dialling the instruction is
identical. Deduped on the QUOTED SPAN at assembly, first reason survives:
different quotes both stand, entries with no quote are untouched, and a
fragment under twelve characters is never a dedupe key, because two real
warnings sharing a two-word fragment must not eat each other.

### The forbidden recency framing came back past a 19-line instruction

TriStar's audit: *"a comparison shopper reading the profile sees a business
that may have gone quiet."* The audit prompt's own REVIEW RECENCY block forbids
exactly this — it quotes the 668-day live failure and explains what the
measurement really means. The model wrote the framing anyway. PART 3's rule is
the whole story: instructional guards do not hold, and this family had only an
instruction while every neighbour has a stripper.

`stripRecencyConclusions` now sits in the audit battery beside the quote, money
and spelled-scale gates. The predicate needs BOTH halves because each alone
eats a true sentence: an AGE signal ("newest review … days old", never the bare
word "review", or the customers' own *"went quiet on them"* dies with it) AND a
conclusion (a hypothetical reader concluding, or the ceased-trading vocabulary,
without which the bare measurement dies — and that line is real intelligence:
they stopped ASKING for reviews).

**The first falsification of that check passed on a broken build.** Widening
the age test to any review word left every fixture green, which proved the age
half had no fixture watching it — a falsification that does not reproduce is a
missing case, not a pass. The fixture that guards it now is a reader-conclusion
about the owner ANSWERING reviews, which only the age signal keeps alive.

### And two smaller things from the same read

- The cascade's "makes the leak bigger" was suspected as a typo from the
  screenshot and is correct in source — checked rather than assumed.
- A stray falsification server from this session's own loops was still alive
  during the first full gate run and starved the fuzz server's boot; the gates
  were re-run clean. The failure line ("never reached a green BOOT VERDICT")
  was accurate both times about its own scope.

**220 boot checks green.** Seven falsifications this round, each red alone —
one of which found its own check's missing fixture. TriStar's audit had no
search position because the deploy predated the DataForSEO credentials; the
LOCAL PACK TRUST line says so by name.

**`index.html` changed (the boot-retry window), so this needs a Netlify
deploy.**

---

## 56. The audit learned to answer the operator's first three questions — 2026-08-24

Vin, on the TriStar audit: *"theres info everywhere... i dont cealry know what
1 2 and 3 of the biggest revenue leaks are... not sure why our audit is leading
with 'Nothing here is broken enough'... nit picking copy of the wbeiste is kind
of a dead end... id like to see just a ranking out of 10 of their website...
we need to know if they have landing pages simply stated... we need to be sure
about if theyre running ads yes or no."* Every one of those was real.

### "No crisis" on a lead with five measured obstacles

TriStar has 90 reviews, customers publicly writing *"been calling for three
weeks, still no call back"*, an 8-field form as the only route in, no booking
and no published price — and the one-thing block said *"Nothing here is broken
enough to lead an email with... manufacturing a crisis."* Two faults compound:

- **The diagnosis read its review base off the rank row.** `localRank.ours`
  only exists when a trusted rank search matched us, and the DataForSEO
  credentials were not on that deploy — so on every rank-dark lead the
  constraint had NO review count, while Place Details held the authoritative
  90. Both call sites now read authority-first, the same order
  `resolveMeasurements` uses.
- **CONVERSION accepted only a rank or a strong rating as proof customers
  arrive.** A review complaint about CONTACT is the arrival event itself,
  written by the person it happened to. Two independent contact-pain mentions,
  or a thirty-review base, now prove arrival — and the branch names which
  proof it holds.

And the fallback no longer dismisses measured friction: three or more
obstacles get named plainly ("no single layer dominates, but N measured
obstacles sit between an interested customer and a booked job"), while a
genuinely clean lead KEEPS the no-crisis verdict, because manufacturing a
crisis is the failure that sentence was right about. `GROWTH ARRIVAL CHECK` —
the TriStar shape must diagnose CONVERSION, and the check caught my own
incomplete edit on its first run (one call site wired, one not).

### "Worst first" now means the money

The findings list opened with two message-match copy quotes while the callback
complaints sat third and the 8-field form fifth — the copy rows were prepended
with `opener: 999` and everything else sorted by harm, a hand-assigned guess at
how bad a fault FEELS. The list now orders by money pillar (BURNING > UNCAUGHT
> INVISIBLE > LEAKING > ROTTING > TAXED), harm breaking ties inside a pillar,
and the copy quotes rank with TAXED: unique evidence, still not a money leak,
and an owner cannot be convinced that a sentence on a page costs him dollars.
`FINDINGS MONEY ORDER CHECK` runs a fixture where harm order and money order
deliberately disagree, because one where they agree would pass on the old sort.

### The /10, the facts strip, and the top three leaks

- **`scoreWebsite`** — six measured components (phone layout, build age,
  booking route, form size, real-visitor speed, https), every point traceable,
  and a component we never measured LEAVES THE DENOMINATOR instead of scoring
  zero — a half-read site is scored on the half we read and the card says how
  much that was. TriStar's shape lands in the bottom half; a modern site with
  a real scheduler can reach the top.
- **`buildAuditFacts`** — ads running / none found / could not read (three
  states, and only two are about the business — absence still rides
  `adsReadable`), the booking route, the form size, the campaign pages the
  site does not link to (positive only, absence proves nothing), real-visitor
  speed, https.
- **The audit screen opens on one card**: the score, the facts strip, and the
  1-2-3 biggest money leaks — pillar-labelled, each carrying *"fix we sell:"*
  from a pillar→product map, so the leak and the catalogue item arrive as one
  thought. "What is actually worth selling them" gets the same product line,
  derived from the leaks rather than asked of the model, because asking a
  model to name a product is how feature-pitches ship. The export carries the
  score and facts line for the call sheet.

Both new fields ride the response, the merge, and `leadToRow`/`rowToLead` —
clientcheck's executable contract demanded the merge the moment the server
returned them, which is that check doing its job. `WEBSITE SCORE CHECK`, six
falsifications across the round, each red alone.

**223 boot checks green.** `index.html` changed throughout, so this needs a
Netlify deploy.

---

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

## 58. The first audit after the pivot, read word by word — 2026-08-24

Vin ran America's Home Place on the merged build and asked three questions:
is a higher website score good or bad, are we 100% sure about "no conversion
tracking anywhere on their site", and why is a review metric leak #2. All
three found real defects, and the goal was restated: **three leaks, led by
the biggest, each translated into money the owner feels. The finding does not
have to be spectacular; the translation does.**

### "Are we 100% sure?" No — and now the claim is bounded

`ads_untracked` had no Tag Manager guard. Google's own recommended setup runs
conversion tracking INSIDE a GTM container, where our reader cannot see it —
the exact rule `social_spend_no_search` and `no_retargeting` have carried
since they were written, missed on the sibling built the same day. And the
sentence said "anywhere on their site" about the pages we read. The rung now
requires `tagManager === false`, the sentence is scoped ("no page we read
carries conversion tracking or call tracking"), and the facts-strip chip
reports "could not see inside their tag container" as null rather than as a
red "no conversion tracking". What Google can count WITHOUT site code — call
assets, GA4 imports — was never claimable and still is not.

### A review metric was leak #2 on the call sheet

"Their Google reviews have slowed" sat as leak #2 with "fix we sell: search
ownership (marketing retainer)" under it — a retainer pitch built on one of
the seven numbers we are barred from ever saying to the owner. Rows now carry
`internalOnly` from the ONE declaration, and the top-3 filter (screen and
export both) refuses them. They keep their row in the full findings list,
marked "internal — never say reviews to him".

### The one-thing said "absent" while the ladder held its tongue

The ONE THING block read absence off a raw single draw (`rankScanned > 0 &&
!haveRank`) while `absent_from_search` demands two misses — one measurement,
two readers, two verdicts on one sheet. `measureGrowthConstraint` now takes
`rankAbsentConfirmed` from both call sites and an unconfirmed miss binds
nothing on visibility. `paying_for_a_search_they_lose` had the same hole from
the other side: its absence branch fired harm 94 off ONE draw. Both now clear
the same two-miss bar. §6 recorded a business returning #3 and #12 minutes
apart; harm 94 was riding that coin flip.

### The translation layer — the finding, said as the money it loses

Every problem row now carries `moneyLine`, assembled by code per pillar. The
ONLY figure it can hold is the trade table's own job-value sentence (already
licensed by AUDIT MONEY CHECK); a trade the table does not know gets the
figure-free version, never an invented number. Rendered under each of the
top-3 leaks on the card and in the export. The score card also answers Vin's
question on its own face: "their website build — higher is better. Grades the
site itself; ads, tracking and search are judged separately" — AHP's 10/10
beside a BURNING ads leak is consistent, and now says so.

### The stale cache that re-entered the pipeline

The new index.html was dragged into an OLD Netlify site. That origin's
localStorage still held a weeks-old pipeline; the cloud answered fine; and the
boot merge put every relic on screen AND seeded it into Supabase as new work.
Once the cloud has answered it is the truth: a local-only lead now merges only
if it was created here within 7 days (fresh unsynced work); anything else is
dropped by name, not seeded, and self-cleans out of the cache. An empty cloud
still takes the full first-seed, so a genuine migration is untouched. The
relics already seeded must still be deleted by hand — the guard stops the
class, it cannot un-write history.

### And the screen dedupe

"Costing them most" printed leak #1's sentence a second time and is gone from
the screen (the export keeps it as a fallback for leads with no leaks rows).
Duplicate warnings collapsed earlier; the card now numbers the leaks.

**Also in that log, and not a code defect:** LOCAL PACK TRUST printed "No
DataForSEO credentials on this instance" — the env vars never reached the
service (an unlinked Render environment group). Until they land, no lead gets
a search position. And the run rode a mid-session deploy restart, which is
what the second full check-suite in the log was.

**Eight falsifications, each red alone.** 225 boot checks green.
`index.html` changed, so this needs a Netlify deploy.

---

## 59. The first credentialed run: DataForSEO answered nothing, and the audits said four things we could not stand behind — 2026-08-24

Vin ran three leads with the DataForSEO credentials finally on the server and
sent the screen, all four exported audits and the whole log, with the standing
order: *"analyze at a sickening level of detail... we need to be doing 50 at a
time by tm with no issues."* Seven falsified server fixes, two falsified client
fixes, and the run's own numbers behind each.

### Every DataForSEO call failed, and the log swallowed their answer

`DataForSEO did not answer usefully - no tasks in the DataForSEO response` on
every rank, organic and duplicate call. Three fixes, because the failure had
three parts:

- **The request sent a location their database has never heard of.**
  `location_name` was handed the lead's city — "San Antonio, TX" — and DFS
  locations must come from THEIR database, where an abbreviated state is not.
  It is `location_code: 2840` (United States) now; the query string already
  carries "in San Antonio, TX", which is exactly what a real searcher types.
- **The parser swallowed DataForSEO's own status.** A task-less response now
  reports their `status_code` and `status_message` — 40xxx names the
  credentials — and "not JSON at all" is reported as the network failure it is.
- **A FREE call settles wrong-password before any lead spends.** Their
  `/appendix/user_data` endpoint costs nothing and answers with the account.
  It runs once after the boot verdict settles, beside the schema probe, and
  prints either the balance or "the CREDENTIALS were refused."

### "#0 of 20 ... both returned #null, so this position is real"

All three leads printed it. On the Places fallback the source refuses to hand
over a position, so both stability samples carry `rank: null` — and
`Math.abs(null - null)` is 0, which the drift branch read as two agreeing
samples. They ARE in the results (the true fact, now said plainly); the
position stays unsayable. The `#0` half was `Number.isFinite(Number(null))`
at the log line — the recorded null-laundering trap, at a printf.

### Four sentences the audits carried that we could not stand behind

- **"Seven of forty recent Google reviews mention the same thing"** — the deep
  mine TIMED OUT, the fallback read the 5 reviews Google exposes, and both
  numbers were invented. Two fixes: the mine call now carries the same
  timeout retry the critique earned in §39 (it was the only Anthropic call on
  the lead path without one), and `stripImpossibleReviewCounts` removes any
  review-count sentence whose numbers fit neither the reviews we READ nor the
  profile's own total — a true count and the profile total both survive, and a
  lead with no measured read strips nothing.
- **"reading the same interchangeable language on all three sites"** — the
  audit asserted the content of competitor sites nobody opened. §52 named the
  audit-narrative claim gap; `stripCompetitorSiteClaims` is its first
  mechanical piece, deliberately narrow: it cuts sentences asserting what
  competitor SITES contain, and the named-competitor spine — measured — is a
  fixture that must survive.
- **"Nothing here is broken enough to lead an email with" beside a composed
  email.** Legacy Bath's sheet carried the dismissal three lines above a leak
  card and an email both built on a harm-74 finding. `buildTheOneThing` now
  replaces the dismissal with the honest version whenever the ladder holds a
  sendable finding; a genuinely clean lead keeps it.
- **"Nothing on the pages we read lets a customer pay over time" on a lead
  whose sitemap lists PRICING pages we never opened.** Its own fact-checker
  called the claim imprecise. `no_financing` now rides the same
  `unreadPricing` guard every other absence carries.

### The money line must fit the finding it sits under

Gurian's leak #1 — miscoded expenses in his reviews — carried "a quote that
sits unanswered is one of those jobs." A per-pillar template reads wrong under
a specific finding, so `review_pain_pattern` and `no_recurring_offer` carry
their own lines now; everything else keeps the pillar's.

### Speed, for the 50-batch

The run's own ⏱ TIME lines: 143–272 seconds of wall clock per lead WAITING for
one of ten Firecrawl browser slots, on a Standard plan that publishes fifty.
The 5000/min tier now maps to 25 browsers (still half the published cap);
`RESEARCH_CONCURRENCY` and the client pool both go 6 → 8; and
`REVIEW_CORPUS_CHARS` goes 30,000 → 36,000 because Legacy Bath bought 23
reviews the model never saw (~$0.002 of Haiku per lead buys them back).

### The screen and the export

- **The batch bar survives a tab switch.** ResearchView owned the run's state
  and unmounted the moment another tab opened — the status bar vanished and
  the "export just this run" option went with it, which is why the run-scoped
  export was missing when Vin exported. ResearchView stays mounted (hidden)
  and the bar rides a portal, so a running batch is visible from every tab.
- **The segment brief renders once per trade, not once per lead.** A 50-lead
  export printed the identical crew-trades brief fifty times. Each distinct
  brief renders once in an appendix; each lead's article carries a one-line
  pointer. `clientcheck` renders two leads sharing one brief and asserts one
  body and two pointers — falsified in both directions.

### What the falsification runs found in the harness itself

Two reverts reported STILL GREEN on the first pass: the review-count fixture
was covered by a second redundant branch (the recorded two-fixes-hide-each-
other class — the revert now kills the whole stripper), and a revert that
unbalanced a regex crashed the boot before any verdict printed, which the
harness read as green. A falsification harness that cannot see a crashed boot
proves the opposite of what it appears to prove; it reports NO VERDICT as its
own failure now.

**226 boot checks green.** Nine falsifications, each red alone.
**`index.html` changed, so this needs a Netlify deploy.**

---

## 60. The sheet and the screen became one seven-category document — 2026-08-24

Vin, on the export and the audit screen: *"very orgnaixzed and not clean...
way way too long... still to busy"* — then, through three mock rounds:
*"i like the depthj we orginally have its just reprtitive and not neatly
organized into ctaegrieis"*, and approving the organized sheet: *"reduce it
like a tiny bit more and make sure the audit screen layout and detial is the
same as the organized export sheet."* And one correction mid-build that
changed the design: *"i dont like how it5s insturctuion us what to say...
id rather have us have all the info we need in order for us to make the
decision on what to say. becuase i still dont trust the brain or the audits
to alwyas pick the perfect thing."*

**The rule that came out of that: the sheet INFORMS, it never instructs.**
The system's ranking is labeled as the system's ranking, every finding stays
visible below it, and nothing on the page tells the caller what to say.

Both artefacts now carry the same seven categories, in the same order, each
original section exactly once — the old export said the same finding in up to
three places (the problems table, the own-words list, the one-thing friction
bullets), which is what "info everywhere" was:

| | |
|---|---|
| **1 THE CALL** | who, title, email, phone big, calling window, the held-back name, the staleness warning |
| **2 THE MONEY** | the ranked leaks with their money lines — captioned *"the system's ranking — every finding is in The evidence; the pick is yours"* |
| **3 THE CONVERSATION** | what the email LED WITH (a fact — it was sent, and the note says the call does not have to open the same way), what he will LIKELY say (the prospect model, labeled "one reading, not a rule"), the question worth asking, and Do-not-say in red |
| **4 THE BUSINESS** | background + headline + read + the one-thing diagnosis merged into one read — three overlapping sections became one |
| **5 THE EVIDENCE** | every finding once, money-ordered, their own words as the sub-line, internal rows marked, dated changes flagged as the only dated facts |
| **6 THE ANGLES** | what is worth selling beside the trade questions |
| **7 THE EDGES** | what we could not check beside the internal review intelligence |

The footer carries the page renders as links (an `<img>` would break the
export's self-containment rule) and the per-lead pointer at the one-per-trade
brief appendix. Styling is the approved Apple-light look — white, hairlines,
one gray, and **red only on Do-not-say and the stop banners**, the same
"colour marks a stop" rule §38 established.

**The screen was reordered, not rewritten.** The audit screen's existing
blocks were moved into the sheet's order (stops first — they were at the
BOTTOM of the screen while the sheet carried them at the top), the two
colored panels (indigo one-thing, green verdict) flattened to neutral cards,
and a new The-conversation section built from fields already on the lead.
`askOnTheCall` moved INTO it and out of the selling block — one home each.

**And the screen got its first executable check.** `LeadBriefing` is half the
audit surface and nothing in this repo had ever run it — a throw anywhere in
its tree blanks the whole audit view. `clientcheck` now executes it with a
recording React stub: all seven category labels must render, askOnTheCall
must appear exactly once, and a null lead must return null. Falsified both
ways — re-adding the second askOnTheCall home went red, and an out-of-scope
name in the new section (the §40 class) went red naming the throw.

The export markers check (all 30 fields) and the brief-dedupe check both held
through the restructure unchanged — which is exactly what they exist for.

**`index.html` changed, so this needs a Netlify deploy.** server.js is
untouched this round.

---

## 61. Does the measurement still say the same thing by the time it reaches the sheet — 2026-08-24

Vin, with three live sheets and the whole log: *"lets make sure that all the
info always correctly travels to the audit... nothing is misconstrued...
it will be going to our junior sales guy for cold calling."* Read word by
word, the three sheets carried nine faults, and the worst was a split-brain
on one page.

### One measurement, four readers, three answers

Breck's Paving's sheet said **"Ads none found"** in its header, **"Their site
has Google Ads tracking on it"** in leak #3 and the narrative, **"Facebook and
Instagram ad tracking, and nothing for Google"** in another evidence row — and
its own fact-checker wrote *"Google Ads tag NOT FOUND on page source; Meta
pixel IS present."* Conner's carried the same header-versus-leak contradiction.

The cause was recorded in the file's own comments and then committed anyway:
`adsTagConfirmed` is deliberately true for a Google tag OR a Meta pixel — the
click arriving at a dead route is the same loss whichever platform sold it —
and `paid_traffic_leaks`' sentence hardcoded "Google Ads tracking". The
comment eight lines below it warns, for the two sibling rungs, that collapsing
the platforms *"would put 'you are running Google Ads' in front of an owner
whose only tag is a Facebook pixel."* The rung's say() now names the platform
from the same fields the facts strip reads, and one client-side label
(`adsFactsLabel`) serves the screen chip, the export header and the facts
strip — a Meta-only advertiser reads "Ads: Facebook only" everywhere.

### A paving company, measured against parking garages

Their sitemap slug `/services/parking-lot` became the query **"parking lot in
Columbus, OH"** — which returns parking GARAGES — and Breck's absence from a
list of parking garages shipped as *"invisible for the exact search"* with
*"we ran that search and went through the whole list."* The §30 failure
through a new door: a clean measurement of the wrong thing.

The DFS rows already carry each business's own category and the parser now
keeps it. `packTradeOverlap` refuses a rank claim when the returned categories
share nothing with the TRADE — the trade's words always count; the phrase's
own words count only against a provider-shaped category, because "Parking
garage" contains the phrase's words by construction while "Gutter cleaning
service" answering a gutter query is the right marketplace. Too little to
compare (a three-letter trade, rows without categories) produces no verdict,
and no verdict never refuses.

### The synthesis was the one block of prose no gate ever touched

`buildSituationRead` runs AFTER the seven-stripper battery, so its output —
the headline, the read, the character rows Mike reads in THE BUSINESS — went
to the sheet ungated. J Chester's rows carried *"A prospect comparing firms
reads that as a business that has stopped growing"* (the recency-conclusion
family, mechanically stripped from the audit since TriStar) and *"a form with
no automated acknowledgment"* (the post-contact family) — both flagged into
Do-not-say and both still printed in the narrative, which is §24's "the
fact-checker only watched" one block over. The synthesis now passes through
the same seven strippers, second call site, same walkers.

**And the post-contact family got its stripper.** The twelve backend rows
(`waits for a callback`, `nothing responds`, `goes to voicemail`…) were inline
`_flag` calls inside the route, so a stripper could not exist without copying
them. They are `AUDIT_BACKEND_CLAIM_ROWS` at module scope now — one table, two
consumers: the fact-check still flags, and `stripPostContactClaimsDeep`
(which also runs the ownership detector) REMOVES the sentence from audit
prose. Flagging and removing are different things.

**Our own code was writing the same claim.** The FOLLOW-UP diagnosis printed
*"nothing responds automatically — no CRM, no automated reply"* word for word
on all three leads — a backend assertion in a code-assembled template — and
the friction item said *"a form that submits and waits for a human to call
back"*, asserting a callback mechanism nobody measured. Both now say what was
measured, scoped to the pages we read.

### The smaller five, each live on a sheet

- **A 2-of-90 anecdote took leak #1 from a measured BURNING finding** on
  Conner's. The evidence-beats-inference promotion now takes the email's own
  anecdote floor: three mentions, not two — the same division the email side
  already refuses ("he will do that division before he finishes the
  sentence").
- **"Mid-morning is the worst window: he is on a roof or under a house"** — on
  a PAVING contractor and a kitchen remodeler. Roofer imagery was hardcoded
  for thirty trades; it says "out on a job" now.
- **"Someone ready to hire a cpa"** — `fixAcronymCase` uppercases the two
  initialisms in the ICP (CPA, HVAC) on audit rows and money lines,
  display-only, because every matcher lowercases before comparing.
- **The same finding printed twice in THE EVIDENCE** on two of three sheets:
  copy-quote findings merged into problemList (§43's AUDIT UNIQUENESS) were
  still also in the standalone own-words list. `dedupeOwnWords` drops an
  original whose text is already a problem row, on the record and the screen.
- **Three leaks that all opened "A kitchen or bathroom remodel runs
  $15k-$80k."** read as one template — later leaks now render only their
  specific half (`trimRepeatedJobValue`), the first keeps the money sentence.

For the junior caller the export also gained the pillar + **"fix we sell"**
line under each leak (the maps went to ONE module-scope copy — they were
duplicated inside two screen blocks and absent from the export entirely) and
the **email-confidence note** beside the address ("pattern-built, not
confirmed" is a thing a caller deserves to see, and education@ on a different
domain was printed bare).

`INFO TRAVEL CHECK` executes every one of these — the rung's say() on three
platform fixtures, the marketplace guard both ways, the stripper on the live
Conner's sentence and a general-truth control, the acronym fix and its
boundary, plus runtime-assembled call-site needles for the synthesis gates,
the floor and the rewordings. Eleven falsifications — eight server, three
client — each red alone; RANK ANCHOR CHECK's needle was widened for the new
`guardTrade` argument after it went correctly red on the wire change.

**227 boot checks green.** `index.html` changed, so this needs a Netlify
deploy.

---

## 62. The audit learned to speak plainly — 2026-08-24

Vin, reading the re-run sheets: *"the grammer on these audits is brutal...
imn not sure what the hell this even means... alot of these audits have
jargon in it like i built this and i dont even understand what is being said
sometimes... we need to organize these audits so anyone can understand whats
going on no matter their experince level marketing wise."* The findings were
right; the words and the order were not. This round changed no measurement
and no ranking — only what the sentences say and where they sit.

### The words

- **The ads finding said "has Facebook ad tracking on it" and its money line
  said "the ad budget is buying clicks"** — the owner of this system could
  not tell what either meant. It reads *"Their site is set up for Facebook
  ads, and the only way in their site offers is a phone call during office
  hours"* now, with the money line *"They pay for every click, and nothing
  tells them which clicks ever turned into a job — the money goes out
  blind."* Same bounds: the wiring is asserted, never a live campaign.
- **The review money line** — *"Every person who hit the same wall those
  reviews describe and never wrote one was one of those jobs"* — was a
  sentence nobody could parse on the first read. Now: *"For every person who
  said this in public, more hit the same wall, said nothing, and went
  elsewhere — each one was one of those jobs."* UNCAUGHT, LEAKING and
  BURNING got the same treatment; ROTTING and TAXED already read plainly.
- **Findings opened lowercase mid-fragment** ("slow or no follow-up after
  estimate appointments, and...") because the mined complaint leads the
  sentence by design for the email. `sentenceCaseStart` capitalises the
  first letter on the sheet — display-only, the email opener rules
  untouched.
- **The Hormozi layer codes are translated everywhere a person reads them**:
  "The one thing — MARKET" is now "The one thing — how they position
  themselves (MARKET)"; "Binding layer: CONVERSION" is "Biggest blocker:
  turning interest into booked jobs (CONVERSION)". The codes stay — they are
  the stored data's vocabulary — the sheet says what they mean. And the
  constraint templates dropped their own jargon: "No layer measured as
  clearly binding" reads "Nothing we measured stands out as the single
  biggest blocker."
- **"Do not say" entries were paragraphs of detector rationale** ("Legal as a
  general truth about people, and legal marked as your own read; illegal
  stated as a report...") — three near-identical copies on J Chester's
  sheet. `plainRisk` renders each as the QUOTE plus one plain line of why
  ("we never watched what happens after someone contacts them"). The
  engineering reasoning stays on the stored lead.
- **whatHeNeeds** — the model-written "worth selling them" paragraph — now
  carries a register spec: concrete nouns (the form, the phone, the price,
  the clicks), follow the money out loud, and NEVER the words capture,
  intake, conversion, friction, funnel, optimize. The Breck's paragraph Vin
  called awesome is the shape it names. An instructional guard, and recorded
  as one: model prose still varies, and this is the available lever.

### The order

**"What this business is" opens the audit** — the caller pictures the
business before any diagnosis of it — and **"Do not say" closes it**, on
both the screen and the export. The score caption stopped explaining itself
in grading vocabulary ("how well their website is built — 10 is best"), and
"Campaign pages: none found (absence proves nothing)" became "Ad landing
pages: none found (they may still exist)".

`INFO TRAVEL CHECK` grew executed guards for every rewording (the BURNING
and review money lines, the sentence-case fix and its call site), and
`clientcheck` executes `plainRisk` on J Chester's live entry — the quote
must survive, the rationale must not — and `layerPlain` both ways. Four new
falsifications, each red alone. FIRST DFS RUN CHECK's money-line needle
tracked the new wording after going correctly red on it.

**227 boot checks green.** `index.html` changed, so this needs a Netlify
deploy.

---

## 63. V2: one story, leaks with their evidence nested, nothing said twice — 2026-08-24

Vin, after the plain-language pass: *"do u think we have too much info...
we should really think of the strucdture of these audits."* The diagnosis he
signed off on via mock: it was never too much info — it was the same fact
said up to five times, and three sections (the leaks, the one-thing, the
going-on read) each written like the conclusion. And two constraints he
added while approving: *"all of our importnant audit signals for reveneu
leak [must be] cleanly and simply displayed"*, and the audits will branch
into *"cold calls emails and even linkeind messages"* — so the structure has
to be channel-neutral.

The research backed the shape before it was built: the one-page pre-call
brief (account context, a hypothesis on pain, discovery questions, one
outcome) is the proven format; pre-call planning lifts win rates ~34% while
most reps spend under five minutes, so the sheet must survive a 60-second
skim; prospects decide in the first 8-30 seconds and openers grounded in a
specific real observation beat scripts — which is what our leaks are; and
calls + email + social together lift results ~30%, which is the argument for
one canonical record feeding three renderings.

### The structure

strip → **THE STORY** (one flow: what it is, where the money leaks, the
sell) → **THE LEAKS** (top three, every supporting fact NESTED under its
leak) → **THE SMALLER LEAKS** (every remaining money-pillar finding, one
line each — none buried) → **THE CALL** (worth asking, likely pushback, the
email as sent) → **REFERENCE** (their own words, also-measured, internal
intelligence, could-not-check, Do-not-say last).

### The mechanism

`groupAuditFindings(problemList, oneThing)` is ONE module-scope function the
record and the screen both call, so the two can never group differently.
Every finding lands in exactly one place: nested under a top leak when it
shares that leak's money pillar; in The smaller leaks when it carries any
other pillar (the owner's rule: a revenue signal may never fall to the
reference tail); in the reference tail only with no pillar at all; internal
rows marked as ever. The buying-path friction nests under the intake-shaped
leak (UNCAUGHT/LEAKING) and falls back to the story when no such leak
exists, so it cannot be lost — the fixture lead in clientcheck exercises
exactly that fallback. Dedupe by normalised text runs across all sections,
because "appears exactly once" is the entire point.

The story is the three old prose blocks rendered as ONE flow — background,
headline, read, the one-thing diagnosis with its why and fix-first folded to
a dim line, then **"The sell:"** in bold — not a model rewrite, so the prose
still varies with the model; the structural win is that it reads top to
bottom as one argument instead of three.

`clientcheck` executes the grouping both ways (a same-pillar fact must nest,
a money-pillar finding must reach The smaller leaks, nothing may appear in
two sections) and re-renders both surfaces; the 30-marker export assertion
held throughout — it caught `t.why` being dropped from the merged story on
the first build. Falsified: gutting the nesting branch and deleting the
smaller-leaks branch each went red alone.

**`index.html` changed, so this needs a Netlify deploy.** server.js is
untouched this round — the grouping is a client concern because the server
already ships pillar and rank on every row.

---

## 64. The audit learned Vin's own funnel walk — and the tracking measurement had never once run — 2026-08-24

Vin picked apart Breck's Paving by hand and asked for audits that consistently
reproduce that analysis: social ads are the low-intent side and Google search
the high-intent side; no landing page and an 8-field form is a broken bottom of
funnel ("Ranking higher won't pay off if it dumps into the same form"); nobody
can see ad ROI without tracking; slow-callback complaints beside open ops roles
mean a team at capacity; quality complaints are not a leak ("we have no control
over the quality they produce"); and above all: "the brain and these audits
dont know the true goal... theres no cohesive overall story." Five recon agents
mapped the mechanisms and an adversarial agent verified the design before a
line changed. Eleven falsifications, each red alone. 228 boot checks green.

### The worst finding was not in his list: "no conversion tracking" had never been measured

`mergeAdSignals` has computed the conversion-label and call-tracking markers
since they were added — and the call site copied back only the three markers
that predate them. `builtWith.hasAdsConversion` was never assigned anywhere,
so `_harmInputs.adsConversion` read `undefined === true` = false on every
confirmed lead. **`ads_untracked` (harm 89) asserted "no conversion tracking"
off a wire that had never carried a measurement** — a confident false absence
of exactly the class PART 3 forbids, live on the Breck's sheet Vin was reading
when he asked "are we 100% sure?" We were not. The two copy lines exist now,
AD WIRE fixtures run the label through the real merge both ways, and a second
defect fell in the same sweep: all six ad fields null-gated on the PLAIN
fetch's `confirmed && !blocked` while the merged `adsRead` was the real
did-we-look — so a bot-challenged site with a perfectly readable rendered
homepage lost every ad finding. Both prompt lines that told the model "make NO
claim" off the same stale gate were re-aimed at the merged read.

### A complaint we cannot fix is context, not a leak

Breck's "quality control issues — drainage, uneven surfaces... 3 different
people" ranked as money leak #2 because the `writtenContact` promotion counted
mentions and never asked what the complaint was ABOUT. `contactShapedTheme`
now classifies the dominant theme POSITIVELY against the three contact buckets
(nobody responds / quotes take too long / scheduling breaks down) — never by
the absence of quality words, and contact wins on a mixed theme. It reads
`reviewPainTop`, the SAME string the rung's say() prints, so the ranking basis
and the printed sentence cannot diverge. A workmanship-dominant theme now
moves the row to TAXED at rank 6 — past the client's top-3 floor of 5, with
zero client edits — and its money line becomes the reputation line instead of
"each one was one of those jobs", a loss claim its evidence does not support.
The `work_quality` bucket vocabulary was widened (drainage, uneven, cracked,
workmanship, quality control...) because Breck's own phrasing matched NO
bucket. The EMAIL side is untouched: review_pain_pattern has a real reply
behind it and the rung, the spine and rankHarms did not move.

### The funnel, walked in order, by code

`buildFunnelStory` reproduces Vin's walk on every lead: money out (with the
three-state answer to "does anything count what a click becomes" — counted /
could-not-see-inside-GTM / blind, scoped to the pages we read because Google
can count conversions without site code); who finds them (bands and two-miss
absence only); what a click lands on (booking, form size, price, financing);
after they reach out (contact complaints with their own arithmetic, and the
capacity read — "signs of a team at capacity" only when the complaint AND an
open ops role are both measured, present tense because an undated posting
buys no clock); what repeats (workmanship as context, by name); and fix first,
read from the SAME bottleneck variables the one-thing reads, never re-derived.
The Facebook-versus-Google join needs all five gates — including
`tagManager === false`, because a GTM container can hold a Google tag we
cannot see — and states its conditional out loud: a pixel proves wiring,
never spend, so "if those ads are live" is both honest and a question only
he can answer. A stage whose inputs were not measured is omitted, never
zeroed.

It is the story's SPINE on the sheet and the screen — the model's headline
and read stay as colour below it — and because a code block attached after
the model's JSON parsed bypasses all seven strippers, `FUNNEL STORY CHECK` is
its whole gate: every branch executed both ways, and **every sentence it can
emit scored by the same plain-English rules the ladder's sentences pass.**
That gate caught its own first wording at boot (a clause opening on
"conversion") — the §10 insight-line class, refused before it ever shipped.
The walk is walled out of the email path by the same source assertion that
walls the niche library.

### The goal, finally stated where the models read it

The audit brain's mission was "find the single most expensive problem." It is
now the funnel walk itself, with the three rules: channel intent (Facebook
names, never "channels" — the abstract wording is a retired negative
fixture), measured-both-halves before the mismatch may be said, fix-order
bottom-up, and workmanship-is-context. The five-area AUDIT TASK carries the
same reasoning per area. `buildSituationRead` gets the money goal, the walk
and both world-knowledge rules in HOW TO THINK. And the headline — whose
entire positive spec was six words, which is why Vin read "The ad budget is
chasing Facebook" as broken grammar — now runs `plainEnglishFaults` as a
HARD fault with a retry, plus a positive spec: a plain subject doing a plain
verb, no metaphor.

### "Is DataForSEO still not working" is now answered on the sheet

`rankSource` was computed at resolveMeasurements and consumed nowhere — the
recorded computed-but-not-passed class. It now travels into `_harmInputs` and
`buildAuditFacts.searchSource`; the facts strip says "search read on the
fallback — no position possible this run" whenever Places answered instead of
DataForSEO. The definitive log greps remain: `DFS AUTH PROBE` (no line at all
= credentials never reached the instance) and `LOCAL PACK [` ("DataForSEO
returned" vs "Falling back to Places").

### What the falsification runs found in the checks themselves

The rework money-line fixture passed on a broken build: it asserted the
lost-jobs phrase ABSENT, and the fixture passes no job value, so the rung's
no-value line lacked the phrase either way. Rewritten as a positive assertion
on the reputation line. And the funnel story's did-we-look revert stayed
green until a corrupted-input fixture existed, because the field contract
upstream already guarantees the clean case — defence in depth has to be
tested with dirty inputs.

**`index.html` changed, so this needs a Netlify deploy.** The story spine,
the ROI chips and the search-source note are dark until the file lands.

---

## 65. The funnel became the layout, and the narrator was made to think — 2026-08-24

Vin, on the first funnel-walk sheets: *"the info is just not getting condensed
into a story about the company its repetitive on its point... it seems like the
brain doesnt actually think about whats going on it just tells about the
signals i need it to think."* And approving the funnel mock: *"make sure each
finding always goes along with the proper place for the funnel... the biggest
leaks are ranked 1 2 and 3 cuz the goal for the audit is to identify the top 3
biggest things that are damaging the business."*

The repetition was structural: five surfaces (the walk, the verdict paragraph,
the one-thing, the top-3 list, the smaller leaks) each rendered its own copy of
the same measurements, because nothing owned the story. Both fixed at the root.

### Every finding has a declared place on the funnel

`RUNG_FUNNEL_STAGE` places all 48 rungs — found / door / after / work — the
same discipline as RUNG_PILLAR: a rung added tomorrow refuses the boot until a
human places it, both directions checked. `review_pain_pattern`'s stage follows
its THEME through the same classifier that decides its rank (contact → after;
workmanship → work, the context strip), so the stage and the rank cannot
disagree. `paid_traffic_leaks` is filed at the DOOR deliberately — the tag is
the money but the fault it names is where the click lands, Vin's own walk.
Rows carry `funnelStage`; the client falls back to a pillar→stage map for
leads audited before the field existed.

### The top three leaks are numbered 1-2-3, once, server-side

`leakRank` is assigned on the sorted list in buildProblemList — the ONE copy
every consumer reads. Internal review metrics, ambient conditions and
workmanship context can never take a number. The client renders the red
LEAK 1/2/3 badges AT the stages where the rows sit, so the ranking and the
location are one picture; a legacy lead derives the same numbers from the same
predicate.

### One narrator, forced to think

The walk and the ranked leaks now feed INTO the synthesis as labelled evidence
("already printed on the sheet — never restate these lines; your read is what
CONNECTS them"), its thinking effort went medium → high (the one call whose
whole job is judgement), and — because instructional guards do not hold —
`restatedEvidenceLines` is the mechanical half: a read sentence sharing 70%+
of its content words with any evidence line is a restatement, two of them fail
the attempt with the fault named, and the retry knows exactly what to do. Both
directions fixtured: a parroting read fails, a genuinely synthesized read over
the same facts passes. The walk is computed ONCE, before the narrator, and the
response returns the same object — two calls could drift.

### The layout: story → funnel → call → reference

THE STORY is the only prose on the page (background, headline, read, the
sell); the code walk is its fallback when the model read is missing. THE
FUNNEL is the skeleton: a real funnel drawing (one `funnelSvg` for both
surfaces — red only where broken, dashed where NOT MEASURED, drips where the
money falls out) beside the three stages, each finding rendered once as terse
evidence with its badge, money lines only on the numbered leaks, fix-first
from the walk, and the work-itself context strip underneath. The old verdict
card, one-thing card, top-3 list and smaller-leaks section are DELETED from
both surfaces — their content lives at its stage or in the reference (the
model's grouped rows, the system diagnosis, the costliest line). An
unmeasured stage says NOT MEASURED and, for "after", names it as the question
for the call — silence never hardens into a verdict, and `buildFunnelStory`
now returns per-stage `measured` flags so CLEAN and NO READ are tellable
apart.

### And the one boot nobody had capped

fuzz went red on a correct build: its spawn was the ONE boot in the project
without `--max-old-space-size=256`, and this round's additions settled the
UNCAPPED heap at 206MB — over BOOT HEAP CHECK's 200 — while the capped boot
(CI, Render, PART 6's own command) collects to 185MB and is green. Fuzzing a
heap shape production never runs is testing nothing; the spawn carries the
cap now. Found on the way: node's fetch of `http://localhost` was being
intercepted by the environment's proxy (503) while `127.0.0.1` answered 200 —
fuzz addresses the server by number now, as servercheck always did. Heap note:
185MB of a 200MB assertion — the next few hundred lines of boot checks need
the §46 memoisation treatment before they land.

**229 boot checks green.** Eleven falsifications (seven server, four client),
each red alone; the G4 revert went red on a sibling fixture rather than its
own, which is accepted — the guard family caught it.

**`index.html` changed, so this needs a Netlify deploy.**

---

## 66. Leak 1 became the deepest break, and the walk said "top three" off a null — 2026-08-25

Vin's decisions after the Conner's Kitchens read, in his words: leak ranking by
funnel depth, bottom first ("the bottom is where it actually makes money and
the bottom can cost the most revenue loss wise"); "yes always the biggest one
1 and second worse 2 and third worse 3. but if there arent big ones then fill
the 2 and 3"; and the 7.9/10 chips block left to us. Plus his line-by-line
critique: "a site cant be set up for facebook ads", "no clue wtf a free
searcher is lol", the leak-1 sentence "like what the fuck is this", the
truncated grey quote, and "the layout and fomratting of the audits is still
unorganized and a disaster."

### The numbering: depth first, always three, one loop

`leakRank` now sorts by funnel DEPTH — after-contact beats the door beats
getting-found — because money already in hand dying at the bottom nullifies
every dollar spent above it. Inside a stage, a complaint a customer WROTE
beats a finding we inferred, then harm. Copy observations top the count up to
three at the route merge and can never anchor at 1. Never numbered, as ever:
internal metrics, ambient conditions, the workmanship row.

**Two findings from the falsification runs, both structural.** The first
version split the rows into a "big leaks" pool (moneyRank ≤ 5) and a filler
pool — and the falsification proved the filler pool UNREACHABLE: every TAXED
rung is INTERNAL_ONLY, so every row that can be numbered at all is already a
money row, and "fill with the not-so-worse" is the same sorted list
continuing. One loop now; a mechanism no fixture can reach is exactly the kind
that rots. And the explicit workmanship exclusion was dead code the same way —
the workmanship row's stage is 'work', 'work' has no depth, and both guards
read the same flag, so they could never disagree. Deleted; the stage gate is
the guard.

### The walk claimed "in the top three" off a NULL rank

The Conner's contradiction — the story saying "they are in the top three"
while the chip said "search read on the fallback — no position possible this
run" — needed no Render log. `Number(null)` is 0, 0 is finite, and 0 <= 3, so
every fallback-source lead (rank nulled by the §52 trust wall) rendered the
strength sentence. The recorded null-laundering trap, in the one sentence Vin
asked to be crystal clear. `typeof m.rank === 'number' && m.rank >= 1` now; a
found-without-position lead says NOTHING about position, and the genuine
top-three case gained "That part works." — the crystal-clear strength called
out. The fallback caveat now travels WITH the stage it scopes: a quiet
Getting-found on a fallback read renders PARTLY MEASURED, never NO FAULT
FOUND.

### "X's ad code is on their site" — the fifth wording, one formula

Every ads-family sentence said "set up for X ads" or "has X tracking on it",
and the owner of this system could not parse either. All five rungs
(`paid_traffic_leaks`, `paying_for_a_search_they_lose`,
`social_spend_no_search`, `no_retargeting`, `ads_untracked`) and the walk's
money-out lines now share one concrete formula: "Google's ad code is on their
site" — a named company's code in a named place, checkable by view-source.
The bound is unchanged: code proves an account, never a live campaign.
"Conversion tracking" became "nothing counts what those clicks turn into...
the code that ties a paid click to a phone call or a booked job." The five
fix-first paragraphs (`bottleneckWhy`) got the same pass — "They capture
interest (a quote/contact form)" is a retired formula the boot now refuses by
needle.

### The rest of the critique list

- **The truncated quote** — "Waiting months for them to fi" — was
  `slice(0, 140)` cutting mid-word. `clipQuote` cuts at the last word
  boundary inside the budget and marks the cut with an ellipsis; one copy,
  all three mined-evidence call sites, executed at boot.
- **Review-quote copy rows are staged by their THEME** through the same
  classifier that ranks them — a callback complaint quote lands after
  contact, never at the door while "After they reach out" reads clean.
- **The chips block is one sentence** — "8.1/10 site build · the build is
  fine — the leaks are in the path around it" (`scoreSentence`, code-
  assembled, reads the score and the stage statuses). The graded components
  moved to the reference; every ads/booking/form fact the chips carried now
  renders AT its funnel stage as the walk's grey evidence line, which is the
  approved mock's shape: stage header → what was measured (grey) → what is
  broken (rows, numbered) → the money line.
- **Inside a stage the numbered leaks lead in rank order** — the first
  sample of this layout printed LEAK 3 above LEAK 2.
- **The synthesis got the register rules as instructions** (the mechanical
  gates already run): never coin a noun phrase ("free searcher" → "the
  people already searching Google"), the headline names real nouns (the live
  "Every door on the site leads to the same phone call" is now a negative
  example in the prompt), and leak 1 is named the PRIMARY ANCHOR per the
  goal doc — the read hangs off it, the smaller two prove the pattern.

### What the falsification runs found in the checks themselves

Sixteen falsifications this round — eleven server, five client — each red
alone, and two of them caught fixtures that measured nothing: the fill
fixture's "filler" rows were both LEAKING (money pool), so deleting the
filler loop left it green until the pools were collapsed; and the
workmanship revert stayed green because the stage gate already covered it,
which is what proved the clause dead. The client falsifications run through
clientcheck's own exit code — the recorded harness rule — and each fired on
its named assertion.

**229 boot checks green.** `index.html` changed, so this needs a Netlify
deploy.

---

## 67. The fix-everything sweep before bulk — 2026-08-25

Vin, with the second Conner's run (the first on a verified DataForSEO account
— the pack answered, #14 of 19 in the blue links, ~341 modeled visits):
"why cant we just fix all of this stuff one time then the logs be clean...
work slow and meticulously with insane attention to detail," plus the audit
read: the story came out thin, the grey text must go entirely, paid traffic
must be visible, and "are we ready to run 50 bulk leads — rank the system
honestly, no smoke."

### The thin story was a timeout with no second chance

`SITUATION READ: call failed — timeout. The audit continues without it.` The
story writer — the one call whose loss a reader sees as "the audit is thin" —
ran Sonnet at thinking-high toward ~3,000 output tokens against a 45-second
ceiling, and was the only call in its class with no timeout retry. One slow
minute deleted the best writing in the audit and the sheet shipped a one-line
story. 90 seconds now, plus the same single opt-in retry the critique and the
mine carry.

### The classifier was outrun again, so the miner now tags the kind

§57 widened the complaint-bucket regexes for Breck's phrasing; the very next
lead's phrasings — "Slow follow-up after initial estimate visit", "Delayed
warranty or defect repairs" — missed every bucket again, so the after-contact
stage read NO FAULT FOUND while the complaint sat under the funnel as
workmanship, and only two leaks were numbered. A hand-kept vocabulary chasing
a model's free-form labels loses forever. The miner READ the reviews, so it
now tags each pattern `contact | workmanship | other` (strict enum, invalid
values die to null), the tag rides beside the strings and wins at every
classification site, and the regex stays as the fallback for untagged data —
widened for both live misses. Signals also sort most-mentioned first: the live
run put a 2-mention pattern above a 3-mention one because emission order was
trusted as a ranking.

### The anchor floor, and a dead limb the falsification found

The depth rule alone would have made a 2-of-90 anecdote leak #1 (§61's exact
complaint through the new door). A review pattern below the email's own
three-mention floor can support at 2-3 and cannot anchor; when it is all a
lead has, it still leads — the email's own BLOCKED RUNG LEADS ANYWAY rule,
mirrored. The falsification run then proved the explicit last-resort fallback
UNREACHABLE (the numbering loop already hands rank 1 to the first sorted row)
and it was deleted: a mechanism no fixture can reach is the kind that rots.

### The rest of the sweep, each falsified alone

- **The owner's replies join the verify corpus** — a TRUE quote of his
  "Thanks so much Terry!" was stripped from the synthesis because the replies
  were handed to the model and never to the gate. Pages, reviews, replies:
  third instance of the category error.
- **"141 five-star reviews"** — the count fits the profile total so every
  figure gate passed it, and the qualifier is false (8 of 90 read sat at
  three stars or below). The count stripper now reads the measured low-star
  count; without that measurement it strips nothing.
- **Do-not-say noise, three shapes**: entries opening "VOICE:" are style
  notes (the old regex only knew "VOICE FAILURE"); an entry whose own text
  says "no email flag warranted... correctly sequestered" is the checker
  AGREEING and is cleared; and "claims what Google shows, from a scrape" is
  exempt when the rank order was TRUSTED — on a real-pack lead we did read
  what Google shows.
- **The ordering claim lives in one place.** "It gates everything below it"
  (the LEADS constraint) printed three lines under "The door first, then the
  traffic" on the live sheet. The constraint keeps its finding; fix-order is
  said once, by the walk.
- **Every scrape sheds its URL fragment at the one door** — "/contact#!" from
  their own sitemap bought a copy of the homepage twice across two runs.
- **The paid half of the traffic estimate is read** (paid.etv sat unread
  beside organic.etv), the walk names the blue-links position ("#14 of 19 —
  a separate ranking from the map itself", silent under six results), and the
  sheet says where the source split actually lives: his Analytics, on the
  call.
- **Log hygiene**: the time buckets stop lumping PageSpeed under "google
  places" (11 timed vs 4 billed read as a metering hole; the meter was
  right), DataForSEO gets its own row, a timed-out model call is named as
  billed-but-unmetered, the GBP category line names its remainder instead of
  counting seven and listing six, and the DFS probe now says it proves
  CREDENTIALS, not account verification — it printed "can actually run" on
  an instance where every paid call answered 40104.

### The screen and the sheet: no grey text, anywhere

Vin: "eliminate the grey text completely... it gets read right over cuz its
smaller font size and grey." Every grey TEXT token on both audit surfaces is
full-contrast now (borders and fills keep their hairlines — a border is not
text), nothing renders under 12px on the screen or 12.5px on the sheet, and
hierarchy lives in size and weight alone. Red still marks stops, the yellow
internal chip stays. Enforced both ways: the rendered export must carry no
grey text token and the briefing source must not use the app's grey vars —
the second scan is on lifted source, stated as such, because a recording stub
cannot see styles.

### What the falsification runs found in the checks themselves

Eighteen falsifications — twelve server, four client, two structural finds.
The owner-reply and google-shows needles were both written as a literal
joined to an EMPTY half — one contiguous string that found the check's own
source and stayed green through a real revert. Ninth and tenth recorded
instances of the self-matching needle, both mine, both caught by running the
falsification rather than trusting the green line.

**229 boot checks green.** `index.html` changed, so this needs a Netlify
deploy.

---

## 68. One lead held three booking answers, and the third one withdrew the email — 2026-08-25

Vin ran Irwin's Septic on the merged build — the strongest lead yet (#2 in the
map, #1 in the blue links, 262 reviews at 4.7) — and the run ended with the
email WITHDRAWN and "Who to talk to —" printed beside shane.irwin@cox.net on a
business called Irwin's. Ten recon agents mapped the mechanisms before a line
changed. Also this round: the Supabase leads read died with a statement
timeout, which is what "the leads disappeared from the research tab" was.

### The booking split-brain — the worst one

The system held THREE independent booking answers on one lead: (1) the cascade
over homepage source + interior MARKDOWN — markdown deletes `<form>`, so the
contact page's real form was invisible and the fallthrough said `phone_only`;
(2) the site-pages model, which read the same interior markdown, correctly said
`form` and `hasCapture: true` — and was overridden by (1); (3)
`checkBuiltWith.hasBooking`, a SECOND hand-kept scheduler list over a plain
homepage fetch, whose bare `acuity` and unanchored `cal.com` (it matches
"medical.com") fed the critique "Booking tool: YES". The ladder wrote "the only
way in their site offers is a phone call" off (1); the critique withdrew it off
(3). A wrong measurement wrote the claim and a differently-wrong measurement
retracted it.

One truth now, four mechanisms: ONE scheduler list (`SCHEDULER_SIGNATURES`,
anchored) shared by all three readers; ONE real-form rule (`htmlHasRealForm` —
an email/tel input, a textarea, or two contact-named fields, so a site-search
box is not "a route in"); the interior harvest — which already buys rawHtml —
now RECORDS forms and schedulers per host, and `applyInteriorPathEvidence`
upgrades a FALLTHROUGH verdict on that positive source evidence (never
downgrades a measured one); and the critique's evidence block lost its second
booking read — the measured Booking path in THE MEASURED FACTS is the one
truth. `captureSeen` (any capture evidence, even the model's) now SUPPRESSES
every "the only way in is a phone call"-class sentence — the rung, the walk,
`no_after_hours` — without ever asserting a form it cannot prove: suppression
on model evidence is the safe direction, a claim on model evidence never is.

### The rest of what one run carried

- **The story was TRUNCATED on its first live Sonnet run** — out:6000 exactly,
  JSON repaired on strategy 4, the tail fields lost. `budget_tokens` 400s on
  this family, so the ceiling is the only bound and it now rises with the model
  (`THINKING_FOR(SITUATION_MODEL) ? 12000 : 4200`), the same pattern the audit
  already had. The situation-read is also the most expensive call on the lead
  ($0.148 of $0.27) — that is the price of §65's thinking-high decision, and
  the dial is effort, not the ceiling.
- **The count stripper ate a measured competitor count.** "#1 competitor's 101
  reviews" died because 101 is neither the 90 we read nor their 262 total — it
  is Caliber's own count from the pack row. The stripper now takes the counts
  we HOLD for the businesses in the ranked search (`competitorCountsFrom`,
  trust-gated at source), passed as an argument and never through the corpus,
  which stays strings-only for the recorded reason.
- **"Getting found: BROKEN" printed above "That part works."** The chip only
  counted rows; the walk's trusted top-three strength now travels as DATA
  (`strong.found`), and a working stage with leaks reads WORKS — WITH LEAKS,
  drips still drawn, red reserved for broken.
- **"The money goes out blind" printed on a lead whose conversion tracking was
  MEASURED TRUE**, three lines under a walk saying the tracking exists. One ROI
  predicate now (`roiStatusOf`) feeds the walk, the facts strip AND the BURNING
  money line: blind/counted/hidden/unmeasured each get the sentence their
  evidence supports. `hiring_marketing_now` also stopped printing "They pay for
  every click" under a job posting.
- **fixFirst said "Nothing needs rebuilding" beside a Website Rebuild
  recommendation and two measured old-build markers** — a third dated-site
  reader that consulted neither. The SCALE branch now reads the same
  eleven-marker site-age read; measurably-dated-with-ads goes FOUNDATION with
  the markers named.
- **"Who to talk to —" was a PHANTOM FIELD**: the screen read `lead.ownerName`,
  which exists nowhere in either file, while `verifiedCEO` held the brain-read
  name all along. Fixed to the chain every other surface uses, and the
  brain-read name now earns a CODE-CHECKED evidence line (`surnameInCompanyName`
  — ONE rule, shared with the resolver's eponymous block — plus the published
  email's own local part): "Read off their own pages... the business name
  carries \"Irwin\", and their published address shane.irwin@… is this name."
  Information for the sheet; never a title, never a change to the buying floor.
- **"Shane is the named owner" shipped in the story** on a lead where the
  resolver found nobody — no gate caught owner-IDENTITY claims. An eighth
  stripper now cuts an ownership sentence whose name no code-checked evidence
  supports (resolver name, eponymous, or email local part); Shane's survives on
  the email evidence, "Marcus Webb is the named owner" beside info@ dies. Its
  own first boot caught the sentence splitter breaking at "Dr." and capturing
  the bare honorific as a name — a correct eponymous sentence died in two
  pieces until the splitter learned honorifics.

### The leads that "disappeared", and the read that cannot time out

The console line Vin sent settled it: `57014 — canceling statement due to
statement timeout` on `/leads?limit=500`. Each row now carries the whole audit,
and 500 of them in one statement is past the database's time budget — the wall
a 50-a-day pipeline hits harder every week. The guard held (nothing seeded,
saving off, cloud untouched); the READ is now keyset-paginated — `order=id.asc`
+ `id=gt.<last>`, 40 rows a page, halving to one row on a failed page — and a
page that ultimately fails returns null for the WHOLE load, because a partial
list served as the truth would mark every unread cloud lead a stale local relic
and drop it. Deliberately keyset, not offset: offset re-sorts under concurrent
writes and rows shift between pages. clientcheck executes the walk (43 rows
across two keyset pages; a mid-walk failure must return null), and both
CONTRACT constants bumped to 20260825 so a stale Netlify page says so.

### Boot: 93 seconds was mostly our own test pace, and the heap was 4MB from red

- **FIRECRAWL GATE CHECK ran its ten probes at the production 350ms gap** —
  3.5s nominal, 57 measured seconds under drain-phase starvation, and it is the
  settle sentinel, so those seconds were the boot. The mechanics prove
  identically at a 40ms test gap; the message now says which pace it ran at and
  that the live store was untouched. The pacing check's 7s/4s/4s fixture holds
  shrank to ~1s — the assertions test WHICH number wins, not how long a boot
  can hold a gate.
- **Eighteen checks each built a fresh comment-stripped copy of this 2.9MB
  file** — the churn that held the heap at 196MB of the 200MB assertion and
  fed the GC thrash behind the 57s. One memoised LF copy
  (`selfSourceNoCommentsLF`, released with the others; deliberately separate
  from the CRLF-preserving memo a needle pins). Settled heap: 196MB → 115MB.
  Local boot: 19s.

### Log accuracy, same rule as ever

A signed sigma printed against magnitude prose ("-2.45 sigma; under 2.00 ...
NO trend is claimed" beside the word "growing") now prints magnitude plus
direction; the [LANE] line dropped a historical parenthetical it printed on
92.5% of leads; PageSpeed's time-bucket row matched a host form the code never
calls (`pagespeedonline.googleapis.com` vs the real
`www.googleapis.com/pagespeedonline/...`) so every PageSpeed second billed to
"google (other)" — the §67 fix shipped with an unreachable regex; quoted spans
shed markdown decoration at `phraseAround` (one door), so "### Turn to the
Pros" stops reaching sheets; and LADDER OVERRIDE names the MEASURED rung beside
the model's label, so "search_absence" on a lead ranked #2 reads as the
mislabel it is.

### And the sidebar that said "0 LEADS" over a 202-lead pipeline — FIXED same day

First reload on the merged build: the paginated read loaded all 202 leads and
the sidebar showed none of them. It synced from memory only on MOUNT and on
the browser 'storage' event — which fires in OTHER tabs only, and never at
all once the pipeline outgrows localStorage and the cache switches off (which
this pipeline now does). The cloud load lands after the sidebar first draws,
so memory updated and no view heard. The masking had been the cache: mount
used to read yesterday's copy and look alive. `setLeadsMem` — already the one
writer — now announces `cj-leads-changed` in its own tab and the sidebar
listens; falsified both ways (dispatch removed, listener removed), each red
alone in `clientcheck`.

**229 boot checks green, settled in 19s locally.** Twenty-three falsifications
— eighteen server, five client — each red alone on its named assertion; the
ownership stripper's own first boot caught its honorific-splitter defect, and
CF5 went red through the executable merge contract on its own, which is that
check doing its §18 job. **`index.html` changed, so this needs a Netlify
deploy** — and the paginated read plus the contract bump are the fix for the
disappeared leads, so the drag-in is not optional this time.

---

## 69. The audit agreed with itself, and the signals moved onto the funnel — 2026-08-25

Vin re-ran Irwin's on the merged build — the email composed clean, the booking
truth held, FACT CHECK returned zero flags — and walked the audit line by line.
His asks, in his words: *"formatting the whole audit around the signals we get
and matching it up with the funnel is ideal"*; *"I'd like to know if they're
funneling the Google traffic to a landing page or just their website — that's
very important information"*; *"it says the biggest blocker is what they promise
a customer (OFFER) — i truly dont think this is the biggets diagnosis... it
doesnt correlate with leak 1 2 and 3... everything needs to match up"*; *"id say
leak 1 is a fix first"*; *"id like 3 options for this section at all times based
on the top reveneu leaks"*; and *"not sure what this means"* about the
dated-build wording.

### The one-thing said OFFER because the engine had no word for retention

Irwin's leak 1 was the missing service plan; the one-thing said OFFER — and its
condition claimed "no guarantee" on a lead whose guarantee was measured TRUE,
because the OFFER templates hardcoded the phrase. Three fixes, one layer:

- **RETENTION is a binding layer now** — Jay Abraham's third lever (more
  frequent transactions), the one his three-lever frame always had and this
  engine never did. It binds ABOVE OFFER, on hard evidence only: the recurring
  read actually ran (which already carries the two-page/3,000-character floor
  and the trade gate), the plan is measured ABSENT, and customers provably
  arrive — retention only matters when there is somebody to retain. Three offer
  gaps is one gap past the ordinary state of a small business (the OFFER
  comment's own words); a measured absence of the industry-standard plan is
  harder evidence. `recurringOffer` is handed in at BOTH call sites, and
  `no_recurring_offer` moved from OFFER to RETENTION in `HARM_LADDER_LAYER`, so
  the binding-layer bonus lands on the rung the diagnosis is about.
- **The OFFER wording names only what was measured.** `readOfferStrength` now
  builds a compact `missing` list in the SAME if-blocks as its gap sentences —
  one copy of each predicate — and both OFFER condition templates and the
  injected positioning candidate read it. "No guarantee" can never again print
  about a business whose homepage says guaranteed.
- The new layer got its full supporting cast (PRODUCT_FAMILY row, opening
  altitude `recurring_gap`, client LAYER_PLAIN), each asserted at boot, because
  a layer key with no product family is a diagnosis nothing downstream can act
  on.

### `worst` and leak 1 were two answers to one question

The costliest-thing line read `byMoney[0]` — a pillar-absolute sort — so
Irwin's sheet said the costliest thing was the dated build (harm 62, LEAKING
pillar) while the numbered leaks led on the recurring gap and customers saying
nobody calls back (harm 86). `worstAnchorFrom` is now the ONE authority: the
same depth-first ordering the numbering uses (after-contact beats the door
beats getting-found, written evidence beats inference inside a stage, the
three-mention anchor floor), shared helpers with `buildProblemList` so the two
cannot drift, executed at boot on the Irwin shape. The evidence derivation
(`leakEvidenceFrom`) also became one copy read by the route and the ranker —
the two-hand-kept-copies disease, closed at the root.

### Fix-first follows the deepest numbered leak

*"i dont think it [rebuild] should be fix first."* He is right, and the rule was
already his: money earned and dying at the bottom nullifies spend above it. The
FOUNDATION-dated branch fired on two old-build markers whenever the ads ran and
the site converted — the door demonstrably works in that branch — so when leak 1
sits AFTER contact, fix-first now names that leak first and the dated build
second, not first. The cascade reads the finished numbering (leak 1 is final by
then; the copy-row top-up can only fill ranks 2-3).

### Where the ad clicks land, from data already paid for

The sponsored pack row's `url` IS the ad's click-through destination, and it
died inside `checkLocalRank` — reduced to one boolean, and dropped entirely on
the organically-absent branch, the exact lead where paying-for-a-search-they-
lose matters most. The matched row travels now (both branches, identity-matched
by place id or domain only), `adLandingKindFor` classifies it against the
site's own harvested navigation — homepage / interior / unlinked (which is what
a purpose-built landing page looks like) / offsite — with the same three-link
floor the unlinked-pages read carries, under which the safe under-claim is
"interior". The walk says it at the door; when ads are wired but no sponsored
row matched, it says the honest thing: only their ads account shows it, worth
asking on the call. **Ads-well-run stays a question, not a measurement** — cost
per click, conversion rates and budgets are visible only inside his ads
account, and the openers hand the caller that exact question.

And the sitemap denominator lie died on the way through: `sitemapPages` counted
the leftover pool (nav-linked pages `continue`d before the counter), so a
12-URL sitemap logged "every one of the 1 page(s)". Two counters now, and the
none-branch log tells the truth about both.

### Three conversation openers, one per numbered leak

*"id like 3 options for this section at all times based on the top reveneu
leaks so convo starts for each."* Every numbered leak now carries `callOpener`
— a question, per-rung first (`RUNG_CALL_OPENER`), pillar fallback second, so a
rung added tomorrow still gets an honest generic start. `CALL OPENER CHECK`
executes every numberable rung's opener at boot: ends in a question mark, under
nineteen words, no digits (so no figure gate can ever apply), no em-dash,
plain-English scored. Worth-asking on both surfaces shows the three starts
labelled Leak 1/2/3 with the model's own question kept beneath them — the sheet
still informs, never instructs.

### The signals, lined up against the funnel

`signalRowsFor` is one builder both surfaces call: per stage, every measured
signal as a full-contrast line — the map read and the blue links, the ad code
and the live-sponsored proof, where the ad clicks land, what a click becomes,
the booking route, the form length, the price, the build age, real-visitor
speed, the service plan, the top review complaint and the unanswered negatives
(the last two chip-marked INTERNAL). Red marks a row only when a problem row at
that stage speaks about the same signal (`SIGNAL_RUNGS`, a declared map).
**Unmeasured rows collapse into one plain line** — §36 removed a grid of "Not
checked" rows from this sheet once already, and a wall of not-measured is how
that comes back. `auditFacts` grew the organic position, the recurring read,
the live-ad proof and the landing kind (all nested, so no contract change), and
the export record carries a compact map-rank copy and the published-price
count.

### The stripper that emptied the story

§68's run had already been damaged by it: the competitor-site stripper's bare
`every competitor` branch matched the tail of a compound sentence and deleted
"Shane has built a strong reputation (262 reviews, 4.7, ranked #1 locally)..."
whole — five sentences of situationRead and realPain, gone, for one clause. Two
fixes: the pattern keys on site-content SHAPES now (a possessive site noun,
identical/interchangeable-to, same-X-every-competitor), never the bare phrase —
a measured "above every competitor in the ranked list" survives — and the cut
is CLAUSE-level across em-dash and semicolon joins, so the measured front half
of a compound survives and only the offending clause goes. The synthesis call
site got the needle the audit call site already had.

### The dated-build wording, caught twice by its own gates

The two marker phrases Vin could not parse now read "the code behind the page
is the kind used before smartphones existed" and "the page announces itself in
a format websites stopped using over a decade ago", and the costs line
translates to revenue: "a customer comparing two quotes takes the fresher site
as the safer company, and the tie goes to the other name." My first costs
rewrite shipped at grade 13.8 with an em-dash and the boot went RED twice —
READABLE FINDING CHECK and EM DASH CHECK doing exactly their jobs on my own
words, which is the whole argument for gates over intentions. The READABLE
fixture now carries siteAgeMarkers so the glued sentence is scored forever.

### What the falsification runs found

Twenty-three falsifications — eighteen server, five client — each red alone on
its named assertion, and three found something real:

- **A dead limb in `worstAnchorFrom`.** The explicit internal-only filter was
  unreachable: every internal review metric's declared stage is 'work', 'work'
  has no depth, and the stage test already excludes it. Deleted, per §66's own
  rule — a mechanism no fixture can reach is the kind that rots — with the
  fixture kept on the stage-placement path that does the work.
- **A client revert that broke the parse.** CF3's first version cut a dangling
  block and clientcheck died on a SyntaxError — a NO VERDICT that proves
  nothing, the recorded harness rule. Rewritten as an exact-string replacement
  and re-run red on its named assertion. The revert also had to delete the
  CREATION, not the return-site use: the recording stub captures elements at
  createElement time, exactly as the check's own honest-limit comment says.
- **The eleventh self-matching needle**, found in passing: the `location_code`
  needle from §59 was written with an EMPTY second half, so it matched its own
  source line and would have stayed green through a real revert. Two real
  halves now. And the two theme needles were re-aimed at the one shared
  derivation when the evidence literal became a spread.

**231 boot checks green, all gates green (2,081 fuzzed emails, servercheck's 31
assertions).** The contract is 20260826 on both sides.

**`index.html` changed, so this needs a Netlify deploy** — the three openers,
the signals-on-the-funnel grid and the RETENTION translation are dark until the
file lands, and a stale page will say so by contract number.

---

## 70. The board, and the bar that finally follows along — 2026-08-25

Vin, with a screenshot: *"it does not show audited leads anymore like i ran
irwin and it didnt pop up in the audited seciton this is a bug and we need a
whole redeign of this tab anyway... id like to know if its in progress
something to follow along. just show me mockups first before build."* He
picked Direction B from the mockups: the whole Research tab as a full-width
board with status tabs, clicking a row opening the audit exactly as it exists.

### The "bug" was a burial, and the burial was real

Irwin WAS in the sidebar — under Audited, which rendered BELOW the entire
not-audited section: on a 202-lead pipeline that is over a hundred rows down,
past sticky headers that replace each other as you scroll. A section a person
cannot find is a section that does not exist. Two fixes: the sidebar (which
survives, as the rail beside an open audit) now orders Audited ABOVE
not-audited, and the BOARD replaces buried sections with tabs — All / Auditing
/ Audited / Not audited — where `boardRowsFor` is the ONE place that decides a
lead's tab, executed by clientcheck, because the old section filters lived
inline in the render where nothing could run them. Running beats audited (a
re-run must not look finished), the anchor leak-1 sentence rides each audited
row, and the sidebar's lead rows render only while a lead is open — two lists
of the same leads is the repetition this file keeps recording.

### And the search box was quietly poisoning Export

The find-a-lead box REPLACED `allLeads` with the filtered subset — the store,
not a view. "Export all audits" while a search was typed silently exported
only the matches. The store stays whole now; the sidebar, the board and the
export all read it through a non-destructive filter.

### The follow-along is milestones, not a simulation

The status route has shipped `job.phase` since the queue clock landed and
nothing ever wrote a milestone into it, so "what is this lead doing" could
only be answered with an elapsed-time guess. Five real milestones now —
reading their pages / reading their Google listing / reading their reviews /
running their search / writing the audit — each set when that stage's code is
actually reached, attached through the job wrapper's setter (the sync route
gets none, so it costs that path nothing). The poll loop hands the phase
outward, the batch reports it as a `lead-status` event, and the reducer keeps
a per-lead detail that is cleared THE MOMENT the lead finishes — a done chip
still claiming "writing the audit" is a stale claim about ended work,
fixtured in batchcheck. The bar itself: one segment per lead (done, running,
queued as three visible states, proportional past sixty), a chip per running
lead with the server's milestone and its worked clock, and "next:" naming who
is queued. `PHASE MILESTONE CHECK` pins the setter, all five milestones and
the route delivery.

### What the falsification runs found

Eight falsifications — two server, six client — each red alone on its named
assertion. CF8's first run was a NO VERDICT twice over: `node batchcheck.js`
ran from the falsification directory (module not found — an exit 1 that
proves nothing, the recorded harness rule) and the restore `cp` wrote into
that same directory instead of the repo, leaving the revert LIVE in the tree.
Both caught by checking the log's first line and diffing the tree after
restore — a falsification harness is judged by what actually ran, never by
its exit code alone.

**232 boot checks green, all gates green.** The contract is 20260827 on both
sides. **`index.html` changed, so this needs a Netlify deploy** — the board,
the follow-along bar and the search fix are dark until the file lands.

---

## 71. Two sheets read word by word, and the reviews correction Vin made to his own correction — 2026-08-25

Vin ran David Alan Wolf (personal injury attorney) and First Coast Plastic
Surgery, sent both sheets and the whole log, and ordered the deepest read yet:
*"read every single word in the audit... make sure the core story is right and
the findings and the leaks are right... work harder than you ever had before."*
Eight parallel recon agents mapped the code behind each symptom before any
edit — one of them ran 252 combinations through the REAL numbering pipeline —
and every fix below was falsified individually.

### Two LEAK 1 badges on one sheet — and the cause was in the DATA

Wolf's sheet carried LEAK 1 at Getting found (the Baggett row) AND LEAK 1 at
The door (the dated build). The recon's executed sweep proved today's code
cannot CREATE that state — the client's legacy branch has been exclusive in
every shipped version, and the server's numbering yields unique 1..k on every
fresh run. The two 1s are STORED rows from two numbering eras sitting in one
Supabase array (the pre-depth money order gave rank 1 to the outranked row;
the depth order gave 1 to the door row), and every reader trusted stored ranks
blindly, forever. Plus one real live-code bug the sweep caught by execution:
the route top-up treats the COUNT of ranked rows as the MAX rank, so stored
{2,3} plus one copy row minted a duplicate 3.

The durable fix is normalization at the chokepoints, which makes the symptom
impossible regardless of data history: `normalizedLeakRows` is ONE client
helper (internal and ambient rows can never take a number, order is
stored-rank-then-position, duplicates become sequential, nothing past three
survives) read by the funnel badges, the board's leak-1 line and both
Worth-asking lists; the server top-up mints past the HIGHEST stored rank; and
duplicate ranks in a merged list are named in the log instead of passing in
silence.

### The FCPS follow-up leak the brain "completely missed" was a tag short-circuit

FCPS's top mined theme — *"poor surgical outcomes not addressed or revised
adequately"*, second pattern *"doctor hard to reach after complications"* —
was tagged workmanship by the miner, and the tag returned BEFORE the contact
vocabulary ran. So the complaint Vin ranked above the copy findings was filed
as context, the after-contact stage read NO FAULT FOUND, and the email led on
the same complaint the audit had buried. Two roots: the contact vocabulary is
tested FIRST now (contact wins on a mixed theme even against a workmanship
tag — the tag decides only strings the vocabulary cannot see), and the
vocabulary itself learned the live misses: "hard to reach" (with a
place-not-person guard so "hard to reach areas" stays workmanship), "not
addressed", "never heard back", "unreachable", and communication phrasing.
The miner's own "contact" definition also now names a problem raised AFTER
the work that nobody responds to.

### Reviews and rank: the correction, then Vin's correction to the correction

The Baggett sentence — two review counts beside a position — was read by the
owner of this system as *"they are above him because of reviews."* The first
fix made the sheet say reviews are NOT deciding. Then Vin, same day: *"i may
have been a little hard on the reviews piece... having more reviews and better
rating is def important but its def a sign if someone ranks higher than you
with less reviews... it means theyre doing the other stuff better."* And a
second research drop settled the split: the ORGANIC map weighs relevance,
distance and prominence — the listing's PRIMARY CATEGORY heaviest, proximity,
the site, engagement with the listing — while phone responsiveness ranks
Google's PAID local ads (LSA), a different surface.

So the outranked row now carries `rankNote`, code-assembled, with BOTH halves:
reviews do count and this business is ahead on them — which is the tell that
the other inputs are deciding — and, only when the lead's own mined theme is
contact-shaped, the join Vin asked for: their customers describe calls that
never come back, and Google's own guidance for its local ads ranks businesses
partly on how reliably they answer. Scoped to the ads surface by name, a
candidate for the call, never a crowned cause. The synthesis register rules
and the audit brief carry the same two-surface split, and "reputation" was
scoped to the public review record everywhere reviews were being called
reputation — the signalReads label "Reputation" and its own worked example
("the position is not being earned on reputation") were teaching the exact
conflation Vin flagged with *"we cant base their entire reputation off of
that can we??"*

### "No potential customer is looking at the code of their website"

He is right, and the dated-build rung was claiming customer-visible age off
markers a customer cannot see. Every SITE_AGE_MARKER now declares
`visible` — tables, pre-CSS tags, Flash, fixed width, no viewport, plain
http and a stale copyright are things a visitor meets; the keywords tag, an
old code library, an XHTML doctype and a dead site builder are not — and
`dated_credibility` fires only with at least one visible marker, because "a
customer takes the fresher site as the safer company" is a claim about what a
customer sees. An invisible-only old build keeps the facts strip and the
website score (it is still measurably old) and loses the credibility claim;
the FOUNDATION prescription says which kind it is holding. Visible markers
sort first, so the sentence names what a visitor actually meets. The
keywords-tag find itself Vin called "insanely great" — it stays, as the
internal evidence it is.

### "They show up, but not in the top three" — and Wolf's paid question

The walk's found stage now carries the digit — *"they show up at #7 of the 20
listed — under the top three"* — because a #4 and a #17 read identically
before, which is a measurement flattened back into an impression. And it
states WHICH ranking a position is: when the markup was readable, no ad code
of either kind, no tag container that could hide one, and no sponsored row of
theirs appeared, the walk says *"That position is the unpaid ranking"* — on
the under-three case and on FCPS's #2 alike, which answers "is that organic
or are they running ads to rank that high" on the sheet itself. Gated on a
standing position sentence, so it can never claim a position nobody measured;
a live sponsored row suppresses it. The fix-order join was taught the new
wording in the same edit — the recon caught that it would otherwise have
silently died for every rank>3 lead.

### The rest of the round, each at its root

- **The VE's no-price friction** claimed "anywhere" and bypassed the
  unread-pricing guard every rung carries — FCPS's constraint said "no price
  appears anywhere" while a pricing page sat unread in the sitemap. Scoped to
  pages we read, suppressed entirely on unreadPricing, and the arithmetic
  honestly loses the unproven obstacle.
- **recommendedPrice reached both sheets blank** because the model echoed the
  prompt's own "from $20k" floor and the money gate's licence list had never
  been told about it. $20k is licensed now, and a gate-emptied price field
  gets the catalog's own declared line as a stand-in — code-assembled, every
  figure run through the real gate at boot.
- **A Team's garage-doors lead got "no trade resolved"** twice over: the §15
  stem trap a third time ('garage door' inside a boundary cannot match the
  'Garage Doors' label every Places lead carries), and a site-down lead had
  nothing to match — while the server held Google's own listing category.
  The category is tried SEPARATELY and LAST, raw: "Garage door supplier"
  still refuses (no brief beats the wrong bucket), a clean category resolves.
- **The critique false-flagged our own arithmetic** — "and 4 others above
  them have fewer too" beside a measured 5-of-10 is 1 named + 4 others = 5,
  and the critique read 4 ≠ 5. It is told the split arithmetic with the
  lead's own numbers.
- **CANDIDATE HYGIENE implied a defect on a down site** — the warning now
  names the honest cause (no trusted homepage copy captured) and reserves the
  alarm for a lead whose copy WAS captured. Third recorded instance of the
  message-names-the-wrong-cause class this file carries.

### What the falsification and fixture work caught in itself

The visible-sort fixture initially asserted `markers[0].visible` — and
`tables` is declared first AND visible, so the assertion passed without the
sort. The fixture-that-measures-nothing trap, caught at design time; the
second and last slots are where the sort actually shows, and the fixture
asserts those now. And the round added three call-site needles (the price
stand-in, the critique arithmetic, the hygiene message) before falsifying,
because a check that does not assert its call site is half a check.

**Twenty-four falsifications — nineteen server, five client — each red alone.
232 boot checks green; clientcheck, batchcheck and the static gates green.**
The contract is 20260828 on both sides. **`index.html` changed, so this needs
a Netlify deploy** — the duplicate-badge fix, the rank note and the normalized
Worth-asking lists are dark until the file lands, and a stale page says so by
contract number.

---

## 72. Trapped on the audit screen, and the stale rows on top — FIXED 2026-08-25

Vin, first session on the round-93 board: *"i click on view an audited lead and
i cant get back to the new layout... theres an all leads arrow but it doesnt
worek"* — and *"it needs to filter the just completed audit to the top of the
list theres alot fo stales ones in here."*

**The back button worked; the state had no way back.** The board renders when
no lead is open, and the "All leads" button correctly set the selection to
null — but the lead-loading effect handled only the FOUND case (`if (l)
setLead(l)`), so nothing ever CLEARED the open lead and the operator was
trapped on the audit screen behind a button that looked dead. A null selection
now clears the open lead; a set-but-not-found id still keeps the old behaviour
on purpose. The branch is pinned by a runtime-assembled needle in
`clientcheck`, because the effect lives inside a React component the harness
cannot execute — the recorded honest limit, stated at the assertion.

**And within Audited, the freshest audit now leads.** The board sorted by
status then SCORE, so a just-finished three-lead run sat buried under a week
of stale 97s. Inside the audited status the sort is now most-recent-audit
first, score breaking ties; every other status keeps score order. Executed in
`clientcheck` on the shape that failed live: an older audit with a HIGHER
score must lose to a fresh one.

Two falsifications, each red alone on its named assertion. From the same
screenshot's own log, not a code defect: one audit failed with "Anthropic
credit balance is low" — the account needs a top-up before the next batch.

**`index.html` changed, so this needs a Netlify deploy.**

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
node clientcheck.js                     # the client's request/merge contract — EXECUTES the merge
node batchcheck.js                      # runs 50 leads through the bulk audit with a fake network
#   These two are the only gates that RUN index.html. It deploys to Netlify by
#   hand and nothing in this repo could execute it, so every client change until
#   2026-08-20 shipped on a read-through — which is how nine duplicate-key
#   collisions, seventeen disagreeing request fields and eleven dropped server
#   measurements all reached live at once.
node fetchtest.js                       # the one helper all 60 outbound calls use
node servercheck.js                     # the research route DRIVEN over a fake network
#   Two real boots, six scenarios: the golden lead, a preflight refusal, a dead
#   Apify token, a brain husk, a 402 day, the day ceiling. The seams BETWEEN
#   functions are where every computed-but-not-passed has lived, and until
#   2026-08-22 nothing walked them. bash ci-gates.sh runs this whole list —
#   ONE executable copy, and CI runs it on every push.
node fuzzcore.js 20000                  # 11 gates, in-process
node fuzz.js 500                        # composes emails over HTTP
node pngscale.js --selftest             # 21 assertions on the screenshot scaler
#   This was NOT in the gate list for the life of the project, and nothing in
#   server.js ever executed fitWithin either — the only guard was a source regex
#   asserting the CALL SITE exists, which passed on the run that lost every
#   image on a lead. SCREENSHOT SCALER CHECK now runs the real function at boot.
PORT=4000 timeout 420 node --max-old-space-size=256 server.js   # 227 boot checks
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
and caused none of this week's failures. The 227 boot checks and the comments above
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

---

# PART 8 — DEPLOYING WITHOUT HANDS

Three one-time account actions turn the 2026-08-22 build into a pipeline where
a merge to main IS the deploy, and a build that cannot pass its own checks
cannot land. None of them is a code change; until each is done, everything
keeps working exactly as before.

## 1. Render: point the health check at /healthz

Render dashboard → the service → Settings → Health Check Path → `/healthz`.

The endpoint answers 503 until the BOOT VERDICT settles green and 503 forever
if any boot check failed — so with the health check set, Render holds a deploy
on a red build and keeps the PREVIOUS build serving. A red boot stops being a
grey log line and becomes a deploy that visibly did not land. Nothing to
configure in code; the endpoint is already live.

**The honest trade-off.** Render uses the same path for deploy gating AND for
runtime monitoring. Deploy gating is pure upside: a red build never starts
serving. Runtime is the edge case: if a LIVE service crash-restarts and a
flaky check happens to go red on that one boot, the service stays 503 until
the next restart — there is no previous build to fall back to at runtime.
That trade is accepted deliberately: every check in the file exists because
its failure shipped something false, and serving with a failed truth gate is
the worse outcome. A crash restart also re-runs the checks with POSTs held
(the boot-window gate), so the ~20-second window costs retries, not leads.

## 1b. GitHub: make the gates a merge BLOCKER, not a report

CI runs on every PR and every push to main — but GitHub only refuses a red
merge once branch protection requires it. One-time: repo Settings → Branches
→ Add branch protection rule → branch `main` → tick "Require status checks to
pass before merging" → select `gates`. Until this is done the gates are
visibility, not enforcement, and a red PR can still be merged by hand.

## 2. Netlify: connect the repo (ends the hand-deploy)

Netlify dashboard → the site → Site configuration → Build & deploy → Link
repository → `Vinnyvinny2/crojungle-outreach-backend`, branch `main`. The
committed `netlify.toml` does the rest: it copies index.html into `dist/` and
publishes that — never the repo root, which would serve server.js and every
check as public files.

After this, the client half of every merge deploys in the same motion as the
server half — which removes the single biggest structural bug source this
repo has: the server half of a fix going live on merge while the client half
sits on a desktop, the shape that makes a bug look intermittent. Until it is
done, the drag-in keeps working; the toml is inert.

## 3. Staging: a second pair, same repo, one env var

A second Render service and a second Netlify site pointed at the same repo,
branch `staging`. Set `RENDER_ENV=staging` on the Render side — /healthz
reports it, so a screen and a log always say which world they are. Merge to
`staging`, click through the app against real APIs with small budgets
(`FC_DAILY_BUDGET=50` etc.), then merge `staging` → `main`. A bad build costs
nothing and touches no lead Vin is calling.

## The knobs this build added

| setting | default | meaning |
|---|---|---|
| `FC_DAILY_BUDGET` | 1500 | Firecrawl credits per UTC day; 0 = off (loud) |
| `PLACES_DAILY_BUDGET` | 600 | Places calls per UTC day |
| `ANTHROPIC_DAILY_BUDGET_USD` | 20 | model dollars per UTC day |
| `APIFY_DAILY_BUDGET` | 150 | review pulls per UTC day |
| `FAKE_UPSTREAM` | unset | servercheck's test seam — NEVER set in production; fetchtest proves it inert when absent |
| `RENDER_ENV` | unset | shown by /healthz so staging and production cannot be confused |
| `DATAFORSEO_LOGIN` / `DATAFORSEO_PASSWORD` | unset | the REAL Google local pack. Without both, no lead gets a search position at all — see §52. About $0.60-2.40 per 1,000 against Places at $35 per 1,000 |
| `APIFY_MAX_REVIEWS` | 90 | reviews bought per lead. Apify bills per review, so this IS the Apify line |
| `REVIEW_CORPUS_CHARS` | 30000 | how many of them the pain miner actually reads. Raise the pull without raising this and you are paying for reviews no model sees — see §54 |
| `APIFY_ACTOR` | unset | override the Google-reviews actor (owner~name form, validated). The default actor is proven; a cheaper one (~half the per-review rate, −~$22 per 1k leads) is a flip Vin makes deliberately, and the log names which one ran — see §57 |
| `PAGESPEED_KEY` | unset | FREE from Google Cloud (enable the PageSpeed Insights API on the same project as `GOOGLE_PLACES_KEY`). Without it `slow_mobile` cannot fire on any lead, and it is the only rung measured from the prospect's own visitors. There is deliberately no Settings field — see §54 |

**Set the budgets to the PLAN, not the default.** The defaults (1500 Firecrawl
credits, 600 Places calls, $20 of model) are a runaway-day safety net sized for
paid tiers. On the free Firecrawl tier (500 credits ONE TIME) or inside the
Places free allowance (1,000 Enterprise calls a month), the default ceiling sits
ABOVE what the account can afford — the ledger will happily meter the account to
zero before the ceiling speaks. When the plan is small, set the ceiling small.

**The client handshake.** `CONTRACT_VERSION` (server.js) and `CLIENT_CONTRACT`
(index.html) are one number in two files, asserted EQUAL by clientcheck. Bump
both when a change needs the new client live; a stale Netlify page then shows a
banner naming both numbers instead of silently reintroducing fixed bugs.

