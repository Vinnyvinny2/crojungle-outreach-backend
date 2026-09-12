# §143B — grade the website before the money is spent — 2026-09-12
Written 2026-09-12 for docs/history (one file per round; CLAUDE.md carries no history). Not a moved section: verify-split.sh skips it.

## 143B. grade the website before the money is spent — 2026-09-12

Vin, on 2026-09-12, in his own words:

> "Yes — one free read, three answers."
> "The full free read — homepage plus their team and contact pages."
> "Cut it with the free read first."
> "Use how old their web domain is."
> "Keep them, but separate from the rest." (businesses with no website)
> On a site that blocks us: "for now dont do anything."
> "Keep the old path switchable."

### What was found

**The free read ran after the money, not before it.** Everything that says whether
the thing we SELL is broken — the build verdict, the visible-fault verdict, the ad
and analytics tags, their own prose about size and age — was already free, already
pure over markup, and ran only inside the contact read, which is the paid stage.
So the press ranked three hundred businesses on a guess off the business NAME
(`reach_predict`), paid to read them in that order, and only then discovered which
of them had a website worth talking about. The measurements existed; the order of
operations wasted them.

**The visual verdict Round 142 built reached nobody.** `site.looks` is the verdict
of the two halves a person actually meets. The Fit score never saw it: the signals
handed to `findIcpScore` carried `siteMeasured`, `siteGap`, `siteWord` and
`siteWhy`, and `siteLift` priced `siteGap` — the technical grade Round 141 proved
is 56% faults no visitor and no owner can see. Reproduced by execution: two leads
alike in everything but their website scored identically.

**Two rules were built and could not run for want of a homepage.** The tracking-id
collision (one analytics account wearing several names in several metros) was
deferred from Round 143A for exactly this reason, and the name-not-on-site test
existed only inside the paid read — after the spend it could have prevented.

**And one defect this round created and the harness caught.** The age read was
written `Number(signals.yearsInBusiness) >= 0`. `Number(null)` is 0 and 0 is
finite, so a page stating **no** founding year came back as a business founded
this year, stamped "their own pages" — and the registry fallback underneath it was
unreachable on every lead in the system. The null-laundering class, inside the fix
for it. It was found by `servercheck` on the one cast site built to state no year,
not by reading the line.

### What changed, at the root

**The free read moves to the press, behind one knob.** `pressSiteRead` runs after
every free drop and before anything is spent: for each surviving lead with a
website it plain-fetches the homepage, reads their own navigation for a team page
and a contact page, and runs the SAME `readSiteBuild`, `readSiteLooks` and
`readFindIcpSignals` the contact read has always run. Nothing is rewritten. It
issues **zero Firecrawl calls and zero model calls** — asserted at boot against the
function's own source and against the whole press block, and asserted at the wire
by `servercheck` over the 26-listing fixture cast.

**Three pages a business, not twenty.** `FIND_MAX_FREE_PAGES` is 20 and the contact
read is right to use it: there it is one lead. Here it is every business in the
run, and twenty pages across three hundred businesses is six thousand fetches. The
homepage plus their team page plus their contact page is what the three answers
need, and that is nine hundred. The bound is a constant, not a setting — a knob
that can restore twenty at a press is a six-thousand-fetch run somebody turns on
by accident. The switch is `FIND_PRESS_READ`, default on, off in seconds.

**Bounded and measured**: a pool over businesses (`FIND_PRESS_POOL`, 8), a per-fetch
timeout (`FIND_PRESS_PAGE_MS`, 8s), a deadline on the whole phase
(`FIND_PRESS_READ_MS`, 10 minutes), a per-host gap with the slot reserved before the
wait so two workers cannot both go first (`FIND_PRESS_HOST_GAP_MS`, 700ms), and a
ceiling on businesses (`FIND_PRESS_MAX_LEADS`, 400). Every failure is a NAMED
refusal and the lead is KEPT: a site that refuses us reads `unknown` and is never
graded (§141's rule, unchanged, and Vin's "for now dont do anything"); a business
with no website is marked as one and the absence is the finding; a business the
phase ran out of time for is unmeasured rather than poor.

