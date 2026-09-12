---
name: business-and-icp
description: "L1 STRATEGY: Business context for CROJungle outreach: what is sold and at what price (premium $35k sites, $10k/mo retainers, AI builds; the never-advertised lower tier), who buys (founder-led trades and owner-operated practices on the $800k-$20M ladder cut into four published size tiers, where size also picks the channel (call under $10M, email above); bigger companies are email leads, a franchisee is never a lead and a nonprofit is), and why the cold email's only job is to earn a reply, with the one email that did. Use when asked what we sell, whether a lead or finding fits the ICP, whether a finding is sellable, or what a good email looks like."
---
# Business and ICP — what CROJungle sells, to whom, and what the email must do

**Goal:** After reading this, Claude can decide whether a lead or a finding fits what CROJungle sells, and at which price tier.

Copied verbatim from CLAUDE.md (commit b01d952) lines 10-87 (PART 1). The seven non-negotiable rules stay in CLAUDE.md; what is PROVEN by real replies is the skill `evidence-and-priorities`.

**Read the dated sections at the bottom before acting on the numbers in this block.** It is a
historical copy and is deliberately left byte-exact (`docs/history/verify-split.sh` proves it), so
every later ruling is APPENDED rather than edited in. Two of its figures are already superseded: the
**ceiling is $20M**, not the $15M written below (Vin, 2026-09-12, on researched evidence), and the
pool is cut into **four published size tiers** where **size also picks the channel** — call at or
below $10M, email above it.

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

## Confirmed and added by Vin, 2026-09-02

The prices, the people and the ICP above were re-confirmed as correct on 2026-09-02. Two directions were added the same day: **the niche list still needs a deeper pass to confirm every searched trade is correct and ideal** (see the `new-niche-playbook` skill for the tables that define it) — **done 2026-09-08 in [§123](../../../docs/history/round-123.md)**: 55 trades re-tiered on sourced job values and firm sizes (20 A, 19 B, 16 benched), the money lines corrected to the published averages, and the metro swap held until the pool the query memory already holds is read, and **the ICP will eventually move up toward the higher end, probably $3M+ revenue** — when that happens the affordability band, the review floors and the size gate in `server.js` move with it, and this note is updated first. For orientation, the code already reasons above the floor: the affordability comments in `server.js` (near `CATEGORY_TIER`) treat roughly **$2.4M** in revenue as where a $10k/mo retainer is comfortable and **$5M+** for the $35k/mo tier, and call an $800k shop writing a $120k cheque a 15%-of-revenue spend; the $800k–$15M range is the ICP as sold, the band is what the code uses to grade affordability.

**Superseded on 2026-09-03 ([§111](../../../docs/history/round-111.md)).** Vin re-derived the band from the price list and his rule that *"the gold standard is marketing spend should be 10% of revenue"*: the premium retainer ($120k/yr) needs **$1.2M**, so that is where the core tier starts; **$800k** stays the floor of the call lane (*"still a viable business"* — the rep qualifies live and the lower tier is sold by Vin and David); **$10M** is where a marketing head exists and still buys agencies (under it a brand almost always uses an agency, $10–30M runs a hybrid, above ~$30M it goes in-house; PE buys operators at $3–30M; the average Nexstar member is ~$7M); **$30M** is the ceiling. The dollar lines are affordability lines, so they hold for every niche; what varies by niche is how many people make a dollar (`ICP_REVENUE_PER_EMPLOYEE_BY_TRADE`: ~$530k per lawyer, $550–850k per vet, $150k per landscaper, $70k per caregiver). The code holds all of it in one table, `ICP_REVENUE_BAND`, and every cut — the rep's medium and high, the discovery employee gate, the TheirStack query, the affordability team cuts — is that table divided by a benchmark; a boot check refuses a literal. Two lanes are drawn on the one ladder: **call** (owner within reach, $800k+; the rep's sheet) and **email** ($1.2M+ with a named owner or marketing head; layered businesses and TheirStack leads are email only). "Afford all tiers" strictly means $1.2M+ (premium) and ~$4.2M+ (the $35k/mo tier); entry rows rank last so the rep dials core first.

