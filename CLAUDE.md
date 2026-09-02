# CROJungle Outreach — everything you need to know

One file. Business context, how the system works, what is broken, what to do next,
and how to work here without breaking it. Read it all before touching anything.

---

# PART 1 — WHAT THIS IS FOR

## The business

CROJungle is a marketing and technology agency. Three founders: **Vin** (builds and
owns this system), **Mike Taft** (CEO, takes every sales call), **Muhammad Junaid**.

**What they sell** (corrected 2026-08-28 against the sales playbook itself — this
table listed only the premium tier and was out of date, and the affordability
floor is derived from it):

| Product | Price | Who sells it |
|---|---|---|
| High-end website | **$35k floor**, ~$70k typical, uncapped | Mike + staff |
| Revenue/marketing retainer | **$10k/mo floor**, excludes ad spend | Mike + staff |
| AI Brain | $40–70k | Mike + staff |
| Custom AI software | $40–100k+ | Mike + staff |
| Exit/valuation advisory | varies | Mike |
| Website, lower tier | from **$5k** | staff only |
| Landing page | **$1,600–2,000** | staff only |
| Retainer, lower tier | from **$3,250/mo**, ad spend included | staff only |

The lower tier's own rule is *"never packaged, never advertised, fine to close
when the fit is right"* — so it is an opportunistic close, not a targeting floor.
Mike takes nothing below premium; Vin and David take the lower tier.

The premium line is a five-figure engagement, and **this matters more than
anything else in this file** — a finding that leads to a $200 fix cannot become a
conversation about a $30k retainer, no matter how true it is.

**Not yet seen, and the affordability thresholds should be revisited when it
is:** the Dev Jungle (AI / software / integration) pricing sheet.

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
credits a day, 24,000 a month**. The free tier is **1,000 credits ONE TIME** (corrected
2026-08-28 against the account itself; this file said 500 for weeks), which is
about 62 complete audits, ever — not one fifty-lead day.

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

## 73. The batch learned to take orders, and the leads read stopped fighting the database — 2026-08-25

Vin, live on the board: *"it forces me to audit the leads like i cant select
which leads to run the 50 audits on it pre chooses."* He was right — the bulk
button took the top-scored waiting leads and the operator had no say.

**Every board row now carries a tick box, and a ticked set IS the batch.**
`batchCandidates` takes `pickedIds`: a non-empty set replaces the top-N pick
entirely (the pick is the limit), while eligibility still applies — a running,
not-a-fit or no-website lead cannot be bought into a run by ticking it, and a
ticked already-audited lead still needs the re-audit box, which is exactly how
a chosen re-run is supposed to happen. The panel says whose choice is running
("3 of your 5 ticked leads will run — the rest are..."), the button says
"Audit N ticked leads", a Clear-ticks button undoes the pick, and the ticks
are consumed by the run they start — a stale pick silently steering next
week's batch is the quiet-scope class the search box already had once. No
ticks means the old behaviour exactly, asserted by fixture. Executed in
`batchcheck` four ways and pinned at both call sites in `clientcheck`; three
falsifications, each red alone.

**And the leads read starts at 20 rows, down from 40.** Live the same day: a
40-row page hit the database's statement timeout (rows have grown a whole
audit heavier since §68 chose the size) and every boot burned a failed
statement before the halving ladder rescued it. The ladder is unchanged — it
is what turned that timeout into a slow load instead of a lost pipeline, and
Vin watched it do exactly that. The new start size is a tuning constant, not
a guarded mechanism; the ladder is the guard, and it is already fixtured.

**`index.html` changed, so this needs a Netlify deploy.**

---

## 74. The rank was blind to every surface above the map — 2026-08-26

Vin hand-checked three audits against live Google and every one carried a
false verdict about being found. Axiom Eco-Pest Control: our sheet said
*"Getting found: BROKEN — not in the results at all, we ran that search
twice"* while their ad held the **#2 slot in Google's Sponsored services
block** and their listing sat at **#26** in the businesses list. George Sink:
sponsored #2, our two positions both wrong, a live-chat popup our read never
saw, and a mobile layout he called terrible that no render had ever shown.
Bob Ray: #2 in the blue links under a Reddit thread, only the homepage read,
and two numbered leaks saying one thing. *"the biggest round of bugs weve
found hands down... fix all of this stuff at the root."* Eight recon agents
mapped the code before a line changed.

### The window, and the surfaces

- **The local finder asked for 20 rows of a 100-row surface.** `depth: 20`
  made #26 structurally invisible, and both stability samples ran the same
  window — so the miss CONFIRMED itself and became the strongest absence
  sentence in the system. Depth is 100 now (~$0.008 more per lead), and every
  absence sentence says the window: *"they are not among the 100 local
  listings that search returned"* — never "the whole list", which was false
  the moment the list was a 20-row window. The rung, the walk, the paying
  band, the client row and the RESTATED EVIDENCE fixtures all moved together.
- **The Sponsored services block (LSA) is read off the organic SERP we
  already buy** — the `local_services` item in the same DataForSEO response,
  $0 extra. POSITIVE-ONLY in both directions, because the block rotates by
  design (the same top two appear in the same order about one search in ten):
  our pull seeing their ad proves live spend; our pull not seeing it proves
  NOTHING and no sentence may say otherwise. An LSA advertiser can carry zero
  ad code on their site — the leads arrive inside Google's own call-and-
  message flow, never touching the website — which is exactly why every
  site-code read missed Axiom's spend.
- **`lsaUs` STANDS RUNGS DOWN rather than feeding them.**
  `paying_for_a_search_they_lose` cannot fire on a business winning the paid
  surface of that search, and `absent_from_search` cannot call INVISIBLE a
  business whose ad the searcher is looking at — the one-search-disproof
  class. The walk's found stage counts the paid door as being found
  (`strong.found`), money-out names the block, and the unpaid-ranking call
  stands down beside their own ad.
- **Google's AI answer** rides the same response (`load_async_ai_overview`,
  ~$0.002, auto-refunded when absent). Being cited is sayable — George Sink
  was source #5 — and NOT being cited never is, because the answer varies
  pull to pull. The walk says what stacks above the blue links; the signal
  rows carry both surfaces; and a **Check it yourself** row hands the caller
  the exact search we ran, because the page moves and the sheet is one pull.

### The chat widget and the phone render