**Age is their own page first, the domain second.** A founding year they published
is a fact about the business; a registration date is a fact about the domain, and a
2003 business that rebranded in 2019 registered its domain in 2019. So the registry
answers only when their pages state no year, the row says which of the two
answered, and the number is described as a floor rather than the same claim.

**The verdict is persisted twice, on purpose.** It rides `extra` unconditionally,
and its own `site_verdict` jsonb column only once the boot `SCHEMA PROBE` has
WATCHED that column answer — because PostgREST refuses the whole row on one unknown
key (§42), so a press that ran before the ALTER would lose three hundred leads
rather than one field. The probe now keeps its answer instead of printing it and
throwing it away.

**The verdict then reaches the three places it has to.** The draw order
(`orderUnread` reads it ahead of `reach_predict`, keeping the `_qnum` −1 convention
so an unmeasured lead is never dressed as a good one or a poor one); the separate
list (a business with no website is drawn after the ones that have a site, because
it is a different call with nothing to audit); and the score (`siteLift` prices
`site.looks`, one declaration keyed on `SITE_LOOKS_WORDS`, with `siteGap` kept as
the fallback for a lead whose visual verdict is unmeasured).

**The two new listing rules.** `detectAnalyticsCollisions` follows
`detectPhoneCollisions` exactly — pure, recomputed from the run's own results plus
the bench, name-variance AND metro-variance both required, one listing counted
once. A single name across several metros is a real multi-branch business and
survives, which is the half that matters. `nameNotOnSite` DEMOTES and never
deletes: a trading name, a rebrand and a logo-only header all look like this from
outside, and an absence needs 800 characters of readable text before it is a claim
at all.

**And the contact read stops paying for an answer it already has.** A homepage the
press graded `dated` or `bad` buys no Firecrawl render and no vision model call —
the code faults are added to whatever the eyes return, so the picture could only
confirm them. A `modern` or `unknown` verdict still buys the render, because a site
whose code reads clean can still look terrible and that is the only case a picture
can answer.

**Deliberately NOT built**, with the evidence beside each in the press field mask:
keyword-stuffed names, residential addresses, no-website-as-spam, toll-free
numbers, 24/7 hours, VoIP carrier lookup, thin content. Each deletes real
owner-operated businesses faster than fakes. Reviewer-collision detection stays
deferred: the `reviews` field is Enterprise + Atmosphere, a tier above what the
press buys. `index.html` was NOT touched, so the verdict is on the row and in the
log this round and reaches the rep's columns in a later one.

### What the falsification runs found in the checks themselves

`node falsify.js docs/history/round-143b-reverts.js` — 18 reverts, each against a
baseline proven green (boot, clientcheck, build-check), each restored byte for
byte. **18 of 18 RED on their own named line.**

Two came back "RED but NOT on the guard's own line" on the first pass, and both
were the same defect in the CHECK rather than in the fix: an assertion reached
through a field the revert had removed (`_one[0].pressSite.nameOnSite`,
`siteLift(...).terms[0].id`), so the check CRASHED — "COULD NOT RUN" — before it
could print the line it exists to print. A check that crashes is quieter than one
that fails. Both accesses were guarded and both reverts then went red on their own
line. Nothing about the fixes changed.

The list, one line each: the press reads nothing · the three-page bound goes back
to twenty · the verdict never lands on the lead · the column is written without
asking whether it exists · the queue stops drawing by what the free read found ·
the no-website leads are mixed back in · the visual verdict never reaches the score
· the lift reads the technical grade again · the read re-buys what the press
already answered · the tracking-collision rule is called by nothing · the
name-not-on-site mark never reaches the lead · the comparator halves read different
reasons again · an absence is claimed off a page nobody could read · the pool stops
being polite per host · the free read never reaches the yield report · the
no-website mark never reaches the lead · a page with no founding year dates the
business anyway · the registry parse reads any event as the registration.