**Corrected on 2026-09-03 ([§114](../../../docs/history/round-114.md)).** The "$35k/mo top retainer" above was wrong: *"there is no top of the retainer"*, so the ceiling could never have been an affordability line. It is a **reachability rule** — Vin: *"I don't want us to waste our time cold calling companies where we never get to the owner and/or a decision maker"* — and it bounds the CALL lane only: the call cap is **$35M** (headroom on a measured number), an owner-run business over it is still called up to **$50M**, and **the email lane has no ceiling: big companies are email leads**, targeted at the marketing decision-maker. Branch networks, PE-owned companies and national operators are marked and routed to email, never dropped; only franchise evidence drops. Under the cap they stay on the call sheet, ranked last (the hedge: *"it's better to never find out if we cut it"*). The one live data point: the rep reached a branch receptionist at Rose Paving (PE-owned, ~$255M) who said the owner should hear it — recorded in the note as a reason for the rep to follow up by hand off the Email lane.

## Reversed on 2026-09-11 by Vin — the ceiling is $15M, the written ICP wins

The two paragraphs above are the record of what was reversed, and they stay. From 2026-09-03 the code carried a **$35M** call cap with an owner-run reach line above it, while "Who they sell to" in this note has said **$800k–$15M** since the day it was written. Two hand-kept copies of one number disagreed for more than a week and nobody saw it; that is the bug, not the number. Vin's ruling: **the written ICP wins, and the ceiling is $15M.** **The reach line above the cap did not move with it**, and the distinction is the point: the cap asks whether a business FITS what we sell, the reach line asks whether the PHONE still reaches the person who signs. A founder who answers his own phone at $8M answers it at $24M. Asked directly about a $24M owner-run roofer with the founder named, Vin ruled both lanes — *"id say do both for sure we should email him and phone him"* (2026-09-11). It lives in the code as `ICP_CALL_REACH_CEILING` — read the figure there, or off the `🎯 TARGET` line in a log, and do not retype it into a note, because retyping it is how the drift started.

What the ceiling DOES has not changed ([§114](../../../docs/history/round-114.md) still stands): it bounds the CALL lane only, because it is a rule about reaching a person and not about who can pay. Over it a business is an email lead aimed at the marketing decision-maker; an owner-run business over it is still called while its measured dollars sit under `ICP_CALL_REACH_CEILING`; the email lane has no ceiling at all. The rep's word "high" is now $10M–$15M, and the cuts derived from the ceiling move with it: about 75 staff at $200k a head, about 50 trucks at $300k each.

Three rulings the same day about who is a lead at all:

- **A franchisee is not a lead, in either lane** — not demoted, not emailed, dropped. A franchise agreement can hand the franchisee a call centre the brand contracts and a website the brand supplies, so the call we place can land at a third party and the site we would audit is not his to change. No revenue band filters them, at any size, so this has to be a fact rule and not a number. The brand-level marks are unchanged: a branch network, a PE-owned operator and a national operator are still kept and routed to email ([§114](../../../docs/history/round-114.md)).
- **A nonprofit is a lead.** It used to be dropped on a /donate page or a 501(c)(3) line. A nonprofit whose CEO is named and reachable is a person who can say yes, which is the only test this note has ever applied.
- **A professional practice is an email lead**, off the rep's call sheet. The practices stay inside the ICP; the phone is not the way in to them.

## Superseded on 2026-09-12 by Vin — the ceiling is **$20M**, and this time it has evidence

The two sections above are the record of what was reversed, and they stay: a reversal with no record
of what it reversed is how the same drift happens twice.

**Why it moved again.** The $15M of 2026-09-11 won an argument, not a measurement — the code had
drifted to $35M, this note said $15M, and Vin ruled that the written ICP wins. That is a correct way
to stop two copies disagreeing and no reason at all to believe $15M. Asked on 2026-09-12 for the
number rather than a pick — *"find me the ideal range for whats still reachabile either cold callign
wise or email wise"* — three independent lines were researched and they cross in the same place:

1. **Cold email reply falls almost linearly with headcount.** Belkins, 7.5M emails sent in 2025:
   under 10 people 0.72%, 11–50 0.49%, 10,000+ 0.22%. Sales.co over 2M+: businesses of 1–10 people
   return **18.2% positive** replies against **3.4%** at 5,000+. Woodpecker/Stealery: 1–100 8–15%,
   100–1,000 4–8%, 1,000+ 1–3%. The break sits near **100 people**.
