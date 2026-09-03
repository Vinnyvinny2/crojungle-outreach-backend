---
name: business-and-icp
description: "L1 STRATEGY: Business context for CROJungle outreach: what is sold and at what price (premium $35k sites, $10k/mo retainers, AI builds; the never-advertised lower tier), who buys (founder-led trades and owner-operated practices on the $800k-$30M ladder, where the owner reads his own email), and why the cold email's only job is to earn a reply, with the one email that did. Use when asked what we sell, whether a lead or finding fits the ICP, whether a finding is sellable, or what a good email looks like."
---
# Business and ICP — what CROJungle sells, to whom, and what the email must do

**Goal:** After reading this, Claude can decide whether a lead or a finding fits what CROJungle sells, and at which price tier.

Copied verbatim from CLAUDE.md (commit b01d952) lines 10-87 (PART 1). The seven non-negotiable rules stay in CLAUDE.md; what is PROVEN by real replies is the skill `evidence-and-priorities`.

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

The prices, the people and the ICP above were re-confirmed as correct on 2026-09-02. Two directions were added the same day: **the niche list still needs a deeper pass to confirm every searched trade is correct and ideal** (see the `new-niche-playbook` skill for the tables that define it), and **the ICP will eventually move up toward the higher end, probably $3M+ revenue** — when that happens the affordability band, the review floors and the size gate in `server.js` move with it, and this note is updated first. For orientation, the code already reasons above the floor: the affordability comments in `server.js` (near `CATEGORY_TIER`) treat roughly **$2.4M** in revenue as where a $10k/mo retainer is comfortable and **$5M+** for the $35k/mo tier, and call an $800k shop writing a $120k cheque a 15%-of-revenue spend; the $800k–$15M range is the ICP as sold, the band is what the code uses to grade affordability.

**Superseded on 2026-09-03 ([§111](../../../docs/history/round-111.md)).** Vin re-derived the band from the price list and his rule that *"the gold standard is marketing spend should be 10% of revenue"*: the premium retainer ($120k/yr) needs **$1.2M**, so that is where the core tier starts; **$800k** stays the floor of the call lane (*"still a viable business"* — the rep qualifies live and the lower tier is sold by Vin and David); **$10M** is where a marketing head exists and still buys agencies (under it a brand almost always uses an agency, $10–30M runs a hybrid, above ~$30M it goes in-house; PE buys operators at $3–30M; the average Nexstar member is ~$7M); **$30M** is the ceiling. The dollar lines are affordability lines, so they hold for every niche; what varies by niche is how many people make a dollar (`ICP_REVENUE_PER_EMPLOYEE_BY_TRADE`: ~$530k per lawyer, $550–850k per vet, $150k per landscaper, $70k per caregiver). The code holds all of it in one table, `ICP_REVENUE_BAND`, and every cut — the rep's medium and high, the discovery employee gate, the TheirStack query, the affordability team cuts — is that table divided by a benchmark; a boot check refuses a literal. Two lanes are drawn on the one ladder: **call** (owner within reach, $800k+; the rep's sheet) and **email** ($1.2M+ with a named owner or marketing head; layered businesses and TheirStack leads are email only). "Afford all tiers" strictly means $1.2M+ (premium) and ~$4.2M+ (the $35k/mo tier); entry rows rank last so the rep dials core first.