**311 boot checks green**, 1 expected decline, 0 failures. `bash verify.sh` green
(byte proof, static stage, one boot); `node clientcheck.js` green; `node
servercheck.js` green at **314 assertions** (299 before this round), including the
load-bearing one: a press over 26 listings issues **0 Firecrawl calls and 0 model
calls**, opens the pages of at least five businesses, and never fetches more than
three pages of any one of them. `bash ci-gates.sh` green on every stage. The
contract is **20261018** on both sides, unchanged.

**`index.html` did NOT change, so this round needs no Netlify deploy.** One SQL
statement to run in Supabase (it is in `deploy-and-accounts/schema.sql`):

```sql
alter table discovered_queue add column if not exists site_verdict jsonb;
```

No Render environment variable is required: every new setting has a default and the
round works with none of them set. No account needs topping up — this round spends
nothing new.

### Needs your eyes

1. **The Supabase statement, and the order it goes in.** Run the `alter table`
   above BEFORE merging. Nothing breaks if you forget — the server refuses to write
   a column it has not watched answer, and the verdict rides the existing `extra`
   column meanwhile — but until it runs the queue cannot be drawn by the verdict in
   SQL. Good looks like `SCHEMA PROBE: all 15 expected tables and columns answered.`
   in the Render log after the next restart.

2. **Whether the registry lookup is reachable from Render at all.** This is the one
   thing in the round that is not proven. RDAP is the protocol that replaced WHOIS,
   it is free and keyless, and every gTLD registry serves it — but no live press has
   run against it, and it could not be reached from the machine this round was built
   on (that machine has an egress allowlist, which says nothing about Render). It is
   written to be wrong safely: every failure falls back to the founding year on
   their own page and says so. **Grep the first press for `DOMAIN AGE [Places]`.**
   Good looks like a non-zero middle number. If that number is 0 while the last one
   is large, the registry is not reachable, and the fix is either
   `FIND_RDAP_BASE=https://rdap.verisign.com/com/v1/domain/` or `FIND_DOMAIN_AGE=off`
   — no deploy either way.

3. **What the free read costs in wall clock.** Three pages across three hundred real
   hosts, eight at a time, with a 700ms per-host gap. The press already runs as a
   background job that outlives its request, so this is affordable in principle;
   what it actually adds is measured and printed. **Grep `FREE READ [Places]`** and
   read the seconds. If it is unacceptable, `FIND_PRESS_POOL` and
   `FIND_PRESS_MAX_LEADS` move it without a deploy, and `FIND_PRESS_READ=off`
   restores the old path entirely.

4. **Whether the website verdicts read TRUE to you.** This is the judgement no check
   can make. Open five leads from the first press and compare `bad` / `dated` /
   `modern` on their row against what you see when you open the site. The verdict now
   moves the Fit score and the draw order, so a verdict that reads wrong to you is
   moving real leads to the wrong end of the queue.

5. **The one rule with a case it cannot tell apart: the tracking collision.** A
   marketing AGENCY that puts one GTM container across several clients would read
   exactly like a network and both businesses would be dropped. The bar is
   deliberately the phone rule's — different names AND different metros, one listing
   counted once — and no live run has said how often the agency shape happens.
   **Grep `TRACKING COLLISION [Places]`** on the first few presses and check the
   named businesses really are one operator. If they are not, say so and the rule
   comes out.

6. **The name-not-on-site demotions.** **Grep `NAME NOT ON SITE [Places]`.** These are
   kept and ranked last, never deleted, and each line names the business and the
   site. If the businesses it names look like ordinary rebrands to you rather than
   anything odd, the demotion is costing more than it earns and should be a note
   instead of a rank.

7. **The merge itself.** Never while a batch is running: every merge to `main`
   restarts Render and a restart kills the reads in flight.