2. **Who still buys from an agency at all**, converging across six sources: under $1M freelancers;
   $1M–$5M one in-house marketer plus agencies; $5M–$25M a 3–6 person team with agencies for
   overflow; **above $25M a full department and agencies get defined projects only.**
3. **PE roll-ups in these exact trades:** the *platform* acquisition is a **$20M–$80M** operator and
   the add-ons are $2M–$15M independents. Once a business is the platform, marketing technology and
   lead routing centralise at corporate and the local owner stops deciding. Vin: *"big PE comapneis
   woukd never work for cold outreach"*.

At $200k of revenue a head, **100 people is about $20M**, and all three cross there. **Honest shape:**
lines 1 and 2 are general B2B, not trades; only line 3 is trade-specific. It is better evidenced than
$15M or $35M ever were, and it is still an affordability-and-reachability judgement rather than a
measurement of our own results — we have never sold to a $20M business.

**Two rules this research independently confirmed**, which matter more than the ceiling: **owners and
founders reply more than any other job title** (0.57% against 0.32% for VPs), and asking a
receptionist for the owner by name works **60–70% of the time**, falling off above ~200 people. The
owner-first rule and the rep's approach are both sound, and the approach's limit sits past the point
where the buyer has already gone.

**What the ceiling now DOES is narrower than §114 said.** §114 gave the email lane no ceiling — a big
company was an email lead at any size. Vin put a ceiling on the whole ICP instead: *"over 30m is
dropped for now higher tiers are more so email leads btu we arent wokring on email yet so we jsut
need a nice qway to organzie and categroize them."* So **over the ceiling is no lane at all today**,
not an uncapped email lane. **§114's reach exception survives untouched** and is the one way back onto
the call sheet: an owner-run business with measured dollars under `ICP_CALL_REACH_CEILING` is still
called, which is DMI Paving at $24M. **Round 139's headroom survives too**: a business over the cap on
a *guess* stays callable, because a guess is the thing most likely wrong.

## Four published size tiers, and size picks the channel (Vin, 2026-09-12)

> *"break catgeroize that pool into 4 teirs very small , small, meidum large … size is the golden
> ticket because size kind of decides reachability wise and also decides which channel we use."*

| tier | revenue | channel | why |
|---|---|---|---|
| **very small** | under $1.5M | call | the owner answers his own phone |
| **small** | $1.5M–$4M | call | one CSR; ask for the owner by name |
| **medium** | $4M–$10M | call | an office team, but the owner still decides marketing |
| **large** | $10M–$20M | **email** | a GM and a Sales/Marketing Manager exist |
| — | over $20M | none | not a lead today |

**This is a SECOND ladder, not a rename of the affordability band, and the distinction is load-bearing.**
`ICP_REVENUE_BAND` answers *what can they pay* and its cuts are prices — `coreFrom` is $1.2M because a
$10k/mo retainer is 10% of $1.2M, and a boot check proves it against the price list. These four cuts
answer *how big are they*, and the two cross-cut: very small, small and medium all sit inside one
affordability band. Kept apart, both stay provable, and a row can say "small · lower tier" against
"medium · premium fit", which is the who-closes-it question. They live as `ICP_SIZE_TIERS`, and only
two numbers are typed there — the $10M and $20M lines are read from `ICP_REVENUE_BAND`.

**The $10M channel line is researched, and it is not about the phone being answered.** Four
trades-specific staffing sources give one ladder: under $1.5M the owner answers his own phone (1–2
techs, booking calls between estimates); ~$1.5M buys the first full-time CSR or dispatcher, the
"unlock hire"; $3M splits CSR from dispatcher and adds an office manager; $5–10M runs 2–3 CSRs, a
dispatcher and an ops manager **with the owner still deciding marketing**; $10–20M adds a GM **and a
Sales/Marketing Manager**. The ratio holds across all four: one office person per 3–4 technicians, at
$250–350k of revenue per technician. So the line is where **somebody other than the owner owns
marketing**. Above it, the rule this note already carries applies: ask for the marketing
decision-maker one rung down. **Weakest on the professional practices** — a ten-person law firm at
$1.75M has a receptionist and a different shape.