- **The old chat test matched the bare words "intercom" and "drift"** — prose
  on a gate-repair site read as a live-chat product — and its verdict reached
  only prompts. `CHAT_SIGNATURES` is host-anchored (widget.intercom.io,
  embed.tawk.to, 27 products including the legal-vertical ones), lives in
  `AD_TAG_SIGNATURES` so the plain fetch, the rendered homepage and the
  interior harvest all read ONE list, and copy-back happened the day it was
  added — the AD WIRE lesson applied before the first live run. Chat evidence
  SUPPRESSES "the only way in their site offers is a phone call" (George
  Sink's popup, under an audit claiming form-and-wait was the only route) and
  never asserts a booking route: chat answers a question, it does not book a
  time. `liveChat` rides the facts strip and the door signal rows.
- **Every render this system had ever taken was a desktop page.** One extra
  Firecrawl credit buys the homepage as a phone shows it (`mobile: true`
  device emulation), asked only when the desktop read produced something. It
  joins the SAME `pageShots` list every consumer already reads — the brain's
  image loop (ranked just under the booking page), the screen's render strip
  and the export footer — so it needed no new contract field. HONEST SHAPE:
  the option has never been run against the live endpoint from this codebase;
  a refusal costs one credit and the audit continues without the phone view.

### The funnel stopped repeating itself

- **One leak number per claim family.** Bob Ray's leak 2 and leak 3 were both
  `booking === 'form'` wearing two rung ids. `RUNG_CLAIM_FAMILY` is declared,
  not derived — the RUNG_PILLAR discipline — and the numbering hands each
  family at most one of the three numbers; the duplicate stays an ordinary
  finding below. Executed on the Bob Ray shape, both directions.
- **`ads_untracked` moved found → door**: its claim is what a click BECOMES,
  and its signal row (What a click becomes) already rendered at the door —
  the red mark and the leak row sat at two different stages of one funnel.
- **The walk carries a `brief` beside every `text`** — only the sentences no
  signal row states (the top-three verdict, the paid-door reading, the
  unpaid-ranking call, the Facebook join, the capacity read, the financing
  absence). The client's funnel renders the brief; the story fallback keeps
  the full text; a lead audited before the field existed keeps its walk. And
  a stage with measured signal rows can no longer print "Nothing measured
  here" — the emptyNote finally looks at the rows above it.
- **The fix-order join was keyed on a regex over the sentence the same
  function had built three lines up**, and my own rewording killed it at boot
  — the two-hand-kept-copies disease in one hand. It reads the MEASUREMENTS
  now.

### The rest of the round

- **Tree care joined `RECURRING_NORMAL_TRADES`** (anchored forms — a bare
  `tree` would match "Palm Tree Motel"), so Bob Ray's 66-year tree service
  can finally carry the recurring-revenue finding. Fixtured both ways; the
  personal-injury stand-off is untouched.
- **The three silent nulls in `auditSitePages` got a voice.** "Only their
  homepage was read" on a many-page site could not be diagnosed from the log:
  missing inputs, an empty sitemap map and an all-filtered pick each name
  themselves now, with the downstream cost stated (no interior pages means
  the recurring read cannot run at all — its floor is two pages).
- **The rankNote's contact join names the surface** when their ad was seen
  live: Google's local-ads guidance weighs answer rate, and that guidance
  applies to a block they are demonstrably paying for today.
- **Chrome scraping, answered honestly:** a personal browser session cannot
  be the pipeline — personalised results, CAPTCHA, terms, and nothing
  automatable at fifty leads a day. DataForSEO now covers the surfaces a
  hand-check sees; the Check-it-yourself row covers the rest.

`LSA SURFACE CHECK` executes the parser on real response shapes, the walk
branches, both stand-downs in both directions, the rankNote join, the chat
suppression and the mobile wires; `clientcheck` executes the signal rows, the
scoped absence row, the chat row, the hand-check line and the brief
preference. **Eighteen falsifications — fourteen server, four client — each
red alone on a clean baseline.** The contract is 20260829 on both sides.

**And the falsification harness lied once before it proved anything.** The
first pass reported all eighteen red — against a baseline that was itself
RED: the contract-bump script had read server.js with Python's default
universal newlines and silently flattened all 64,887 CRLF endings to LF,
after the last green boot, and two CRLF-sensitive checks (BOOT WINDOW GATE,
SOURCE STORY) were red on every single run. A harness whose baseline is
already red proves reds too cheaply — a revert that did nothing would still
report RED. The tree was restored to CRLF (HEAD is pure CRLF, so the
conversion is exact), booted GREEN to prove the artifact theory, the harness
learned `newline=''` — the rule ed.py has carried all along — and the whole
pass was re-run on the clean baseline. Any script that touches server.js
outside ed.py is the CRLF trap waiting; this was the first time it fired
from inside the proving machinery itself.

**`index.html` changed, so this needs a Netlify deploy** — the surface rows,
the chat row, the hand-check line, the funnel dedupe and the scoped absence
wording are dark until the file lands, and a stale page says so by contract
number.

---

## 75. The funnel became the rows — 2026-08-26

Vin, approving the round-98 mock: *"i like option A but i dont like that its
a boxes its suppose to be a funnel"*, then the one rule that decided the
design: *"the size of the funnel needs to always fit the amount of text to
the right of it."*

**So there is no drawing to keep in sync any more.** The funnel segments and
the stage cards are the SAME grid rows: each tapered segment (a percentage
clip-path, so the taper scales with any height) stretches to the exact height
of its card, and the two can never disagree on any lead, because they are one
row. `funnelSvg` — a fixed 236x474 picture the content beside it outran two
to three times on every real lead — is deleted, along with the `sts` object
that fed it.

Three declarations, one copy each, both surfaces: `FUNNEL_TAPER` (each row's
bottom edge IS the next row's top edge, so the segments join into one
continuous funnel — the "boxes" complaint made structural), `funnelSegClip`
and `funnelSegFill` (red fill only where BROKEN; mixed fills as a working
stage and keeps its red drips; no_read is the faintest fill). The segment and
its card share ONE status string, so the label in the funnel and the label on
the card cannot drift — the same one-source rule as everything else here.
Drips render on broken and mixed rows, and the narrow "booked jobs" spout
closes the shape. Fix-first, the work strip and the reference tail render
full-width under the grid.

`clientcheck` executes the shape contract: row continuity (join and
narrowing), the clamp, red-only-broken fills, the rendered sheet's segments
and spout, and runtime-assembled call-site needles proving both surfaces clip
through the ONE builder. **Four falsifications, each red alone — and the
fourth caught its own first assertion being vacuous**: it looked for the
words "booked jobs", which `LAYER_PLAIN` prints on nearly every sheet as the
CONVERSION translation, so the spout could be deleted and the check stayed
green. It keys on the spout's own class now. The
fixture-that-measures-nothing trap, recorded once more, found only by
running the revert.

The contract is 20260830 on both sides. **`index.html` changed, so this
needs a Netlify deploy.** server.js changed only its contract number.

---

## 76. The search stood in the wrong country, and the pacing never reached production — 2026-08-26

Vin re-ran Bob Ray, Axiom and George Sink on the merged build and the ranking
piece was still dark on all three sheets — "no position on this run's source",
"Sponsored services block: none appeared", "read on the fallback source". His
overnight order: *"we need to know where they ranked for sponsored for places
and for businesses and where they rank seo wise... i cant have measurements
half measured... run like 5000 fake audits... i want to wake up tomorrow with
a system that is flawless."* Five recon agents mapped the code and the vendor's
own documentation before a line changed; every fix below was falsified alone.

### The search stood in the wrong country

Every live DataForSEO call localized to `location_code: 2840` — the whole
United States. A country-level results page carries **no Sponsored-services
block, no AI answer, and a differently-ordered list**, which is why three
hand-checked audits said "none appeared on our pull" while Vin's own browser
showed all three on every search. And the finder's 20-second timeout sat under
a depth-100 read that takes ~20-22s, so **every localized finder call died
with the money already spent** — DataForSEO's own guidance is a 120-second
client timeout.

The searcher this system simulates now stands where the customer stands:
`location_coordinate` from the business's own Google listing first (exact, no
dependence on their location database — the §59 failure), the full-state
`location_name` their database does hold second ("San Antonio,Texas,United
States", never an abbreviation), and country-level 2840 only as a LOUD last
resort. The two endpoints take DIFFERENT third components (the finder a zoom,
organic a radius), so the decision is ONE function both request bodies ask.
Timeouts are 75s, a timeout or empty body is retried once (a 40xxx account
error is not — it fails identically the second time), and the two stability
samples run CONCURRENTLY on the DFS path — the second look was bought either
way, and its request ignores coordinates, so parallel is the same money at
half the wall clock. The Places fallback keeps its sequential anchored shape,
because there the anchor IS the measurement discipline.

**The map pack rides the organic response, free.** The organic page's own
`local_pack` rows — title, domain, rating, paid flag — were reduced to one
boolean. They are a SECOND read of the map question now: their listing in the
pack stands down `absent_from_search` and the paying band (one-search
disproof through a source a failed finder read cannot take with it), reads as
a strength on the walk, and lands on the facts strip. POSITIVE-ONLY: absence
from a three-row pack is the normal case and is never consumed. The LSA slot
number travels too — "shown #2 on our pull (rotates)" — which is the
"where they ranked for sponsored" half of the ask, said with its bound.

**A whole state is not a market.** "pest control company in Colorado" shipped
live, harvested off a /service-areas/ slug. Both doors refuse a bare state
name now — with New York and Washington deliberately spared, because each is
also a real city and the size gate already recorded what a guard too tight
costs.

**And the localization's own first fixture caught a disaster before it ever
ran live.** `Number(null)` is 0, 0 is finite — so every coordinate-less lead
would have been localized to latitude 0, longitude 0: open ocean off West
Africa, measured as their market. The recorded null-laundering trap, written
by me the same night it was fixed elsewhere, caught at boot. auditfuzz then
found `Number([])` is ALSO 0, and then the single-zero case — the guard now
requires typeof number, finite, and neither component exactly 0.

**HONEST SHAPE: no localized call has run against the live endpoint** — the
account balance (~$0.79) blocks a live test tonight. The parser, the decision
and every wire are executed at boot; the morning run's grep is the
`LOCAL PACK` line, which now names its localization out loud.

### §50's pacing never reached production

The per-endpoint Firecrawl pacing was built in §50 and the wire was dead for
its whole life: **all eight call sites passed no kind**, every job queued as
'other', and every Firecrawl start in the process paced at the 7.5-second
unknown-plan default on ONE shared clock — about 105 seconds of pure spacing
per lead, the single largest cause of "the audits take forever". The fcSerial
comment even promised "the endpoint is read off the response's own URL" and
delivered it only to the limit LEARNING, never to the pacing. The boot checks
tested the gap arithmetic with kinds supplied and never the call sites' kind
argument: the recorded half-a-check, and instance twenty-five of
computed-but-not-passed.

`fcCall(url, opts, timeout)` derives the kind from the URL the caller already
types, so a call site written tomorrow cannot forget it; all eight sites go
through it and `SEARCH SLOT CHECK` refuses any hand-rolled wrapper — its own
first version's failure message contained the literal it hunts, the twelfth
recorded self-matching needle.

**And a search is not a browser.** `/v1/search` renders nothing, and it held
one of the gate's browser slots anyway — a twelve-credit owner-lookup wave
starved the page renders behind it. Search jobs keep the per-kind spacing and
the 429 hold (account facts) and skip only the slot, proven on the real gate:
a search dispatches past a full gate, a scrape cannot. **The phone render
left the critical path too** — it was serialized at the end of the homepage
read, one full paced transit added to every lead; it rides a promise now and
is collected where the shots are assembled, long after it has resolved.

### Four claim families from the same sheets

- **Distinct patterns never sum.** The miner reported four distinct
  two-mention patterns and the audit wrote "Four different customers describe
  the same experience" — the summed count attributed to ONE complaint.
  `stripPatternConflation` cuts a same-thing sentence whose count exceeds the
  largest SINGLE pattern, in both batteries; a true count and a
  single-pattern lead survive untouched. The prompts say DISTINCT out loud,
  and the critique flags the arithmetic — but instructional guards do not
  hold, so the stripper is the gate.
- **A tag is wiring; spend is a claim.** "The ad code is live... so they are
  paying to bring people to the door" shipped in a synthesis.
  `stripUnprovenAdSpend` cuts asserted active payment unless their ad was
  SEEN on our own pull (the one proof of live spend we can buy) or the
  sentence carries its own conditional — "if those ads are live" is the
  sanctioned form.
- **The THROUGHPUT bar needs one real pattern.** Bob Ray: three delivery
  patterns of two mentions each cleared every aggregate bar and bound "demand
  is not the problem, delivery is" — the sentence that tells Mike not to sell
  this business leads — off three pairs of bad days. The bar now also needs
  one pattern with three or more mentions, the same floor the email's own
  anchor carries.
- **The miner's label rode inside a quoted span.** A sheet printed `their own
  words: "Review quotes: 'Someone came in March...'"` — the label stripper
  knew only page labels, and the verifier returned the RAW evidence even
  though it had stripped the label for matching. The review-label family is
  in the stripper and both verifier exits return the stripped span.

Also from the same sheets: the critique learned that booking='form' means a
route EXISTS and nothing books a TIME — both true at once, and the false flag
that read them as a contradiction withdrew a correct email live; it also
gained a phone-on-site evidence line, because it once wrote "no evidence the
phone number exists on the site" beside a measured tap-to-call link. The
email caption "Pattern-built, not confirmed" no longer renders under an
address that does not exist. And "category:Services (1 in total: service)" is
gone: `service` is Google's generic API taxonomy leaking through, not a
category anybody picked, and it printed as a measurement on every trades lead.

### An untied name is a stranger

August Hoppe, live: the licence search for a Louisville tree company
extracted the owner of Hoppe Tree Service, MILWAUKEE — the prompt's
"must clearly refer to THIS business" rule was instructional only. The tie is
mechanical now: some hit line must carry the extracted surname AND a
distinctive word of OUR company's name, or the name is discarded. And the
eponymous settle was nearly unreachable — it demanded an independent-source
count its own collapse rule made impossible (own-site + business-name count
as ONE), and its 4-letter floor refused the 3-letter "Ray" of Bob Ray Co on a
whole-word match that never needed it. The business named after its owner now
settles the resolver without the ~8-credit paid wave; the domain half keeps
the 4-letter floor, because a domain substring has no word boundaries.

### The rest of the round

- **What already brings them traffic, named.** DataForSEO Labs'
  ranked-keywords read (~$0.011/lead, bought only when the domain is already
  known to be in the index) lands the top searches a domain ranks for on the
  found stage — INTERNAL, a third-party model, never an email.
- **A ticked audited lead IS the re-run intent.** Round 96 made it also need
  the re-audit checkbox and Vin hit exactly that wall ("it only lets me do
  one"). The checkbox still governs the no-picks flow; the panel prices
  re-runs. The batchcheck fixture that pinned the old rule was re-aimed, with
  the owner's decision recorded at it.
- **The situation-read effort is a setting** (`SITUATION_EFFORT`, default
  high per §65): the priciest call on the lead at ~$0.14 of ~$0.27, and the
  dial the owner can turn without a deploy.
- **`auditfuzz.js` is a new gate**: thousands of randomized measurement
  vectors through the real ladder, numbering, walk and facts strip. Its first
  run found two live bugs (the `Number([])` coordinate and the single-zero
  case) and one wrong invariant of its own — it flagged the round-97
  "absence beside the LSA block" sentence, which is a deliberate, coherent
  two-surface pair joined by "though"; only pack-beside-absence is a real
  contradiction, and the fuzzer's comment records that it was the fuzzer that
  was wrong. 5,000 vectors run in ci-gates on every push; 100,000 ran clean
  tonight. The plain-English gate also refused my own first pack sentence at
  boot ("map pack" is agency vocabulary) — the gates working on their author.

**Deliberately NOT done tonight** (the launch-sweep rule): parallelizing the
review mine against the rank read (~30-60s/lead, but it crosses shared
variables the night before bulk — documented open item), and the DFS Standard
task queue (70% cheaper per call at up to 5 minutes' latency; not worth the
rearchitecture against a $9/1k line).

### What the falsification runs found in the checks themselves

- **The localization needles pinned the DECISION and not the WIRE.** Reverting
  the request body's `..._loc.arg` spread back to `location_code: 2840` left
  the check GREEN, because the needle pinned the `const _loc =
  dfsLocalization(...)` line — which the revert left standing. Computed-but-
  not-passed, inside the very check built to catch it; the spread into each
  request body is pinned on its own now, and both reverts go red.
- **Five re-runs reported NO VERDICT before they reported anything** — the
  harness passed ports above 65535 (`43$RANDOM`), the §47 invalid-port trap
  fired from inside the proving machinery again, and the harness said NO
  VERDICT rather than a false colour, which is the honest failure. Re-run on
  fixed ports.
- **Three revert scripts could not reproduce their defect on the first try**:
  one expected a literal `\u2014` where the file holds a real em-dash, one
  broke the syntax by reverting a call's head without its tail (NO VERDICT,
  proves nothing), and one left the guard's regex standing behind an early
  return so the needle stayed green. Each rewritten until it reproduced the
  original defect — a falsification that does not reproduce is a missing
  case, not a pass.

**237 boot checks green.** Thirty-four falsifications — thirty-one server,
three client — each red alone on its named assertion. The contract is
20260831 on both sides. **`index.html` changed, so this needs a Netlify
deploy.**

---

## 77. Round 100 — every leak signal checked for truth, and the leaks that had no signal at all — 2026-08-26

Vin: *"Also make sure that we have all the correct and best find signals to
identify every possible leak within these business funnels. Take ur time on
this as well this is importnant."* Five recon agents mapped the ground first —
the complete rung-by-stage matrix, every paid response field we throw away, the
industry's own evidence-graded playbook, an adversarial pass on how each
existing signal can be WRONG, and the known-deferred list. What came back
sorted into two piles: signals that could put a FALSE sentence on a sheet, and
leaks no signal covered at all.

### The signals that could be wrong, fixed at the root

- **A site's own /book-now link counted as a vendor scheduler.** The relative
  URL shapes sat inside SCHEDULER_SIGNATURES, so the harvest logged "a
  scheduler signature is in the SOURCE" and the verdict said "a third-party
  scheduling tool is embedded" about a nav link — a checkable false statement.
  The shapes moved to BOOKING_ACTION_PATHS with the honest why ("the page
  links its own booking page"), and the vendor list gained the 2026 trade
  stack it was missing: GoHighLevel/LeadConnector booking (the most common CRM
  on home-service sites), Schedule Engine (its embed loads from
  js.scheduleengine.net — the word "servicetitan" never appears in that
  markup), OnceHub and Workiz. LeadConnector's webchat and Chatra joined the
  chat list the same way.
- **A WordPress comment form read as a contact route.** htmlHasRealForm judged
  the whole document, and an open-comments blog post carries textarea + name +
  email by construction — one such interior page set forms:true for the host
  and upgraded a true phone_only verdict. It judges PER FORM BLOCK now;
  comment forms and newsletter-only embeds are excluded by what they are.
- **"The money goes out blind" was never provable.** Google's own setup wizard
  puts the conversion EVENT snippet on the thank-you page alone — routinely
  noindex, unlinked, and therefore never read by us — so a correctly tracked
  account presents exactly the shape ads_untracked fired on. Same reasoning
  that made the GTM container a stand-down, missed on the sibling. Every
  renderer of the blind state now carries the conditional and hands the
  question to the one place that can answer it: "whether anything ties those
  clicks to jobs is a question only their ads account answers." The rung and
  its scoped say() survive; the false certainty does not.
- **An LSA-only advertiser read "Ads: none found".** The §74 Axiom label,
  still live in the facts strip: an LSA campaign needs zero site code by
  design. A new 'lsa_only' facts state says what is true — their pay-per-lead
  ad was SEEN on our pull, and that product runs through Google's own call
  flow. The plain 'no' is scoped to "no ad code on their pages" everywhere.
- **The two Google regexes disagreed on the AW id floor** (8 digits vs 6), so
  an older account's conversion label could sit in the markup beside
  "nothing for Google". One floor.
- **no_financing could not see a Financing page.** The unread-page guard
  matched /pricing|price|rates|fees|cost/ and a /financing/ URL matches none
  of those — the §59 defect reintroduced one URL-regex short. existsButUnread
  gained a financing entry and the rung rides it. BIG_TICKET stopped matching
  the cleaning trades ('window' caught "Window cleaning service"), the lender
  list gained EnerBank, Wisetack-peers Aqua Finance, Lyon Financial, Mosaic
  (anchored), PowerPay and HFS, and "Join the Comfort Club" finally reads as
  a recurring offer.
- **A homepage hero price was structurally invisible.** Published prices come
  from the interior-corpus extractor by design, so "$89 tune-up special" in
  the hero shipped under "no price anywhere on the pages we read" — disproved
  in one glance. A dollar figure in the homepage's own rendered text now
  SUPPRESSES the no-price family (rung, constraint and value equation, one
  rule at three call sites). Suppression only; the claim never widens.
- **Two vocabularies answered "is this a delivery complaint" and had
  diverged.** OPS_PAIN_WORDS was a strict subset of the bucket definitions —
  §57 and §67 widened the buckets for live misses and the copy never got the
  same words — so the leak ranking called a theme contact-shaped while the
  THROUGHPUT read counted zero operational themes: two verdicts about one
  string on one sheet, the §41 class. readOperationalPain reads the SAME
  bucket definitions now, plus the three ops-only words (paperwork, lost my,
  disorganiz) that deliberately never stage a theme as contact. The
  no_response bucket also learned the vernacular: ghosted, left us hanging,
  blew us off, never returns calls, no one picks up.
- **jQuery UI 1.13 read as 2016 code.** jQuery UI's current major is still
  1.x — released 2021-2024 and shipped by WordPress core today — and the
  oldjquery marker matched it, so a maintained site carried a dated-build
  marker. The ui alternative is gone; core jquery 1.x/2.x is the real signal.
  And the dated-credibility sentence may now name only VISIBLE markers: the
  visible-first sort used to put an invisible marker in slot 2 whenever
  exactly one visible marker existed, inside a customer-perception claim.
- **slow_mobile fired in Google's needs-improvement band.** The LCP finding
  pushed at 2.5s — where GOOD ends — while Google's own failing line is 4.0s,
  so a 2.6s site (better than half the web) carried a harm-83 rung under a
  caption reading "failed Google's thresholds". Only the poor band is a
  finding now; the middle survives as a note in the verdict. And the p75 is
  said honestly: "one phone visitor in four waits more than X seconds" — the
  typical visitor waits less, and he can read the same distribution on
  PageSpeed Insights.
- **"Too few visitors" was said about sites whose CrUX record existed one
  field over.** A URL with no page-level record often has an ORIGIN record;
  it is consulted now, with fieldScope recording which.
- **"Mobile Bay Roofing" in Mobile, Alabama narrowed to the mobile-roofer
  search** — the §30 failure rebuilt by the fix for it. A modifier that is a
  word of the city can never narrow; 'custom' narrows only the build trades
  ("Custom Plumbing Inc" is a name, not a specialty).
- **The marketplace guard was synonym-blind.** Trade "attorney" against
  returned categories "Law firm"/"Lawyer" shared no 4-character prefix, so
  the guard refused the whole rank read and killed outranked_by_weaker — the
  reply-proven rung — on a correct search. A small DECLARED synonym table
  (attorney/lawyer/law, dentist/dental, hvac/heating/cooling…) closes it; the
  parking-garage refusal still stands.
- **service_invisibility was structurally dead on Squarespace/GoHighLevel
  architectures**, which publish service pages at the ROOT. Root slugs that
  name a service (a declared vocabulary, 2-3 words, articles refused) count
  now.
- **absent_from_search on the Places fallback rested on the bias it was
  supposed to survive.** §52's rationale — the lookup BOOSTS name matches, so
  absence despite the boost is strong evidence — inverts exactly for a
  business whose name shares no word with the query ("A Team Services",
  garage doors). On the fallback source, harm 96 now additionally requires
  the name-token overlap that makes the rationale true; DataForSEO absences
  are untouched.
- **A 240-day-old JobPosting co-signed the capacity read.** Recruiting
  plugins leave JSON-LD in place for filled roles; a DATED posting past the
  rung's own 120-day window now drops the "hiring right now" flag while
  keeping its honest date, so every consumer can refuse for itself.
- **review_pain_pattern's pillar finally moved with its theme.** RUNG_PILLAR's
  own comment promised since §64 that a contact-shaped complaint would move
  to UNCAUGHT, and pillarForRung read the table flat — so the finding both
  real replies came from was always priced by ROTTING's cold-quote line. The
  move lives in buildProblemList's _pillarOf beside the workmanship→TAXED
  move, off the SAME classification the stage and the rank use.
- **Garage door, appliance repair and water heater joined
  RECURRING_NORMAL_TRADES** — trades where a maintenance plan is standard and
  §69's RETENTION layer could never bind.
- **Nine orphan fields, resolved by name.** rankOrderTrusted, the resolver's
  open24 copy, the unreadReviews forward, obsDays, adsStartedDays,
  scrapeTrustworthy, pageChars and siteVeryDated were computed and read by
  NOTHING — dead freight that reads as a wire. Deleted (open24 became ONE
  copy, the resolver's). The two dead literals reading
  _measured.copyrightYear — rescued only because the measureAbandonment
  spread sits later in the literal, one reorder from silently killing rungs 5
  and 7 — are deleted with the hazard documented at the spread. And the
  in-ranker LOCAL_ONLY branch now states its honest state: at the production
  call site the business model resolves AFTER the ladder runs, so the branch
  is defence for future call sites, exercised by fixtures, with the route's
  _kept filter as the real mechanism.

### The leaks that had NO signal

The rung inventory said it plainly: 48 rungs — 22 at the door, 17 at
getting-found, 7 internal review metrics, and TWO at after-contact, the stage
that wins leak #1 by depth. And whole leak classes fired nothing:

- **buried_in_results (harm 71, INVISIBLE, found).** A trusted #7 with no
  weaker rival above fired NO rung at all — the walk printed the digit and the
  ladder could not number the fact. Bands, never digits (§52), trusted source
  only, standing down for the pack, the paid door, and outranked_by_weaker's
  sharper version of the same fact.
- **unclaimed_listing (harm 87, INVISIBLE, found).** The DFS finder row we
  already buy carries is_claimed, and an unclaimed listing cannot answer
  reviews, fix its hours, or refuse a stranger's edits — Google prints "Claim
  this business" on it, so the owner checks it in one look. Fires only on an
  IDENTITY-matched row (placeId or domain — a name-guess licensing this would
  be §19 at a stranger's listing) with an explicit boolean false. HONEST
  SHAPE: the field has never been read from the live endpoint by this
  codebase; an absent field is null and null licenses nothing.
- **campaign_page_dead (harm 78, LEAKING, door).** The campaign-shaped
  unlinked pages were counted, named, and never OPENED — so an ad landing
  page that died was indistinguishable from one that works. A plain status
  probe (fetchT, never Firecrawl — Firecrawl bills a 404 as a fetch) opens up
  to four of them; only a page answering 404 or 410 to TWO probes counts,
  because a 403 is routinely a bot wall in front of a healthy page. Its first
  wording said "landing page" and "sitemap" and PLAIN ENGLISH CHECK refused
  the boot — the gate doing its job on my own words, again.
- **Owner reply LATENCY.** responseFromOwnerDate was in every Apify row and
  dropped at normalize — the one after-contact measurement this system can
  take without ever contacting the business. Median days between a review and
  its reply, three measurable pairs or nothing, over the same mined set as
  every other count. INTERNAL, like everything review-derived. The
  whole-profile star histogram (reviewsDistribution) rides the same rows.
- **The §28 checklist six were consumed by NOTHING.** submitOnlyButton,
  wrongKeyboardFields, multiStepForm, proofOnlyInFooter, sharedInboxOnly and
  firstFoldCtaKinds — measured off CROJungle's own published Autopsy and
  Ledger, boot-checked, and read by no rung, no prompt line, no facts chip,
  and zero client renders. The recorded computed-but-not-passed class applied
  to an entire feature. They reach the audit prompt's SITE REVENUE SIGNALS
  block and the facts strip now (tri-state, so an unread page never renders
  clean), and the multi-step signal SOFTENS the long-form line — a stepped
  form is the fix, not the fault.
- **"Is anything measuring the site at all."** Distinct from the ads question:
  a site with no GA4, no pixel, no counter of any kind means no dashboard
  anywhere can tell the owner how many people came last month. One signature
  beside its siblings in AD_TAG_SIGNATURES, copied back the same day (the AD
  WIRE lesson), internal.
- **The benchmark rows the after-contact stage could never cite.**
  five_minutes and response_42h have been declared in REVENUE_BENCHMARKS
  since §52 and read by nothing. On a lead whose own mined theme is
  contact-shaped, the call sheet now gets both industry rows — each a segment
  fact with its source and year, structurally unable to mention him.
- **Google's own reviewSummary was a dead field in a billed call** — in the
  Place Details mask, parsed by nothing. Consumed now (internal), alongside
  three more free fields on the same call: utcOffsetMinutes (the calling
  window in THEIR timezone), the authoritative city off addressComponents,
  and pureServiceAreaBusiness (the one listing shape the duplicate-listing
  address match can never work on).
- **The People-Also-Ask questions and the advertisers whose ads were SERVED
  on the search** both ride the organic SERP response we already buy and were
  thrown away. Both positive-only, both internal: the questions customers
  actually type, and who is paying for the click.
- **The finder row's total_photos** finally answers the photo question past
  the Places API's 10-photo cap (§53) — identity-matched rows only.

### Deliberately NOT built, and why

- **The mystery-shop lead-response test.** The entire top-evidence tier of the
  industry's own playbook — speed-to-lead, missed calls, follow-up cadence —
  is measured by submitting a real enquiry and clocking what happens. It is
  the single biggest gap left, and it CONTACTS the business, which is not a
  decision this system gets to make on its own. Flagged to Vin as a
  recommendation, not a build.
- **GBP posts, Q&A and photo recency** need a profile-scraping actor — new
  spend, and "if anything it needs to get cheaper" stands.
- **Per-service ORGANIC positions (intent_mismatch)** stay deferred: the
  map-side service read — revived this round for root-slug architectures —
  covers the sellable claim, and the organic nuance costs ~1¢/lead for an
  internal-only distinction.
- **Firecrawl's metadata.statusCode** stays unconsumed for now: the
  duplicate-page fingerprint already catches the redirect-to-homepage harm,
  and a captured-but-consumed-by-nothing field is the disease, not a feature.
- **Message-match as a mechanical signal**: we cannot read their ad copy with
  Transparency off, so there is no substrate; the model's copy quotes already
  surface it.
- **No harm renumbering, no rung reordering** beyond the declared pillar move:
  PART 6's rule holds — no tuning until real replies exist to tune against.

### What the round's own guards caught while it was being built

- **The gates caught my own new rung twice.** PLAIN ENGLISH CHECK refused
  campaign_page_dead for "landing page" and "sitemap"; RUNG PHRASE CHECK
  refused it again for repeating "built to receive ad clicks" across its own
  sentences. Both rewritten; both checks were doing exactly their jobs.
- **The five new response fields landed in the WRONG LITERAL first** — inside
  scoreReachability's arguments instead of res.json, where they would have
  been computed and never returned. clientcheck's executable contract named
  all five the moment they reached the real response object and the merge did
  not carry them. The check built in §18 caught the §18 disease, mid-build.
- **My own P5 edit script died half-applied and the fixture caught it.** The
  first site-age script failed on a byte mismatch AFTER the jQuery and
  visible-naming fixes were staged; the atomic save dropped both, the rerun
  carried only the speed half, and the new dated-say fixture went RED on the
  very next boot naming the missing slice. A fixture written the same hour it
  was needed.
- **SITE AGE CHECK then went red on a fixture that predated the visible-count
  contract** — its say() fixture passed markers with no count, which the new
  slice correctly reads as "name nothing". The fixture now carries the count
  the production wire always carries.

### What the falsification runs found in the checks themselves

- **The ops-vocabulary revert came back STILL GREEN**, and the reason is the
  recorded half-a-check trap, committed by me in the same session that fixed
  it elsewhere: the new phrasings ("unresponsive", "never heard back") were
  fixtured on the PREDICATE alone, while every function-level fixture used
  phrasings BOTH vocabularies match — so reverting readOperationalPain's
  call site to the old narrow list left every fixture green while the sheet
  went back to two verdicts about one string. The guard now runs three
  new-vocabulary complaints through the full function and counts the themes;
  the re-run went red on exactly that assertion.
- **One revert script died on a needle written from design notes instead of
  live bytes** — the real function carries two comment lines the notes did
  not. A failed revert proves nothing about the guard; rewritten from a byte
  probe of the live source and re-run red.

**240 boot checks green.** 39 server falsifications and 3 client
falsifications, each reverted alone and each red on its named assertion —
the one mechanism-free change (deleting two dead literals) has no
falsification, because there is no behaviour to revert. The full gate suite
green. The contract is 20260901 on both sides.

**`index.html` changed, so this needs a Netlify deploy** — the LSA-aware ads
label, the checklist and analytics rows, the reply-latency and
customer-questions notes, and the five new merge fields are dark until the
file lands, and a stale page says so by contract number.

---

## 78. Three hand-checked leads, and the search stood in the wrong place twice — 2026-08-26

Vin ran TriStar Concrete, Windows Plus and Burbank Electric, hand-checked every
ranking claim against live Google, and sent the sheets, four site PDFs and the
whole Render log: *"i mean this is just completley wrong wtf is this... fix
every single thing im outting u on ultracode... i dont want you to comeback
until everyhtign is addressed and fixed at a high levekl hoineslty."* Eight
recon agents mapped the code behind each symptom before a line changed; the
industry sources were read before the localization decision was reversed.

### Burbank read #1 of 100 while a person in Jacksonville finds them ~#15

§76 stood every DataForSEO search at the business's own coordinates, on the
argument that the customer stands where the business is. Burbank proved the
argument wrong at its edge: their registered address is Fernandina Beach, 30+
miles from the Jacksonville they sell into, so "electrician in Jacksonville,
FL" measured from THEIR OFFICE made them the closest electrician to
themselves — #1 — and both stability samples shared the standpoint, so the
second look CONFIRMED the bias (the §74 window class again: a systematic error
agreeing with itself). The industry's own rank-tracking guidance says it
plainly: checking rankings from the business's own address is a documented
inflated read; the city-level location name is the neutral "searcher in this
market" standpoint.

So `dfsLocalization` stands in the CITY first ("Jacksonville,Florida,United
States" — their database wants the full state name, §59), the business's
coordinates are the DECLARED fallback taken on a 40501 in BOTH fetch loops (a
fallback nobody swaps to is a comment), and country-level 2840 stays the loud
last resort. The sponsored block and the AI answer are location-sensitive too,
which is why Vin saw sponsored electricians on every hand search while our
Fernandina standpoint saw none. HONEST SHAPE: the city-name-first read has
never run against the live endpoint — the account balance blocked a live test
— and the first credentialed run is its proof.

### The lead's rank was a bathroom query, and the sheet went to war with itself

Windows Plus is #2 for "window replacement contractor in Louisville, KY" — the
trade it is NAMED after — and the sheet said *"Search, map: not among the 100
listings returned (checked twice)"*, because §47's pickRankRow PROMOTES an
absent service-page row for the email spine, and the promoted row ALSO became
the lead's `m.rank`. Two queries, one variable. The map-pack row beside it,
measured on the head query, said #2 — Vin: *"the entire getting found section
is just not accurate... constantly goes against itself."*

Split at the root: `headRankRowFrom` makes the primary-trade row the lead's
rank identity everywhere, always; pickRankRow keeps ONLY its email job (the
sharpest OUTRANKED evidence among FOUND rows — the John P. Goodman case), and
its absent-service promotion is DELETED. The outranked evidence travels as its
own row (`outrankRow`) with `outrankedQuery` naming the search its numbers
came from, and a confirmed single service absence travels by name through
`service_invisibility`'s new single-confirmed branch — the finding is real and
keeps its query, it just can never again be "their rank". And every search row
on the sheet now NAMES ITS QUERY, with per-query rows for their own service
pages, because two rows about two searches with neither named is a
contradiction to any reader. `PRIMARY TRADE RANK CHECK` executes the Windows
shape end to end.

### TriStar's whole search surface died on a city parse

`LOCAL RANK: skipped — no city could be parsed from the location` — while the
same run held Nashville THREE ways, including the `gbpCity` §77 had just added.
Computed-but-not-passed again: the location chain took the first truthy string
and validated nothing. `rankLocationFrom` now walks lead location → their own
Google record (gbpCity + the new gbpState) → formattedAddress, keeping the
first candidate that actually parses to a city and is not a bare state name.
Vin's ruling on the class: *"this is the most importnant out of eveyrhting...
we NEED to measure this."*

### A 403 block page shipped as "their homepage"

Burbank's homepage render was literally *"403: Access Forbidden — Your
location (NO) has been disallowed"* — a geo-block served to a non-US egress —
and it shipped as their homepage: the vision model read it, the score graded
it, the sheet displayed it. Three layers now, each falsified: the scrape
quarantines on the HTTP status Firecrawl already returns
(`metadata.statusCode`, consumed by nothing until today) plus a widened
block-page vocabulary; every render request carries `location: country US` so
the page we photograph is the page a US customer sees; and the vision model is
asked `looksBlockedOrError` — when the eyes say the image is not a business
homepage, the render leaves the sheet, the brain's evidence and every visual
conclusion at once, and the sheet says WHY there is no picture
(`renderRefused`) instead of pretending none was taken. A quarantined render
grades NO first-screen component — the denominator shrinks, the reason is
named. `RENDER QUARANTINE CHECK`.

### The leak order, ruled on by the owner three times in one message

TriStar's callback complaints sat at leak 3 under two form findings ("leak 3
is the biggets leak ever"); Burbank's quote-delay complaint sat at leak 2
under the ads finding ("def the number 1 leak... money literally going out
the door... withotu a question"); Windows' no-shows he was ambivalent about.
The §67 anchor floor (three mentions) was holding them down. The distinction
his three calls draw, now encoded: a written complaint about RESPONSE TO
MONEY IN HAND (the no-response and quote-delay buckets) anchors at TWO
distinct mentions; scheduling keeps three; workmanship still never numbers.
And "nobody responds" — the live TriStar phrasing — matched NO bucket at all
(the vocabulary had no respond-verb stems), so the complaint he called the
biggest leak ever was classified as nothing. Both fixed through the one
shared derivation, fixtured on the live phrasings.

### "Generic market positioning stuff that couldn't be farther from the truth"

When no layer measured as binding, the constraint stamped MARKET and appended
a positioning essay — printed on two of his three sheets. A layer named while
the diagnosis disclaims one is a contradiction wearing a heading. NONE is a
real state now: no layer label renders, and the one-thing defers to the
numbered leaks by name ("the numbered leaks ARE the diagnosis, and leak 1
is..."). No positioning prose without positioning evidence.

### "How tf did we give this a 9/10"

scoreWebsite graded build mechanics, so a form-and-wait conversion disaster
scored 9/10 under the caption "the build is fine". V2: the booking route is
the heaviest component (3 of 10 gradeable points — the depth ordering's own
rule that the door is where the money dies), the first screen is graded by
the eyes that actually looked (and never off a blocked or mid-load render),
price and proof placement join measured-only, and NO build scores above 7.5
while its door cannot book a time — the cap names itself, and the caption
reads "built cleanly, but nothing on it books a time — the door caps the
grade". Unmeasured still leaves the denominator.

### "We need to know 100% they are running ads"

The code-assembled money lines asserted spend as fact off a tag — "They pay
for every click" is literally the class stripUnprovenAdSpend cuts from MODEL
prose, and these sentences were assembled past it. One rule now, at the one
place the lines are built: a sponsored row or their LSA ad seen on OUR OWN
pull licenses the flat form; a tag alone gets "If those ads are live..." —
which is also the honest call opener, because it asks him something only he
knows. The whole rung family (reframe, costs, bottleneck paragraphs) carries
the same tense discipline, ONE adsLive predicate (pack row OR LSA sighting)
feeds the facts strip, the leak evidence and the walk, and the sheet ships a
ten-second hand-check: adstransparency.google.com, search the business name —
the one public place a human can confirm live ads.

### The door rows, simplified to Vin's list

The chat row renders only when a chat product was FOUND; the price row reads
the server's four honest states (shown / none measured / a pricing page
exists that we did not open / never measured) — and the picker can no longer
LEAVE a pricing page unread: money words match anywhere in the slug
(/concrete-pricing, /driveway-cost — the money word trails the trade word by
convention), the vocabulary knows financing, cost and fees, and the
leadership position rule is untouched. "What a click becomes" says it in
plain words. And Burbank's emergency contradiction — pages selling 24/7
emergency work over a "schedule a walkthrough" door — is measured
(`emergencyMismatch`, from their own copy plus the measured booking route,
phone-only deliberately NOT a mismatch) and rendered as an INTERNAL row:
a question for the call, never a claim to him.

### The service-area query noise

"Bagdad, KY" (pop ~200) was harvested from a slug list that included
"Scottsburg In Bathroom" — the "-in-" = Indiana trap — burned two DFS calls
on 40501 and printed a Places absence row. The state hiding mid-slug is
parsed after the trade strip now, the service-area read is DFS-only
(`noPlacesFallback` — a Places answer about a village is relevance noise
sold as a market), and a 40501 skips rather than falling through.

### What the falsification runs found in the checks themselves

Forty-five falsifications — thirty-seven server, eight client — each reverted
alone. Three found defects in the checks, not the code: the pricing-vocabulary
fixture supplied its own regex copy (the recorded half-a-check, caught at
design time — a needle now pins the real PAGE_INTENTS row); the red-mark
assertion on the confirmed service absence was wrong about the §69 rule (red
requires the rung to have FIRED — the fixture now carries it); and the first
TriStar city fixture used an invented input the parser legitimately accepts —
rewritten to the recorded live shape (an EMPTY lead location), with the
parser's comma-less-prose looseness documented rather than papered over. The
7.5 cap also masked any booking-weight revert in every whole-score fixture,
so the weight is asserted on the graded component itself. And the round-99
RANK LOCALIZATION ✓ message still described the coords-first order a full
round after the order reversed — a stale claim in the check's own mouth,
reworded.

**243 boot checks green.** The contract is 20260902 on both sides.

**`index.html` changed, so this needs a Netlify deploy** — the query-named
rows, the four-state price row, the ads hand-check, the renderRefused note
and the capped-score caption are dark until the file lands.

---

## 79. Round 102 — the website read, rebuilt across all four axes — 2026-08-26

Vin: *"we need the rating and the findings on the websites to always be
accurate so we can always curtly identify if a website is bad or good design
wise booking clients wise backend code wise the code set up for seo wise every
aspect of the website... fix at the root and build from the ground up."* Seven
recon agents mapped the four axes before a line changed, the industry's own
evidence was read before the SEO axis was designed, and 44 falsifications ran
— each red alone.

### Booking clients: the label decided, and now the link decides

`measureBookingPath`'s first branch turned any book/schedule LABEL into
`online_booking` before a shred of evidence ran — so "Request an Appointment"
over a plain 9-field contact form graded 3/3 on the score's heaviest
component, lifted the 7.5 cap, and silenced both door rungs: the false GOOD,
on exactly the leads those rungs exist for. A label is INTENT now and only the
LINK URL decides — a known scheduler URL, the site's own /book-now page, or an
offsite address that itself says booking. Everything else falls through to the
form and phone evidence, and the label travels as `bookingLabelSeen` for the
call sheet. Bare `\bbook\b` is gone ("Guest Book" read as a booking route).

- **A LINKED scheduler is probed**: a URL answering 404/410 TWICE is removed
  from the read (the campaign_page_dead discipline) — a dead Calendly whose
  trial ended is not a booking route however its address reads.
- **A password form is a login portal**, never a contact route; a careers
  page's application fields are not a customer route in; an `sms:` link is a
  capture route (suppression only, never a booking claim); and `visiblePhone`
  — asked of the vision model since it was written and consumed by NOTHING
  (instance twenty-three) — now corrects `none_found` to `phone_only`, so
  "no route in at all" is withdrawn about a number the render plainly shows.
  `unreadBooking` finally gates the walk's "only way in" sentence too.
- **The rendered DOM joins every scrape.** Firecrawl's own docs: `rawHtml` is
  the server's HTML BEFORE JavaScript ran; `html` is the rendered DOM. Every
  DOM-shaped read (forms, iframes, booking widgets) was running on markup a
  site-builder page had not built yet. Same page, same credit — Firecrawl
  bills per page. Script signatures stay on rawHtml, where the tags are.
  HONEST SHAPE: the `html` format has never been watched succeed live, so the
  request carries a runtime fallback — a 400 drops it and re-asks on the
  proven pair — and `HOMEPAGE REQUEST CHECK` admits the new shape ONLY
  because that fallback exists.

### The /10: no flattering number survives a thin read

- **`siteAgeScore` was delivered ungated** while `readSiteAge`'s unchecked
  return is `score: 0` — `Number.isFinite(0)` passed, so an UNREAD page
  graded 1.5/1.5 "modern build". The recorded null-laundering class, live.
  Delivered null unless checked, and the wrong-company discard now blanks the
  age read's input, so a franchisor's markup cannot grade the lead's build.
- **THE FLOOR: under five graded components there is no /10 at all** —
  `checked: false, thin: true`, the count named. Two components used to
  multiply out to a confident 10/10 on precisely the lead where the least was
  known (a blocked site, a ladder crash). The screen and the sheet both say
  "site build not graded — N of M components measured".
- **The vision grader ran at temperature 1.0 its whole life** — the API
  default, the exact class §6 fixed on the writer, on a call that GRADES.
  Pinned at 0.2, its booleans coerced ("true"-as-string silently dropped the
  component), and `pageFullyLoaded === true` required — an omitted field used
  to walk a mid-load shot past the gate. A null viewport leaves the
  denominator instead of passing; a 10-field form split into steps scores as
  the checklist's own PASS case.
- **A promo dollar is not a price.** "$0 down", "Save $500" and "$2M insured"
  no longer read as published pricing; "$89 tune-up special" still does.
- **Proof position is measured over VISIBLE text** — a JSON-LD review block
  in the head used to read as "proof before the footer". And the new check's
  FIRST RUN caught a live bug nobody had reported: `_proofRe` held
  `testimonial\b` and `review\b` — the §15 stem trap — so "Testimonials" and
  "Reviews", the two most common proof headings on real pages, matched
  NOTHING, and the proof-position read was dark on most sites that actually
  have proof. Plural-aware now, with the fixture that found it.

### Design markers: the adversarial pass on our own checklist

Every §28 signal had a way to fire on a page that got it RIGHT: a hidden CRM
prefill named "email" counted as a wrong-keyboard field AND as a Submit-only
button, "Step 1 of 3" in how-it-works prose read as a stepped form, three nav
links counted as competing first-fold asks, a plain-text named address was
invisible to the shared-inbox read (mailto-only), a PDF embed fired "it still
has Flash on it", `data-width=` fired "cannot fit a phone" on a responsive
build, ONE pasted rate table read as a table-layout build (tables and pre-CSS
markers need two hits now — content is not the build), and a maintenance
pitch arguing AGAINST emergencies read as selling emergency work. All fixed
in both directions. And Wix/Squarespace measure traffic natively with no tag
in the markup, so the analytics-absence claim is barred on builder platforms
(`builderNativeAnalytics`, read from the platform's own asset hosts).

### The SEO axis, measured for the first time — and bounded

"The code set up for SEO wise" was four booleans in a prompt line.
`readSeoSignals` now reads the homepage source: a robots noindex in either
attribute order; JSON-LD schema CLASSIFIED — a typed block carrying an
address or phone is the business schema, builder-injected
WebSite/Organization is the boilerplate it is (Wix and Squarespace auto-inject
it, so bare presence proves nothing); the title checked for the default and
for the trade STEM and city (the §15 discipline — 'roofer' finds "Roofing");
the canonical; image alt coverage; and the sitemap's own lastmod dates —
STALENESS-only, because plugins regenerate lastmod on every deploy so a fresh
date proves nothing, and under three dated entries nothing is claimed at all.

**The bound, from the industry's own studies: on-page is ~15% of local-pack
weight, so nothing here is EVER sold as the reason for a map position** — the
sheet's own row says so. The one sendable finding is **`site_noindexed`**
(harm 92, INVISIBLE): a robots noindex is a kill switch, not a ranking factor
— Google is TOLD to skip the page and obeys — checkable by whoever runs the
site in one look, and it fires only with the page actually read. Everything
else lands as internal context on the found stage and in the audit prompt.

HONEST SHAPE: the sitemap fetch, the `html` format and `site_noindexed` have
not yet fired on a live lead — the first live run after this merge is their
proof.

### What the falsification runs found in the checks themselves

44 reverts — 38 server, 6 client — each red alone. sf16's first run came back
STILL GREEN: the vision-temperature needle was written as one literal and
found ITSELF in the check's own source — the thirteenth recorded instance of
the self-matching needle, caught by the falsification run doing exactly its
job, and split into two real halves. The unread-rung revert went red on
LADDER SURVIVAL rather than its named fixture — the guard family caught it,
the accepted §65 outcome. And the first fixture pads were stubs
`extractHtmlSignals` rightly refused (under 15 tags reads as an error page by
design), which is the function's own honesty gate refusing a dishonest test.

**247 boot checks green.** The contract is 20260903 on both sides.

**`index.html` changed, so this needs a Netlify deploy** — the Search setup
rows, the installed-not-answered chat wording, the not-graded caption and the
seoSignals persistence are dark until the file lands, and a stale page says
so by contract number.

---

## 80. The finds were never deleted. Their only rendering was. — 2026-08-26

Vin: *"I remember the audits would state code and behind design of websites. I
haven't seen that in recent audits since I complained not being able to
understand it. I feel it was cut from the audits. This was very strong, just
needed it in simple terms to understand. The audits spoke about bad code,
websites not being set up well for seo, code being built prior to smart phones
etc. It was great finds."*

He was right, and the cause is a NEW SHAPE of the class this file records more
than any other. The usual shape is computed-but-not-passed: a value never
reaches its consumer. This one looks healthy at every wire. `readSiteAge`
measures eleven markers and writes each as a finished plain sentence ("the
copyright line at the bottom still reads 2014", "the code behind the page is
the kind used before smartphones existed"). The value is delivered, persisted,
and survives a reload. What was deleted was the only place a person could READ
it: §71 correctly made the customer-credibility CLAIM require a marker a
customer can see, and `buildAuditFacts` passed only the COUNT. So the sheet
said *"3 old-build markers in the source"* — jargon, unverifiable, the exact
opposite of the translation he asked for — while three finished sentences sat
in memory. **A count IS a render, so nothing downstream could tell.**

The words travel again, with the honest scope on a code-only build ("all in the
page code — a visitor never sees these; it is the build that is dated"). The
CLAIM stays gated on visible markers; the FINDING does not.

### Every fact must have a home

The root fix is not the age markers. `FACTS_RENDER` declares, for every key the
facts strip returns, either `client` (a person reads it), `derived: <sibling>`
(another key carries it, named), or `internal: <reason>`. `FACTS COVERAGE
CHECK` executes `buildAuditFacts` and fails the boot on a key with no home;
`FACTS RENDER CHECK` in clientcheck — the only file that can see both sides —
fails when a key marked `client` is read by nothing in index.html, and when a
held-back key's reason is not a reason. A field can still be dropped from the
sheet, but only by a person writing down that they meant to. **The table's own
first boot caught a key missing from its first draft.**

### Two live truth bugs found on the way, both worse than the render gap

- **The review count in "what is working for them" could belong to another
  business.** §44 settled that a review COUNT comes from Place Details on the
  exact place id, never the rank-search row (matched on placeId, else domain,
  else an exact NAME). §56 found two more raw call sites and fixed them. THREE
  were still raw, all running before `resolveMeasurements` and so unable to
  read the resolved figure — and the worst was `measureValueEquation`, whose
  numerator reaches the audit brief under *"WHAT IS WORKING FOR THEM (do NOT
  call these problems)"* and the fact-checker under *"do NOT flag these as
  unverified"*. The one gate that would catch a wrong number is explicitly told
  to stand down on it, and `likelihood` and `earnedButBlocked` are scored off
  it — so a name-matched row changed the STORY, not just a figure. The rule is
  `reviewFigureAuthority` now, called by all five sites including
  resolveMeasurements, because five hand-kept copies is how the fifth stays
  wrong.
- **The buying-authority floor was bypassed on one arm.** §41 removed the
  `|| 'Owner'` default and built the held-back path INSIDE the resolver arm.
  The cache-hit arm one branch above kept the old behaviour, so a contact
  cached within 60 days was promoted to verifiedCEO with the word "Owner"
  invented for a row with no title — the exact live sheet §41 exists to stop,
  shipping on every re-research of a cached lead. A row cached before §41
  carries no `canBuy`, so an absent verdict is re-derived through the same
  `authorityScore` the resolver uses.

### And the one mechanism that produces evidence could never write a row

`recordCallOutcome` stamped `crypto.randomUUID()` into `id` — a column declared
`id bigserial primary key`. Postgres refuses a UUID string for a bigint (22P02),
PostgREST answers 400, `sbRest` returns null on any non-ok response, and the
grey ⛔ line printed on every press. **Every call outcome ever logged was
discarded, and `/api/call-outcomes` has always answered zero.** §35 calls this
capture *"the lever, and it is the only one that is not inference"* — the single
mechanism in this project that produces evidence rather than the system grading
its own homework. The two siblings written the same week (`writeObservation`,
the send_log write) both omit the id and let the sequence assign it; this was
the odd one out. The id is gone, and the row shape is now a pure function
(`buildCallOutcomeRow`) the boot check EXECUTES — it never could before, which
is exactly why a defect in the shape survived: every assertion exercised the
REPORT over hand-made rows, and a report can only be right about rows that
exist.

### A milestone is not a state

§70's follow-along setter wrote into `job.phase` — the field the kill clock,
the stale sweeper and the concurrency counter all read as a STATE ENUM. From
the first milestone onward that enum held prose, so every consumer comparing it
to a state was comparing against a sentence. The milestone has its own field;
the status route still hands it outward under the name the client reads, so
nothing on the wire changed.

### The rest of the dark measurements, now in words

- **The SECONDS, not the adjective.** Google's CrUX field data — the only
  measurement in this system taken from the prospect's own customers — was
  collapsed to `slow`/`fine`. The row now states the p75 wait, and the band
  travels from the server so the sheet never holds a second copy of Google's
  2.5/4.0 thresholds. It also carries WHICH metric failed, so a good load time
  beside a failing layout shift can never print a strength above the numbered
  leak that says otherwise.
- **The booking LABEL over a door that cannot book.** Measured on every branch
  in §79 "for the call sheet" and delivered nowhere. Only the contradiction
  earns a row.
- **The SEO bands were measured and invisible except at their extremes** — a
  title naming the trade but not the city, two of forty images, a sitemap eight
  months cold. All three render now, and a site with all three in order is
  still given no fault, because a row that flags every site tells a caller
  nothing.
- **The calling window says the hours are THEIRS.** §77 bought
  `utcOffsetMinutes` for exactly this and never delivered it, so a caller three
  zones away read "opens around 8am" as his own clock. Stated as a difference
  from the caller's clock, never as a named zone, and silent when no offset was
  measured.
- **A hidden address is not an absent duplicate.** A pure service-area listing
  hides its street address on Google by design, so the address half of the
  duplicate proof standard can never be satisfied — and "no duplicate found"
  was reporting our own blindness as a fact about their listings.
- **Google's own review summary and the listing's other categories** reach the
  story and the fact-checker as INTERNAL lines. Both were bought in the billed
  Place Details mask and parsed by nothing.
- **The first h1 was not the first h1.** `[\s\S]{0,200}?` does not safely yield
  '' on a long heading: `String.match` advances on a failed attempt, so a first
  h1 running past 200 characters was SKIPPED and the SECOND h1 came back as the
  headline — silently, and most often on builder pages that wrap an h1 around a
  whole hero block. Proven by execution, not by reading.

### Two neutered guards

`NICHE BRIEF CHECK`'s structural wall sliced a fixed 6,000 characters of each
function it polices; those functions run to 3,000, 7,600 and 9,700, so a niche
read in the TAIL of two of them sat outside everything the loop could see and
the wall reported itself intact. It reads to the function's own closing brace
now, and asserts that it got there — the assertion is on the SLICE, not on the
variable that computes it, because a revert that breaks scope proves nothing.

### What the falsification runs found

Nineteen reverts, each red alone — and **six came back STILL GREEN on the first
pass**, which is the whole reason the discipline exists: nothing guarded the
cache-hit authority gate, the booking-label wire, the h1 read, the speed
seconds, the timezone clause, the service-area guard or the widened SEO bands.
Each now has an executed guard.

Two more found in my own new work by my own new fixtures: the timezone clause
laundered a null offset into UTC (`Number(null)` is 0 and 0 is finite — the
recorded trap, arriving on schedule inside the round that fixed it elsewhere),
and the FACTS RENDER parser stopped at an escaped apostrophe, which is exactly
the character a written REASON contains.

**249 boot checks green.** The contract is unchanged at 20260903 — no field the
client must have moved.

**`index.html` changed, so this needs a Netlify deploy** — the old-build finds
in words, the real-visitor seconds, the booking-label row and the widened
search-setup bands are dark until the file lands.

---

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

## 90. The Find tab got its own artefact: fifty leads, ranked, with a name, an address and a number — 2026-08-28

Vin, after a week of cost questions and one clear decision: *"i literally need to
just be able to export find leads... i hit a button within the find tab section
and it grabs the decision maker the phone number the email and that is it then
it gives it a ranking out of 100 of their icp... They're already paying for ads
y/n. Team page headcount. They're hiring for marketing y/n. thats literally all i
need and i want it separate from the research tab so nothing gets confused code
wise."* And the constraint: **50 a day, 5 days a week, under $100 a month.**

This is a different artefact from the audit, bought by a different button, in a
different tab. The Research tab audits. The Find tab lists.

### The reframe that produced it, and the correction I owed him

Three sessions of my own advice pointed at cutting the owner and email work to
save money. He rejected it, and he was right: *"i like that we are certain about
who the owner is and certain about the email and phone number becuase our guy is
going to be email and calling."* The certainty is what the rep needs. What was
actually wrong was not the work, it was that **the cheapest way of doing it had
never been tried.**

### The three rules every line rests on

- **THE FREE READ IS THE DOOR; FIRECRAWL IS THE FALLBACK.** A plain HTTP GET
  returns the full markup of most small trade sites, and this file has had one
  since `checkBuiltWith` was written — it was simply never used to save a
  credit. `findPlainFetch` reads the homepage for nothing; the site's own
  navigation names its contact, team and careers pages, so `sameHostLinks` plus
  `rankUrlsByIntent` replaces the paid sitemap call outright. Firecrawl is asked
  ONLY when a site refuses a plain fetch, and then with `shot:false`, because a
  contact list never looks at a picture and a render is the most expensive thing
  on that menu.
- **NOTHING HERE IS A SECOND IMPLEMENTATION.** The owner comes from the same
  `findOwnerViaBrain` the audit uses — handed pages instead of buying them, so
  the roster parse, the prompt and the anti-hallucination gate are byte for byte
  the ones that ship. The address comes from the same `findEmailFireproof`, which
  gained a `freePages` pass that runs the SAME extractor with the SAME
  same-domain strictness before a credit can move. Ad markers come from
  `AD_TAG_SIGNATURES`, the roster from `parseTeamRoster`, hiring dates from
  `jobPostingsFromHtml`, and whether a role is a marketing role from
  `signalsFromTitles` — the one function that owns that question.
- **AN UNMEASURED SIGNAL LEAVES THE DENOMINATOR.** It never scores zero. A
  business whose site we could not read is not a business with no team, no ads
  and no hiring, and a score that says so is the recorded unmeasured-as-zero
  failure pointed at a number a rep repeats out loud. The row says how many of
  the five signals stood behind the number.

### The score, and the thing it deliberately does NOT measure

Five declared terms: how many people they publish (35), whether they already pay
for advertising (25), whether they are hiring for marketing (20), what their
review volume shows (12), and where their rating sits (8) — the last using the
4.2-4.85 band, still the one filter in this system with real evidence behind it.

**HONEST SHAPE, and it is the most important sentence here: the ICP is defined
as $800k-$15M of revenue and NOTHING in this measures revenue.** Revenue for a
private local business is not free. The two closest free proxies are how many
people they publish on their own team page and how much business their review
record shows, and both are used as proxies and labelled as proxies everywhere
they render. The team count in particular is a FLOOR, never a headcount — a firm
with forty staff may publish four — and the CSV column says so on its face.

What the audit path had before this was worse and nobody had looked: `sizeGated`
and `looksLikeEnterpriseByName` run only inside `/api/discover`, the paid sizing
step there explicitly excludes Places leads (`!isPlacesLead(c)`), and Places is
92.5% of discovery. `verifiedRevenue` only ever arrives from Companies API
enrichment whose lookup is gated on `verifiedEmployees >= 8`. So for
substantially every lead in the pipeline the ICP gate was a name pattern plus a
rating band, and the revenue range was never verified at all.

### The file

The first CSV this repo has written for a person to work from. Twenty columns,
ranked highest first, and an UNSCORED lead sorts LAST rather than as a zero. The
email's TIER is its own column and its confidence is read from that tier, never
from prose that happens to contain the word "verified": a published address, an
SMTP confirmation, a learned pattern and an outright guess are four different
risks and the rep about to press send has to be able to tell them apart. Every
cell is neutralised against formula injection, because a business name scraped
off an arbitrary web page and opened in Excel by a junior rep is the exact shape
that executes.

### The screen

One panel above the results, in the tab where the money is spent: what is on
screen, what has been read, how many have an email; one button; and while a run
is live, a progress bar, the leads in flight by name, a one-second clock, the
run's own Firecrawl and model spend, and Stop. Every lead is written through to
the queue as it finishes, so a Stop or a closed tab keeps everything already paid
for. Each card gains a three-line strip — who, how to reach them, and the three
signals — and colour marks a stop and nothing else, so the only red on it is an
address the send gate refused.

Two smaller truths on the same screen: the existing discovery number is labelled
**Find score** so it cannot be confused with the new fit score beside it, and the
header no longer claims a weekly auto-scan. There is none — the code that would
have run it says so in its own comment — and a false line on a screen costs what
a false line on a sheet costs.

### The cost, stated as an estimate because that is what it is

At 1,100 leads a month: Firecrawl on the smallest paid tier, Anthropic on Haiku
only (the two expensive Sonnet calls in the audit path never run), DataForSEO
untouched by this route, and one Places call per lead inside the free allowance.
The arithmetic lands near **$60 a month**, and the whole of it rests on the free
read actually being free.

**That is why the headline assertion is an end-to-end one.** `servercheck.js`
drives the real route over a fake network and asserts that a site answering a
plain fetch costs **ZERO** Firecrawl calls, that all three signals are measured,
that the owner and the address come off pages nobody paid for, and that a site
which refuses a plain fetch — and only then — falls back and spends. A boot
fixture could never have proved any of that: it passes its own arguments and
cannot see what the route buys.

**HONEST SHAPE: no contact read has run against a live business.** The bound is
the guards, not a measurement. The first real run answers it outright — the
`FIND CONTACT` line reports the credits and the dollars that lead actually cost.

### The first live press: a paused server retired a hundred leads in two seconds

Vin, minutes after the deploy: *"it loaded really fast like impossibly fast for
it to get all the info we needed for 50 leads"*, then *"i ran it when the derve
was paused now i cnat get it to do anything."*

He read it exactly right. Render was paused, every request failed the instant it
was made, and **the failure paths stamped `contactAt` anyway** — the same field
the panel used to mean "this lead has been read". So a hundred leads were retired
as done, with nothing on them, and the button could never pick them up again.
The Render log showed nothing because no request ever reached the server.

Three defects, one root: **a stamp that says "done" was being written by
something that had not done it.**

- `contactReadOk` is now the only thing that means a business was read, it is
  written in ONE place — the function that parses a real server answer — and
  every consumer keys on it. The hundred poisoned leads become unread again on
  their own; nothing had to be repaired by hand.
- A failure records itself as a failure (`contactFailedAt` plus the reason) and
  the panel says so in the one colour this screen reserves for a stop, naming
  the cause, because "it did nothing" with no reason attached is what sent an
  operator to the Render logs looking for requests that were never made.
- **Three transport failures in a row stop the run.** A dead server is one fact
  about the server, said once, not a hundred instant per-lead failures dressed
  as a finished run. And a **Clear N read** button exists for the case where a
  successful read needs redoing.

**The falsification that mattered came back GREEN first.** The revert that
reproduces the exact live defect — putting the `contactAt` stamp back on both
failure branches — passed, because every assertion written that hour keys on the
new read flag, so the reverted branches merely wrote a field nothing consulted
any more. Green for the wrong reason is not a pass. The failure branches are now
asserted *directly*: both must record the failure, and neither may write the read
timestamp. That revert then went red, and so did the other four.


### What was deliberately NOT done

- **No second route.** The mode inherits the boot-window gate, the day ceilings,
  the credit latch, the preflight and a concurrency ceiling of its own.
  `/api/test-contact-engine` is the standing proof of what a second route costs.
- **No revenue estimate.** Deriving a dollar band from review count and printing
  it as a measurement is the fabrication class this file exists to prevent. The
  proxies are named as proxies and the revenue column does not exist.
- **No change to the audit path.** The one shared function that moved —
  `firecrawlScrape` — keeps its render by default, and the boot check asserts
  that a caller who asks for nothing is still charged for the picture it is still
  receiving.

### What the falsification runs found

Twenty-four reverts, each applied ALONE against a green baseline: fourteen boot,
eight client, and two driven end to end through servercheck. **Twenty-two went
red on their own named assertion on the first pass. Two came back STILL GREEN,
and both were fixtures that measured nothing:**

- The marketing-hire fixture used the title "Marketing Manager", which any regex
  containing the word "market" also catches — so replacing the shared
  `signalsFromTitles` with a hand-rolled classifier left the check green. It is
  "SEO Specialist" now: a marketing role with no "market" in it, which is exactly
  the gap a second copy of that rule opens.
- The careers-page fixture used a LONG sentence, which the six-word title cap
  already refuses — so removing the sentence-punctuation rule changed nothing.
  It is a four-word sentence now, which only that rule can refuse.

And the harness lied once before it proved anything: the revert helper took a
third positional argument that most reverts did not pass, so twenty-three of
twenty-four reported **NO VERDICT (the revert did not apply)** on the first run.
NO VERDICT is not a pass, the harness said so rather than reporting a colour, and
the whole pass was re-run once it could actually apply.

**`index.html` changed, so this needs a Netlify deploy**, and the contract is
**20260913** on both sides — without the new server the button answers 404, and a
stale page says so by number.


---

## 94. Find stopped asking the star rating what a business can afford — 2026-08-28

Vin, setting the goal for the whole round: *"our goal here is to get the most
likely businesses that need our help and our ICP and can afford us into Find and
filter out all the ones that cannot afford us."* And on the signal that was
deciding it: *"the ones with lower ratings have way more pain, especially
visibility pain - if they can afford us then these leads are gold as well."*

### The measurement that was doing the wrong job

**A star rating is not a revenue signal, and it was the gate.** A business below
3.8 stars was demoted out of the queue at discovery; a business above 4.85 was
demoted too; and the card rendered **`💰 Est. $1M–$5M+`** from a review count
alone — a dollar figure we never measured, printed as a measurement, on the one
screen an operator reads before deciding what to audit. That is the fabrication
this file forbids everywhere else, sitting in the place it is least likely to be
looked at.

Three things replace it, and none of them names a dollar:

- **The star FLOOR is gone entirely.** What decides entry now is the trade-aware
  review floor, which is a JOB COUNT and at least adjacent to revenue. 2.4 stars
  over 150 reviews is an established business in pain; 2.4 over 16 is a business
  dying; the floor already tells them apart. A low rating earns a modest lift
  instead of a deduction, because rating is one of the inputs Google weighs in
  the local pack — a low-rated business really is harder to find, which is a
  reason to buy. Modest, because at Find time we cannot tell "bad at marketing"
  from "bad at the job", and only one of those is a customer. The audit answers
  that, and it runs after this.
- **The CEILING stays and means something different.** At 4.9 there are almost no
  negative reviews left on record to mine, which is a fact about what an AUDIT
  will find rather than about what the business can afford. Fourteen audits are
  behind it, and it demotes rather than deletes exactly as before.
- **`affordabilityBand` is the new answer**: what one job in their trade is worth
  (`CATEGORY_TIER`), times how many jobs are on record, capped where the owner
  does the work himself, sharpened by a published team and published hours. One
  derivation, three consumers — the Find score, the card's tier label, and the
  contact list's own ranking — because two affordability rules in one app is how
  the card and the CSV end up telling an operator different things about one
  business, which is the defect the demotion penalty was extracted to fix one
  round earlier.

**It never produces a dollar figure.** We do not buy revenue for a private local
business and we never measured it. It orders leads and labels them *premium fit*
/ *lower tier only* / *below our floor*, and every input it used is named so a
person can argue with it. A lead with nothing measured comes back with NO band,
never `below_floor`: "we did not look" has never meant "they cannot pay".

### Vin's handyman, and why a flat deduction could not fix it

*"A handyman that runs his own company and does all the jobs is likely not worth
it - he may have great reviews and a lot of reviews."*

`TRADE_CAPACITY_CLASS` declares every one of the 55 searched categories as
**solo / mixed / crewed**, and an unknown trade returns **null, never crewed** —
guessing crewed on an unclassified trade is how a one-man band gets promoted to a
premium call.

The first version bolted a flat penalty onto the band and **the boot check caught
it**: the establishment curve inside `placesTriageScore` is worth up to 26 points,
so a solo operator at 400 jobs still out-scored a crewed trade at 60. The real
defect was the CURVE, which reads volume as capacity. It is halved for a solo
trade now — not deleted, because a busy one-man operation is a better lead than
an idle one, it simply does not SCALE — and the band caps it at the lower tier
however high the count goes. The check asserts the OUTCOME (a solo trade at 400
must not out-rank a crewed one at 60) rather than the number.

**And the inverse of `HIGH_VOLUME_LOW_TICKET` never existed.** That set raises the
review floor for trades that earn many cheap reviews. Nothing lowered it for the
trades that earn almost none — and that is the more expensive gap: a $6M custom
home builder may have NINE reviews, a $3M accounting firm five to twenty. The
15-review floor was silently deleting the richest and most owner-reachable
businesses in the entire ICP, which are exactly what a $35k build and a $10k/mo
retainer are for. `LOW_VOLUME_HIGH_TICKET` holds eighteen labels at a floor of 5.

### The hours we have been buying on every search and never reading

`places.regularOpeningHours` has been in the discovery FIELD_MASK for its whole
life and no line in the discovery loop ever read it. Instance twenty-seven of
computed-but-not-passed, and it is the one CAPACITY signal available before a
penny is spent: one person cannot open seven days a week. `readPublishedHours`
returns the open-day count and a weekly total that goes **null the moment any day
fails to parse** — a partial total read as a real one understates a staffed
business, which is the direction that costs us the lead.

### The niches, re-read end to end

- **55 categories, up from 46.** Dropped five that cannot buy (Chiropractic — a
  solo practitioner at $400-800k that farms reviews, so it passes the volume
  proxy and fails the ICP, which is Vin's own case by name; Fertility, ~75%
  investor-owned; Physical Therapy and Lawn Care, already tier-C excluded and now
  deleted outright so the list stops disagreeing with what is searched;
  Landscaping, a worse-queried duplicate of Hardscaping). Re-queried `general
  contractor` — the lowest-precision search in the list, returning handymen and
  one-man LLCs — as `design build remodeling company` plus `home addition
  contractor`. Added thirteen high-ticket types: addiction treatment ($30-60k an
  admission), dental implant centres ($25-50k a full arch), commercial roofing,
  commercial mechanical, outdoor living, custom cabinetry, basement finishing,
  siding, funeral homes, in-home care, managed IT, medical weight loss and epoxy
  coatings. Fire Protection, Signage and Excavation came back from tier C.
- **23 metros, up from 20.** Boise out on arithmetic alone: ~800k against
  Phoenix's 5.1m, sampled equally, for the same money. Atlanta, Houston,
  Minneapolis and Cleveland in — and the last two are there for a reason the Sun
  Belt cannot give us: every metro on the old list was warm, so basement
  finishing, waterproofing and insulation had almost no ground to be found on.
  The coordinate map moves with the list, because the coverage-gap check reads
  `Object.keys(GP_CITY_COORDS)` as THE SEARCHED SET.
- **The money table had ten gaps, and one of them was a hundred times wrong.**
  `TRADE_JOB_VALUE` priced lawn care at *"a landscaping project runs $5k-$30k"*
  while `CATEGORY_TIER`, four thousand lines above, prices it at **$50-200 a
  MONTH**. Two tables in one file disagreeing about one trade by roughly a
  hundred times, and the one that reaches the prospect was the wrong one — and
  Lawn Care being an unsearched category never protected anything, because these
  rows match on TRADE TEXT and any lead whose Google category reads "Lawn care
  service" was quoted a five-figure project. `\bhardscape` could not match
  "hardscaping" (the §15 stem trap, so the Hardscaping label returned no money
  line at all), bare `\bexterior` stole *exterior painting* from the paint row at
  three times the figure, the general dental row swallowed implants ($25-50k) and
  veneers ($15-45k) at $4-7k, and dermatology was priced at the med spa's
  cosmetic figure. Eighteen rows added; nine searched categories had no money
  line at all.

**`TRADE TABLE COVERAGE CHECK` is the mechanism that stops this recurring.**
`NICHE_BRIEF_EXPECT` has had a coverage check since it was written and has never
drifted; the four tables beside it had none and held ten gaps between them. The
correlation is exact. It runs the LIVE regexes against the REAL query strings —
which is how the ten were found — and asserts every searched category is tiered,
capacity-classified and priced. Two exemptions are DECLARED rather than absent:
PI Law and Estate Law have no honest single job value (a contingency case is $5k
or $500k), and Roofing and Home Care have no honest urgency profile (a 2am leak
and a planned re-roof are one company; a hospital discharge is decided in two
days, which is neither "weeks of research" nor "nobody compares"). Both fail in
the other direction too: an exemption that excuses nothing hides the next real
gap.

**Nineteen of the fifty-five categories had no purchase-urgency profile at all** —
a third of the hunted set, with `URGENCY_ADJUST` worth up to 26 points either way,
the largest business-type rule in the ladder. The Windows & Doors miss is the
stem trap again: the list carried `window replace` and the query is "window and
door replacement", two words apart.

### Why a run came back with eighty leads

Vin's SQL fix worked, and that is what caused it. Row-level security had been
refusing every `lead_bench` write — 1,317 qualified leads a run, discarded with
one grey log line saying so — so the demote-don't-delete design shipped in §12
and §17 was completely inert. The moment the bench filled, `placesBudgetFor` cut
the Google budget to its 25% floor, and the grid deals round-robin across the
categories, so 25 queries searches 25 categories at one city each.

That floor rests on *"a benched lead replaces a fresh one"*, which nothing has
ever measured and which is false in at least four ways: a benched lead still
faces the ICP filter, the size gate, a 60-day TTL and the client's own dedupe.
It is 60% now, and the honest number is the survival rate — so **`📉 FIND YIELD`**
prints what the bench actually contributed against what the budget assumed, and
the next move is made on that rather than on another guess.

`MAX_TOTAL` was a hardcoded 120 with no setting, and this file already records
that 393 qualified businesses were dropped on the floor by it in a single run.
It is `FIND_RUN_MAX`, default 300 — which costs nothing extra at Google, because
the same searches are already bought; it only decides how many come back in THIS
response instead of waiting on the bench. `MAX_ADZUNA` is deleted: it capped a
lane at 70% of the run, and that lane has been disabled since TheirStack replaced
it, so the cap governed a source that cannot produce a lead.

**And the brand blocklist was deleting the leads this pipeline exists to find.**
It matched a single generic word ANYWHERE in a name, and thirty of its entries
are ordinary small-business words: *kelly, block, square, target, fox, volt,
visa*. Kelly Roofing, Fox Plumbing, Block Electric, Target Pest Control and
Square Deal Plumbing all died at discovery. A single-word entry must now be the
whole name (a legal suffix aside); a multi-word entry keeps every position it
had, because "robert half" and "bank of america" are phrases nobody names a
two-truck plumbing company after. The rule is `brandNameHit` at module scope and
`ICP FILTER CHECK` asserts both directions — the eight names that must survive
and the eight brands that must still be refused, because §14 records at this very
check that a filter loosened until it catches nothing is the more expensive
failure.

### The first measurement of whether owner and email finding work

Vin: *"i want u to double check on how well decision maker finding is and how
well our email finding is because we have been running without email finder."*

**Nothing in this system has ever counted it.** Not a rate, not a counter, not a
log line — the per-lead `FIND CONTACT` line says what ONE lead produced and
nothing has ever said what a RUN produced. So every judgement about the resolver
and the email engine, across the life of this project, has been made from
remembering a handful of leads.

`findRunTally` counts it, and four rules keep it honest: rates are over leads
actually READ (a run that refused thirty enterprises by name did not fail to find
thirty owners); the EMAIL TIER SPLIT is reported rather than one "found" number,
because a published address and a guess from a common pattern are both "an email"
and this project's two hard bounces both came from the second kind; under twelve
reads it says out loud that its numbers are counts and not rates; and a run made
while the verifier was down says so, because thirty downgraded addresses read as
thirty bad prospects otherwise.

**And the verifier latch had no way back.** `VERIFIER_EXHAUSTED` and
`VERIFIER_DEAD` were one-way for their whole life — no TTL, no probe, no reset —
so a single busy minute on a free-tier daily allowance turned SMTP verification
off for every remaining lead until Render restarted the process. §43 records
exactly this shape on the Firecrawl credit latch. The cost here is quieter and
just as expensive: **tier 2 is unreachable without a live verifier**, so every
address after the blip falls to tier 3 or 4 and reads as pattern-built rather
than confirmed. On a fifty-lead run that exhausts at lead twelve, thirty-eight
leads are silently downgraded. It re-tests now, one probe per cooldown window,
time-based for the reason §43 gives: an in-flight flag has to be released on
every exit path and the one path somebody forgets is a second deadlock wearing
different clothes. A separate read-only look-ahead exists so a GUARD site can let
the probe through without consuming it — otherwise every guard refuses, no call
reaches the verifier, and the probe can never fire, which is the same deadlock
one level up.

### What was deliberately NOT built

- **No revenue estimate anywhere.** The band names inputs, never dollars.
- **`findOwnerViaReviewReplies` is still not wired into the Find contact read.**
  It is the best owner source at an owner-run shop — whoever answers the reviews
  IS the owner — and it costs an Apify review pull per lead. Adding a per-lead
  cost to the deliberately-cheap contact path without measuring the yield first
  is the wrong order; the tally above is what measures it.
- **No lane toggle, and no size signal on the non-Places lanes.** Both are real
  and both are in the plan; the scope filter Vin already has (`placeId` present)
  is the mechanism that matters today.
- **No ranking or copy change to the audit ladder.** PART 6's rule holds.

### What the falsification runs found in the checks themselves

Twenty-three reverts, each applied ALONE against a baseline the harness refuses
to start without proving green first. **Two came back STILL GREEN, and both were
the same shape: a mechanism built and never watched.**

- **The verifier's way back had no guard at all.** The cooldown, the one-probe
  ration and the clear-on-an-answer were all written, and restoring the one-way
  gate broke nothing, because nothing executed it. `VERIFIER LATCH CHECK` is the
  answer, and the clock had to become a PARAMETER for it to exist: a fixture
  that cannot travel ten minutes forward cannot reach a branch that only exists
  ten minutes after a latch.
- **And then the first version of that check was half a check.** It exercised
  the FUNCTIONS, so the original revert — swapping `verifyEmailSMTP`'s door back
  to a bare `verifierBlocked()` read — passed through it while the latch was
  one-way again in production. `verifierBlocked` is read-only by design and
  never consumes the probe, so a call site gated on it can never fire the one
  attempt that clears the latch. The check now reads the LIVE FUNCTION
  (`String(verifyEmailSMTP)`) rather than the file text, so no needle can match
  the check's own source. Eleventh recorded instance of *a check that does not
  assert its call site is half a check* — found only by running the revert.
- **The email tier split was asserted on the OBJECT, never on the LINE.** Every
  fixture read `t.tier1`, so the tally could stop printing the split entirely
  and stay green. The assertions read the rendered sentence now.

Both re-armed reverts then went red on their own named assertions.

**HONEST SHAPE: none of this has run against a live Find press.** The bands, the
tables, the tally and the yield line are executed at boot and in `clientcheck`;
what a real 1,400-business grid returns under a 60% floor is settled by the first
press, and the `📉 FIND YIELD` line is what answers it.

**`index.html` changed, so this needs a Netlify deploy**, and the contract is
**20260916** on both sides.


---

## 95. A form field label was the decision-maker, and half the list had none — 2026-08-28

Vin ran the Find contact list for real, sent the sheet and the whole Render log:
*"some of these leads arent coming with decion makers phone numebrs and emails
those are impoirtnbant stuff yano"*, and *"we are getting coloumns that are not
needed when pasting to cvs we dont need all of that for now just the most
improtnnat info i have to dekete a bunch of coloumns everytime i paste stuff
in."*

Sixty-three rows. About half had no decision-maker. One of the ones that did had
a person who does not exist.

### "Last Name" was on the sheet as the person to ask for

America's Home Place shipped as **decision-maker "Last Name", title
"Principal's Contact Info"** — a form field label under a form section heading,
handed to a junior rep as the name to say out loud. Reproduced by executing the
real parser, not read: `parseTeamRoster` returns exactly that pair.

**Two independent causes, and either one alone still ships a false person.**

- **A possessive is about the owner, not a title anyone holds.**
  `ownershipIsHead` asks what FOLLOWS the ownership word — the fix §91 made for
  "Partner Track" — and an apostrophe is not a letter, so the phrase fell
  through the punctuation branch and read as a title whose head is *Principal*.
  Executed: it returned true for *"Principal's Contact Info"*, *"Owner's
  Manual"* and *"Founder's Story"*. The one near-miss proves the rule —
  "Owner's Representative" is a hired agent in construction and emphatically
  NOT the owner, so refusing it is correct twice over.
- **A form field label sits exactly where a name sits.** "Last Name" satisfies
  the two-capitalised-words pattern by construction. Same family as "About Us"
  and "Google Reviews", both already blocked, and the same INPUT cause: the Find
  tab's free read hands the roster parser a WHOLE PAGE where the audit path
  hands it a leadership page, so navigation and form furniture arrive in a
  person's slot.

Both directions are fixtured: the false pair is refused, and twelve real
ownership titles plus four real rosters from that same run survive untouched.

### Half the list had no owner, and the reason was a default

The free stage of the owner ladder settles roughly half of leads. The paid stage
— a web search and a licence-record search — is what finds the rest, and it was
hard-coded OFF on this route. That was the right cost decision for a batch that
would only ever be dialled and the wrong one for a list that is emailed as well:
Triton, Rhino and about thirty others came back with a company mailbox and no
name.

Measured from that run's own log, it is **about eight Firecrawl credits and two
cheap model calls per lead the free read cannot settle** — roughly 200 credits
across fifty. Vin: *"if its that cheap then yes always have it on make it so i
can swtich it off within the settings though yano."*

So it is ON by default with a Settings switch, and the direction of the default
is the point: **an absent flag BUYS**. A client that has not been redeployed
sends nothing, and the honest reading of nothing is "the old client, which
expected the owner to be found", never "the operator asked us to save money".
The Firecrawl key is handed over only when the paid stage may actually run — a
key passed beside a stood-down stage is spend one forgotten branch away, which
is how a switched-off feature bills anyway.

**And `want` was declared on every page intent and read by nobody.** One regex
covers /about AND /our-team AND /leadership, the loop broke after the first hit
whatever the table said, and the owner is commonly named on the page we did not
read. The table decides now. A page on the plain path is free, so the second one
costs nothing on the leads this is for.

### The columns

Twenty-one, most of them deleted by hand after every paste. The default is now
the eight Vin specified when this list was first asked for — company,
decision-maker, title, email, phone, ICP score, already paying for ads, hiring
for marketing — with all twenty-one one tick away and the Google Sheet reading
the same choice, because two destinations reading two column lists is how an
operator gets a file he cannot reconcile.

**The Apps Script deduped on column 3**, because 'company' was the third
declared column and the only thing holding the two in step was a comment. In the
lean set company is SECOND (the columns come out in declaration order, so the
ICP score leads and Company follows it), so a hard-coded 3 would have
silently deduped a whole sheet
against the decision-maker's name — two-hand-kept-copies, with one copy living
in a script pasted into a spreadsheet where nobody would look for it. It reads
the header row now, so the column order can change as often as the operator
likes.

### Not a code defect, and it cost four owner emails

`🔴 EMAIL VERIFIER OUT OF CREDITS` on that run. Jason Hicks, Daniel Meadows,
William Barr and Michael Schweitzer were all resolved as owners and all came back
with no address, because tier 2 is unreachable without a live verifier. The §94
latch worked exactly as built — it re-tested and printed `🟢 EMAIL VERIFIER:
back` — but the allowance is genuinely empty. That is a top-up at
myemailverifier.com, not a build.

### What the falsification runs found in the checks themselves

Thirteen reverts, each applied alone against a baseline the harness proves green
first. **The form-label revert came back GREEN**, and the reason is the recorded
two-fixes-hide-each-other class: "Last Name" is refused by the last-word rule
AND by the whole-phrase rule, so removing either half alone left every fixture
passing while the other half did the work. There are now two cases only one half
can refuse — a label whose exact phrase is not on the list, and a label whose
last word is ordinary — and the revert is split to match.

**And the page-picker check went RED on a correct build, which was right.** It
asserted one page per intent, and what it was really protecting is that a
careers page cannot be crowded out by two about pages. That proxy is replaced by
the property itself: the declared wants must SUM to no more than the page
budget, so every intent is guaranteed its share whatever order they run in.
Widen one want without widening the budget and it goes red.

**HONEST SHAPE: none of this has run against a live press.** The parser fixes
are executed at boot on the exact strings that shipped; the paid-lookup default,
the page widening and the column choice are executed at boot and in
`clientcheck`. What a real fifty-lead press yields is settled by the next run's
`FIND RUN TALLY` line, which is the thing this project has never had.

**`index.html` changed, so this needs a Netlify deploy**, and the contract is
**20260917** on both sides — the Settings switch would silently do nothing
against a server that predates it.


---

## 96. Phase 1 — the fundamentals of a lead — 2026-08-31

Vin: *"i really want to focus on quality of leads coming in and quality of info
an accuracy for leads i want to work on just phase 1 which is the fundamentals
of the leads yano"*, and *"make sure to build at the highest level and bugs fix
at the root."* Three recon passes read the whole Find path — who gets into the
queue, how we decide who the owner is, and what the row finally asserts.

Four decisions he took before anything was built: **no paid revenue source**
(sharpen the free proxies; revenue stays unmeasured and the row keeps saying
so); **the non-Places lanes off by default**, one tick to re-enable; **a generic
mailbox stays on the sheet, marked clearly**; and **measure first, set the bar
after** — ship, run one 50-lead press, read the tally, then pick a target.

### The measured owner sentence had never matched anything

`_ownerFromCorpus`'s backstop reads the corpus directly for the sentence an
owner writes about himself, so a name already in memory is not re-bought with
~8 Firecrawl credits of paid search. Every escape in its regex was written FOUR
backslashes deep inside a template literal, so what reached `RegExp` was a
literal backslash followed by a letter rather than a word boundary. Executed
against the exact live sentence it was written for — *"As the founder and owner
of David Price Construction, LLC, David is a lifelong builder"* — it returns
null. So the search it exists to save has been bought on every lead since it
shipped, and the false *"no owner-level person named on their site"* it exists
to prevent has been printed on every one of them. Its company-first shape also
captured a single token while `looksLikeRealName` requires two, so even with
working escapes it could never have returned anybody. **A regex that matches
nothing is silent rather than wrong** — the §15 stem trap and the §57 corrupted
byte, a third time.

Un-breaking it makes a dead path live, so its three holes closed in the same
change rather than shipping as new behaviour: the company between the role and
the person was unconstrained, so an owner quoted in a supplier's testimonial was
reported as this lead's buyer; it claimed **high** confidence, which is exactly
what `ownSiteConfident` reads to settle stage 1, so one regex hit would switch
off every source that could disagree with it; and the title was hard-coded
"Owner" even where the sentence said president.

The check compiles the regex out of the live function's own source, so it runs
the production text rather than a second copy. Its first run correctly reported
that it could not find what it was aiming at.

### Two tokens found separately are not a name

`nameCorroborated` is the one gate between the model's JSON and a person's name
on a call sheet. It flattened the company name and all four scraped pages into
ONE string and asked only that the first name and the surname each appear
SOMEWHERE in it, independently. On a four-page corpus that is close to
unfalsifiable: "David" in the header and "Price" in a street address hundreds of
characters away passed "David Price". It requires **adjacency** now, not a
contiguous span — "David A. Price", "Price, David", a line break between them
and `davidprice@x.com` all still corroborate, because demanding the exact string
back would refuse the real shapes a page writes a name in. A ceiling assertion
sits on the window, since the cheap way to "fix" a refusal is to widen it until
it is the whole document again.

**And the model's title was never checked at all.** The name got a gate and the
title did not, so a real person found on the page could have "Owner" attached to
him out of nothing — and the title is not decoration, it is what
`authorityScore` reads to decide whether he may be shown as the buyer. An
invented "Owner" scores 100 and walks through the buying floor; the same person
with no title scores the 30 default and is held back. The NAME is kept either
way: losing a real person because the model guessed at his job is the
guard-too-tight failure.

### A held-back name was building email addresses

The authority gate's `canBuy` verdict stopped at the sheet. The same held-back
name was passed into the email engine as `ceoName`, where it built a personal
address, taught a **process-lifetime** house pattern for the whole domain, and
came back marked sendable. That is the path from an invented person to a hard
bounce, and a bounce is charged to the sending DOMAIN — the one asset here that
cannot be rebuilt in an afternoon. Both of this project's bounces came from
addresses it had itself labelled "pattern-built, not confirmed".

**The rule is not "refuse the lead".** A name is usually held back because no
TITLE was found, not because the name is wrong — Michael's Flooring returned
"Daniel Meadows, no title found" and Daniel Meadows is almost certainly real.
So an unvouched name may be **TESTED** and never **ASSUMED**: a published
address is a measurement of their site, an SMTP-confirmed one is a measurement
of that mailbox and is the strongest possible proof the name was right, and
neither is touched. What is refused is the half that assumes — no house pattern
is learned from an unproven name, and a constructed T3/T4 guess stays on the row
with its reason and is not sendable. The downgrade happens at the ONE door every
result leaves through, because gating the core's many exits is a list somebody
forgets.

### Three more ways the row could assert something nobody measured

- **A neighbour's job.** The roster lookahead stopped at the next person only
  when that person carried NO title, so on a card layout "Jane Doe, CFO"
  satisfied the title test and became the title of the person above her. Two
  people wrong at once, and the output still reads as a plausible roster. The
  reason the old test could not simply ask "is this a person" is that a bare job
  title satisfies every name pattern — "Managing Partner" is two capitalised
  words — so the question is which reading a run has, and only a run whose title
  reading is the ONLY reading belongs to the person above it.
- **The phone was asserted, never checked.** It was copied off the Google
  listing and stamped "their Google listing" unconditionally — true about where
  we got it, silent about whether it is the number they answer. We hold their
  pages by then and `sitePrintsOurPhone` already existed, so this costs nothing.
  The number is never deleted: a disagreement is a note about a possible
  tracking number or a listing nobody has updated.
- **One lead reading another lead's page length.** `_leadershipTextLen` was
  keyed by company name alone; the reasoning that made that safe was the
  duplicate-run guard, which keys on the PLACE ID first — so two genuinely
  different businesses sharing a name get two job ids, run concurrently by
  design, and collide here. A blank name was worse: every nameless lead shared
  one slot. The website is what was actually read, so it belongs in the key, and
  a TTL is the other half, because the reset only runs when the leadership read
  runs.

### The lanes that produce unjudged leads

Every ICP rule in this system is written against a Google listing: the rating
band, the trade review floor, the capacity class and the affordability band all
read fields only Places supplies. The job-board, funding, news and for-sale
lanes carry none of them, so a lead from one arrives unjudged by every filter
that matters and is then scored as though it had been judged. That is where
Coca-Cola Bottling, Penn Medicine, Lennar Homes, Securitas, Goodyear and
SkillPath came from, and no widening of the name filter was ever going to catch
them.

Off by default, one tick to re-enable, in the scope bar beside the button that
spends the money. Nothing is deleted — those lanes are still the only thing in
this pipeline that puts a CLOCK on a finding. **The gate takes a thunk rather
than a promise**, because written the natural way the call happens before the
gate is entered and a switched-off lane spends its network anyway. And Reset now
MERGES rather than replacing `pullFilters`: a button labelled Reset silently
clearing a spend switch is how an operator buys a different run than the screen
describes.

### A long name is not a size measurement

`if (name.length > 55) return false` sat under a SIZE heading and DELETED the
lead. Character count has never measured how big a business is, and this file
already records that reasoning being rejected once: *"Character count is NOT a
measure of distinctiveness and never was."* "Southern Comfort Heating and Air
Conditioning" is 47 before a suffix or a city. Removed rather than raised,
because a bigger number is the same guess.

### The two biggest deleters finally have fixtures

`GP_FRANCHISE` is the only **unconditional** name-delete in the Places loop — no
demotion, no bench, gone — and it had no must-catch list and no must-survive
list, which is exactly the protection `brandNameHit` gets. Two of its entries
were ordinary English: **"rainbow" deleted Rainbow Roofing** and **"one hour"
deleted anything called One Hour Signs**, both squarely in the ICP. Each is now
qualified by the words that actually name the franchise, and both directions are
asserted, because a filter loosened until it catches nothing is the more
expensive failure.

`reviewFloorFor` deletes more leads per run than anything else in the file and
nothing asserted a trade sat in the right set. The two directions cost opposite
things: a high-ticket trade wrongly held to the base floor deletes the richest
leads in the ICP (a $6m custom home builder may have nine reviews), and a
high-volume trade wrongly given the low floor fills the queue with businesses
that farm reviews. An unclassified trade must keep the base floor, or adding a
trade silently changes how many leads every run deletes.

### Everything measured reaches the row

- **The do-not-send flag was dropped on promotion.** `leadFromCompany` carried
  thirteen contact fields and `contactEmailSendable` was not one of them, so a
  lead promoted out of Find arrived WITH the address and WITHOUT the flag the
  card refuses to send on and the CSV prints "NO - do not send" for.
- **Three fields computed on every read and rendered nowhere:**
  `contactOwnerSources` (so a name read verbatim off a team page and one a model
  proposed looked identical to the rep saying it out loud), `contactAdsWhy` (all
  four phrasings, including the one that says a tag container could be hiding a
  tag we cannot see), and the phone check above. The recorded
  computed-but-not-passed class, three instances in one artefact.
- **A front-desk mailbox says so on the row.** The tier already distinguished it
  internally; the row never said it in words, so a caller opened with the
  owner's first name into a mailbox the office manager reads first. Kept, marked,
  and the test is deliberately narrow — a name that merely CONTAINS one of those
  words ("infosystems@", "billsales@") is a real mailbox.
- **A stale local queue permanently shadowed the cloud.** The Find queue restore
  returned the moment localStorage held anything, so once a browser had ONE
  queued company the Supabase queue could never load in it again. It MERGES now,
  the cloud winning a name collision, because replacing would delete a company
  queued in this tab and not yet pushed.

### The affordability sentence says which half is about this business

The tier and the capacity class are inherited from the GOOGLE CATEGORY the lead
was found under, so every plumber in a run shares them; only the job count, the
published team and the published hours are this business's own record. An
operator reading one sentence has to be able to tell those apart, or a shared
judgement about a trade reads as a measurement of the company in front of him.
And the two /100 numbers on one card now say which is which: the triage score is
what we thought before reading them, FIT is what we found afterwards.

### What was NOT done, and why

- **`placesTriageScore`'s `|| 0` on the review count and rating**, which the
  plan flagged as null laundering. Checked by execution rather than asserted:
  discovery sets `reviewCount` from `p.userRatingCount || 0` before this ever
  runs, every term reading either value is a BONUS rather than a penalty, and
  the `_affIn` object is built only inside the Places branch. So the laundering
  is real and its effect is nil today. Recorded rather than "fixed", because a
  mechanism no fixture can reach is the kind that rots.
- **No paid size or revenue source** (Vin's decision). The proxies are named as
  proxies and there is no dollar band anywhere.
- **`findOwnerViaReviewReplies` stays unwired** on the Find path. It is the best
  owner source at an owner-run shop and it costs an Apify review pull per lead;
  the tally is what should decide it.
- **No audit, ladder or email-copy changes.** PART 6 holds.

### What the falsification runs found in the checks themselves

**The C-group fixtures were inserted inside the `Promise.all` callback, AFTER
the block that reports `fails` and exits** — so every push landed in an array
nobody read, and the first smoke test of the promotion revert came back GREEN on
a build with the field deleted. My own version of the recorded "a check that
reported a green line ahead of a failure it did not know about yet". Moved above
the report; the same revert then went red on its named assertion.

And the harness itself refused to start twice rather than reporting a colour:
once on a port left in use by a killed run, and once on a baseline it could not
prove green. A harness whose baseline is already red proves reds too cheaply.

**HONEST SHAPE: none of this has run against a live press.** Everything is
executed at boot and in `clientcheck`; what a real fifty-lead contact run yields
is settled by the next run's `FIND RUN TALLY` and `FIND YIELD` lines, and Vin's
own decision was to read those before anybody sets a target.

**`index.html` changed, so this needs a Netlify deploy**, and the contract is
**20260918** on both sides.

---

## 97. The contact list had no ICP filter on it, and the score rewarded the businesses we cannot sell to — 2026-08-31

Mike's brief, via Vin: **"we just need to focus on getting good quality leads in
our ICP."** Vin's three complaints from the live five-lead run: he could not move
what he had just read into Research, the Find tab is *"way too much going on"*,
and *"the read 16 like i just ran 5 leads and im not sure where they are now im
not sure where 16 came from."*

Three recon passes read the code behind each. All three complaints were real and
every one had a root cause. The run's own log carried a fourth that nobody
reported, and it was the biggest.

### The contact route ran one content check, and it catches none of them

`/api/find-contact` had exactly one business-identity gate,
`looksLikeEnterpriseByName`. Executed against the six live businesses that
check's **own comment** names as the reason it was added — The Washington Post,
Herc Rentals, Lodging Dynamics, Penske Truck Leasing, Highmark Health and the
American Heart Association — it returns **false for all six**. A guard in the
wrong function, under a comment claiming a capability it does not have.

Meanwhile `GP_FRANCHISE`, `brandNameHit` and the four brand sets — the filters
that DO know what a national brand is — were declared with `const` **inside the
discovery handler**, so the route that builds the list somebody dials could
reach none of them. Four guards in the wrong function at once. They are at
module scope now, moved verbatim, and `nameIsOutOfIcp` is the one door: the
franchise list, all four brand sets and the institution pattern. `icpFiltered`
calls the same door, which matters because that is the ONLY place a **benched**
lead is re-filtered — a lead banked under last month's rules re-enters the
pipeline right there, and GP_FRANCHISE never ran on it.

### The evidence was in hand and free

Truly Nolen's own team page told us: **John Sanders is "Majority Franchise
Owner"**. `titleKind` reads that string, matches "Owner", returns owner — and
the word FRANCHISE sitting in the middle of it was read by nothing, anywhere.
Window Nation's own URL is `/locations/north-carolina/charlotte`. We fetched
both and read neither.

`readChainEvidence` reads two signals off pages we already hold, both
unambiguous by construction because Vin's ruling is that a chain is **dropped**
— so a false positive deletes a real lead, which is §14's guard-too-tight
failure and the expensive one:

- **ROLE** — a roster title naming the franchise relationship itself.
- **PLACE** — a locations URL scoped to a STATE and then a city. A two-branch
  independent publishes `/locations/downtown`, which cannot match; a
  three-branch single-state operator publishes `/locations/austin`.

Deliberately NOT signals: *corporate office*, *all locations*, *find a location
near you*. Each appears on independents with two branches. And the word cuts
both ways — *"locally owned, NOT a franchise"* is a selling point independents
print, so a negated mention can never fire. Twelve cases fixtured in both
directions, including a franchise lawyer.

**The drop happens before the expensive half.** The site read is already spent
and cannot be refunded; the paid owner wave and the address lookup behind it are
about ten Firecrawl credits and they can. Truly Nolen's own team page named it a
franchise on the FIRST page we read, and the run went on and bought the rest of
the lead anyway.

### The chain detector had no memory, and the memory already existed

`detectChainOutlets` needs three metros and three distinct names **inside one
run**, so a franchise that surfaces once per run is invisible to it forever.
That is how Ram Jack — the franchise §24 is an entire entry about — was still
third from the top of the live list. The bench is loaded before the search runs
and every row on it IS a lead, restored whole, carrying its own `marketsSeen`.
Passing it in costs nothing, needs **no new table and no SQL**, and only ever
adds evidence: the bar is unchanged and the filtering still applies to this
run's own results.

### Six lists answered "is this a person's mailbox" and disagreed

`JUNK_LOCAL` (17 words), `ROLE_LOCAL_S` (24), `GENERIC_LOCAL` (13),
`ROLE_INBOX` (30), `ROLE_RE_M` (45) and the client's own `GENERIC_MAILBOX_RE`.
**The word "recruiting" was in none of them** — which is how
`recruiting@windownation.com`, scraped off their CAREERS page, shipped as a
tier-1 *"Published on their site"* address, sendable, score 100, to cold-pitch
marketing services at. Same-domain addresses skipped every filter outright.

`mailboxKind` is the one vocabulary now, in two grades: **junk** (not a human at
all) and **role** (a real mailbox a department reads — still worth having, per
Vin's standing ruling that a front-desk address stays on the sheet marked, but
never the owner). And `person` is the honest name for the third answer: NOT
RECOGNISABLY a department mailbox. It has never meant we know a human reads it,
and jacksonville@ is a location mailbox this cannot tell.

**Tier 1 stopped being unconditional.** The tier is right — it really is
published on their site — and the LABEL was not. A careers-page address scores
70 and says a recruiter reads it; a role inbox 85; an off-domain address 90 and
says which domain it is on.

**And the careers-page intent finally travels.** `freePages` mapped to
`{ url, text }` **one line after** the owner path keeps `intent` — so the
extractor was handed a page fetched on purpose BECAUSE it is a careers page,
with no way to know. That is the same fix already made for the roster reader and
never applied to its sibling. The careers page is now read LAST rather than
skipped, because a small business whose only published address sits there is
still reachable.

The `"using personal off-domain email"` log line was unconditional and false
whenever the siteConfirmed fallback admitted the address — `service@hspools.com`
printed as "personal". Third recorded instance of a message naming the wrong
cause.

### A real owner was missed and a licence qualifier bought instead

Aqua Blue Pools' page reads *"Jerry Owner Kyle General Manager Jim Operations
Manager"*. `ROSTER_NAME_RE` structurally requires two capitalised tokens, so
Jerry was discarded before the title lookahead ran — and the run then spent about
fourteen Firecrawl credits on paid search and came back with a name off a licence
record. The log even said so: *"An ownership word IS in the text, so the page is
here and the layout is what we cannot read."*

The mononym pass is bounded four ways: only when the main pass found no owner,
the next run must be an unambiguous ownership title, the word must not be a
title or a declared section heading, and the row is marked `mononym` so nothing
downstream treats one first name as a settled identity — `foldFirstNameClusters`
is already the mechanism that corroborates it. **The check caught the missing
guard on its first boot**: "Careers" above an ownership word parsed as a person.
There is no dictionary in this process that can tell "Jerry" from "Careers", so
the headings are DECLARED, the way `STEM_COMPLETE_WORDS` and the chain stoplist
are.

And `findOwnerViaLicense` returned `title: parsed.title || 'Owner'` — the exact
`|| 'Owner'` default §41 removed from the merge, back again. Its query asks for
`"license holder" OR qualifier OR owner`, so the name is routinely the tradesman
a company EMPLOYS to hold its state licence. No title is invented now, and a
qualifier is labelled as one.

### The screen

- **Where the five you just ran went.** `contactAt` was stamped on every read and
  consumed by nothing. Every number on the panel counted the whole filtered
  queue, cumulatively, across every press this browser has ever made. One toggle
  now: **This run (5)** beside **The whole queue (16)**, and the stats, the tally
  and the CSV all read whichever is chosen.
- **From a contact read to Research, in one press.** The existing button acts on
  `filtered` top-50-by-score — never the leads just paid for. There is a tick box
  on every card now (the same shape the Research tab's batch runner already
  honours) and a **"Move the N you just read"** button. With nothing ticked the
  old behaviour is untouched.
- **A refused lead does not cost a slot.** The runner takes a POOL plus a number
  and keeps drawing until it has that many GOOD leads, so "read 5" returns five.
- **The duplicates go.** The queue size was rendered twice in identical words a
  few hundred lines apart; the "narrow the list" sentence was printed by two
  panels.

### A read knows how old it is

Contact results are stored whole and re-rendered and re-exported forever.
*"America's Home Place / Last Name / Principal's Contact Info"* — a form-field
label parsed as the decision-maker — was still on the sheet after the parser that
produced it had been fixed, because nothing recorded which build a read came
from. Stamped and FLAGGED, never auto-cleared: a silent re-read spends money the
operator did not ask to spend.

### What was deliberately NOT built

- **No new Supabase table and no SQL.** The bench already carried the cross-run
  memory the chain detector needed.
- **No paid size or revenue source.** Revenue stays unmeasured and the row says so.
- **No `independent` score term.** The plan called for one, and with chains
  dropped outright it could only ever score on the ABSENCE of chain evidence —
  which is precisely what this round's own rule forbids. §66: a mechanism no
  fixture can reach is the kind that rots. What was built instead is the one
  remaining real defect in `size`: its anti-scale carve-out knew only SVP/VP and
  C-suite words, so a 200-person regional operator staffing Regional Directors
  scored the full 35 as though it were a ten-person crew.
- **No audit, ladder or email-copy changes.** PART 6 holds.

### What the falsification runs found in the checks themselves

Twenty reverts, each applied ALONE against a baseline the harness refuses to
start without proving green first. **Two came back GREEN, and both were checks
that could not see what they named.**

- **The denial fixture could not reach the denial guard.** "We are not a
  franchise" trips none of the franchise-SELLING phrases, so the fixture was
  proving `CHAIN_SELF_RE`'s narrowness and nothing at all about
  `CHAIN_DENIAL_RE` — reverting that guard left the boot green. The only shape
  that reaches it is a page that uses the vocabulary and then denies it, and
  that case exists now. §66's rule aimed at a guard rather than at production
  code: a mechanism no fixture can reach is the kind that rots.
- **The tier-1 generic decision had no call-site assertion.** Every mailbox
  fixture exercises `mailboxKind`; `isGeneric` is the CALL SITE, and reverting
  it to the old thirteen-word list left all 23 of them green while a recruiting
  inbox went back to shipping at score 100. Tenth recorded instance of *a check
  that does not assert its call site is half a check* — and the one this round
  was written to close, committed by me inside the round.

Both re-armed reverts then went red on their own named assertions. Final:
**20/20 red alone.**

**273 boot checks green**, and every gate: tdz, dupkeys and scopecheck on both
files, fetchtest, pngscale, clientcheck, batchcheck, auditfuzz over 5,000
vectors, fuzzcore over 20,000 cases, and servercheck's **77** assertions over a
fake network — including a new scenario J that refuses a national franchise on
the contact route with **zero network calls** while an owner-operated pool
company beside it is still read in full.

**HONEST SHAPE: none of this has run against a live press.** The name gate, the
chain evidence, the mailbox vocabulary and the mononym pass are executed at boot
against the exact strings the live run produced, and scenario J drives the route
end to end over a fake network. What a real fifty-lead press returns is settled
by the next run's `📇 FIND CONTACT`, `📇 FIND RUN TALLY` and `🔗 CHAIN OUTLETS`
lines.

**`index.html` changed, so this needs a Netlify deploy**, and the contract is
**20260919** on both sides — without the new server the panel would render a
chain drop as an ordinary read.

---

## 98. The score could not see what the read produced, and a product name was the buyer — 2026-08-31

Vin ran the Find contact button again and sent the panel, a five-row CSV and the
whole Render log. Two asks and one question: *"this section is still messy and
unorganized it needs to look professional"*, *"analyze veyr metickousoly fix fom
root work hard and build sat the highest quality"*, and **"can we trsut the
ratiings on these as well?"**

Every finding below was reproduced by extracting the real functions and
**executing** them. And the first one is not a code defect at all.

### Zero: eight commits were sitting unmerged, so Render was serving §95

The live log printed a format string that does not exist in this tree. Netlify
had the new client. The branch was pushed and **`main` stopped at PR #88** — so
§96 and §97 had never reached the server, and the app was running a new client
against an old one. Vin: *"yes nothing pushed to github thats y."* He was right
about the consequence and I had answered the wrong question, having checked only
that the PUSH succeeded. §37's own rule: **a push to the branch is not a deploy.**

### The ratings could not be trusted. Three reasons, each executed.

- **The score was frozen before the lead was known.** `out.icp =
  findIcpScore(signals)` ran ~370 lines ABOVE the owner lookup and the address
  lookup. So a lead where we found a named buyer and an SMTP-confirmed personal
  address scored **identically** to one where we found neither — the two things
  that decide whether a rep can work the row, structurally invisible to the
  number he sorts by.
- **The denominator moves and the bare number sorts.** The score is a percentage
  of what could be MEASURED, so a lead scored on three signals and one scored on
  seven are divided by different totals. `why` said so; nothing read it.
- **It measured marketing maturity, not fit.** Five terms: size 35, ads 25,
  hiring 20, demand 12, rating 8. Four reward organisational maturity and only
  `rating` is fit-shaped. From the live rows: **Castellano 45** (a real owner, an
  SMTP-verified personal address, textbook ICP) against **DHI Roofing 75** (no
  owner, no address, location pages in six states). The business that already
  has what we sell won, because that is what four of the five terms measure.

**The fix reuses the derivation that already existed.** §94 built
`affordabilityBand` as *"one derivation, three consumers — the Find score, the
card's tier label, and the contact list's own ranking"*. `contactRankFor` reads
it. **`findIcpScore` never had**, which is how three surfaces came to hold three
verdicts about one business.

The scoring moved below the lookups (`signals` stays exactly where it is — the
chain read depends on its position and is deliberately ahead of the paid wave),
and two terms were added beside Vin's three rather than taken from them:
**`afford`** from `affordabilityBand`, and **`reach`** from what the read
actually produced — a decision-maker who cleared the buying floor, and an
address read from its TIER, never from prose that happens to contain the word
"verified". Both leave the denominator when unmeasured, and a lead dropped as a
chain never reached the lookups, so `reachMeasured` is false there rather than
scoring a confident 1. The card and the sort now carry the denominator: it
prints on the face of the number, and it breaks a tie, so a thin read cannot
outrank a full one.

**No `independent` term.** §97 settled that: with chains dropped outright it
could only score on the ABSENCE of chain evidence, which this file forbids.

### A product name was the decision-maker, and it settled the lookup

Floor Daddy shipped **"Vinyl Plank", "Affiliate Partner"** as the buyer. Three
independent causes, all executed:

- **`looksLikeRealName("Vinyl Plank")` is true.** Both name checks are purely
  shape-based; the only defence is a closed list, and *vinyl, plank, laminate,
  carpet, hardwood, tile* are in none of it. Adding flooring words is the list
  that rots.
- **`titleKind("Affiliate Partner")` returned `owner`.** `OWNER_TITLE_RE`
  matches the bare trailing word, so `after` is empty and `ownershipIsHead`
  returns true before anything asks what "Affiliate" modifies. Executed across
  the family: **Channel, Referral, Delivery, Technology and Installation Partner
  all read as owner**, identically to Managing, Founding and Senior Partner.
- **And it SETTLED stage 1.** `rosterConfident` requires `ranked.authority >=
  DM_AUTHORITY_FLOOR`, and `authorityScore('partner')` is **85** against a floor
  of 75 — while the same log line printed **`score 45 | low`**. The gate
  consulted a number the operator never sees and ignored the one he does, so a
  single uncorroborated roster row stood down every paid source.

Three fixes: the affiliation modifiers are **DECLARED** (grammar cannot separate
"Affiliate Partner" from "Managing Partner" and never will, so the modifiers are
written down where a reviewer sees them, the way the deputy list beside them
already is), the label stays a TITLE so it cannot become a person on the next
pass, and `dmConfidenceFor` is one derivation the gate and the log both read.
The list is deliberately NARROW: a small law or accounting firm is squarely in
this ICP, and **Tax, Audit and Advisory Partner are real equity partners who can
buy.** Both directions fixtured, all nineteen strings.

**Deliberately NOT done: refusing a roster row read off a whole page.** The
plan called for it, and reading the code says it would delete real leads — a
homepage that says "John Smith, Owner" is good evidence, and most small
businesses in this ICP put their team there. The composite-confidence bar is
the mechanism; the page-intent rule would have been the guard-too-tight failure.

### The company's own name was six people's job title

Auto Insurance Specialist's footer produced **Office Location, All Rights
Reserved, Agency Office** and **Great Rates**, each with the company's own name
as their title. Reproduced exactly by executing the real `parseTeamRoster`.

One word does it: `titleKind`'s junior test contains `specialist`, and the
business is CALLED "Auto Insurance Specialist" — so its own name tested as a real
staff title, and a truthy kind is all the lookahead needs. `personFromRun` has
refused a NAME made only of the company's own words since it was written;
nothing ever asked the same question of the TITLE. A guard in the right function
on the wrong half of a pair.

They are **not one predicate**, because they are not one question: a name of only
company words is refused outright, while a title may legitimately carry the
company name after a real job word. "Owner, Auto Insurance Specialist" is a
roster line and survives; the shared part is the normaliser and the word set.

### The chain read could not see a locations index

`chainLocationPath` required `/locations/<state>/<city>`. DHI Roofing publishes
`/locations/missouri`, `/locations/kansas`, `/locations/minnesota`,
`/locations/iowa`, `/locations/nebraska`, `/locations/wisconsin` — **one segment
each, and executed against their real sitemap every one returned nothing.**

And it would not have mattered: `links` is built only from the homepage's own
navigation. The 165 URLs `findOwnerViaBrain` maps are a local that **never
leaves the function**, so the sitemap has never once been in scope for the chain
read. Instance twenty-eight of computed-but-not-passed.

Both halves fixed. The one-segment form is accepted at a bar of **three distinct
states** — one state page is ordinary and a two-branch independent inside one
state cannot reach it, while a per-CITY page under a state stays at one, because
that shape is a branch network by construction. And the mapped list is kept
(same key, same TTL and same cap as the leadership-length memo beside it, for
the same reason: two businesses with one name run concurrently by design) and
handed to a **second** chain look. The first look stays where it is and stays
cheap — it caught Truly Nolen on the first page we read, before a credit could
move; the second runs after the owner wave and still saves the address lookup.

### The panel: four bands, not twenty-two blocks

It rendered a heading, five paragraphs of prose, three stat tiles, about fifteen
controls and four boxes in **one flat vertical stack with the prose interleaved
between the controls**, so there was no way to tell what a press would do from
what had already happened.

Four bands in the order the questions get asked — **what this is / what the next
press covers (Scope) / what to press (Read, Export) / what came back (Result)**
— using the file's own `.btn-p`, `.btn-g` and `.btn-sm` instead of recolouring
inline. Prose became captions under the control it describes. **Every control
survives**: this is the button that spends real credits and §39's rule holds,
and `clientcheck` now names each spending and destroying control individually so
a layout change can never quietly delete one.

Three counts went with it:

- **"68 of these 68 reads"** — the stale banner printed the stale count twice.
  True by accident on a queue where every read is stale, false the moment one is
  re-read. My own bug, from §97.
- **The tally read the whole filtered queue while every stat above it read
  `_scoped`**, so with "This run" selected the header and the tally described
  different sets of leads on one panel.
- **The primary button's pool is named rather than forced.** It draws from the
  whole queue and the stats describe what is on screen; those are genuinely two
  populations, so each says which it is instead of one being bent to fit.

### What the falsification runs found in the checks themselves

Four failures on the FIRST boot after the fixes, every one mine:

- **`dmConfidenceFor(null)` returned 'low'.** `Number(null)` is 0 and
  `Number.isFinite(0)` is true — the null-laundering trap, inside the function
  written this round to close a different one, caught by its own fixture.
- **The self-matching needle, twice.** My assertion that exactly one place
  computes the contact score was written as a regex literal, so it sat in
  `_src`, **found itself**, and failed a correct build. And the needle guarding
  the roster settle was written with an EMPTY second half, which joins to one
  contiguous literal in the check's own body — it passed on a build with the
  guard removed, and only the falsification run found it. Nineteenth and
  twentieth recorded instances in this file.
- Two blocks used `_src` and `_n` above the lines that declare them.

And three reverts did not prove what they named on the first pass:

- **`rosterConfidence` (the empty-half needle above).**
- **A check that does not assert its call site is half a check.** The
  dropped-lead fixture hands `reachMeasured` in as false, so it proves the TERM
  reads the flag and nothing about the line that WRITES it — reverting that
  write to a bare `true` left every fixture green.
- **A revert with two anchors is NO VERDICT, not a pass.** The tally was
  computed twice, once per branch of a ternary, so the anchor matched twice and
  the harness said so rather than reporting a colour. One call now, with the
  branch choosing only the words in front of it.

And one fixture asserted a number I had assumed rather than measured: the
no-website lead scores on **three** signals, not four — with no industry there
is no trade tier and no capacity class, so the affordability band correctly
declines to speak. Corrected to the measured value, with the reason written at
the assertion.

**273 boot checks green**, every gate green, and every fix reverted ALONE
against a baseline the harness proves green before it starts.

**`index.html` changed, so this needs a Netlify deploy**, and the contract is
**20260920** on both sides.

---

## 99. The roster knew trades and nothing else, and the Find tab had no done state — 2026-09-01

Vin ran three leads on the merged build and hit two things at once: the panel
said *"Get contacts for 3 leads"* when 5 was selected, and with 80 of 80 read he
was **stuck** — the only two buttons on offer were "Re-read 77" and "Clear 80
read", both of which spend credits to go backwards. In his words: *"if a lead
gets read it wont get read again and it can only be added to pipeline for
audit... i think we need a whole format change becasue im getting confused."*
He could not run the one-lead cost test either, because there was nothing left
to read.

Every finding below was reproduced by **executing** the real functions out of
`server.js`, not by reading them.

### The roster parser knew trades and nothing else

Run the real `parseTeamRoster` over 41 realistic roster titles and **29 come
back NULL** — and a null kind means the run is not a title, so **the name above
it is never paired.** Every one of the 29 is a professional practice:

```
law        Attorney NULL · Attorney at Law NULL · Of Counsel NULL ·
           Shareholder NULL · Managing Attorney NULL · Esq. NULL
dental     Dentist NULL · DDS NULL · DMD NULL · Orthodontist NULL · Oral Surgeon NULL
medical    Physician NULL · MD NULL · Plastic Surgeon NULL · Dermatologist NULL ·
           Veterinarian NULL · DVM NULL · Optometrist NULL · Chiropractor NULL
accounting CPA NULL · Certified Public Accountant NULL · Accountant NULL
trades     Owner owner · President owner · Founder owner · Estimator staff   ← all fine
```

**Fifteen of the 114 rows in `GP_CATEGORIES` are professional practices**, and
the ICP is *"trades and owner-operated professional practices"*. So the free
owner read was dark on the whole second half of what this pipeline hunts.

It is also the cost lever, and that is why it led the round. A lead whose free
read settles the owner costs **0 Firecrawl credits**; one that does not buys the
paid search wave at about **10**. From Vin's own log: McCormick Law 0, Statewide
Remodeling 10, Greater Cincinnati Chiro 10. The Firecrawl free tier is **1,000
credits, ever** — corrected against his account; this file said 500 for weeks —
so it is the difference between roughly a thousand leads and roughly a hundred
and fifty.

Three vocabularies, declared the way `STEM_COMPLETE_WORDS` and
`NICHE_BRIEF_EXPECT` are, so a vertical added later cannot inherit one by
accident:

- **owner-level** — `shareholder` and `managing attorney` are the two ownership
  titles a practice uses that `OWNER_TITLE_RE` did not carry. A shareholder of a
  professional corporation is an equity owner; a managing attorney runs the
  firm. Both settle the owner and skip the paid wave. They join
  `TITLE_AUTHORITY`'s 85 row too, because scored 30 they sat below the buying
  floor and the settle could not fire whatever the parser said.
- **practitioner** — Attorney, Of Counsel, Dentist, DDS, MD, CPA and the rest.
  Its own answer rather than folded into 'staff', because the three mean
  different things: it pairs the name, it reaches the model as corroboration,
  and it **never sets isOwner**. An associate attorney is not the buyer.
  `TITLE_AUTHORITY` already scored these 80 with the reasoning written at it —
  *"at a small practice the credentialed person almost always owns it, but a
  group employs many, so corroboration decides the rest"* — which is exactly this
  rule. The gap was only ever that the parser refused to see the title at all.
- **practice staff** — paralegal, hygienist, treatment coordinator. Checked
  first, because a coordinator at an oral surgery practice can carry a
  practitioner word.

**Deliberately NOT added: a bare `Member`.** It is the ownership word at an LLC
and it is also "Team Member" and "Board Member", and there is no grammar between
them. `Managing Member` is the form a firm prints and it already resolved.

**One head rule, parameterised rather than copied.** `titleHeadIs(title,
pattern)` carries every guard the ownership pattern earned — the possessive that
shipped "Principal's Contact Info" as a person, the partner-program modifiers,
the followers list — and `ownershipIsHead` and `professionalOwnerIsHead` are two
lines over it. A second copy of that function is the two-hand-kept-copies
disease, and the copy that rots is always the newer one.

**And the shape filter was deleting the dotted forms.** `Esq.`, `D.O.` and
`D.C.` were refused as *"a sentence, not a title"* on a bare `/[.!?;]/` test —
so the filter was deleting exactly the titles the vocabulary had just been
taught. An abbreviation's periods follow a single letter or end the string;
strip those two and any period left is real punctuation. **Bounded to three
words, and the boot caught why on the first run**: *"Gain a partner, keep your
practice."* is a marketing line off Alliance Animal Health that ends in a period
and carries the word partner, so an unbounded strip handed it to
`ownershipIsHead` and a nav label became the decision-maker again — the exact
live failure section one of that check exists for.

29 NULL down to 9, and the 9 are the correct refusals: Member, Team Member,
Partner Track, CEO Roundtable, Shareholder Services, Do It Right.

### The log turned our missing vocabulary into a claim about their business

The ROSTER line printed, whenever `OWNER_TITLE_RE` found nothing in the corpus:

> *No ownership word appears anywhere in the text, so their pages **genuinely do
> not state who owns the business**.*

Executed, that pattern **misses** *"Cagney McCormick, Attorney at Law"* and
*"Dr. Michael Hekler, DC — Chiropractor"*. It fired on two pages that plainly do
say who runs the firm. A fact about our word list, dressed as a fact about them
— the message-names-the-wrong-cause class, and the fourth recorded instance. The
hint now searches every vocabulary the parser has, and the sentence says the
honest thing: either their pages do not state it, or they use words this parser
does not know.

### The calling window was measured, free, and thrown away

`callWindowFor` has fed Mike's audit sheet since the call sheet was built, and
`publishedHours` has been captured free on the discovery call since the capacity
read was added. **The two had never met**: `contactRequestBody` did not send the
hours, so they arrived `undefined` on every contact read — which also silently
killed the affordability band's staffed term. Instance twenty-nine of
computed-but-not-passed.

`readPublishedHours` also threw the weekday TEXT away the moment it had counted
it, so there was nothing for the window to read even once the wire existed. It
keeps the lines now, the window is computed on the contact read, it renders on
the card beside the number it is about, and it is the **ninth lean CSV column**
— for a calling motion it is the most useful free field there is. A listing that
publishes no hours produces an EMPTY cell, never a guess.

### "Get contacts for 3 leads" — the number was right and the sentence was a lie

120 in queue, 40 hidden by the Google-listing filter, 80 on screen, 77 read,
**3 unread**, so `min(5, 3)` was correct. The caption said *"3 unread in the
whole queue"* and the whole queue had 43. The panel named the wrong population.

### Three tabs, and a read lead leaves the pool

**Not read / Read / Ruled out**, with the counts in the tab row — 13 / 67 / 6
already says where every lead is, so the three stat tiles that used to show a
slice of the same thing are gone rather than sitting beside it. `contactTabOf`
is module-scope and pure, because the section filters it replaces lived inline
in the render where nothing could execute them, and **the list is the tab too**:
counting alone would have left "a read lead leaves the pool" true of the numbers
and false of the screen, which is the whole complaint.

**Every control that spends now lives on one tab.** That is what fixes the state
Vin was stuck in: the screen you land on when there is nothing left to read
cannot offer Re-read and Clear as its only two buttons, because both belong to
the Read tab. With no unread leads the Not-read tab says so and offers **Find
more leads** and, when the filter is hiding some, **Include the other lanes**.

**A failed read stays in Not read.** The plan for this round filed it under
Ruled out; that is wrong, and it is the exact failure that retired a hundred
leads against a paused server on 2026-08-28. A dead server is something that
might work next time, so it has to come back. A server VERDICT is not — asking
again cannot change it — so that keeps its own tab and its own way back.

The run-scope toggle survives, moved into the Read tab beside the tally
sentence it re-points, which is the only place it means anything. Two toggles
above three tabs was the confusion, not the fix.

### The eponymous settle keeps no confidence bar, and now says so

The roster settle grew `rosterConfidence !== 'low'` on 2026-08-31, because one
uncorroborated roster row scored 45 and stood down every paid source. McCormick
Law then settled through the EPONYMOUS path at score 25, and the asymmetry was
an accident of which rule had been tightened.

It stays open **on purpose**, and it is written down as a decision instead of
left as one. A low score there is almost always NO TITLE FOUND rather than a
doubtful person, and an eponymous business whose own site names a person with no
title is precisely the shape the rule exists for — adding the bar would refuse
those leads and buy the paid wave back on every one of them. What guards it is
the evidence rather than a score: the name must be read off their OWN site at
high confidence AND the business must be named after them, which is two
artifacts of the owner's own making. Asserted in both directions, because the
cheap way to "tidy" this is to add the bar.

### What the falsification runs found

Every fix reverted ALONE against a baseline the harness proves green first.

- **A ruler that overshoots costs what a false green costs.** My first eponymous
  assertion sliced a fixed 260 characters from the declaration, ran straight
  past it into the roster settle below — which legitimately mentions the bar —
  and the boot went RED on a correct build. It slices to the statement's own
  terminator now.
- **And the boot caught the marketing-line regression** described above, on the
  first run after the abbreviation fix, which is section one of OWNER TRUTH
  CHECK doing exactly the job it was written for.

**A guard I wrote this round caught a defect nobody had reported.** Asserting
that every owner-level title clears the buying floor went RED on **`Managing
Member`**, which scored 30 — `TITLE_AUTHORITY`'s 85 row had every managing form
except the one an LLC actually uses. So a roster naming the firm's owner in the
firm's own words was read correctly as an owner and still bought the paid wave.
Pre-existing, and only the new assertion found it.

**273 boot checks green.** Seventeen falsifications, each reverted alone against
a baseline the harness proves green first, each red on its own named assertion.
Two came back GREEN on the first pass, and both were mechanisms with no guard at
all: nothing asserted that an owner-level title clears the buying floor (the
roster fixtures test `isOwner`, and `isOwner` alone settles nothing), and nothing
asserted that the ROSTER hint reads every vocabulary. Both have executed guards
now, and the hint became one shared derivation rather than a rule the check would
have had to copy.

**`index.html` changed, so this needs a Netlify deploy**, and the contract is
**20260921** on both sides — without the new server the calling window arrives
empty on every row.

---

## 100. Four nav labels became the decision-maker, and the price was measured at last — 2026-09-01

Vin ran two Find presses and nine contact reads on the merged Round 99 build and
sent the whole Render log, the exported CSV and Deirdre Taylor's audit. The round
worked in part — Diehl-Whittaker's nine-person roster parsed perfectly, Founder
through Funeral Assistant, and settled the owner for **zero credits**. The
calling window landed and is populated in the file.

The log carried five reproducible defects. One was mine from Round 99, and one
was **in the exported CSV that morning**.

### The price, measured rather than estimated

Three sessions had proposed cuts to a bill nobody had measured. From that run's
own meter lines:

| | measured |
|---|---|
| Find press | **60 Places queries = $2.10** (the log's own cumulative counter, $2.10 then $4.20) |
| Contact read | **6.33 Firecrawl credits, $0.0076 of model** across nine leads |
| Genuine free-settle | **2 of 9** — and a third "settled" on a nav label, so the real rate is worse than the log said |

At 50 a day × 22 days = 1,100 leads a month: **~6,970 Firecrawl credits**
(Standard $99; Hobby's ~3,000 does not reach), **$8.34 of Anthropic**, and
**$0 of Places** — four presses of 60 queries sits inside Google's free
1,000/month. **Roughly $115–135 a month, and Firecrawl is ~75% of it.**

**Vin's hypothesis was measured false.** Find is $2.10 a press and effectively
free per month; the contact reads are the whole bill. And the single number
driving them is the free-settle rate: at 22% it is ~6,970 credits, at 60% it is
~3,520 — the difference between the $99 plan and the $16 one. So the owner
fixes below are the quality fix *and* the cost fix, which is why they led.

### A nav label became the decision-maker — and one of them SETTLED

```
👤 ROSTER [Jim Reynolds Asphalt]:  Contact Us Feedback is "Become a Partner"
👤 ROSTER [THE ALLEN CPA FIRM]:    Corporate Responsibility is "Meet the President"
DM [THE ALLEN CPA FIRM]: settled at stage 1 — skipped web search (~10 credits saved)
```

Executed rather than read: `ownershipIsHead("Meet the President")` returned
**true at authority 90**, `ownershipIsHead("Become a Partner")` **true at 85**.
Both parse as owner-level, and Allen CPA **stood down every paid source on
one** — so the CSV shipped `Corporate Responsibility / Meet the President` as
the person to ask for.

This is the "Partner Track" class one grammatical step sideways. `titleHeadIs`
asks what FOLLOWS the ownership word and never what PRECEDES it, so a call to
action whose object happens to be an ownership noun read as a title.

**The same head rule, looking left.** A phrase whose head is an **imperative
verb** — meet, become, join, contact, see, find, ask, learn, request, schedule,
donate — is a nav label, not a job somebody holds, and it is disqualified before
the pattern runs at all. No real title opens with one; "Managing" and "Acting"
are participles and were already resolving. Both directions fixtured, because a
verb list widened until it eats "Owner/Operator" is the more expensive failure.

### My own Round 99 regression: the practitioner words matched anywhere

```
👤 ROSTER [Bradley Hull IV]: Video Center (An Ohio Attorney For),
   Services Across Ohio (Compassionate Attorney), Firearms Trusts (Power Of Attorney)
```

Before Round 99 `attorney` returned NULL and these paired with nobody. I added
`PRACTITIONER_TITLE_RE` as a **bare `.test()`** with no head rule — so "Power Of
Attorney", a legal instrument, became a job title, and three junk names were
paired behind it. Round 99's own entry says the head rule is *"parameterised
rather than copied"*, and I then wrote the one new caller that skipped it.

Two fixes, both through the one function: the practitioner words go through
`titleHeadIs` exactly as the ownership words do, and `titleHeadIs` learned that
**an ownership word preceded by a preposition is that preposition's object**.
The bar is deliberately narrow — "Of Counsel" is a REAL law-firm title and a
bare preposition test would delete it. What separates them is whether anything
sits in FRONT of the preposition: "Of Counsel" opens on it, "Power Of Attorney"
has a noun before it.

### "Surek Plastic Surgery" and "Firearms Trusts" parsed as people

Both clear `ROSTER_NAME_RE` — three and two capitalised words. `personFromRun`
has refused a name made only of the LEAD's own company words since it was
written, which does nothing when the name belongs to a *different* company.

`BUSINESS_TAIL` refuses a run whose **last** token is a noun that ends a firm's
name and ends nobody's — surgery, dentistry, construction, trusts, associates,
clinic. Only the last token, because that is the surname slot, and the list is
narrow on purpose: **"Law", "Bell" and "Steele" are real surnames and are absent
by decision**. Jude Law and Mary Steele are fixtures that must survive.

### The contact path had no wrong-company guard

```
FC PAID [map] quinnplasticsurgery.com
👤 ROSTER [Quinn Plastic Surgery]: — Surek Plastic Surgery (Board-Certified Plastic Surgeon)
DM/brain [Quinn Plastic Surgery]: ✓ Chris Surek [high]
```

**quinnplasticsurgery.com serves Surek Plastic Surgery's content.** We read
Chris Surek as the owner of Quinn's practice. The paid wave rescued it — Yelp
and the licence record both said John Michael Quinn — but only by luck, and it
cost 8 credits. `confirmDomainMatch` exists and the contact route never calls
it.

The guard here is **free rather than a model call**: not one distinctive word of
the lead's own name appears anywhere in the pages we read. "Quinn" is in the
domain and absent from every page. **A note, never a drop** — a business that
rebranded is still the business, and §14 records what a guard too tight costs.

**And the flag needed a home, which is where it nearly died.** The server also
pushes a note, and the notes line on the card renders **only when there is no
owner and no email** — which is precisely the case this flag does not describe,
because here both exist and both may belong to somebody else. A guard in the
wrong place, found by reading which branch the note lands in rather than by
watching it fail. It is its own line on the card now, in the one colour this
screen reserves for a stop, and it rides the merge as its own field.

### A lead the server RULED OUT was in the exported CSV

```
🔗 FIND CONTACT [Daniel Bortnick, MD]: DROPPED as a branch of a larger operation
```

and his row was in the file, ICP 45, with a phone number off his Google listing.
Mine, from the round that added the tabs: I filtered the rendered LIST by tab and
left the export reading the whole pool, and `hasContactData` only asks whether
there is something to dial.

The membership rule lives in `findContactRows` now, so the CSV and the Google
Sheet both inherit it rather than each carrying a copy — the destination added
next is correct without knowing this happened. The two panel counts were reading
two populations for the same reason and now read one.

### The paid wave is measured rather than argued about

Miller's Integrity Construction cost 10 credits and produced nothing: the free
read found zero names and zero ownership words, all three paid stages ran, and
nothing came back. Jerry Spears was the same shape and produced a name the
authority gate then HELD BACK — 11 credits for an unusable row.

Two of two in one run is not evidence, and a stand-down decided on one afternoon
is exactly how a real source gets switched off. So `💸 OWNER WAVE` records, per
lead, whether the paid wave was bought, what it produced (a buyer we can name, a
name below the buying floor, or nobody), which sources settled it, and what it
cost. **Grepped across a batch that line IS the free-settle rate**, and that rate
is what decides the Firecrawl plan. The stand-down waits for it.

### What was deliberately NOT done

- **No stand-down on the paid owner wave**, until the line above has real numbers
  from a real batch.
- **No widening of the enterprise name filter.** §91 recorded that it catches
  none of the six national brands that cost money, and §14 records what widening
  it costs. Scope, not names, is the mechanism.
- **Deirdre Taylor's audit contradiction is diagnosed as unknown, not guessed.**
  Her story says *"She ranks #3 of 20"* and *"7 of 10 measured signals are
  clean"* while the funnel says **Getting found: NOT MEASURED**. One of those is
  false and which one cannot be told without her audit's own Render log — the log
  sent was the Find and contact run. Asked for rather than answered.
- **The verifier ran out of credits mid-run.** §94's latch re-tested and
  recovered on its own. That is a top-up, not code.

### What the falsification runs found

**Thirteen reverts, each applied alone against a baseline the harness proves
green first, each red on its own named assertion.** Two things were wrong in the
checks rather than the code:

- **One needle covered two call sites.** The wrong-company flag and the owner
  wave line were asserted with a single `||`, so both went red when either was
  reverted and the message could not say which. A guard that fires with the wrong
  cause on it costs what a missing one costs, and this file records the same
  shape at the `leakWhereFor` and mailto scanners. Two assertions now, each
  naming its own consequence.
- **The render had no guard until the falsification pass asked for one.** The
  merge wire and the card line are asserted separately, and reverting either goes
  red on its own sentence.

**273 boot checks green**, every gate: tdz, dupkeys and scopecheck on both files,
fetchtest, pngscale, clientcheck, batchcheck, auditfuzz over 5,000 vectors,
fuzzcore over 20,000 cases, servercheck's **81** assertions over a fake network,
and 2,050 emails composed over HTTP.

**HONEST SHAPE: none of this has run against a live press.** Every fix is
executed at boot or in `clientcheck` against the exact strings the 2026-09-01 run
produced. What a real fifty-lead press yields is settled by the next run's
`💸 OWNER WAVE` and `📇 FIND RUN TALLY` lines.

**`index.html` changed, so this needs a Netlify deploy**, and the contract is
**20260922** on both sides — a stale page renders the ruled-out leads into the
CSV and shows no wrong-company stop, and it will say so by number.

---

## 101. The row could not tell a confirmed owner from a guess — 2026-09-01

Vin, on the only thing that matters now: *"the only goal right now is to get the
highest quality possible leads of our ICP to our sales guy. thats the only goal
right now nothigni else. so lets think on how quality can be increased."* And he
asked for a number out of ten.

**The honest answer was 5, and it was about 3 before Round 100.** Rated against
the only two live logs this project has saved rather than against impressions:

| | | why |
|---|---|---|
| Right company | **7/10** | discovery's ICP filters are strong; the contact route re-checks almost nothing |
| **Right person** | **4/10** | the weak link, and most of the gap |
| Reachable | **5/10** | one SMTP-confirmed address in eleven |
| Rep can act | **6/10** | phone, calling window, three signals; no reason to call |

From `vinlogs.txt` — eleven leads, running the same owner and email machinery
this list uses: an owner name was emitted on **11 of 11** and ten cleared the
buying floor, but only **4 of 11** settled on the free read, only **1 of 11**
produced an SMTP-confirmed address, and **4 of 11** ended with both a usable
owner and a usable email. From the 2026-09-01 nine-lead contact run: free-settle
**2 of 9**, four of the owner rows navigation labels or another company's owner —
those four fixed in Round 100.

**The one-sentence diagnosis: the row cannot tell a confirmed owner from a guess,
and neither can the rep.** `findDecisionMaker` has computed `canBuy`,
`authority`, `sources` and `corroborated` since it was written. The card rendered
the name and the title and threw the rest away, so a name the buying-floor gate
HELD BACK shipped looking exactly like one three sources agree about.

### The best free owner source was wired and structurally unreachable

`findOwnerViaReviewReplies` is weighted 35 and guarded on `(placeId &&
apifyToken)`. The contact route passed **`placeId: ''`** and **`apifyToken: ''`**
for its whole life. At an owner-run shop whoever answers the Google reviews IS
the owner, and he signs them — it is the best free read of who to ask for that
this system can buy, and it could never fire on the one list a rep dials from.

Both values already existed: `placeId` on the queued company, `apifyToken` a
declared Settings field already sent on the research path. Neither was sent.

**It runs as a stage 1.5, not in stage 1**, because it bills an Apify review
pull. Stage 1 is genuinely free; this runs only on the leads stage 1 could not
settle — which are exactly the leads about to buy the ~10-credit stage-2 search
wave. That is the owner's own rule for it: only when free fails.

**And the first placement was wrong in a way only the end-to-end check caught.**
It sat below the dead-site early return, which silenced it on precisely the leads
that need it most: a site that returned nothing is the one case where their
Google reviews are the ONLY place an owner's name can still come from. The 402
scenario in `servercheck` went red, and the fix was to move it above that return.
A boot fixture could not have seen it.

### Four grades, and the two thin settles are named rather than removed

Vin's rule for a weak name: *"we really need the woners name to be correct
because if we are asking for them and its wrong its not good but we are able to
pivot like is jogn not the owner?"* The name **ships, graded**, and the row tells
the rep how to open.

| grade | when |
|---|---|
| **confirmed** | corroborated across two independent sources |
| **stated** | their own site says so, one source, nothing corroborating |
| **inferred** | the business is named after him and nothing else names an owner |
| **unconfirmed** | the buying-floor gate held the name back |

`eponymousConfident` carries no confidence floor at all and `rosterConfident`
fires on one uncorroborated roster row. Both are **kept** — each saves ~10
Firecrawl credits and §99 recorded the decision to leave the first open — and
what changed is that their output is labelled. `ownerAskLine` builds the pivot
sentence ONCE on the server, so the card, the CSV and the Google Sheet cannot
describe one row three ways.

### The demotion finally reaches the number

`contactRequestBody` never sent `outsideBand` or `aboveSizeCeiling`, so
`findIcpScore` could not see them and a 4.9-star business the star band demoted
scored exactly like an in-band one. Vin, asked what should happen: *"i mean if
its already demoted ti would be shown in its overall rating out of 100."* It was
not; now it is.

**The numbers come from the table that already declares them.**
`demotionPenalty` reads `CONTACT_RANK_TERMS`, the same list the contact ranker
reads, so the two can never disagree about what a demotion costs — and the boot
check asserts the delta EQUALS that table rather than a literal. Applied after
the ratio and never as a term: a negative max would change the denominator, so a
demoted lead would be scored out of a different total than a clean one.

**And the two demotion reasons were described with the same words.** Both strings
said "review ceiling", so the RATING-band demotion read as a review-count one and
the new CSV column would have disagreed with the card about the same lead.

### Six email states, not one word

Published-personal, SMTP-confirmed, a **role mailbox** (a careers-page
`recruiting@` on another domain ships tier 1 `sendable:true` by decision, with
only its score and label moved), a **catch-all** domain (cannot bounce, may not
be his box), a **pattern guess**, and the one that is not about the address at
all — **the verifier was down**, so tier 2 was unreachable and every later lead
silently fell to tier 3 or 4.

Graded at the single wrapper every one of the core's returns passes through, so
nothing re-decides it. This also replaces the client's regex-over-the-label
derivation, which was a fourth copy of a rule that already had three. A missing
verifier KEY is deliberately not an outage: it is a setting nobody filled in, and
reporting the two as one makes every run by an operator without the key read as
a failure.

### An absence claim needs a look

`readChainEvidence` has computed `measured` since it was written and the consumer
read only `isChain` — so a site we could not open returned `isChain:false` and
was treated exactly like a business we proved independent. It says what is
unknown now, and it does NOT score against the lead: charging a business for our
own blindness is the guard-too-tight failure.

### The number that decides everything

Nothing in this project has ever counted whether the owner resolver and the email
engine work. `findRunTally` now counts **rep-ready** rows — the company was kept,
the name is one we stand behind, the address will deliver, and there is a number
to dial — plus **pivot-ready**, the rows a caller can still work on an
unconfirmed name, because that was the owner's own decision about weak names.
`findTallyLine` prints it FIRST: a counter computed and never shown is the exact
defect this round exists to close, and the check asserts the print as well as the
count.

**And `verifierOff` was dead.** It grepped `contactNotes` for the word
"verifier", and no note written anywhere on the contact path contains it — so the
counter printed nothing on precisely the runs where every address was silently
downgraded. It reads the server's own flag now, and a fixture asserts that note
prose can no longer be counted.

### What the falsification runs found

**Thirty-one reverts, each applied alone against a baseline the harness proves
green first. Ten came back GREEN on the first pass, and every one of the ten was
a mechanism with no guard at all** — which is the whole reason for running them:

- Nothing asserted the Apify token was READ off the request. The wire forwards a
  variable, and a variable hard-coded to `''` satisfies it perfectly.
- Nothing asserted stage 1.5 was LIVE. The position needle finds the call
  wherever it sits, so neutering its condition left the call in place.
- Nothing asserted WHICH rule settled the owner was recorded. The grade fixtures
  are handed `settledBy` directly, so they prove the reader and never the writer.
- The catch-all return's own declaration, the verifier-down override on the
  catch-all branch, and the string-tier laundering case each had no fixture that
  could reach them.
- And four client wires — the place id, the token, the demotion flags and the
  chain measurement — were sent and never asserted.

Two more things were wrong in the harness rather than the code. **The Apify
assertion counted the whole run's requests**, and the golden lead legitimately
buys a review pull, so it was measuring another scenario's spend — scoped to the
lead's own window now. And **a global find-and-replace of a needle helper name
renamed 39 lines it had no business touching**; caught by diffing every changed
line against HEAD and restoring the ones whose only difference was the rename.

**273 boot checks green**, every gate: tdz, dupkeys and scopecheck on both files,
fetchtest, pngscale, clientcheck, batchcheck, auditfuzz over 5,000 vectors,
fuzzcore over 20,000 cases, servercheck's **86** assertions over a fake network,
and 2,045 emails composed over HTTP.

### Deliberately NOT in this round

- **Re-weighting `findIcpScore`.** `ads` 25 + `hiring` 20 of 135 rewards
  marketing maturity rather than ICP fit, and only `rating` and `afford` are
  fit-shaped. Real, and it re-orders every list — so it should be measured
  against a baseline rather than changed at the moment the baseline is created.
- **Running `contactRankFor` on this path.** Two rankers over one list is the
  disease; the resolution is one ranker, and that is a bigger decision.
- **Any paid revenue or headcount source** — the owner's standing decision. The
  proxies are named as proxies and there is no dollar band anywhere.
- **Removing the two thin settles** — they save credits and grading them is the
  honest fix.

**HONEST SHAPE: none of this has run against a live press.** Every fix is
executed at boot, in `clientcheck`, or driven end to end over the fake network.
The quality number becomes real on the next fifty-lead run, when the
`📇 FIND RUN TALLY` line reports how many rows a rep could actually work — and
until it is read, every judgement in this section is inference.

**`index.html` changed, so this needs a Netlify deploy**, and the contract is
**20260923** on both sides — a stale page sends no place id, no Apify token and
no demotion flags, so the free owner source stays dead and every demoted lead
scores like a clean one.

## 102. The owner was on the page and the parser could not read it — 2026-09-01

Vin asked for 25 contact reads, got 31, and read the file: *"im seeing a lot
with no decion maker thats a problme id say thats more important than capturing
the email."* He is right, and the cause is not the paid lookups. **Every finding
below was reproduced by EXECUTING the real functions against the exact strings
from his run.**

### First, the honest finding: that run was on a build two steps behind

Three strings on his screen cannot be produced by HEAD — `every column (27
instead of 9)` where the arrays hold 30 and 11, a tally with no `ready to work`
clause where index.html always emits one, and a CSV header reading `ICP score
out of 10` where it reads `out of 100`. And no `♻ DM` line appears anywhere in
the log, which server.js prints on every lead stage 1 fails to settle.

**So PR #92 was unmerged and the Netlify file was never dragged.** Round 101's
review-reply owner source — the free source that names an owner-run shop's
owner — did not run on a single one of the 19 leads that went on to buy the
paid search wave. Some of what he was looking at was already fixed and
undeployed, and this entry must not take credit for it.

### What his log measures (30 leads with an OWNER WAVE line)

| | |
|---|---|
| free settle producing a buyer | **8 of 30** — two of them garbage (below) |
| paid wave bought | **19 leads, 160 Firecrawl credits** |
| paid wave that produced **nobody at all** | **7 leads, 71 credits** |
| **paid credits that bought nothing usable** | **77 of 160 — 48%** |
| rows with no usable decision-maker | **13 of 30 — 43%** |

And the number that decided the round: **21 of the 25 sites we read returned
`Read 0 name/title pair(s)`.** The roster parser worked on four. On **ten** of
those 21 the log itself said *"An ownership word IS in the text, so the page is
here and the layout is what we cannot read"* — and seven of those ten then
bought the paid wave anyway: Ecoview 6, Bid-Rite 8, Red's 10, Andrew's 6,
Today's Dentistry 11, Premier 6, American Roofing 13 = **60 credits spent
re-finding an answer we had already read**, two of which still came back with
nobody.

### Six defects in the roster parser, each with a live example

The parser validates the name by SHAPE (`ROSTER_NAME_RE`) and the title by SHAPE
(`looksLikeJobTitle`). Neither side ever asked whether the thing in the name slot
is a person or whether the thing in the title slot contains one.

- **`parseTeamRoster` never called `looksLikeRealName`.** That one function holds
  `BUSINESS_TAIL`, `jobWord` and `junkWhole` — the three guards written for
  exactly this — and the roster was the ONE owner source that skipped it.
  Executed: `ROSTER_NAME_RE` MATCHES `"Iron Sharpens Iron"`, `"Trefoil
  Holdings"`, `"National Paving Solutions"` and `"Our Owner"`, while
  `looksLikeRealName` refuses `"Trefoil Holdings"` on `holdings` and `"Our
  Owner"` on `our`. **Live consequence: Cooper CPA Group shipped with
  decision-maker "Trefoil Holdings" at the TOP of the exported file, score 88.**
  A guard in the wrong function; one call site closes three live failures.
- **A title carrying a person's name.** Executed: `titleHeadIs("President & CEO
  Jon Schilling", OWNER_TITLE_RE)` returns **true** — the ownership word matches
  at index 0, what follows starts with `&`, so the "punctuation means head"
  branch returns true and the real person downstream of it is never examined. JR
  & Co shipped **"Iron Sharpens Iron" / "President & CEO Jon Schilling"**, and
  its two siblings the same way. Two outcomes now, and the split is the safety:
  if the name slot is not a person the person in the title IS the row and we
  recover it; if BOTH slots name somebody the row keeps its pairing and loses its
  ownership claim, because an owner we cannot identify beats the wrong one on a
  sheet somebody dials from.
- **Title-before-name was structurally unreachable.** The name is always the
  first comma-segment, the inline title is always what follows it, and the
  lookahead runs strictly forward. Scott Roofing's own page says **"CEO Brian
  Scott and president Mike Scott"** and the parser returned `[]`. Splitting on
  " and " first is what keeps the pairing honest: taken whole the trailing name
  is Mike, and the CEO is Brian.
- **The name-is-a-title guard was switched off by a comma.** It read `if
  (!p.inlineTitle && titleKind(runs[i]))` — conditioned that way because "Jenny
  McDowell, Owner" reads as a title end to end — so any run carrying an inline
  title never got asked. That is how **"Branch Manager"** became a person. The
  question is asked of the NAME SLOT now, which is both stricter and correct.
- **A first name ships, marked.** *Vin's decision.* Ecoview's page says **"Our
  Owner, Carl"**; we discarded it and paid 6 credits for the surname. It is
  emitted with `mononym: true`, counts as an owner for the caller, and never
  builds an email address — the held-back email rule already refuses an unvouched
  name.
- **A role noun is not a surname.** `FIND_ROLE_NOUN` moved up beside the parser
  so both readers ask one question. This is the expensive half: "Master Plumber"
  is name-SHAPED by every pattern in the file, and the falsification proved it —
  reverting that one test turns the correct row "David S Graham / Owner, Master
  Plumber" into **a person called Master Plumber**.

**Corroboration is unchanged** (*Vin's decision*): their own team page settles the
owner for free and the row says "stated on their own site".

### The counts — four separate causes, all verified

- **The overshoot.** The runner checked `kept >= want` **before** the draw with a
  pool of six workers, so at `kept === want - 1` all six passed the guard and
  drew. Ceiling was `want + 5`. **25 asked, 31 read — exactly this.** The slot is
  reserved before the work now.
- **A failed read consumed a slot** while the lead stayed in Not-read and the
  panel promised "the button above picks them up again". Only a lead we actually
  read consumes one of the N; the three-strike dead-server stop is what bounds
  the loop when every read is failing.
- **A chain drop was counted twice and exported never.** `contactFieldsFrom` sets
  both `contactReadOk: true` and `contactNotFit: true`, so the tally counted it as
  read while the tabs filed it as Ruled out — it was inside "31 read" AND inside
  "Ruled out 4" and in no file. One membership rule now, read by both.
- **The move bar ignored the scope checkbox.** It read `filtered`, one link above
  `_cShown`, so "Move all 92" offered to move the 32 leads the panel directly
  above says it is hiding — and those 32 are the non-Places lanes that panel
  warns about by name.

### Deliberately NOT in this round

- **Raising the free page budget.** Tempting, and the evidence refuses it: Today's
  Dentistry read ONE page and that page contains `"Dr. Ryan L. Olson, DDS"` in the
  parser's own hint text. The answer was already in the corpus. Fix the reader,
  not the budget.
- **Widening `looksLikeRealName` to accept mononyms globally** — it decides which
  mailbox an owner-addressed email is sent to. The first-name rule is scoped to
  the roster and to the caller.
- **The email half.** The verifier ran out of credits mid-run and **13 domains
  came back `Catch-all probe: COULD NOT RUN`** — ~42% of the run had no SMTP
  check at all, which is what "1 mailbox-confirmed, 6 a guess" is. That is a
  top-up at myemailverifier.com, not a build; §94's latch recovered on its own
  twice in the same log, exactly as designed.
- **Any paid revenue or headcount source**, and **no ranking or audit-copy
  change.** PART 6 holds.

### What the falsification runs found

**Ten reverts, each applied alone against a baseline the harness proves green
first, each red on its own named assertion.** Two things worth recording:

- **The rep-ready fixture had no `name` on its rows**, and the one membership rule
  it now shares (`contactTabOf`) refuses a row without one. Production rows always
  carry a name, so this was the fixture bending to an old private rule rather than
  to the shared one; both were corrected, and the ruled-out row's owner is now
  deliberately outside the run's own grade split.
- **The role-noun revert printed the invented person by name** — `{"name":"Master
  Plumber"}` beside a demoted David S Graham — which is the clearest evidence in
  this round that the must-survive half of a filter is the expensive half.

**273 boot checks green**, every gate: tdz, dupkeys and scopecheck on both files,
fetchtest, pngscale, clientcheck, batchcheck, auditfuzz over 5,000 vectors,
fuzzcore over 20,000 cases, servercheck's 86 assertions over a fake network, and
2,070 emails composed over HTTP.

**HONEST SHAPE: none of this has run against a live press.** The parser is driven
against the exact strings the 2026-09-01 run produced; what a real 25-lead press
returns is settled by the next run, and the number to read is `Read 0 name/title
pair(s)` — today it is 21 of 25.

**The contract does NOT move this round.** The parser fix is server-only and the
count fixes are client-only, so a new client works against an old server and the
other way round. `index.html` changed, so it still needs a Netlify deploy.

---

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

## 104. Seven leads, twelve reads, and four names that were not people — 2026-09-01

Vin ran the Find contact button for 7 and sent the screen, the CSV and the whole
Render log: *"i need this find and read section running flalwessy. determine all
fo the issues eveyr single one... keep in mind our gola is top quality leads that
are all in our ICP."* Three parallel traces read the owner resolver, the Find
route and the client. **Every finding was reproduced by EXECUTING the real
functions against the exact strings from that log**, not by reading them.

**Two of the three things he reported were already fixed and merely undeployed,
and that is the round's first lesson.**

- **He asked for 7 and 12 were read.** `CONTACT_POOL` is 6, and the pre-Round-102
  runner checked `kept >= want` BEFORE drawing, so the ceiling is
  `want + (pool - 1)` = 12. The log carries exactly 12 `FIND READ` lines. The
  reservation fix shipped in Round 102 and the page was never dragged into
  Netlify. The five extra reads bought Roof King (10 credits plus four Firecrawl
  scrapes), Pella (a map call plus the full paid wave), Four Peaks and Unlimited
  Windows — **about forty credits he never asked for.**
- **The CSV has no header-counting bug.** Every user-facing count is over an
  array of company objects; the header is added only inside `findContactCsv` at
  the `join`, and that array's `.length` is never read. The button said 8 because
  8 of the 12 leads genuinely produced contact data.

### And the reason nothing said so: the contract had not moved in three rounds

`CLIENT_CONTRACT` sat at 20260923 for R101, R102 and R103. The staleness warning
is `if (s <= CLIENT_CONTRACT) return`, so a browser on the Round 101 build
against a Round 103 server was **indistinguishable from an up-to-date one** — no
banner, no console line — and `contactReadBuild` is stamped with the same
constant, so no read that client took could ever show as stale either.

I set that number three times on the reasoning that the change was not
server/client INCOMPATIBLE. That was the wrong test. This number is the only
staleness signal there is, and the rule is now written where it lives: **a round
that changes index.html bumps it.**

## The row must not name someone who is not a person

- **A CTA button became the decision-maker, and it SETTLED stage 1.**
  Performance Windows Raleigh shipped `Schedule My Consult` / `OUR FOUNDER` to
  the sheet. `CTA_VERB_RE` was declared for exactly this in the round before and
  given ONE call site, inside `titleHeadIs` — which is only ever handed a TITLE.
  The name slot was on shape alone. Executed:
  `CTA_VERB_RE.test('Schedule My Consult')` was true the whole time and nothing
  on that path asked. One declared list, both slots now. **Disclosed cost:** the
  list contains `read`, which is a real surname, so a person whose FIRST name is
  Read is refused — the only real-name collision in it.
- **"Our Founder" is NOT a heading, and the boot check proved it.** I added a
  guard refusing a possessive determiner with the ownership word as the whole
  remainder. `OWNER TRUTH CHECK` went RED, and it was right: *"Our Owner, Carl"*
  is a real roster line off Ecoview's own page and *"John Smith / Our Founder"*
  is the ordinary shape of a one-person leadership block. Refusing the title
  deletes the owner in both. The failure was entirely in the NAME slot and the
  imperative rule closes it alone. Reverted, with the reasoning left at the site
  the next person will reach for.
- **A correct owner row was demoted by the company's own name.** The Roof
  Detective: *"Shane Kaylor, Owner of The Roof Detective"* — a correct row with a
  correct ownership title — had `isOwner` STRIPPED, because `nameTailOfTitle`
  read "Roof Detective" as a second human (it clears the name pattern, and
  `BUSINESS_TAIL` carries "roofing", not "detective"). The lead then printed *"no
  owner-level title found"* beside that very row, in one sentence. The question
  is asked at the shared tail gate, so both readers inherit it, and it is bounded
  to candidates of two or more words: a single token that matches the company
  name is the eponymous owner himself. **Disclosed cost:** a title whose trailing
  words are ALL words of an eponymous company — "Founder Luke Smith" at Luke
  Smith Plumbing — loses the name inside the title.
- **The eponymy clause was printed without the eponymy test.** `DM/bizname` said
  *"the business is named after them"* on every result and the function never
  called `isEponymousOwnerRule`. Executed, the rule is **false** for both live
  rows: Jerry Zapf is not Sure Thing Pest Control, and Cassidy Cook is not High
  Bridge Development.
- **The title beside the name was unvalidated model prose.** The CSV's "Their
  title" column read **"locally owned and operated owner"**. The NAME on that
  path has had an anti-fabrication gate since it was written; the TITLE had none.
  Four declared rules, each of which the live string breaks; a title that fails is
  dropped and the name is kept.
- **The model's own confidence was switching off the one defence.** The
  place-name check is a role word near the surname, and it was skipped entirely
  when the model returned `confidence: 'high'`. The corpus is the whole homepage,
  testimonials included, and both live evidence quotes were customer reviews.
- **A first name was hard-rejected.** `MONONYM_RE` reaches only `parseTeamRoster`
  and its two helpers, so `"Levi" is not a usable full name — REJECTED` fired on
  the same lead where a CTA button won the row. It ships marked now, which is the
  owner's standing decision.

## Stop buying answers we already hold or cannot get

- **The eponymous settle could never fire on the source that produces it.** §83
  shipped a diagnostic instead of a fix because the cause could not be resolved
  from source. **This run answered it**, on Lukes Asphalt Paving, in one line:
  `eponymousRule=true eponymous=false brainConfidence=none`. The settle demanded
  the candidate come from `own_website_brain` AND that the BRAIN return high
  confidence; a `findOwnerViaBusinessName` candidate carries `business_name` and
  sets no `brainHit`. So on the one source whose whole job is spotting an
  eponymous owner it was false by construction, and the lead bought the 8-credit
  wave plus a 12-credit negative web search for a name we were already holding.
  The evidence floor is unchanged — the name read off their own site at high
  confidence, and the business named after them. Both sources read the same
  homepage; `independentSourceCount` says so itself by collapsing them into one.
- **No city guard on the paid wave.** Every branch of `findOwnerViaLicense`
  interpolated a bare `${loc}`, which on Four Peaks Roofing shipped
  `"Four Peaks Roofing LLC"  contractor license ...` — the double space is the
  missing jurisdiction. A licence board is a STATE thing. The audit path has had
  this guard since §101; the SPEND path never got it. Per his decision the
  licence query is skipped and the domain-scoped search still runs, and the guard
  is also the fix for the malformed string: past that line `loc` is always a real
  "City ST", so the double space is impossible by construction rather than
  patched at ten interpolation sites.
- **The OWNER WAVE line guessed whether the wave fired.**
  `(out.spend.firecrawl || 0) > 2` — a threshold on TOTAL lead spend, whose own
  comment admitted it did not hold the fact. A site that refuses a plain fetch
  costs four Firecrawl page reads, so a lead whose roster settled the owner for
  FREE printed *"the paid wave was BOUGHT"* — in the one line whose entire job is
  measuring the free-settle rate, which is the number that sets the monthly
  Firecrawl plan. `stagesRun` has been computed inside `findDecisionMaker` since
  the ladder was written and was **never returned**.

## A lead with no Google listing gets the same read

Vin, pushing back on a question rather than answering it: *"well what are we
going to do when we dont run google place leads like i dont want it to cost
anymore moeny then when we do but i want the smae qualioty produced"*, and then
*"i have a bunch of leads in there that are not google places leads but guess
what i dont care i want them to cost the same to read while ahving the same
quality as places."*

Six of the twelve leads printed *"this lead carries no Google place id"*. Every
ICP judgement this system owns reads a Places field — the rating band, the trade
review floor, the capacity class, the affordability band — and so does the free
review-reply owner source, which is why **four of the five paid owner waves in
that run were bought on leads with no place id.**

**So it costs LESS, not more.** `resolvePlaceId` was already written, is already
metered as `place-id-recovery`, and its match bar is DOMAIN PROOF — the site
Google lists must be the site we hold, so it cannot resolve the wrong business.
One Places text search replaces a ~10-credit Firecrawl wave often enough to pay
for itself, and Google's free Enterprise allowance is 1,000 calls a month against
roughly 550 recoveries at this volume: **$0 marginal here, $0.035 each beyond
it.** Its field mask widened to the whole record — rating, phone, hours, address,
category — for nothing extra, because `userRatingCount` already put the call on
the Enterprise SKU.

**What it does NOT fix, said plainly.** The listing filter was added in §97
because the other lanes produced Coca-Cola Bottling, Penn Medicine, Lennar and
Securitas. Recovering a listing gives the ICP rules something to read on those
rows; whether that is enough to keep every enterprise out is **not proven**,
which is why the tick box survives as a control rather than being deleted. It
defaults OFF now and its escape hatch is gone, so it means what it says.

## The TheirStack lane's own evidence must travel, and must win

*"Im going to fill up the theirstack credits so that we have quality companies
with actually job listings for marketing which is a huge timing signal. So that's
the most important out of all the non Google places leads."*

A TheirStack lead is built with a **verified headcount** (free, in the same call),
`industry`, `signalAgeDays`, the marketing role TITLES, `jobPostingUrl` and
`jobPostedAt`. **`contactRequestBody` sent none of it.** So on the one lane he is
about to fund:

- The verified headcount was dropped, and it is the strongest ICP measurement
  this system can hold — everything else is a proxy, and a team page is a FLOOR
  (a forty-person firm that publishes four reads as a four-person shop). §14
  already established the rule in the other direction and the contact score never
  got it.
- The marketing posting was dropped, so `readFindIcpSignals` re-derived the
  answer from their careers page — and a role posted on Indeed or LinkedIn and
  not on their own site comes back **no**. Every row of that CSV said `no` in
  that column. A lane bought for its clock had its clock deleted at the door.
  A posting in our hand is evidence; an absence on their site is not evidence
  against it, so it SETS the signal and the careers read can only corroborate.
- The role, the posting date and its URL never reached the sheet, so the rep lost
  the strongest cold opening this pipeline can produce. `When that role was
  posted` is a lean CSV column now, and an undated posting says so rather than
  inventing recency.

## The log and the file say what is true

- **`FIND READ` printed intent LABELS**, so five distinct URLs came out as
  `home, team, team, contact, careers` and read as a duplicate purchase. They ARE
  different pages, and the real paths were already on `out.pagesRead` and simply
  not printed. §24 recorded this exact class: *"a label that hides what was
  bought reads exactly like the thing not having been bought."*
- **The ROSTER hint was three bare `.exec()` calls over the corpus**, and it
  decides which of two OPPOSITE sentences the line prints. Executed, three of the
  four live hits were false — *"and **partner** locally"*, *"a commercial
  building **owner** who needs a new roof"* (their CUSTOMER), *"**Owner**
  supervised worksite"* — and each blamed the parser for a page that names
  nobody. It goes through the same head rules the parser uses now, over short
  runs, so "Owner" alone on a line still fires it.
- **`FIND RUN TALLY` does not exist in any code.** `findRunTally` and
  `findTallyLine` are client-render-only, printed into a DOM caption. The literal
  appeared **five times in this file and nowhere else in the repo** — and I told
  him twice to grep the log for it. Corrected: the free-settle rate is greppable
  from `OWNER WAVE`, which is true of it for the first time this round.
- **Noon printed as "12am".** `open > 12 ? (open-12)+'pm' : open+'am'` has no
  case for 12, in the one column whose job is telling a rep when to dial. And the
  fix laundered `Number(null)` into midnight on its first draft — **caught by the
  assertion written for it on the next boot.**
- A blank *When to call* cell now carries its reason, and an address resolved
  while the mailbox checker was down says that is **our outage, not a fault of
  the address**.

## What the falsification runs found

**Twenty-five reverts, each applied ALONE against a baseline the harness
proves green first, each red on its own named assertion.** The first pass
was 21 of 25.

Two of those came back GREEN because nothing guarded them at all — the ROSTER
headline's demotion clause and the mononym on the business-name path — and one
went green because its needle pinned the MESSAGE rather than the CONDITION:
reverting `if (!loc)` to `if (false)` leaves the sentence standing. A fourth
reported **NO VERDICT**, which is not a pass: the revert anchor matched the
check's own needle as well as the production line.

And the boot caught two things in my own work before any revert ran: the
"Our Founder" guard above, and the null-laundered noon.

**HONEST SHAPE: none of this has run against a live press.** Every fix is
executed at boot, in `clientcheck`, or driven over the fake network. What a real
seven-lead press returns is settled by the next run, and the lines to read are
`Read 0 name/title pair(s)` (21 of 25 on 2026-09-01), the free-settle rate in
`OWNER WAVE` (honest for the first time), and `LISTING RECOVERED` on any lead
that arrived without a place id.

**`index.html` changed, so this needs a Netlify deploy**, and the contract is
**20260924** on both sides — a stale page sends none of the TheirStack evidence
and hides the other lanes by default, and it will now say so by number.

---

## 105. Ten leads read in twelve seconds, and the score that called them a 53 — 2026-09-02

Vin set the three Render cost vars, dragged the client, unticked the
Google-listing box as instructed, and read ten. **Under twelve seconds, and all
ten came back "their website returned nothing"** — Epicrispr Biotechnologies,
Teal Health, Ember LifeSciences, SPORTY & RICH, a title-loan company, a
networking club. Then a refresh lost the run and the export dropped to 62 with
no way to tell what had already been handed out: *"now i refreshed the app i
have no way of getting taht runs leads back... i have no clue which ones ive
already exported and which i dont."*

Three code traces read the picker, the route and the client; every line below
was quoted from source, not inferred from the log.

### The run measured nothing, and it was guaranteed to

**Two lanes build a lead with a name and nothing else.** `sec_edgar` returns
`{ name, source, signals, raiseAmount, signalDate, jobTitle }`; `news_*`
returns `{ name, source, jobTitle, signals }`. No website, no location, no
place id, no phone. TheirStack — the lane Vin is funding — carries all of it
and was never the problem.

**The picker had no can-this-be-read precondition** (`batchCandidates` on the
Research tab does; `_cUnread` never got it), **and they sorted FIRST**: the
pool is ordered by `predictReach`, which scores the *name shape alone*, so a
personal-sounding name with no website to drag it down led the draw. **The
route read and then stopped rather than refusing** — preflight checked that a
website *parses only if one was supplied*, and the place id was first read
after admission, after the slot was taken.

### The 53/100 was fabricated, and printed a false sentence

`findIcpScore` is a ratio over a shrinking denominator, and exactly one of
seven terms scored. `reachMeasured` was `!out.notIcp` — "not dropped as a
chain", never "the lookups ran". Inside the term, `Number(s.emailTier)` on a
null tier is **0, and 0 is finite**, so "solid" was true and the row printed
**"a published or mailbox-confirmed address"** about a lead with no address
and no website. 8 of 15 → 53. The honest value on that branch is 1 → 7. The
same trap was written down sixty lines away about a different field.

Three fixes: `strictNum` on the tier; `reachMeasured` means an owner or
address lookup actually **completed**; and **`FIND_ICP_MIN_TERMS = 3`** —
below it there is no score, it says "not scored — only N of 7", and it sorts
under every scored lead. Vin's decision: a ratio over one term is not a fit
score. The stagesRun early return (§104's OWNER WAVE line printing "the
resolver did not run" when stage 1 ran) got its missing property too.

### A name-only lead gets a website, or it stays unread

Vin's decision, over dropping them. The payoff chain: a resolved domain
unlocks the page read, which unlocks `resolvePlaceId`, which recovers the
listing and with it the rating, hours, category and the free
owner-from-review-replies source.

It is also the most dangerous thing on the route, in `resolvePlaceId`'s own
words: *"Resolving the WRONG business would be the most damaging thing this
system could do."* A wrong domain re-parents the whole read — owner, email,
phone, rating, score — and a rep dials it. So:

- **A SLATE of free sources, in parallel, never a ladder.** The Companies API
  by-name (free, and the only source with a real match standard — it needs
  `COMPANIES_API_KEY`, and the run says so once an hour if it is absent),
  Clearbit autocomplete, and a HEAD probe at `{name}.com`. Two sources naming
  the same host is corroboration, and it is free.
- **No source's own verdict is read.** Clearbit's `confident` flag is
  discarded. Every candidate is judged by ONE module-scope predicate,
  `websiteProofFor`: a bare registrable host, a blocklist that finally carries
  **every news host** (the news lane's name came out of a headline, so a
  search finds the article first), the TLD and scam-shape lists hoisted out of
  the Companies API callback where nothing else could reach them, the
  tightness rule that stops `unitedairway` matching `united`, and one of two
  name proofs — `domainSpellsLeadName` or the hoisted word-level match that
  refuses Digitas Liquorice. The boot table carries **accept** cases beside
  the refusals, because a refuse-only table is green on a predicate that
  refuses everything.
- **Two accepted hosts with equal corroboration resolve NOTHING.** Two
  plausible domains is evidence that two companies share this name — exactly
  when resolving is most dangerous. Refusing is free.
- **A self-derived guess is PROVISIONAL, never accepted.** The domain-spells-
  name proof is circular for it; only the page can confirm it.
- **A name with no distinctive word is not resolved at all**, and the route
  refuses it *before the slot is taken* — `unreadable: true`, never `notIcp`,
  which retires a lead permanently. It only needs a human to paste a URL.
- **The paid rung (a Firecrawl search) is opt-in and default OFF.** The real
  marginal cost is two credits PLUS a full lead read, on the lane least likely
  to be in the ICP, and a wrong NAME is one word a rep corrects on the phone
  while a wrong DOMAIN re-parents everything.
- **A Places text search by name is deliberately NOT a source**, and the
  reason is recorded so nobody re-adds it: `resolvePlaceId`'s entire safety
  argument is that the website is the *input and the proof*. Taking its output
  as the website inverts that into "Google's name relevance decided which
  business this is" — on a lane with no location. Its role is corroborator,
  never source.

**The page confirms it or it is un-stamped.** The Round-104 corpus guard
already computed the right thing; it is three-state now (`unmeasured` counts
as NOT confirmed), shares one tokeniser with the acceptance predicate, and —
**the single most important correctness point in the round** — is
word-boundary anchored with the domain string stripped first. A parking page
prints `acmeroofing.com` in its footer, and a substring test reads that as the
words "acme" and "roofing": it reported CONFIRMED on precisely the case it
exists to catch. When the free test cannot confirm, one Haiku call
(`confirmDomainMatch`) decides; `wrongCompanyOverruled` is kept out of this
path on purpose, because its first half is true by construction for a guessed
domain.

**One test, two verdicts, keyed on provenance.** A published domain the guard
FLAGS — somebody other than us believed it, and a rebrand explains a miss. A
domain WE resolved on a name match has no such belief behind it, so a miss
**un-stamps** it, and **everything site-derived goes with it** through a named
function over a declared field list — §82 recorded blanking the URL alone and
auditing the wrong company anyway. The lead returns to the unread pool minus
the cost; `notIcp` is never touched.

**And the mark travels.** `websiteConfidence: 'weak'` — the same word
`sizeConfidence` already uses. The listing recovery cannot run on an
unconfirmed domain (it would quote a stranger's rating and phone onto the row
at full confidence). `contactFieldsFrom` never read `d.website` at all, so a
resolved site would have reached the row as an owner and an address with no
website beside them; it carries the domain, the proof and the confirmation
now, and **the provenance rides the lean CSV's how-sure cells**, because
`website` is not in the lean set and a rep must never download an owner
without knowing the domain was ours. Nothing on this path writes
`company_size_cache` (`getCachedSize` returns `trusted` unconditionally), and
there is no name-keyed memo (§19 with a new payload).

### The Find tab remembers

- **Seven view states reset on every reload** and none read storage.
  `verifiedOnly` defaults to *Strong first*: Vin had clicked Show all, and the
  refresh silently took the population from 420 to 92 — which is the whole
  153→76 mystery and the export dropping to 62. One localStorage key now.
- **A run survives a refresh.** `contactRun` was state-only, so the run/queue
  toggle did not even render after a reload. Every lead a run touches carries
  `contactRunId`, and the newest id in the data IS the last run.
- **Every exported row is stamped** — when, and whether to CSV or the sheet —
  through the `extra` jsonb round trip that already carries everything (no
  schema change). Shown on the card and as a lean CSV column. Vin's decision:
  stamp and show, keep exporting the full set. Honest limit on the sheet: the
  script returns only counts, so a row is stamped as SENT and the sheet's own
  dedupe may have skipped it.
- **The export band says why it is empty.** The button had not vanished; it
  had nothing to export and said nothing.
- **Nothing to read is its own tab** — not Ruled out (a verdict), not Not read
  (which re-draws it forever) — with a way back.

### What the falsification runs found in the checks themselves

Three of the resolver fixtures failed a CORRECT build on their first boot,
and each is a recorded trap: **"Bob Ray Co"** was asserted resolvable, and
three-letter words are deliberately not tokens — the fixture was wrong, not
the floor; a needle for the resolution block's end was written with an
**empty second half** (the self-matching literal, caught inside the round that
fixed it elsewhere) and, once split, found `contactRankFor`'s identical line
earlier in the file — it searches from the block's start now; and a
pre-existing needle pinned the `_opts` line I reformatted.

**Thirty-two reverts, each applied ALONE against a baseline the harness proves
green first, each red on its own named assertion.** The first pass was 31 of
32: the news-blocklist revert dropped `prnewswire` alone, and `prnewswire`
CONTAINS `newswire`, which was still on the list — a revert that reproduced
nothing. The original defect is no news host at all, and that goes red on the
reason: the article is refused for having extra words, not for being news.

**HONEST SHAPE: none of this has run against a live press.** The slate, the
predicate, the confirmation and the un-stamp are executed at boot on the
recorded wrong-company shapes, and `servercheck` drives all four outcomes
over the fake network — refused with zero calls, resolved and confirmed with
the listing recovered, contradicted and un-stamped with no listing call, and
ambiguous with nothing read. The first real press is the measurement, and the
line to grep is `🌐 WEBSITE RESOLVE`.

**`index.html` changed, so this needs a Netlify deploy**, and the contract is
**20260925** on both sides.

---

## 106. Twenty leads read live, four things on the sheet that were not true, and the export became grades — 2026-09-02

Vin ran the merged Round 105 build for real — ten Places leads, ten from the
other lanes — and sent both logs and both files. Then two things: *"lean out
the export column only essentila info and long sentences dont work use ratings
instead"*, and *"i want to kind of stop building here and workshop the code is
this a good spot to stop leads are being shot out at decent quality."*

**The honest answer was yes, after one close-out.** The run's own numbers, and
they are the first live measurement of the R102–R104 roster work:

| | Places (10) | other lanes (10) |
|---|---|---|
| owner settled on the free read, no paid wave | 5 | 4 |
| paid wave bought | 5 (35 credits) | 6 (46 credits) |
| credits per lead | 3.5 | 4.6 |
| roster read at least one real name/title pair | 5 | 4 |
| an owner named at all | 10 | 9 |

The roster read something on 9 of 20 sites, against 4 of 25 the last time it
was measured; the paid wave fell from 6.3 credits a lead to about 4. What kept
it from being a clean stopping point was the sheet a rep would dial from: read
line by line it carried four things that are not true, and three code traces
located the mechanism behind each. Vin's decisions: **letter grades A–D**, and
**one round = the export plus those four**, then stop.

### "Client Connection Lead" was the decision-maker, with three real owners on the page

Ten Key's team page reads *Chris Reed — Owner, Client Connection Lead · Mike
Kahn — Owner · Rebecca Muller — Owner, CEO*. The sheet said the decision-maker
was **Client Connection Lead**. `parseTeamRoster` invented the person three
separate ways, each executed against that exact string:

- The run "Owner, Client Connection Lead" has no name in it, so the title-led
  reader took the words after the last comma as the person — and "Client
  Connection Lead" clears every shape test in the file: three capitalised
  words, no role noun anybody had written down (`lead` was not in
  `FIND_ROLE_NOUN`), no title pattern. **A name slot made entirely of role
  words is a title now** (`ROLE_WORDS`, `allRoleWords`), asked in the one door
  both readers share. "Ann Lead" survives, because one role word is a surname.
- The two-people pass then read "Connection Lead" as a SECOND person inside
  Chris Reed's correct row and **stripped his ownership claim** for it. Same
  door, same fix.
- Among the real owners, `authorityScore("Owner")` and
  `authorityScore("Owner, CEO")` are both 100 — the ladder returns the first
  rung — and the tie went to the SHORTER title, which is the bare word.
  `ownershipDepth` counts the senior rungs a title carries, so "Owner, CEO"
  beats "Owner" and Rebecca Muller wins. The pick is a named function
  (`rankRosterOwners`) that also refuses any row whose name slot fails the
  shared name rule — a title that slipped past the parser can never be
  promoted by the pick.

Same family, same run: "Director of Client Onboarding" was cut into the name
"Client Onboarding" and the title "Director of" — **a head that ends on a
preposition is a title cut in half** (`titleHeadComplete`); the location
heading "Winter Park" was paired with "Tax Associate Christina Sears" because a
four-token run fails the name pattern and the next-person test could not fire —
**a title run carrying the next person ends the entry above it**; and the chat
widget "Let's Chat / WowFix assistant" parsed as a person — `CTA_VERB_RE`
learned `let's` and `chat`.

### "The WowFix Team" was the owner, and `the@wowfix.us` was the email

`findOwnerViaReviewReplies` accepted any signer whose first token appeared in
the replies — "the" always does — and synthesised an "Owner" title for it, so a
team signature came in at authority 100. It never called `looksLikeRealName`,
which would have refused it. Then two hand-kept copies of the eponymous mailbox
rule tested whether ANY token of the name sat inside the domain root and mailed
the FIRST token: `the@wowfix.us`, tier 3, sendable. `reviewSignerOk` asks the
one question of every signer, and `eponymousMailboxFor` is ONE rule that both
branches call: a real person's name, the surname (or a four-letter first name)
in the business name or the domain, and a first name that is a given name
rather than an article. **Disclosed:** `bill@zoellerpumps.com` still passes,
because Bill Zoeller genuinely runs a company named Zoeller. That row is wrong
on SCOPE — a manufacturer is outside the ICP — which is a discovery question
and not a mailbox rule.

### The company's own mailbox was labelled as a person's

`cpa@jtccpas.com`, `aardconcrete@aol.com` (Aard Cement),
`parklanedentalortho@d4c.com`, `aanddcontracting@aol.com` — all `[person]`.
Two causes. `mailboxKind` is three anchored word lists and nothing ever compared
the local part to the COMPANY's own name or its trade; it takes the company and
the host now and answers `company` when the local part IS the company. And
`emailConfidenceGrade` read `e.kind` at tier 1 while the tier-1 return writes
`mailboxKind` — `kind` is set later, in the route — so that half of the grade
was dead and a role mailbox graded as "a person, not a department". It reads
the field that is written.

### 65/100 on a site that returned 258 characters

Floor Gurus refused a plain fetch, Firecrawl returned 258 characters from
/about, the owner resolver called it unreadable — and `readFindIcpSignals`, in
the same run, asserted "no ad code", "measures its traffic" and "no open roles"
off that page: six of seven signals. `anyMarkup` was a 500-byte floor on RAW
HTML, which a `<head>` clears alone, and "not hiring" needed only that ANY page
had been read. **An absence needs readable text now** (800 characters, the
same floor class `readRecurringOffer` carries) and "not hiring" needs somewhere
the roles would have been — a careers page we read, or a homepage whose
navigation we read. Positives are untouched. And the reach term needs a
readable site, or a lead with no site to read: a lead with NO website measures
its reach on its listing and its reviews, which is honest; a lookup that ran
over 258 characters measured nothing.

### The export: grades, not sentences

Five of the thirteen lean columns were sentences, and the short tokens every
one of them was rendering already sat on the lead unread — `contactOwnerGrade`,
`contactEmailGrade`, `contactEmailKind`. The lean file is twelve columns now:
Fit /100, Company, Decision-maker, Their title, **Owner grade (A–D)**, Email,
**Email grade (A–D)**, Phone, **Best time** ("7-8am", written on the server
beside the sentence), Already paying for ads, Hiring for marketing (with the
posting's age riding the yes: "yes (11d ago)"), Exported (the date). Owner: A
two sources agree, B their own site says so, C likely, D held back. Email: A
confirmed or published as a person's, B a real shared mailbox, C a catch-all
domain, D a guess — with "(checker down)" on a run our verifier was out. The
resolved-domain provenance rides the owner grade, because that cell is lean
and `website` is not. Every sentence column is still one tick away in the full
export, and the card chip carries the same letter, from the same function.

### Deferred, recorded for the workshop

- `settled()` prints its EPONYMOUS / ROSTER SETTLES IT line twice on a live lead.
- `LEADERSHIP_URL_HINTS`' bare `owner` stem matched `/owners-manual` as a
  leadership page; `CONTENT_URL_EXCLUDE` misses `/resource-category/`.
- The Find ICP `size` carve-out does not know Region President, Controller or
  Branch Manager — Lifescape (multi-region, a CFO) scored 35/35 and topped the
  run.
- Zoeller Pump Company, a manufacturer with a 500-URL sitemap, is in the ICP
  by every filter we have. Scope, not names, is the mechanism.
- The email verifier ran out of credits mid-run again and five rows carry a
  guess. A top-up at myemailverifier.com, not code.

### What the falsification runs found

**Thirty-two reverts, each applied ALONE against a baseline the harness proves
green first, each red on its own named assertion** — twenty-two server, ten
client. Two guards were built with a case only they can refuse, because the
first fixture covered both at once: removing the person-name gate on the
eponymous rule left "The WowFix Team" refused by the article list, and removing
the article list left it refused by the name gate — so "Wowfix Support Team"
(a name the article list cannot see) and "The Fixer" (an article the name rule
accepts) each exist now. Two fixtures went RED on the first boot and were right
to: the JR & Co two-people fixture, whose h3/p shape no longer produces the
motto row at all now that the lookahead ends the entry (re-aimed at the inline
shape, which is the only one that still reaches the two-people pass); and the
new owner pick, which a title-shaped name walked straight through because
`looksLikeRealName` accepts three capitalised words — the pick asks the
role-word rules as well. And servercheck went red on the reach term for a lead
with NO website, which was right: a lead with no site to read measures its
reach on its listing and its reviews. The rule is "readable, or nothing to
read", not "readable".

**HONEST SHAPE: none of this has run against a live press.** Every fixture is
the exact live string driven through the real function; servercheck drives the
contact route over the fake network. The next fifty-lead press is the
measurement, and the lines to read are `👤 ROSTER` (a name that is not a
person), `DM/reviews` (a signer discarded as not a person), `EMAIL … EPONYMOUS`,
and any `📇 FIND CONTACT` line scoring a lead whose pages returned nothing.

**`index.html` changed, so this needs a Netlify deploy**, and the contract is
**20260926** on both sides.

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
| `SITUATION_EFFORT` | high | the situation-read's thinking effort (low/medium/high). The priciest call on the lead (~$0.14 of ~$0.27); medium roughly halves the model bill at the cost of story depth — see §76 |
| `PAGESPEED_KEY` | unset | FREE from Google Cloud (enable the PageSpeed Insights API on the same project as `GOOGLE_PLACES_KEY`). Without it `slow_mobile` cannot fire on any lead, and it is the only rung measured from the prospect's own visitors. There is deliberately no Settings field — see §54 |

**Set the budgets to the PLAN, not the default.** The defaults (1500 Firecrawl
credits, 600 Places calls, $20 of model) are a runaway-day safety net sized for
paid tiers. On the free Firecrawl tier (1,000 credits ONE TIME) or inside the
Places free allowance (1,000 Enterprise calls a month), the default ceiling sits
ABOVE what the account can afford — the ledger will happily meter the account to
zero before the ceiling speaks. When the plan is small, set the ceiling small.

**The client handshake.** `CONTRACT_VERSION` (server.js) and `CLIENT_CONTRACT`
(index.html) are one number in two files, asserted EQUAL by clientcheck. Bump
both when a change needs the new client live; a stale Netlify page then shows a
banner naming both numbers instead of silently reintroducing fixed bugs.

---

## 82. Wave 1 and Wave 2: the seven false statements and the lead-killers — 2026-08-27

Vin, after the master plan: *"build wave 1 and 2 at the highest quality ever...
fix at the root dont breka anything."* Wave 1 is the seven sentences a caller
would read aloud and be wrong about. Wave 2 is the mechanisms behind one lead in
three dying or auditing near-blind. Every fix below was falsified by reverting it
ALONE against a green baseline — 44 reverts, each red on its own named
assertion — and four of those came back STILL GREEN first, which is the whole
reason for running them.

### Wave 1 — what a caller would read aloud

- **"of the 150 reviews we read" on a run that read 90.** §44 licensed a
  COMPETITOR's measured count so "#1 competitor's 101 reviews" would stop being
  eaten, and that licence was applied to every number in the sentence including
  the DENOMINATOR of "of the N reviews we read" — a claim about the size of OUR
  OWN SAMPLE, which can only ever be the count we read. A window company in the
  ranked pack carried ~150. The profile total was licensed there too, which on a
  90-of-215 lead is a claim about 125 reviews nobody opened. Both gone; the
  numerator keeps every permission it had.
- **Three ages for one company.** Grant Renne: the log measured 14 years, the
  story said 1873, the headline said "143 years behind it". 1873 to 2026 is 153.
  Every other figure family has a gate and a computed YEAR SPAN had none — the
  email's fact-checker carries an INVENTED TENURE flag, and flagging is not
  removing. `stripUnverifiedYears` runs on the audit AND the synthesis: a
  founding year or a tenure span survives only if it matches the measurement, is
  derivable from it, or appears in THEIR OWN COPY. An unmeasured lead with an
  empty corpus strips nothing, and "a 10-year warranty" is not a tenure claim.
  Its own first draft laundered `Number(null)` into year ZERO and cut every true
  age sentence — the recorded trap, caught by executing it.
- **A search nobody types.** `/window-doors` became the query "window door in
  Glen Allen, VA" and shipped as LEAK 1 with a five-figure job value under it;
  `/windows-services` became "windows service in Sheridan, CO". Two mechanisms:
  nothing asked whether a slug is a phrase a person would type, and
  `naturalTrade` — a trade-LABEL singulariser — rewrote the owner's own slug on
  the way to the query. `searchablePhraseFromSlug` refuses three provable
  artifacts (a trailing generic word, a geography slug, every word a product
  line with no verb) and a slug-derived phrase now travels VERBATIM. Executed
  over 106 realistic slugs: one disclosed false refusal ("roof windows"), and
  four that the first version got wrong were found by running it rather than
  reading it. Every refusal is LOGGED by slug and reason, and nothing had ever
  printed the phrases we buy.
- **A market with no state.** "kitchen remodeling contractor in Ashland" — no
  ", VA" — produced a CONFIRMED absence. Ashland exists in about twenty states.
  The comment forty lines above the assembly says "THE STATE IS NOT OPTIONAL"
  and then made it optional the moment the slug did not carry one. It is
  inherited from the lead's own state now, and when neither is available the
  query is not bought at all. The extractor was lifted out of an IIFE to module
  scope so the check EXECUTES it.
- **Two different people named as the owner.** "Chris Brever, Co-Owner" in the
  contact block and "run under Joe Brever's name" in the story. THREE holes, all
  the same idea: `namesConflict` treated one shared word as agreement (a family
  business shares a surname by definition); the ownership stripper's
  corroboration test let any shared token license a claim about a different
  first name; and both ran seven hundred lines BEFORE `situationRead` exists, so
  the one guard against two owners on one sheet could not see the block the
  operator reads. One containment predicate, one ownership vocabulary (the two
  hand-kept patterns both missed "run under X's name"), and the check moved
  whole to where the story exists.
- **The sheet and the log disagreed on every rank number.** Hand-checking those
  digits against Google is the entire trust process. `scanned` is a property of
  ONE DRAW's result list, and the log prints a line per draw while one row
  survives — so the operator was comparing the other draw's window. Two fixes:
  a single `SHEET RANK` line printed from the exact object the sheet renders,
  and the confirmed-absence row now publishes `Math.min` of the two windows,
  because "checked twice" is only proven for the smaller one.
- **"Your newest Google review is 105 days old — your review record is fresh and
  strong."** The model did not invent that. `measureHistory`'s credit branch
  fires on a LIFETIME RATE and never looks at recency, and it hands the model
  "a steady, working machine" with *"credit this"* attached, while the 105-day
  number arrives from a different function in the same prompt. Two hand-kept
  branches of one rule inside one function. The bar is now the business's OWN
  gap — at 15 reviews a year one arrives every 24 days, so 105 days is four of
  them — and the credit says both true things: the record is strong and the flow
  has stopped. `stripStaleFreshClaims` is the mechanical backstop over model
  prose, on both batteries, and strips nothing on an unmeasured lead.

### Wave 2 — the lead-killers

- **A map timeout deleted a website.** Grant Renne was audited on ONE page while
  fifteen internal links harvested from his own markup sat in memory, free. The
  rescue that reads them lived INSIDE the try, on the map-answered-empty branch,
  and the timeout catch could not reach it — its own comment claimed "the
  harvested-links path below already covers the gap" and that path is ABOVE it.
  FIVE exits returned an empty list without ever looking. One `_mapFallback`
  that every failure path returns through, a cache entry marked as a FAILURE
  rather than as a measured zero, and the free `cachedSiteMap` reader obeying
  the same rule. A host we have never read still yields nothing rather than a
  guess.
- **A real practice killed by the wrong-company guard.** "Dr. Levi Young -
  Advanced Cosmetic Surgery" against advancedcosmeticsurgerykc.com, in its own
  market, discarded on a model's "no (high)" after the whole research cycle was
  paid for. The PRIMARY cause is that the model is shown 3,000 characters — on a
  practice that is nav, hero and services, so the practitioner the prompt's own
  escape hatch looks for is below the cut and the hatch could never fire. It is
  the whole page now. The backstop is code-checked: a model NO is downgraded to
  UNCLEAR (never to yes) when the domain SPELLS the lead's own name — three
  words, twelve letters, so "ramjack" does not clear it — AND the page names our
  market or prints the listing's own phone number. Ram Jack Durham is still
  discarded, and the honest limit is stated: a two-word business keeps the old
  behaviour, because widening to two re-admits the franchisor.
- **Pictures of another business, and a message naming the wrong cause.** The
  wrong-company discard nulled ONE of the three renders, so the full-page
  capture and the phone capture — both photographs of a DIFFERENT company's
  homepage — reached pageShots, the model's image evidence and the audit screen
  under this owner's name. The in-flight phone render is no longer collected
  either. And "Their website returned nothing. We fetched it twice" printed for
  a site that returned 52 internal links: the reason a corpus is empty now
  travels, and the sheet says which of the two it is.
- **The browser cap sat at 10 on a plan that allows 25.** The cap took the most
  restrictive endpoint of ALL, and every number in the tier table is a SCRAPE
  per-minute figure — so feeding it any other endpoint reads the plan off the
  wrong meter, and on one account `/v1/map` answers 500 while `/v1/scrape`
  answers 5000. The cap is derived from `/v1/scrape` alone: `batch` is excluded
  even though its pages render, because the batch STATUS POLL writes that same
  key and a polling endpoint must never decide how many browsers we hold. Until
  a scrape has answered, the cap does not move at all. `map` joins the slotless
  set — five map calls a lead were each holding a slot the renders queued
  behind — and its standing is stated honestly: no formats requested, one credit
  however large the site, a 20s timeout against a render's 45-90s. Good
  evidence, not proof, and the 429 gate-wide hold is the backstop if it is
  wrong. The existing boot check asserted the cap was sized from the SEARCH
  limit — the defect written down as an invariant — and that assertion is
  flipped.
- **Doomed retries into a host that had already stopped answering.** Three paid
  scrapes timed out on one lead after that host had already timed out once, and
  Firecrawl bills the submit. A per-lead host stand-down after two timeouts, on
  `FC_LEDGER` so it dies with the lead — a process-wide latch is the §43
  deadlock where no probe can ever run — read in the CALLER's own frame, because
  §51 records that the ambient store at the gate's dispatch belongs to whichever
  lead's continuation freed the slot.
- **A lead with no place ID lost eleven measurements and the log named three.**
  The recovery itself already exists and works; what was missing was an honest
  account of the cost, including the trade word every search query is built
  from — which is why the same run also logged "rank check skipped: no
  industry" and nobody connected the two lines.

### What the falsification runs found in the checks themselves

Four reverts came back STILL GREEN, and each was a fixture that could not see
what it named:

- **One needle covering two call sites.** Reverting the service-page search left
  it green, because the CONFIRMING search still carried the same text. Two
  needles now, one per site.
- **A fixture that licensed its evidence twice.** The year fixture handed the
  founding year in as a MEASUREMENT as well as putting it in the corpus, so
  deleting the corpus licence changed nothing. The fixture that guards it is now
  a year on their own site with nothing measured.
- **Two over-widenings invisible behind a length bar.** The Ram Jack fixture is
  refused on twelve letters, so neither the market half nor the three-word floor
  was ever exercised — both were reverted green. Each now has a case only IT can
  refuse: a national brand whose domain DOES spell its name, and a two-word name
  long enough to clear the bar.
- **And a needle written with an EMPTY half**, which joins to one contiguous
  literal sitting in the check's own source and matches itself. Written by me,
  caught before falsifying. Fourteenth recorded instance.

Three more checks went RED on a CORRECT build and were re-aimed rather than
worked around: two closed needles that pinned the END of an argument list (both
grew a parameter this round), and a probe that set a pace for an endpoint a
later assertion asserts was never given one — a check that leaves state behind
fails its neighbour and the neighbour gets the blame.

**253 boot checks green**, every gate green: tdz, dupkeys on both files,
scopecheck on both files, fetchtest, pngscale, clientcheck, batchcheck,
auditfuzz over 5,000 vectors, fuzzcore over 20,000 cases, servercheck's 31
assertions over a fake network, and 2,048 emails composed over HTTP.

**HONEST SHAPE, stated rather than implied.** None of this has run against a
live lead — the last live run is the one these defects were read out of. The
C6 mechanism was NOT reproducible from source: the log and the sheet agree on
every branch when both are measured, so the fix makes them one fact by
construction rather than by diagnosis. And W4 is the smallest item here: the
place-ID recovery already existed, and only the log's account of the cost was
wrong.

**`index.html` changed (the honest empty-corpus message), so this needs a
Netlify deploy**, and the contract is 20260904 on both sides.

---

## 83. PR C: the cuts that touch no measurement — 2026-08-27

Vin: *"lets build at the highest level the PR C Build Map... DO NOT BREAK
ANYTHING BE SURE OF IT."* Every item below is a setting whose default is
today's behaviour, or the removal of work nothing reads. **No measurement was
removed, no claim was widened, and no sentence an owner or a caller reads
changed.** 16 falsifications, each reverted alone against a green baseline and
each red on its own named assertion. 256 boot checks green, all gates green.

### What the meter settled first

One live lead (Miller's Fancy Bath, 2026-08-27) answered the cost question
outright: **$0.1871 across 13 model calls, and 81% of it is two** — the story
writer at $0.0785 and the audit at $0.0738. Both show `cacheRead=0
cacheWrite=…`, so that is the FIRST-lead price; the story writer's system
prompt interpolates only static blocks, so every lead after it reads at 10%.
Steady state is **~$0.117 a lead**, and blended across a 50-lead batch **~$0.128
= $190/month**, not the $253 that had been scaled from a three-lead balance
delta. `DFS_LABS` was confirmed already off. The corrected baseline is **$513**,
not $613.

The same log carried three defects, and the first two are the same money.

### The free owner source could never corroborate

Their own site named **Rick Miller** at high confidence; the Google review
replies were signed **Rick**. `sameName` refuses any name under two tokens
outright — correctly, because it decides which mailbox an email addressed to
the owner is sent to — so the two never clustered. Instead of corroborating,
they COMPETED, stage 1 did not settle, and the run bought the paid websearch
and licence wave to rediscover a name it was already holding.
`findOwnerViaReviewReplies`' own prompt says *"A first name alone is fine and
useful"*, and the source is weighted 35 because at an owner-run shop whoever
answers the reviews IS the owner. It was structurally unable to be useful.

`foldFirstNameClusters` folds a bare first name into the one full name it can
belong to, and three properties are the whole design: the FULLER name always
survives, it only ADDS a source, and **ambiguity refuses** — two different
people sharing that first name means the signature does not say which, and a
guess there would credit a real source to the wrong person. `sameName` is
deliberately untouched; the first-name rule it kept inline moved to module
scope so the two questions cannot become two hand-kept copies.

**And the eponymous settle should have fired on this lead and did not.**
`isEponymousOwnerRule('Rick Miller', "Miller's Fancy Bath & Kitchen")` returns
TRUE — executed, not read — the brain returned high confidence, and the winning
cluster carries `own_website_brain`. All three conditions compute true on that
lead's own values and stage 2 was bought anyway. **That could not be resolved
from source and no guess was shipped for it.** What shipped is the diagnostic:
`settled()` now records which of corroborated / ownSite / eponymous / roster
was false, plus the brain's confidence and the eponymous rule's own answer, and
the stage-2 branch prints it. The next run answers the question instead of
posing it again.

### We paid for the homepage four times, then deleted the fourth

`/index.html` came out of their own sitemap, the backfill bought it as an
interior page, and the duplicate-page fingerprint threw it away one step later:
*"1 of the 5 page(s) we read came back with text identical to the HOMEPAGE"*.
That lead fetched its homepage four times — corpus text, full-page render,
phone render, and this.

The old guard excluded an EMPTY path, so `/` was caught and every server
default document walked past it. `isHomepageAliasUrl` drops `index.*`,
`default.*` and `/home` **before the picker can spend**, on an exact SEGMENT
match: a homebuilder's `/homes`, a services page at `/home-improvement` and a
folder's own `/a/index.html` are real pages on exactly the trades we target,
and a filter that ate them would cost a page read to save one. `clean` itself is
untouched, because `findUnlinkedPages` reads it and its denominator is a fact
about their sitemap rather than about our page budget.

### Calling mode

Stage 2 and 3 of the owner ladder buy a NAME. On a batch that exists to be
dialled the rep gets that name in four seconds by asking whoever picks up, so
the wave is ~10 Firecrawl credits and two model calls spent on a question the
call itself answers. `callOnly` rides `buildResearchBody` — the one request
builder — and takes the same branch `settled()` takes, with its own log line
naming why. Stage 1 is untouched and still runs on every lead.

**What it costs, stated: no TITLE.** An uncorroborated stage-1 name is held back
exactly as it is today and the sheet says "(no title found)" rather than
inventing one. That is a fair trade for a call and a bad one for an email, which
is why it is a per-request flag and not a new default.

`batchcheck` runs it both ways through the real runner — a flag stuck ON is the
worse half, because it would stop resolving the owner an email is addressed to —
and **servercheck drives it end to end**: on a lead built so stage 1 cannot
settle, the control buys 5 owner searches and the calling-mode lead buys 0,
`CALL MODE` prints, and both read the same homepage.

### The gate that refused a lead after buying two more calls

The BRAIN GATE lives ~2,000 lines below the audit call, and both inputs it
decides on exist the moment that call returns. So a husk still bought the STORY
WRITER — the most expensive call on the lead — and the fact-check before being
refused, on a lead that was always going to 422. Four of five leads died that
way in one live batch.

One rule (`auditRefusalKind`) now decides, asked as soon as the audit parses and
again at the gate. **The refusal itself did not move**: same place, same
wording, same status. What changed is that two calls are not made first.

The safety rests on one claim, so the check EXECUTES it rather than arguing it:
the early answer is asked of `parsed` and the late one of `brainAudit`, which is
built field by field FROM parsed, and the two fields that can differ both LOSE
content on the way (`situationRead` becomes the synthesis object; `whatHeNeeds`
never reaches the literal). So the early answer is always at least as
PERMISSIVE — **an early refusal implies a late refusal, never the reverse** —
and no lead can be refused that the old gate would have shipped. Executed across
six shapes in both error states, with the field sourcing asserted so it holds
for fields we have not thought about, and a `_seen < 6` floor so the scan cannot
report a clean pass while matching nothing.

### What was NOT built, and why

- **DataForSEO Standard task queue.** `docs.dataforseo.com` is blocked by this
  environment's egress proxy, so the endpoint shape and the discount could not
  be verified. Writing an API contract from memory — for the call that produces
  leak 1 on most sheets — is the fabrication failure this file exists to
  prevent. It needs one look at their live docs, and then it is a small build:
  the parser does not change, only the submit-and-collect handshake.
- **Widening the audit cache to four calls.** The plan assumed the audit key
  would serve all four. Reading the code says it will not: the story writer's
  input includes the funnel walk and the ranked leaks, and **none of that is in
  `auditKeyFromContent`**. Caching the story under the audit key could serve a
  story built on a different funnel walk — §19's class pointed at a new door.
  Each cached call needs its own key over its own inputs, which is a bigger
  build than the plan allowed for, worth ~$8 a month, and only on re-runs. Not
  something to ship the night before a fifty-lead run.

### What the falsification runs found in the harness

- **The runner read `tail`'s exit code, not the gate's.** Two client
  falsifications came back STILL GREEN against a wire that is genuinely
  guarded — the recorded harness-that-lies class, committed here by piping the
  gate through `tail` inside a command substitution. Both went red on their
  named assertions once the pipe was removed.
- **The first calling-mode fixture settled at stage 1**, so the scenario would
  have reported a clean pass having exercised nothing. The cause was not the
  model's answer: the page TEXT names the owner, so the roster reader (code, not
  the model) found the title and settled on authority alone. The fixture now
  serves a business that names nobody, which is the state in which the paid wave
  is actually bought.
- **An equality assertion that was measuring the fixture's own name.** The
  calling-mode and control leads differ by two characters of homepage text —
  their own company name and host — so demanding equality failed a correct
  build. It asserts a full read on both sides instead, and says why equality
  cannot be used.
- **One revert went red at the wrong gate.** Removing the early-gate guards
  fails the boot check, so `/healthz` never goes green and servercheck cannot
  start — a RED that proves the boot check and says nothing about the
  end-to-end assertion. Re-run with the source needles removed as well, leaving
  a build that boots GREEN and is behaviourally broken, and scenario D went red
  on exactly its own two sentences.
- **A revert script that matched two places.** The unlinked-page wire already
  had a guard from an earlier round, so the naive revert hit both the production
  line and the check's own needle. Retargeted at the full production line; both
  guards then went red, which is stronger than one.

**HONEST SHAPE.** None of this has run against a live lead — the last live run
is what these defects were read out of. The eponymous settle is diagnosed rather
than fixed: the next run's `stage 1 did not settle` line is what answers it. And
the Anthropic figures above come from ONE lead, so the steady-state number is
arithmetic over a measured first call, not a measured second one; a fifty-lead
batch settles it.

**`index.html` changed (the calling-mode tick box and the request field), so
this needs a Netlify deploy**, and the contract is 20260905 on both sides.

---

## 84. The eight from five live sheets — 2026-08-27

Vin, on the five audits his junior rep would have dialled from: *"fix the eight
at the highest level possible fix at the root build from the ground up... we
dont want any drop in quality whatsoever... we need th elogs perfect and these
audits perfect and teh cost perfect."* Seventeen falsifications, each reverted
alone against a green baseline and each red on its own named assertion — two of
which came back STILL GREEN first, which is the entire reason for running them.
**259 boot checks green**, every gate green.

### "16 of the 1 businesses ranked above them have FEWER reviews"

On the Tuck & Howell sheet, and "20 of the 1" on Bradley Construction, in the
System one-change diagnosis a caller reads out loud. Neither number was wrong on
its own. The **numerator** came from the outrank row — which §78 split off on
purpose, because the sharpest outranked evidence can legitimately sit on a
service query — and the **denominator** was re-derived downstream from the HEAD
row's position. Two searches, one sentence, arithmetic that refutes itself on the
page. Justin Doyle's "1 of the 1" was right by coincidence.

A denominator is a measurement, not something to compute from a different
measurement. `outrankRatioFrom` takes both halves off ONE row or returns no
ratio at all, both call sites pass the pair, and a ratio measured on a different
search now names that search. Three refusals ride with it: a row with no
position produces the durable no-denominator sentence instead of an invented
one, a numerator larger than its own denominator is refused outright, and a
**relevance-lookup row supplies no ratio at all** — the §52 wall, finally applied
at the one consumer that never had it.

**The first fixture for the buried branch measured nothing.** It looked for the
words "of the 11 businesses" and that branch's MOST framing writes "16 of 11", so
reverting the fix left it green. The assertion now READS the printed ratio and
checks the arithmetic, which no rewording can slip past.

### An absence asserted from a surface the same page called unmeasured

Tuck & Howell: *"Not measured: Search, blue links"* and, eleven lines below,
*"They do not appear anywhere in the first 19 search results for 'HVAC
contractor in Greenville, SC'"* — with their map position at #2. One
measurement, two readings, on one page.

`organic_invisible` fires on `checked && !found`, and the facts strip could only
ever carry a POSITION — so the exact state that rung exists for had no
representation and rendered as a blank, which the client reports as "not
measured". Three states now, like every other measurement on the strip: found at
#N, read and not in it, or nobody looked. The absent state carries the **window**
it was read over, because "not in the results" without the depth is the §74
overclaim, and an absence from fewer than six results is refused on both sides.

### "Do not say", full of engineering

Two live entries: *"The 'Reason' field correctly identifies that the real problem
is operational"* and *"the audit leads on review_pattern while gbp_gap is tied
within noise"*. Neither describes anything a prospect could disprove. Do-not-say
is the section that stops a FALSE sentence being read down a phone, and filling
it with our own reasoning is how an operator learns to skip it — the cost §45
recorded for true sentences and §24 for a CTA precaution that fired on nearly
every lead.

- **A new `internal` kind**, keyed on TWO halves so neither over-reaches: a name
  only this system uses (a snake_case rung id, or one of our own field names) AND
  our own selection vocabulary. CRITICAL is tested first and always wins, so a
  real fabrication that happens to quote a rung id still warns — asserted with a
  fixture in that direction.
- **The confirmation pattern learned "correctly identifies/states/notes"**, which
  it did not know.
- **And OUR OWN honest sentence was being flagged.** *"We could not read enough
  of their funnel to name the first broken link"* went into Do-not-say because it
  contains the word *funnel* — a gate written to police the model's VOICE, fired
  on a fact we assembled. Register flags (marketing jargon, developer register)
  keep their rules and lose their destination: they are logged and stored as
  `_registerNotes` and never reach the sheet. Same split §61 made for VOICE notes.

**Two fixes hid each other.** Reverting the confirm-pattern widening left the
check green, because both live fixtures also matched the new internal rule. A
third fixture — a plain confirmation with no machinery vocabulary in it — is the
one only the widening can clear.

### 10/10 on sites the same sheet calls broken

The arithmetic is the whole story. The booking route is **3 of the 10 points AND
the gate on the 7.5 cap**, so when it goes unmeasured it leaves the denominator —
taking the biggest deduction with it — and disables the one safety net in the
same move. What remains are the components that most often pass. **The grade
improved the less we knew**, which is the recorded unmeasured-as-flattering
class pointed at a number an operator repeats to an owner.

- **The door is required.** No /10 without a measured booking route, on the same
  reasoning as the five-component floor: the door is the money stage the whole
  depth ordering is built on, and a build grade that excludes it grades the
  wrapper. A measured door still grades — the requirement is a measurement, not a
  tax, and the check asserts that direction too.
- **And the grade may not argue with the leaks on the same page.** A leak the
  ladder placed at the DOOR is a measured fault on this website; the build cannot
  sit in the top band beside it. The cap names the leak, so the number and the
  finding arrive as one statement. A leak elsewhere in the funnel does **not**
  tax the build — the caption says these are judged separately and that stays
  true.
- The client stopped keeping its own copy of the cap reason. It printed "nothing
  on it books a time" for any cap, which with a second reason would have been
  false about a site whose scheduler works fine.

### "Fix first: unknown" over three numbered leaks

The blind guard tested `builtWith.checked` — a fact about the **plain
no-JavaScript fetch**, which a bot-hardened site refuses routinely while the
rendered homepage beside it reads perfectly, and every booking, form, phone and
tag measurement comes off the rendered copy. §64 found this exact mis-aimed gate
for the six ad fields; the cascade was the consumer nobody re-aimed.

It now reads positive evidence of an actual read: markup we read, a booking route
we measured, an interior page we opened, the plain fetch when it DID answer, or a
numbered leak at the door — **a leak about their door cannot exist unless their
door was measured**. The existing order assertion was re-aimed rather than worked
around, and two new needles pin the merged read.

**One added branch was deleted before it shipped.** A deferral clause I wrote sat
inside an else-if chain where its own `!bottleneck` guard is always true, and its
condition was a strict subset of the FOUNDATION branch directly below it, which
already says the same thing better. §66's rule: a limb no fixture can reach is
the kind that rots.

### Two map positions on one sheet

*"Search, map: #2 of 100"* three rows above *"The map beside the results: their
listing is in it at #1"*. Both reads are honest and they are pulled separately,
so they can disagree by a place — and a caller handed two positions for one
surface cannot say either out loud. The finder read is the authority (a 100-row
window, two agreeing samples, localized to the city); the three-row block on the
results page is a SECOND read whose value is proving they are in the map at all.
It states presence when a position is already on the sheet, and its own slot only
when nothing else could.

### A gate that fired and could not say which

`SITUATION READ GATED: removed 2 sentence(s) — quotes 0, money 0, spelled scale
0, recency conclusions 0, review counts 0, competitor sites 0, post-contact
claims 0. First: ""`. The TOTAL counted nine buckets and the BREAKDOWN named
seven, so the two families added since that line was written removed real
sentences and reported as nothing — and the First chain could not reach them
either. Both now come off the SAME object, so a stripper added tomorrow appears
by construction; a bucket with no label prints its own key, visible and ugly,
never silently zero. `SYNTHESIS GATE TALLY CHECK` holds the declaration both
ways, and the ownership cuts moved out of a total they already have their own
line for.

### The Places meter could not name the call

Five leads, DataForSEO credentialed: **5 text searches + 5 profile reads**. Two
Places calls a lead where the design says one profile read and no search at all —
every rank and duplicate-listing search goes to DataForSEO now. **Four different
call sites can produce that search and the line named none of them**, so the
largest remaining question about the Places bill could not be answered from a log.

This is §54's Anthropic-label fix one service across, and it is deliberately a
MEASUREMENT rather than a cut: nineteen of twenty-four model calls once printed
as the word "anthropic", and three sessions proposed cuts to a bill nobody had
measured. Every billed Places call names itself now (`find-discovery`,
`place-id-recovery`, `duplicate-listing-fallback`, `rank-fallback`,
`place-details`), the spend line prints the breakdown sorted by count, and
`PLACES LABEL CHECK` computes the inventory from the file's own call sites — so a
call added tomorrow fails the boot until somebody names it.

**HONEST SHAPE: no API call was added or removed this round, so the per-lead bill
is unchanged.** The next live run's `GOOGLE PLACES` line names the mystery search
outright, and that is the evidence a cut should be made on. Cutting a call I
cannot identify is the failure this file records most.

### What is NOT diagnosed

The David Price Construction block repeats about twenty times in the log Vin
pasted. There is no per-lead loop in this file that can emit it more than once —
no session report, no re-emitter — so it is either a client re-submission or an
artefact of the log viewer, and guessing between them would be the
message-names-the-wrong-cause failure. The next run answers it: `grep -c
"duplicate request ignored"` and the count of `JOB job_` lines against the number
of leads actually submitted.

**`index.html` changed, so this needs a Netlify deploy**, and the contract is
20260906 on both sides — a stale page would render a measured absence as "not
measured" and print the wrong cap reason.

---

## 85. Round 107 — the sheet stopped arguing with itself, and the log stopped telling its own history — 2026-08-27

Vin: *"take ur time i need auidts at 8.5 logs at 9.5 audits ready to send to
sales guy in bulk"*, then *"build everything at the highest quality ever... fix
everything at the root build from the ground up."* Twenty-six defects across
three clusters, every one falsified by reverting it ALONE against a green
baseline — **37 reverts, each red on its own named assertion** — and four of
those came back STILL GREEN first, which is the entire reason the discipline
exists. **264 boot checks green**, all gates green.

### A — the sheet said two things about one measurement

- **"Their Google listing has 0 photos on it", on leads with photo-rich
  listings.** The Places photos array saturates at **10** — that is our API's
  ceiling, not their count — and `fetchGBPHealth` correctly travelled a
  saturated read as null. The DataForSEO finder row then re-mapped the same
  number through `Number.isFinite(Number(x.totalPhotos))`, and **`Number(null)`
  is 0 and 0 is finite**, so the null minted one hop earlier came back as a
  measured ZERO. Its sibling field on the very next line, `isClaimed`, is
  `typeof`-guarded and was immune — the contrast that proves the guard was lost
  rather than never written. `readPlacePhotos` is one pure derivation now
  (`photosSeen` / `photosAtCap` / `photoCount`), `gbpPhotoPhrase` is the one
  sentence every consumer prints, and every photo total is coerced with
  `strictNum`, which refuses null, undefined, booleans, arrays and the empty
  string. A saturated listing states **"at least 10 photos, so the real number
  is unknown and must never be stated"**; a genuine measured zero still fires
  `thin_profile`, because the finding is real when the measurement is.
  **And the same laundering was inside the gate built to catch it**:
  `verifyFiguresTrace` calls `add()` for eleven fields, so one unmeasured
  measurement — which is nearly every lead — put the digit **0** into the
  allowlist the figure gate quotes back at a refusal.
- **"Nobody responds — 5 mentions" printed one line under "After they reach
  out — NOT MEASURED".** The complaint and the size of the sample it was read
  from are ONE measurement and they travelled separately: five different places
  wrote `publicPainSignals` and only some of them wrote `reviewsRead`. One
  setter now (`takePain`), and it carries three things — the strings, the
  denominator, and **whether the complaint came from their reviews at all**.
  The funnel walk gained a third state between "no fault found" and "not
  measured": **PARTLY MEASURED**, for a stage we looked at and cannot say
  enough about. A complaint from a WEB SEARCH is no longer described as their
  customers' own written record; it is not, and it cannot license the pattern
  rung.
- **"The only way in is a form"** on sites with a phone number in the header.
  `booking === 'form'` has always meant *a route exists and nothing books a
  time* — the critique prompt says so in those words — and the rung's own
  sentence had never been told. Only the word "only" was false, so only it was
  removed: widening the test to demand no phone would delete a real, sellable
  finding on most trade sites, which is the guard-too-tight failure.
- **"Every one of those is a job that went somewhere else"**, on a lead whose
  review mine found no complaint at all. Four of the rungs in that pillar are
  measured off the WEBSITE and need no review evidence to fire, so the money
  line takes an evidence argument now: with the customers' own written record
  behind it the loss is stated; without it the sentence says what was measured
  and hands the rest to the one place that can answer it — his own phone log.
- **"None of the earlier stages measured as the problem"** printed above a door
  stage rendered BROKEN with two red leak rows on it. That branch never measured
  what it claimed; all it knew was that no condition ABOVE it matched. The
  door-leak fact was computed 190 lines up and read by one other line —
  computed-but-not-passed inside one function.

### B — what a junior rep reads as sloppiness

- **Four human-facing cuts ended mid-word.** One word-boundary clip now, at
  every one of them.
- **A quoted span that begins inside a sentence is marked as the excerpt it
  is.** It read as a whole sentence otherwise, and the reader could not tell
  which he was holding.
- **`replyLatencyPhrase(null)` returned "the same day"** — my own null
  laundering, written in the same round that fixed the class three functions
  away, and caught by this round's own assertion.
- **A door finding priced by an after-stage template.** The financing leak
  carried *"a quote that sits unanswered is one of those jobs"*; it says the
  monthly-payment thing now.
- **`"repair replace"` was bought as a real search** and `"seal coating"` had to
  survive. Anchored whole-word forms only, both directions fixtured — widening
  the list one step eats real service pages, which deletes `service_invisibility`
  in silence.
- **Two renders under one intent key printed as "proof · proof"**, the campaign-
  shaped half of the unlinked-page read was dropped at the return, and the route
  top-up could mint a SECOND leak number for a claim family that already had
  one — two rows saying the same thing, numbered 2 and 3.
- **One display form for the website**, so the Contact block and the export
  cannot spell one fact two ways.
- **The Do-not-say quote had two homes.** The stored entry BEGINS with the
  quoted span, so the fallback reason printed it a second time — three of five
  entries on two separate live sheets.

### L — the log names the real cause, once

- **Every DataForSEO failure printed "the CREDENTIALS were refused — check
  DATAFORSEO_PASSWORD in Render."** A 40200 is an EMPTY BALANCE and the
  credentials are perfect. A guess printed as an instruction reads exactly like
  a measurement, and it sends whoever reads it to inspect the one healthy part
  of the system — the Supabase-table failure this file already records, in a
  second costume. The cause is READ from their own code now (balance / auth /
  location / request / notfound / theirs), each with what to do about it.
- **And it was said once per QUERY.** A lead asks the pack up to ten times, so
  one account fact printed ten times and the reader scrolled past all ten. An
  account-level failure latches like the Firecrawl balance and the Apify token
  do — with the same half-open probe, because a latch with no way back is the
  deadlock recorded in §43 — and the doomed attempt is skipped while the Places
  fallback is untouched.
- **The CONSEQUENCE was never said at all.** What matters is not that a call
  failed, it is that this lead's sheet will carry **no search position, no named
  competitor above them and no sponsored block**. One `RANK SOURCE` line per
  lead, beside the spend, with the count of Places searches bought as the
  fallback.
- **Thirteen per-lead log lines carried the codebase's history** — what the code
  used to do, which live lead it broke, on what date — in the middle of a fact
  about THIS business. Every measurement and every scope note stays; the
  changelog goes. A boot check scans the 440 per-lead log lines for it, with a
  population floor, because a scan that matches nothing reports a clean pass.
- **A second rank sample could print after its own function had returned**, so
  its failure landed under the NEXT lead's name, and a settings line about the
  Firecrawl PLAN was announced once per lead as though it were about the
  business.

### What the falsification runs found in the checks themselves

- **The mid-sentence fixture measured nothing.** Widening the quote's lead
  window to 160 characters — the same round — made the whole sentence fit, so
  the span began at a capital letter, the marker could never fire, and
  reverting the marker left the check green. The fixture's lead-in is now
  longer than the window, which is the only state in which a span CAN begin
  mid-sentence, and it asserts the marker itself rather than a proxy.
- **A fixture that handed in the flag it was testing.** The review-provenance
  fixture passed `reviewPainIsReviews: false` to the consumer, so it could only
  ever prove the consumer reads it — reverting the one WRITER that sets it left
  every fixture green. Tenth recorded instance of *a check that does not assert
  its call site is half a check*.
- **One needle covering two surfaces.** The partly-measured state is rendered by
  the screen AND the export, and a single `indexOf` was satisfied by either, so
  reverting the export alone passed. It counts both now.
- **A fix with no guard at all.** The one website display form had been added to
  the harness's lift list so the code would compile, and nothing asserted it.
- **Five needles with an EMPTY half** — one written by me this round, four
  standing. A needle assembled from a real half and an empty one is one
  contiguous literal sitting in the check's own body, so `indexOf` finds
  ITSELF and the guard passes on a build where the thing it protects is gone.
  Sixteenth recorded instance. Two of the four turned out to be guarding
  something real: with the halves split, reverting the review-figure authority
  and the cached-contact buying floor now both go red, and neither did before.

### Two smaller things settled on the way

- **`\bused to\b` is not the substring "used to".** The first changelog scan
  flagged *"the spine refused to build on it"* — `ref**used to** build`. A
  boundary, not a substring, and the fixture that found it is in the check.
- **"Invalid Field" is not automatically a LOCATION field.** Matching the bare
  words made every malformed field read as a market their database does not
  hold, which would buy a second identically malformed request while reporting
  a problem that does not exist. Found by this round's own fixture on a 40502.

**HONEST SHAPE, stated rather than implied.** None of this has run against a
live lead — the last live run is what these defects were read out of. The
DataForSEO account is out of balance, so the cause reader's `balance` branch is
the one that will fire first on the next run, and that is the branch to check
the wording of against a real log.

**`index.html` changed, so this needs a Netlify deploy**, and the contract is
**20260907** on both sides — a stale page would render a thin read as a verdict
and send a complaint to the server with no sample size behind it.

---

## 86. The sheet got a top — 2026-08-27

Vin, relaying his junior rep: *"he has no clu ehwta these audits mean and
truthfuklly as im reqding them they are like spekaing in code."* Then, with
Mike Taft's own hand-made call sheet for Irwin's Septic in front of him:
*"im thinking use exaclty mikes example... i need everythign said in the audit
to bascially be like so what? so we know the takeaway for eahc point... these
audits are built for me and i have to read through them deeply to understand
everythgin and trnalte to my sales guy that cant happen."*

Mike's version was read line by line before anything was built. What it does
that ours did not is three things, and only one of them is layout:

- **every leak carries a cost line in its own colour** — the "so what?", made
  structural rather than left to the reader;
- **a two-column scoreboard** — six things won, six things leaking, before any
  diagnosis, so a rep knows in ten seconds what NOT to sell against;
- **a section flagging contradictions in OUR audit**, which Mike had to
  resolve by hand.

And one thing it does that cuts against a decision made two days earlier:
Mike **kept** "Open with this" and "Do not say", which had been argued away on
the grounds that a plain-enough sheet needs no script. He is right and that
argument was wrong: one opener and one do-not-say line is exactly what makes a
sheet usable in sixty seconds.

**The diagnosis was never "too much information."** Vin, deciding it himself
after seeing a version that condensed: *"i feel like we do need all of this
detial for now just to conintue improving the app but the top fold is perffect
for our sales guy to brush ove rand knwo whats goign on."* So nothing was
deleted. The sheet got a TOP.

### Two tiers, one document, both surfaces

**For the call** — the story, the scoreboard, the numbered leaks each with
their so-what, the conversation, and Do-not-say. **The full record** — the
funnel with every measured signal at its stage, their own words, the internal
intelligence, what we could not check. The screen carries the identical order,
because a rep and the person who built the audit have to be reading one
document in two places.

**Do-not-say moved INTO the call tier**, reversing §62's "warnings last". The
reason is not taste: a rep who never scrolls past the top is exactly the reader
those guardrails exist for, and at the foot of the record they were invisible
to him.

### The takeaway is written in the branch that produced the value

A "so what?" keyed on the row LABEL, or matched against the rendered text,
would be a second copy of the condition that produced the value — the disease
this file records more than any other, and the copy that rots is always the one
that only runs where nobody looks. So a signal row may hand back a PAIR,
`[what we measured, what it means for the call]`, written inside the same
branch. Seventeen rows carry one. `R()` is backwards compatible by
construction, so a row whose value speaks for itself is unchanged.

Falsified: two opposite booking measurements must not produce the same
takeaway. Reverting `R()` to ignore the pair goes red on exactly that.

### The scoreboard, and the suppression that had to be narrow

`scoreboardFor` is one builder both surfaces call. The won column restates
measurements we actually read; the leaking column is the ladder's own sayable
findings as a one-clause index, so a revenue signal can never be buried below
the fold — the owner's own rule. **A numbered leak in the index carries no cost
line**, because it is spelled out in full a few centimetres below.

Every won item is suppressed by the findings that would contradict it, and the
suppression names **exact rung ids rather than a signal group**. The first
version suppressed on the whole `search` group, and the falsification proved
what that costs: a business can be **#1 for its own trade AND invisible for one
service page** — two true facts about two different searches — and the group
form deleted the strength that decides how the call opens. Both directions are
now fixtured: the booking win must vanish beside a booking finding, and the
head-term win must survive a service-page finding.

### A numbered leak is written out once

At its funnel stage it is now a POSITION MARKER — the badge, a clipped clause,
and "written out in full above." Printing its sentence, its cost line and its
product a second time at the stage is the "info everywhere" complaint. Same on
both surfaces. The three per-leak openers left the Worth-asking list for the
same reason and live on their own cards; that list keeps the one question the
READ produced, which belongs to no single leak.

### The words

`PILLAR_PRODUCT` said "conversion work", "search ownership" and "automated
response layer" — our category names, which a junior rep reading aloud is
repeating rather than describing. Same six products, said as what they do:
*rebuild the site so the page turns visitors into jobs*, *own the searches he
is missing*. And `The door` — our shorthand for a whole funnel stage — is now
**The page they land on**, which is what the server's own fix-first sentence
had been saying all along.

### The live bug the rebuild surfaced

`auditRecordFor` never set `reviewsRead`, and the export's own signal context
had been passing `r.reviewsRead` from the day the denominator was added. So on
**every exported sheet** the top review complaint read *"and how many reviews
that came from was not recorded"*, while the screen — reading the lead directly
— showed it correctly. Computed, wired, and dropped one line before use, in the
one artefact a salesperson actually holds. Instance twenty-six.

### Paper

Measured, not estimated: seven audits went **7 pages to 14**. A forced page
break between the tiers was tried and made it **21** — a clean page one that
the record spilled off anyway — so it was reverted rather than kept for the
look of it. On paper the takeaway now flows on the same line as the value it
explains (`display:inline` in the print sheet only), which is where the saving
is on a real lead: this fixture has three signal rows and a live lead has
eighteen. Two pages a lead, and the second one is the record Vin asked to keep.

### What was deliberately NOT built

**"Flags for Vinny."** Mike's section listing contradictions in our own audit
is the most interesting thing on his sheet, and the three flags in it are
mostly ALREADY closed in code: §106 caps the site score when a numbered leak
sits at the door and makes the server write the reason, the found-stage
"mixed" status exists for the works-with-leaks case, and the ads hedge has one
predicate. A detector for what remains would fire on almost nothing, and a
mechanism no fixture can reach is the kind that rots (§66). The honest version
is a real contradiction detector over the assembled sheet, which is its own
round.

**No ranking, no rung, no copy change.** PART 6 holds: nothing is tuned until
real replies exist to tune against. One mismatch is worth recording as a
finding rather than fixing blind — `no_financing` is pillar ROTTING, and
ROTTING maps to follow-up automation, so a financing gap currently recommends
an automatic follow-up product. That is a declared pillar mapping and changing
it is a ranking decision, not a layout one.

**Eleven falsifications, each reverted alone against a green baseline and each
red on its own named assertion**, plus every gate: 264 boot checks green,
clientcheck, batchcheck, servercheck's 41 assertions over a fake network,
auditfuzz over 5,000 vectors, fuzzcore over 20,000 cases, 1,637 emails composed
over HTTP.

**What the falsification runs found in the checks themselves.** The harness's
own parse gate used a process substitution, produced EPIPE, and reported **NO
VERDICT for all eleven reverts** — the harness-that-lies class, in my own
machinery, and it would have read as eleven clean passes to anyone who did not
look. Rewritten to a temp file. Two guards then failed to guard: the
duplicate-content assertion counted a marker that renders twice either way (the
fixture-that-measures-nothing trap) and now asserts the mechanism itself; and
the `leakWhereFor` needle covered TWO call sites with ONE search, so reverting
the export alone left it green — it counts both now. Both were invisible until
the reverts ran.

**`index.html` changed throughout, so this needs a Netlify deploy**, and the
contract is **20260908** on both sides — a stale page renders the old
single-tier sheet and will say so by contract number.

---

## 87. The repetition I built, and one document in two places — 2026-08-27

Vin, on the first live pair of the two-tier sheet: *"this is cleaalry
reprtitive and for the actualy audit screen its even mroe detial then before i
wnat it to macth the export sheet."* Both were mine, both from §86, and both
were structural rather than cosmetic.

### The index was reprinting the cards

The leaking column carried the three numbered leaks VERBATIM and the cards
printed the identical sentences ten centimetres below. I had deduped the *cost
line* and left the *sentence*, which is most of the row.

The column is now **what is NOT already on a card** — headed "Also leaking, the
biggest N are written out below". Nothing is lost and the owner's rule still
holds: a finding is either on a card or in this list, never buried and never in
both. On a lead where the three leaks are all there is, the column says so.

### Two leaks priced by one template said the same thing twice

`paid_traffic_leaks` and `ads_untracked` are both BURNING, so leak 1 and leak 2
carried a **word-for-word identical So-what** and the same product line. A
takeaway the reader has just read is not a takeaway. `trimRepeatedJobValue`
already trimmed a repeated first SENTENCE; it now also refuses an exact repeat
outright.

### And eight identical opening words

Both leaks opened *"Google's ad code is on their homepage, and…"*. The two
rungs are correctly separate — `RUNG_CLAIM_FAMILY`'s own rule is that a family
is for rungs that read one measurement **and say the same thing about it**, and
these say different things — but the shared preamble buries the difference and
the pair reads as padding.

`trimRepeatedLead` drops a leading clause the card directly above has already
stated. **Display only, and bounded**: never a whole sentence, only where what
remains is a substantial sentence in its own right, and never in an email —
the rung sentences themselves are untouched, because they ship without this
neighbour to lean on. Falsified in both directions, including the floor.

### One document in two places

Three sections differed between the sheet and the screen: **the sell** existed
only on the screen (the sheet had it as a line inside the story), the same
block was headed **"The call"** on one and **"The conversation"** on the other,
and the **score** sat in the sheet's header while the screen buried it in a
card halfway down — a card that also carried internal reference notes inside
the call tier.

All three closed by moving each to the same place on both, not by writing a
second copy: the sell is its own section after the leaks, the heading is "The
conversation" everywhere, the /10 renders with the contact details and its
internal notes render in the record.

`SHEET_ORDER` is ONE declared list of the nine sections, asserted against the
exported page and against the audit screen. A section added to one surface and
not the other now fails the build.

### What the falsification runs found

**Seventeen reverts, each red alone.** Two guards did not guard and three
reverts were stale:

- The So-what fixture used a ONE-sentence money line, which the head-trim that
  already existed also reduces to '' — so the revert changed nothing and the
  assertion proved nothing. A two-sentence line is the only shape that isolates
  the new rule.
- The screen's order check matched section labels as SUBSTRINGS, so renaming
  "The conversation" to "The conversationX" still satisfied it. Exact match now.
- Three reverts written against §86's code no longer applied after this round's
  edits. A revert that does not apply is NO VERDICT, not a pass, and each was
  rewritten against the live bytes.

And two defects of my own, caught by rendering rather than by reading: a stray
`_leakSeen.length = 0,` became a fourth ARGUMENT to `cat()`, so the body was
`0` and every leak card vanished; and both surfaces recorded a card's own
opening clause BEFORE rendering it, so every card trimmed itself against
itself.

**264 boot checks green**, every gate green, and 7 audits of a seven-finding
lead render in 15 pages.

**`index.html` changed, so this needs a Netlify deploy.** The contract is
**20260909** on both sides — a page still on 20260908 renders the repetitive
version and says so by number.

---

## 88. One document — the record was mostly a reprint of the fold above it — 2026-08-27

Vin, reading a live pair: *"im really starting to think the full record section
is not needed... i dont think we are losing any detail in that section"*, and
then, directly: *"correct me if im wrong the The full record has the saem info
as the section above."*

He was right, and my first measurement said he was not. A script that
normalised both halves and compared them reported **zero duplicates**; listing
the two lists side by side instead showed **all four non-numbered findings
printed twice** — once in the scoreboard's index, once again at their funnel
stage. The normaliser truncated at 70 characters and the two renderings join
their cost line differently, so the substring never matched. The
harness-that-lies class, and it nearly went into a report to the owner as
"zero duplicates."

**The duplication was mine, from §87.** Fixing the repetition he flagged, I
moved the non-numbered findings up into the index and did not remove them from
the funnel. One duplication closed, another opened, shipped.

### What was actually unique below the rule

Measured, not asserted, on a seven-finding lead: the four findings printed
twice, plus an unstaged block printing a fifth. What remained that existed
nowhere else was **six measured signal rows** (form length, price, what a click
becomes, analytics, service plan), the **"Not measured"** list, the internal
review intelligence, the read limits, fix-first, and the stage statuses.

That is a real half-page — and it is not enough to be a second document. So
the tiers are gone: one sheet, one screen, the measurements folded in where the
funnel already was.

- A finding that is NOT one of the numbered three renders in the index, once.
  Its `rankNote` — which the index has no room for — is the only thing that
  still earns a line at its stage.
- Rows with no funnel stage render in the index only; the block under the
  funnel that used to carry them was the same reprint one row down. Their
  `area` label rode that block, so the index carries it now.
- The workmanship strip owns the `work` rows, and the index excludes them: a
  reputation note listed in a column headed "leaking" is context sold as lost
  revenue.
- The signal takeaway rides the same line as its value on both surfaces now,
  not just on paper. "Short and small and right to the point."

### What the falsification runs found

**Nineteen reverts, each red alone.** Three were stale against this round's
code and reported NO VERDICT until rewritten against the live bytes — a revert
that does not apply is not a pass. Two guards did not guard: nothing asserted
that a non-numbered finding renders once (the reprint could come straight
back), and nothing asserted that a `work` row stays out of the index. Both now
execute the mechanism.

The section list is one declared constant checked against both renderers, so
the two surfaces cannot drift apart again.

**264 boot checks green**, every gate green. Seven audits of a seven-finding
lead render in 14 pages, and the three remaining blocks measure within 10% of
each other (scoreboard 1449 characters, leaks 1480, funnel 1592) — there is no
fat left to cut without deleting information.

**`index.html` changed, so this needs a Netlify deploy.** The contract is
**20260910** on both sides.

---

## 89. Fifty leads ranked, with an owner email and a phone number — 2026-08-27

Vin, after the strategy read: *"I need 50 leads ranked with owner email and phone
number that are in our ICP."* One goal, and the app could not serve it. Phone and
ICP were already free at Find time; the owner email existed only inside the full
research route, which also buys the review mine, the whole search half, PageSpeed,
the sitemap, up to seven interior pages, three renders and four model calls —
about 16 Firecrawl credits and $0.13-0.19 of model — to produce two fields. And
there was no CSV anywhere in the client.

Seven recon agents mapped the paid surface, the queue, the client and the checks
before a line changed; two adversarial critics were then pointed at what the recon
had NOT looked at. **They found the two things that would have made this build
destructive**, and both are recorded below because reading the code would not have
found either.

### The blocker nobody had looked at: a contact run destroyed audits

`applyResearchResult` writes `L.brainAudit = data.brainAudit || null` and then
runs `Object.assign(L, measuredFieldsFrom(data.brainAudit))` **unconditionally**.
A critic lifted `measuredFieldsFrom` out and EXECUTED it with null: seventeen keys,
every one an empty default. So a contact pass over the existing 200-lead pipeline
to harvest addresses would have **blanked every audit already paid for** — on the
lead, and via `leadToRow` permanently in Supabase — flipping the whole board from
Audited to Not audited with nothing on screen saying why. §47's "the audit lost its
findings whenever no EMAIL could be written", through a new door.

The mode flag is the guard, not a truthiness test on the audit: an audit that
legitimately came back empty on a FULL run still has to clear the lead, and only
the server can say which run this was.

**The merge check could not have caught it.** It builds a response where every key
is present, so the destructive shape is structurally unreachable by it. THE WIPE
is its own executed test now: the real merge, over an already-audited lead, with a
contact-only response, asserting the audit survives and the contact fields land.

### The second blocker: the render is an EMAIL source, not decoration

The first build skipped the homepage render on a contact run — it looked like pure
audit cost, and it is the single most expensive Firecrawl item on a lead. A critic
traced it: `visionAuditPage` is asked for `"visibleEmail"` and normalises the
obfuscated forms a scraper cannot read (*"jill [at] x dot com"*), and the recovery
branch writes a **tier 1, sendable** result and logs *"EMAIL RECOVERED BY VISION:
the text scraper was blind to it"* — firing precisely when the cheap engine
returned NOTHING. Cutting it would have cost the deliverable on exactly the leads
where the cheap path already failed. The claim is true of `_findEmailFireproofCore`
in isolation and false of the route.

The render stays. Only the PHONE render — which no email path reads — is skipped.
`FC_CONTACT_VISION=off` drops it for an operator who would rather keep the credit.

### What the mode is, and why it is a mode

`contactOnly` is a flag on the research route, not a second route. The contact half
is a strict PREFIX of that function — the homepage read, the domain confirmation,
the owner ladder, the email engine — and a second implementation of it is the
disease this file records more than any other. A mode also inherits the boot-window
gate, the preflight, the credit latch, the concurrency slot, the RSS gate, the day
ceilings, the per-lead spend ledger and the kill clock for free. `/api/test-contact-engine`
is the standing proof of what a second route costs: it double-buys every source,
skips the contact cache in both directions, and bypasses preflight and the day
ceiling while still charging the day ledger.

Ten guards, each pinned at its CALL SITE by the boot check, because a fixture
supplies its own arguments and cannot see a caller: the Companies API (whose only
email-facing output is `verifiedEmployees`, and the email engine destructures
`employees` and never reads it), the Apify mine and its Places fallback, the whole
search-visibility block, the interior pages, the web-pain search, the careers read,
the phone render, the Facebook Ad Library, the audit model call, and the brain gate.

**Three model calls stood down by one guard.** Skipping the audit call makes
`parsed` null, which makes `auditRefusalKind` truthy, which makes the EXISTING
early gate skip the story writer and the fact-check on its own — a mechanism
already in the file rather than a second copy of it.

**And the gate must not refuse a lead that never asked for an audit.** Without the
exemption every contact lead 422s and the run reports as failed with the owner and
the address already resolved and thrown away — §44's "one blank field destroyed
the whole lead", four of five leads in one batch, money already spent.

### The ranking is not a second scorer

`scoreReachability` has answered "can we put this in front of the decision-maker"
on a 0-100 scale since the day it was written. `contactRankFor` takes that as the
BASE and adds only what it does not know: a dialable number (+8 — reachability is
an email question and this list is for calling), a confirmed buyer (+6 — PART 3's
own rule, and `canBuy` was only ever in a log line), and the two discovery
DEMOTIONS (-10 each, or a decision taken at Find time is silently undone at
ranking). Small against a 0-100 base on purpose: this orders CLOSE CALLS, and the
boot check asserts a phone number can never lift an unreachable lead over an
SMTP-confirmed one.

**An unmeasured reachability refuses to rank rather than laundering into a
confident 0** — eight shapes asserted, because `Number(null)` is 0 and 0 is finite.

### The CSV, and the four states one caption was hiding

The first CSV in this repo. Both existing confidence captions derive their answer
by REGEX over the human-readable label, so four materially different states
collapse into one sentence: a learned pattern, a **catch-all domain** (delivery
certain, RECIPIENT unknown — a wrong-person risk, not a bounce risk), an eponymous
inference, and a tier-4 guess the resolver refused outright while the screen still
rendered it. Tier, sendable and the block reason are their own columns now, read
from the TIER and never from prose that happens to contain the word "verified".
A cached address up to 60 days old says so on its row. A free-page-builder site
carries a warning, because an address built at a domain the business does not own
is well-formed and undeliverable.

**A formula-injection guard**, which the one existing CSV writer has none of: a
cell beginning `=`, `+`, `-` or `@` executes when the file opens in Excel or
Sheets, and this file carries business names scraped off arbitrary web pages,
opened by a junior rep. Every rule is EXECUTED in clientcheck, both directions —
a guard that eats real data is the more expensive failure.

**"Rank" means SEARCH POSITION nearly everywhere else in this codebase**, so the
column says on its face that it is not one.

### What the falsification runs found

Nine reverts, each applied ALONE against a green baseline, each RED on its own
named assertion. Three found something real:

- **Two reverts did not APPLY** and the harness reported NO VERDICT rather than a
  pass — the anchors were written from a stale line number. Rewritten from a byte
  probe of the live source and re-run red.
- **One fixture measured nothing.** The unranked-last rule was fixtured with every
  other rank ABOVE zero, so laundering an absent rank into 0 still put the
  unranked lead last and the revert stayed GREEN. The only shape that isolates
  the rule is a MEASURED zero beside an unranked lead whose name sorts first.
- **My own needle minted a phantom Anthropic call site.** The call-site needle
  contained the literal `anthropicFetch(`, and ANTHROPIC LABEL CHECK scans this
  file for exactly that string to build its inventory — so it found a "call site"
  inside my own check with no name after it and failed a correct build. The
  seventeenth recorded instance of a needle finding something it should not, and
  the first where it invented a call site rather than matching itself. The join
  now falls INSIDE the function name.

**And the CRLF trap fired from inside the editing machinery again.** A replacement
authored in a Python triple-quoted string carries LF, and 83 LF-only lines went
into a CRLF file that still passed `node --check`. `ed.py` now REFUSES a bare LF
rather than trusting the author to remember.

### What is deliberately NOT built

- **No ICP size gate on the research route.** A critic verified that
  `looksLikeEnterpriseByName` and `sizeGated` are called only inside `/api/discover`
  — so a contact list has no institution filter on any lead that did not come
  through Find. Recorded rather than patched: it is a discovery concern and the
  fix belongs there.
- **The `icpFiltered` per-word defect.** The same critic lifted the real
  `BLOCKED_COMPANIES` set and EXECUTED the real per-word test: **Fox Plumbing,
  Kelly Roofing, Apple Roofing, Volt Electric, Target Pest Control, Block Electric
  Company, Square Deal Plumbing** and **Cascade Veterinary Hospital, Federal Way
  Plumbing, County Line Roofing** are all dropped at discovery, and `sizeGated` —
  which carries §14's small-practice escape — runs only afterwards, so that fix is
  unreachable for them. Verified, costly, and NOT fixed here: it is a supply bug in
  a different function and it deserves its own round rather than being folded into
  a feature the same night.
- **The VERIFIER_EXHAUSTED / VERIFIER_DEAD latches** are one-way with no cooldown
  and no half-open probe, unlike the Firecrawl credit latch. On a 50-lead run that
  exhausts at lead 12, the remaining 38 silently fall to tier 3/4. Real, recorded,
  not fixed tonight.

### HONEST SHAPE

**None of this has run against a live lead.** The mode, the ranking and the CSV are
executed at boot and over a fake network; no contact-only batch has been run for
real. The per-lead cost is therefore an estimate from the guards, not a
measurement: expect roughly 2-6 Firecrawl credits plus one render, three to nine
Haiku calls, one Place Details call and a handful of SMTP probes, against 16
credits and four model calls for an audit. **The first real run is what settles
it**, and the `📇 CONTACT RANK` and `FIRECRAWL SPEND` lines answer it outright.

**265 boot checks green**, every gate green: tdz, dupkeys on both files, scopecheck
on both, fetchtest, pngscale, clientcheck, batchcheck, auditfuzz, fuzzcore,
servercheck's 41 assertions and 2,000+ emails composed over HTTP.

**`index.html` changed, so this needs a Netlify deploy**, and the contract is
**20260911** on both sides.

---

## 91. The first live contact run: four nav labels became the decision-maker — 2026-08-28

Vin ran the new Find-tab contact button for real and sent the whole Render log,
the screen and the file: *"the numbers are all wrong saying export this but 14
read etc... the stop button does not work... i download the csv is goes ot
donwload i try to open it and nothing happens."* And the standing order first:
*"i want you to diagnosis all of the issues first befoer building anythign so i
want you to analzye hard to make sure evryhtigns working proeply."*

The run itself worked and it was cheap — **$0.0021 to $0.0092 of model per lead
and zero Firecrawl credits on every plainly-readable site**, against a $62/month
estimate I had given him from arithmetic. That much is measured, from the run's
own meter lines. What the log carried underneath it was ten defects, and four of
them put a fabricated person in the one column a rep dials from.

### The four false owners

Every one of these is a live string from that run, and every one became the
DECISION-MAKER on a sheet:

| business | what we printed | what it actually is |
|---|---|---|
| Alliance Animal Health | Alliance Academy, "Partner Track" | a navigation label |
| American Heart Association | Donate Monthly, "CEO Roundtable" | a navigation label |
| West Coast Wound | Care Experience, "Our Founder Dr. David Kay" | a sentence about the founder |
| Penske Truck Leasing | "Art Vallely Named", President | a headline verb inside the name |

The Heart Association one did not stop at the sheet: the email engine took the
fabricated name and built **donate.monthly@heart.org**.

There were four separate causes and they compound, so fixing any one of them
alone would have left the column wrong.

- **An ownership word must be the HEAD of the title, not a modifier.**
  `OWNER_TITLE_RE` matched all of "Partner Track", "CEO Roundtable" and "Why
  Partner Our Support", and it was right to: the words are there. What separates
  them from a real title is grammatical rather than lexical — in "Founder & CEO"
  the ownership word is the head of the phrase, and in "Partner Track" it
  modifies the noun after it. `ownershipIsHead` looks at what FOLLOWS the match:
  end of string, punctuation or another title word is a title; a plain following
  word means the ownership word was an adjective. A list of banned phrases would
  have caught none of these four and would need a new entry for every site.
- **The cause of the second one is the INPUT, not the parser.** The audit path
  hands `parseTeamRoster` a leadership page; the Find tab's free read hands it a
  WHOLE PAGE — navigation, hero, footer. So a nav label sits exactly where a
  name sits and the marketing line under it sits exactly where a title sits.
  `looksLikeJobTitle` filters on shape only, no phrase list: a title is not a
  sentence, is not longer than six words, and is not a statistic ("250+ partner
  practices"). Removing everything is the honest answer on a page we cannot read
  this way — it is the same state as a page with no roster, and it sends the
  resolver on to the model.
- **The owner was picked by DOCUMENT ORDER.** `_owners[0]`, on a page listing
  fourteen people, is whoever the layout puts first. It is ranked by the same
  `authorityScore` the rest of the resolver uses now, with the SHORTER title as
  the tiebreak, because a real title is "Founder & CEO" and prose that happens to
  carry an ownership word is always longer.
- **A headline verb is not part of a name.** "Art Vallely Named President of
  Penske" is a headline, and the verb sits exactly where a surname would.
  `stripHeadlineVerb` is a declared list of the words a personnel headline uses,
  because there is no other way to tell.

`OWNER TRUTH CHECK` runs all four rules against those live strings AND against
twelve real ownership titles that must survive — "Founder & CEO", "Managing
Partner", "Owner/Operator", "Partner, Litigation" and the rest. A filter tuned
until it refuses everything stops resolving the owners this whole system exists
to find, which is the more expensive failure.

### A leadership page is not a headcount

Alliance Animal Health scored **75/100 — the highest in the run** — because its
team page lists fourteen people, and fourteen reads as "squarely the size we sell
to". The fourteen were a CFO, a COO, three Senior Vice Presidents and four Vice
Presidents, and the same page says "250+ partner practices". A two-person
wound-care practice in the same run scored 26. **The score was upside down.**

What a leadership page states is not how many people work there; it is how DEEP
the org chart is, and a business with three SVPs is not a business with three
SVPs and nobody else. Two or more corporate titles now score as the SCALE
evidence they are. One VP at a fifty-person contractor is ordinary, so the bar is
two, and the check asserts that direction too.

### Six national brands, read at full price

The Washington Post cost 2 Firecrawl credits and 109 seconds, Herc Rentals 3 and
101, Lodging Dynamics 4 and 155, plus Penske, Highmark Health and the American
Heart Association. `looksLikeEnterpriseByName` already exists, is already
falsified against seventeen real owner-operated names that must survive it, and
ran only inside `/api/discover`. Reading it here is free and happens before a
single byte moves — asserted at its CALL SITE and asserted to sit ABOVE the day
ceiling, because a refusal that happens after the money moved is not a refusal.

**HONEST SHAPE, and it is the important half: executed against those six live
names, that filter catches NONE of them.** It is an institution and scale-word
filter, and "Penske Truck Leasing" reads exactly like a local business by name.
It is worth having and it is not the fix. **Keeping enterprises out of this queue
is a Find-side job**, and the Find queue that produced these six is stale
job-board leads rather than Places leads — which is also why almost none of them
carried a phone number.

### The CSV downloaded and would not open

A 4KB file, and nothing happened on a double-click. The row terminator is CRLF
and two of the columns carry PROSE — the score explanation and the notes — which
can contain a newline. RFC 4180 permits one inside quotes; plenty of readers do
not, and the file then opens as nothing. A line break inside a spreadsheet cell
carries no information anyway, so it becomes a space. The check now parses the
WHOLE FILE and counts cells per row, which is what a spreadsheet actually does.

### Two numbers about one thing

"14 read" counted the leads ON SCREEN and "Download CSV (8)" counted the WHOLE
QUEUE, so two numbers about the same thing disagreed on one panel and the
operator could not tell which was wrong. One population now. The two can still
legitimately differ — a lead can be read and carry no owner, no address and no
number — so the panel SAYS so rather than leaving the gap to be guessed at.

### Stop had worked, and was waiting on six requests

`contactStop` is a flag the worker loop reads BETWEEN leads, and one lead in that
run took **155 seconds** (Lodging Dynamics). So Stop appeared not to work: it had
worked, and there was nothing to see for two and a half minutes. It aborts the
requests in flight now — and an abort is the operator, not a failure, so it is
neither recorded on the lead nor counted toward the dead-server tally.

### And how many to run is the operator's choice

A number box plus 5 / 25 / 50 chips. Fifty is the daily rate; five is what you
press when you want to see whether it works before spending on fifty.

### What the falsification runs found in the checks themselves

**Ten reverts, each applied ALONE against a green baseline and each red on its
own named assertion.** Two defects were in the checks rather than the code:

- **`OWNER TRUTH CHECK` failed a CORRECT build on its first boot**, on a needle
  carrying one closing paren too many. Section 81 records this exact trap in
  those words — counting parens in a guard is how a green build gets called red —
  and it came straight back. The needle stops before them now.
- **The enterprise refusal had no guard at all** until the falsification pass
  asked what would happen if it were removed. A fixture supplies its own
  arguments and therefore cannot see a caller, so the filter is asserted where it
  RUNS and in the ORDER it runs.

**267 boot checks green.**

**`index.html` changed, so this needs a Netlify deploy**, and the contract is
**20260913** on both sides.

---

## 92. The queue was mostly not our leads, and the list goes to a sheet — 2026-08-28

Vin, with the screen and the whole log: *"still some bugs and can we hook it up
so it just exports to a google sheet?"*

He pressed for ten. What came back was Coca-Cola Bottling, Penn Medicine, Lennar
Homes, Securitas, Goodyear, SkillPath, Penske Truck Rental and a commercial
property listing called **"Vacant Former Dentist | Value-Add Investment"**. Two
of the ten were businesses we sell to.

### The name filter was never going to fix this

§91 added `looksLikeEnterpriseByName` to this route and recorded honestly that it
caught none of the six brands that cost money the night before. This run proved
the same thing again: it caught Penske and nothing else, because "SkillPath" and
"Penske Truck Rental" read exactly like local businesses by name.

**What separates them is not their name, it is where they came from.** A Places
lead has a Google listing by construction: a local address, a star rating, a
review count, somebody who claimed it. The job-board, funding and for-sale lanes
have none of that, and every wasted read in that run came from them. So the
contact panel scopes on the MEASUREMENT — `placeId` — rather than on a guess
about the words, and it says how many it is hiding and why. It defaults on, and
it is one tick box to turn off.

### A verdict is permanent; a failure is not

These were one branch, and the panel said the consequence out loud: *"1 lead
could not be read: Penske Truck Rental reads as an institution... They are still
counted as unread, so the button above picks them up again."*

Retrying everything is right for a server that is down and wrong for a business
that is not a lead. Penske was refused correctly, at zero cost, and would have
been re-asked on every press for the life of that queue while the unread count
never moved. The server has returned `notIcp: true` for exactly this since the
day the filter landed, and the client ignored it. Now `notIcp` retires the lead
with its own line, its own neutral colour and its own **Put them back** button;
anything else — a dead server, a bad URL, a busy moment — stays unread and comes
back, which is what stops a paused server retiring a hundred leads.

**And a decision is not a failure.** A deliberate zero-cost refusal was being
rendered in the same red box as an unreachable server, under the words "could not
be read". Red marks a stop on this screen and nothing else.

### The same sentence, twice on one panel

The Penske refusal rendered in the failed box AND as a toast, because the toast
fired on every non-ok answer. A toast is for a fact about the RUN — no key, the
day ceiling, a dead server. A per-lead verdict already has a home.

### "1 of 3 lookup stages purchased" on a lead that spent nothing

Printed on Penn Medicine, Coca-Cola, Lennar and Securitas, whose own spend lines
read `0 Firecrawl credit(s), $0.0000 of model`. Stage 1 is the FREE stage — it
reads pages somebody else already fetched — so the word "purchased" was false on
every lead that stopped there, which is most of them. A message that overstates
what was spent costs exactly what one that understates it costs; this file
records the same class at the SMTP timeout and at the Supabase table that
existed.

### The contact list, straight into a Google Sheet

A **webhook**, not a Google integration, for the reason §35 already gave when it
chose the same shape for the CRM: a native integration means OAuth or a
service-account key, a credential to manage and a new dependency, for a feature
whose whole job is "put these rows in that tab". An Apps Script bound to his own
sheet needs none of it — eight lines pasted into his own spreadsheet, deployed
once, and the URL is a Settings field he can repoint without a deploy.

- **The sheet and the CSV are ONE list in two destinations.** `findSheetPayload`
  reads the same `findContactRows` and the same `FIND_CSV_COLUMNS`, so the header
  text, the column order and the ranking cannot drift. A second row-shaper for
  the sheet is the two-hand-kept-copies disease, and the copy that rots is always
  the one nobody opens. `clientcheck` executes both and asserts they agree.
- **The server forwards it, not the browser.** An Apps Script web app answers
  from `script.googleusercontent.com` after a redirect, and a browser POST there
  ends in `no-cors` — which cannot read the response, so "did the rows land"
  becomes unanswerable. A silent success is the failure class this file records
  most.
- **A 200 is not a success.** A deployment set to "Only myself" makes Google
  serve its sign-in page, which is a 200 with HTML in it. An answer that is not
  the JSON the script returns is reported as the misconfiguration it is, by name,
  with the fix.
- **The destination is bounded.** This is the one endpoint whose target comes
  from the request body, which on a public server is an open relay for whatever
  is in those rows. https only, and only the two hosts Apps Script answers on.
  `SHEET EXPORT URL CHECK` executes it: a lookalike host with the real one as a
  prefix, the cloud metadata address, a local address on this very server, plain
  http and the spreadsheet's own edit URL are all refused, and two real web-app
  URLs are accepted — because a bound tightened until the feature cannot work is
  the more expensive failure.
- **A business already in the sheet is not added twice.** The script dedupes on
  the company column, and `clientcheck` fails if the company ever stops being
  column 3 — the script would then silently dedupe on the wrong field.

### What was deliberately NOT done

- **No revenue estimate, still.** §90's rule holds: the team count is a floor and
  says so, and there is no dollar band anywhere.
- **No widening of the enterprise name filter.** "Medicine" would catch every
  family-medicine practice in the ICP, which is §14's dermatology failure exactly.
  The scope filter is the honest mechanism; the name filter stays narrow.
- **No second export route.** The sheet send is a thin forward that inherits the
  boot-window gate, and it costs nothing, so it takes no day ledger.

**268 boot checks green.** Six falsifications, each reverted alone against a
green baseline and each red on its own named assertion. The unread assertion in
`clientcheck` went correctly red on the new population and was re-aimed rather
than worked around, then strengthened: the verdict flag now has to be written
from the server's answer and from exactly one place.

**HONEST SHAPE: the sheet export has never run against a live Apps Script.** The
URL bound, the payload shape and the refusal paths are executed at boot and in
`clientcheck`; whether Google's deployment answers the way the script expects is
settled by the first real press, and the button reports the row count it was
told rather than assuming.

**`index.html` changed, so this needs a Netlify deploy**, and the contract is
**20260914** on both sides.

---

## 93. The Find run outlives its request, and the score stopped arguing with the sort — 2026-08-28

Vin, on the workaround he had been handed: *"ive never needed to do this fix
this at the root Right now: narrow the scope bar... and fix eveyrhting else i
ran that in sql."* He is right on both counts. Narrowing the pull until a run
finishes inside a minute is a workaround wearing the clothes of a setting, and
the three answers he had asked for the round before were: are we paying for
Places leads and throwing them away, why is the Find rating not proper, and why
did the leads never load.

### The waste was one line of SQL, and he ran it

The cuts were never the problem. From one live run: ~1,437 unique businesses
found, **120 returned**, and what is actually DELETED is small and correct — 24
franchises by name, 3 chain outlets, 20 already in the pipeline. Everything else
is demoted, not deleted: 285 too big, ~945 outside the star band, 227 over the
review ceiling, 81 over the per-category cap. §12 and §17 already made that
decision and built the bench to hold the overflow.

The bench was refusing every write. Three consecutive runs, 13:01 to 13:03, in
the server's own words:

```
⛔ LEAD BENCH: 1317 qualified lead(s) could not be saved — the write failed,
   so they are lost and the next run will pay Google to find them again.
   the lead_bench table EXISTS but row-level security is refusing this write.
```

1317, then 1310, then 1318. The same refusal `places_query_state` had been
printing for weeks, on a second table. **So every demotion was a deletion**, and
the query memory could not record which ground had been drained either, so the
next run paid Google to re-ask the same searches and discard the same
businesses. Two `disable row level security` statements, run by Vin, and the
next press serves ~1,300 banked leads before it spends anything.

Recording it because the shape is the point: the demote-don't-delete design was
correct, shipped, and completely inert, and the only thing that ever said so was
one grey line per run.

### A Find run can never survive its own HTTP request

Three `=== DISCOVERY START ===` at **12:59:30, 13:00:30 and 13:01:31 — exactly
sixty seconds apart** — each completing in 102 to 120 seconds. Something between
the browser and Render cuts the connection at 60. The server found 1,437
businesses three times over, finished three times over, and had nowhere to send
any of it; the screen said "Failed to fetch". Every attempt still billed about a
hundred Places searches, so roughly $10.50 bought nothing at all.

`runDiscovery(body)` is a function now, returning `{ code, payload }` — the
shape the research job wrapper already hands its poller — and an HTTP request is
no longer what holds it open. `/api/discover-async` accepts, `/api/discover-job/:id`
collects. The old single-request door survives as the fallback for a server
predating this build (a 404 on `-async`), and **runs the SAME function**, so
there is no second copy of a Find run to drift. A cut connection now costs one
poll rather than a run.

Four things this design got right by construction rather than by remembering:

- **One store.** The same `_jobs` map, sweep, TTL and cap as research. A second
  job system is the two-hand-kept-copies disease, and this copy would rot,
  because Find is pressed far less often.
- **A Find job's phase is `'find'`, not `'running'`.** Both research slot
  counters key on `phase === 'running'`, so a whole discovery grid can never
  occupy one of the slots the memory ceiling exists to bound — and a third
  counter written tomorrow is correct without knowing this route exists. The
  cost of that choice is that the stale sweep cannot see it either, so the sweep
  carries an explicit Find branch with its own twenty-minute ceiling and a
  message that does not tell the operator to re-run a lead.
- **One run at a time.** A press is ~100 Places searches, and the 60-second cut
  produced exactly the failure a dedupe prevents. A second press returns the
  running job's id.
- **The browser's wall sits ABOVE the server's sweep.** The old client abort was
  three minutes, which was harmless while the run could never survive sixty
  seconds anyway — and would have become the NEW thing killing a healthy run.
  `clientcheck` reads both numbers from their own files and fails the build if
  either moves past the other.

### The score argued with the sort, and with the other ranker

`outsideBand` and `aboveSizeCeiling` changed the ORDER and never the NUMBER. So
a 4.9-star business could show **Find score 90** and sit below a 4.5-star lead
scoring 60, with nothing on screen accounting for it — which reads as a broken
rating, and is a real contradiction. Worse, `contactRankFor` DID subtract for
both, so **one app held two verdicts about one lead and the card showed the one
that did not know.**

And the score paid for the property that demoted it: a 4.9 earned +5 for its
rating AND was demoted for sitting above the 4.85 ceiling. PART 5 is explicit
about why that ceiling exists — at 4.9 there are almost no negative reviews left
to mine, and the repeating complaint is one of only two findings with a real
human reply behind it.

`demotionPenalty` reads the SAME declared `CONTACT_RANK_TERMS` table both
rankers read. Only the above-the-ceiling case loses its rating bonus; a lead
demoted for a LOW rating still takes the struggling deduction, which is the same
judgement pointed the other way and was never in dispute.

**And the curve is a function now.** Thirty lines inside a 1,300-line request
handler meant nothing in this repo could ever execute the one number an operator
repeats out loud when deciding what to audit. `placesTriageScore` is pure and
`FIND SCORE CHECK` runs it — including that an unmeasured reachability is
SKIPPED rather than laundered into a confident zero, which at `Number(null)` is
a silent -15 on a lead nobody looked at.

### The card stopped guessing at leads it had already read

"Owner findable 31/40" is read off whether a person's name sits in the business
name. It is free and it genuinely predicts — and on any lead the contact button
had READ it was rendering beside a strip already naming the owner, the address
and the phone number we measured. `findScoreLine` is one function both the card
and `clientcheck` call: a read lead reports what was measured, an unread lead
says out loud that its number is a guess, and a demoted lead finally says why it
was sorted last.

### And the queue held 200

Vin: *"the find tab only holds 200 companies at a time u cna higher it or do
whatevr idc."* It was 200 written by hand in three places — the merge, the
Supabase upsert and the Supabase restore — so raising it meant finding all
three. `FIND_QUEUE_MAX` is one number and it is 1,000. 200 was a decision about
how many rows are useful on a screen, acting as a decision about how many
paid-for businesses are worth keeping, which is §12's failure one tab across.

### What the falsification runs found

Twelve reverts, each applied ALONE against a green baseline, each red on its
own named assertion. Getting there took three attempts, and every one of the
three failures is a shape this file already records:

- **One fixture proved nothing, and only the revert showed it.** The
  rating-bonus assertion compared a demoted 4.9 against an IN-BAND 4.7 — and
  the demotion is -10 while the bonus is +5, so the penalty swamped the very
  thing under test and the assertion held whether the guard existed or not.
  Two fixes hiding each other. Both leads in the fixture now carry the SAME
  demotion, so the rating bonus is the only thing that can separate them, and
  the revert goes red at 73 against 71.
- **A killed run left a revert applied, and the next pass ran against a RED
  baseline** — which proves reds too cheaply, exactly as §74 records after the
  CRLF flattening did the same thing from inside the proving machinery. The
  harness now REFUSES to start unless the baseline boots green, and verifies
  every restore byte for byte before moving on.
- **One revert reported RED for the wrong reason.** servercheck could not boot
  inside its own window on a busy machine and printed "healthz never went
  green", which the runner read as the guard firing. That is a NO VERDICT
  wearing a RED coat, and it is now reported as one. A second reporting bug
  named the expected MODEL DECLINED notice as the cause of a red boot, because
  it takes the same glyph as a failed check; the runner prefers a CHECK line
  now.

And the edit machinery itself broke twice, both times in ways already written
down:

- **A stray `cd` inside a compound command sent an edit script at a stale copy
  of `server.js` in the scratchpad, and it reported "applied 3".** Every edit
  path is an absolute path now.
- **`ed.sub1` wrote the file per call**, so a script that died on edit two left
  edit one applied — the §77 half-applied-script hazard, which shipped a broken
  build from this repo once already. `ed.edits` checks every anchor against the
  ORIGINAL text and writes once.

**269 boot checks green**, and every gate: tdz, dupkeys and scopecheck on both
files, fetchtest, pngscale, clientcheck, batchcheck, auditfuzz over 5,000
vectors, fuzzcore over 20,000 cases, servercheck's **74** assertions over a fake
network (scenario I drives the new Find job end to end and asserts the submit
answers in under ten seconds), and 2,096 emails composed over HTTP.

**HONEST SHAPE: none of this has run against a live Find press.** The route, the
dedupe, the poll and the 404 are driven over a fake network; whether a real
1,400-business grid collects cleanly is settled by the first real press, and the
`FIND JOB` lines report it outright.

**`index.html` changed, so this needs a Netlify deploy**, and the contract is
**20260915** on both sides — without the new server the button answers 404 and
falls back to the old single request, and a stale page says so by number.
