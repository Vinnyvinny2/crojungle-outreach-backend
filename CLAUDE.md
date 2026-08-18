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
- `HARM_LADDER` (~line 9300) — 39 rungs, each with `test`, `say`, `costs`, and
  scores for harm / specific / novel / delegable / weFix / sellable
- `resolveMeasurements` — everything the ladder reads
- `rankHarms` — ordering, with adjustments for purchase urgency, referral
  acquisition, Hormozi binding layer, and commercial weight
- `buildFactualSpine` — the one verified sentence
- `buildEmailEvidence` — splits what the writer may **ASSERT** from what is
  **CONTEXT**. This split is the safety: more information without it is more room
  to invent
- `verifyBrainEmail` — 26 fabrication families, the last gate before sending
- 63 boot checks at the bottom, each documenting the live failure that caused it

## Key components in index.html

- `leadToRow` / `rowToLead` (~line 200–560) — the ONLY door between Supabase and
  the app. Supabase is the source of truth; localStorage is a convenience cache
  that is deliberately not allowed to take the truth down with it. Every field
  the app needs after a reload must survive `rowToLead`, and this function has
  now produced nine separate duplicate-key collisions, each one silently blanking
  data that had just been loaded correctly

---

# PART 3 — THE RULES THAT ARE NOT NEGOTIABLE

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

39 rungs now, classified: 8 reviews, 14 website mechanics and intake, 5 Google
listing fields, 5 search visibility, 4 positioning/offer, 3 operations. Mike sells
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

Still true, and still the real ceiling: the site-derived rungs all share "did we
look?" absence guards, so a thin Firecrawl scrape silences them together while the
review and rank rungs — fed by Places and Apify, which never fail together — keep
firing. Fix the input supply and the balance improves on its own.

Measurable and not being measured, each closer to the product:
- **Duplicate Google listings** — splits reviews and ranking, invisible to the
  owner, risky to fix alone, and explains the outranked finding.
- **Mobile page speed** — free via PageSpeed API, never called.
- **Careers page** — built, rarely fires, closest available signal to what Mike
  sells.

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

---

# PART 5 — WHAT IS PROVEN

Only two things have real evidence behind them. Everything else is inference.

**The rating band.** Across 14 audited leads, every business at 4.9 stars returned
"no pain repeating across 2+ reviews" — at that average almost no negative reviews
exist to find. Every lead where the miner found a repeating complaint sat between
4.3 and 4.8, and both emails that earned a reply came from inside that band.

**Review pain wins.** All three replies came from `review_pain_pattern` or
`outranked_by_weaker` — a complaint in the owner's own reviews, or a named
competitor above him. Emails opening on missing pricing, no guarantee or no lead
magnet get deleted, and the owners say why: *"that's not how I get customers."*

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
PORT=4000 timeout 180 node --max-old-space-size=256 server.js   # 130 boot checks
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
and caused none of this week's failures. The 63 boot checks and the comments above
them are the asset — each records a specific live failure and why the fix is shaped
as it is. A rewrite loses that and re-earns the bugs.

**Do not add or reorder ladder rungs.** Done repeatedly; each fix revealed the next
gap in the same layer. The ladder is not the constraint.

**Do not tune the email prompt further** until real replies exist to tune against.
It has been rebuilt four times in two days on the evidence of a simulator that
contradicts itself.

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
