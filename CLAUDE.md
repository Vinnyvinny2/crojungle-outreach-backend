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
- 182 boot checks at the bottom, each documenting the live failure that caused it

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
182 boot checks green.

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

**Unproven against a live domain.** DNS is blocked from the build environment, so
the parsing is exercised and the lookup is stock Node that has never run here. The
boot check says so rather than implying it was tested.

**And a fifth self-matching needle.** The assertion guarding the resolver-failure
branch was written as a literal, sat in the check's own body, and passed on a
build with the guard removed. Assembled at runtime now. This trap has now been
recorded five times in one session.

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
node fuzzcore.js 20000                  # 11 gates, in-process
node fuzz.js 500                        # composes emails over HTTP
node pngscale.js --selftest             # 21 assertions on the screenshot scaler
#   This was NOT in the gate list for the life of the project, and nothing in
#   server.js ever executed fitWithin either — the only guard was a source regex
#   asserting the CALL SITE exists, which passed on the run that lost every
#   image on a lead. SCREENSHOT SCALER CHECK now runs the real function at boot.
PORT=4000 timeout 420 node --max-old-space-size=256 server.js   # 182 boot checks
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
and caused none of this week's failures. The 182 boot checks and the comments above
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
