# §114 — Rose Paving: the ceiling is a reachability rule, big companies go to email, and the call sheet is hedged — 2026-09-03
Written 2026-09-03 for docs/history (one file per round; CLAUDE.md carries no history). Not a moved section: verify-split.sh skips it.

## 114. Rose Paving: the ceiling is a reachability rule, big companies go to email, and the call sheet is hedged — 2026-09-03

Vin's rep cold-called Rose Paving (rosepaving.com) off the list read on
2026-09-01 by the Round 108 build, a day before the size, layers and
ceiling rulers existed. Rose Paving is a Tenex Capital portfolio company:
about $255M, 1,000 staff, 34 offices. The rep reached the Tampa branch
receptionist, who said *"this is something the owner should hear"* and
joked that the owner pops in like popcorn. Vin: *"we need to repivot
strategy here … now we have companies like that blocked."*

### What today's build does to Rose Paving (traced with the real functions)

The 2026-09-01 read named Jaron Srain, CEO, his mailbox, the Tampa branch
number, ICP 46/100, zero credits, and a roster that included Julie Pappas,
Director of Marketing. Run through the Round 113 rules: size high (sure),
layered (five corporate titles), target the Director of Marketing, tier
over the ceiling → lane none (the Too small bucket), and "portfolio
company" on its page would have dropped it as `owned` before it spent. So
the rep would never have seen it. The filters did what they were told;
the question was whether they were told the right thing.

### Vin's rulings (2026-09-03, verbatim where it matters)

- **The record was wrong.** `owner-decisions` said the retainer tops out at
  $35k/mo, and Round 111 derived the $30M ceiling from that as an
  affordability line. Vin: *"There is no top of the retainer - we would do
  a $50k a day retainer if we got the deal."* The ceiling is therefore a
  **reachability rule**: *"I don't want us to waste our time cold calling
  companies where we never get to the owner and/or a decision maker."*
- **Big companies are email leads.** *"We should be targeting big
  companies via email."* Research (vendor benchmarks, 2026-09-03): the
  phone stops reaching the signer at two hires - the office manager (about
  $1–1.5M: the owner stops answering) and the marketing manager (about
  $5–10M: the owner stops owning marketing); over ~$30M or PE-owned the
  decision is at head office. An owner-run shop up to ~$25M (DMI Paving,
  $24M, the founder named with his own mailbox) is still within reach.
- **Mike's 30 small/medium + 30 large split is not adopted.** Vin
  disagrees and the numbers support him: large-and-reachable is the upper
  tier when owner-run, and there are not thirty of them in a batch.
- **Headroom on the measured numbers, none on the facts.** The call cap
  $30M → **$35M** (a directory figure can be 30% off); an owner-run company
  over the cap stays on the call sheet **up to $50M**; a lead is benched
  under the $800k floor only when its size is *likely* or *sure* (a *guess*
  under the floor stays on the sheet as low). Franchise evidence,
  nonprofits and the buying floor get no headroom.
- **A multi-location company is a large company, not a franchise.** Branch
  networks are marked and routed to email; only franchise evidence drops.
  PE-owned ("portfolio company", "backed by X Capital", "a division of")
  and national operators are marked, never dropped.
- **The hedge, last.** Vin: *"Correct me if I'm wrong but nothing really
  changed for cold calling, right? If anything it got better."* Wrong in
  part: since Round 111 the call sheet had lost layered businesses,
  over-$30M, under-$800k and (Round 113) product companies, and the one
  live win came off a list with none of those rules on it. The rule that
  hid Rose Paving was his own "layered means email only". Asked whether
  to hedge it: *"It's better to never find out if we cut it."* So a
  layered business under the cap **stays on the call sheet, ranked last**,
  with "ask for the marketing head" on the row; the rep decides how far
  down he dials. This supersedes Round 111's "layered rows never reach the
  sheet".
- **The one live data point.** The warm receptionist is recorded here. The
  "owner" a branch receptionist means is the branch head; at a PE platform
  the agency decision sits with the marketing director at head office. So
  it is a reason for the rep to follow up by hand off the Email lane (the
  phone and the named target stay on every card), not a reason to put
  thirty switchboards on the sheet. If warm receptionists keep turning up
  at PE branches, this note is the evidence to revisit the $50M line.

### What changed (server.js only; no contract bump, no Netlify drag-in)

- **Two caps, one ladder.** `ICP_REVENUE_BAND.ceiling` 30e6 → **35e6** and
  everything derived moves with it (staff cut 150 → 175, trucks 100 → 117,
  the discovery employee gate, the sheet's "high" band). New
  `ICP_CALL_REACH_CEILING = 50e6`. `estimateScaleBand` now carries `usd`,
  the measured dollars behind the band (headcount × the trade's revenue per
  head, trucks × per truck, a stated revenue as read; null for a location
  count or tenure), onto `signals.scaleUsd`, so the lane can test the reach
  line. Still never a figure for an email.
- **The email lane has no ceiling.** `LANE_TIERS.email` gains
  `over_ceiling`; the lane says "over the call cap ($35M+) - email, the
  marketing decision-maker".
- **`lanesFor`** takes `usd`, `network`, `peOwned`, `national`. An
  owner-run `over_ceiling` lead measured under $50M is a call. `below_floor`
  benches only on *likely* / *sure*; a guess reads as entry ("under the
  floor on a guess - kept as low"). Layered, a branch network, PE-owned and
  a national operator under the cap are in the call lane with
  `last: true`; `signals.laneLast` feeds a new `layeredLast` (−8) row in
  `CONTACT_RANK_TERMS`, read by `demotionPenalty`, so the FIT score sorts
  them below every owner-run row on the screen and the sheet. Only a
  TheirStack lead (no phone) and a product company (a sales line) are never
  on the sheet. A layered lead with nobody named is the No name yet bucket.
- **Chain evidence carries a kind.** `readChainEvidence` returns
  `kind: 'franchise'` (a franchise title, a page selling franchises) or
  `'network'` (per-city location pages, four state pages, a "Brand - City"
  outlet). The route drops only `franchise`; a network sets
  `signals.branchNetwork` and a note ("the local number reaches a branch;
  the decision is at head office"). The late sitemap read gets the listing
  name and splits the same way. `FIND ICP GATE CHECK`'s chain cases now
  name the kind: Truly Nolen and the franchise-selling page are franchises;
  Window Nation, DHI Roofing, ClearChoice and RiteRug are networks, kept.
- **Ownership tells mark instead of drop.** `readOwnershipTells` tests the
  franchisee disclosure first (a PE-backed franchisee is a franchisee), then
  `owned`, then `national`. The route drops only `franchise`; `owned` sets
  `signals.peOwned`, `national` sets `signals.nationalOperator`, both with a
  note and both routed to email. The `🎯 TARGET` line prints "branch
  network (…)", "PE-owned (…)" or "national (…)".
- **Finding them.** TheirStack asks up to `TS_MAX_EMPLOYEES` (5,000) staff
  instead of the ceiling cut - the email lane has none. The discovery
  employee gate DEMOTES a verified headcount past the cap
  (`aboveSizeCeiling`, a note, `DEMOTED` in the log) instead of deleting it,
  the same seat the review ceiling uses. New env knob `GP_LARGE_SHARE`
  (default 0.1, capped at 0.5): up to that share of a Find run is served
  from the leads demoted for SIZE alone, in pool order, so a batch carries
  some large companies for the email lane instead of leaving them behind
  every in-band lead on the bench forever; `📉 FIND YIELD` reports "large
  companies served for the email lane N".
- **Checks.** `SIZE AND LAYERS CHECK` pins $35M / $50M and the new cuts,
  the email lane's missing ceiling, the reach line both ways ($40M owner-run
  call + email, $60M email, no dollars email, $40M layered email, $40M
  PE-owned email), the floor headroom both ways, the hedge (layered core
  call + email and last; owner-run not last; the −8), the three marks under
  and over the cap, the dollars behind every band, Rose Paving's shape →
  email and DMI's → both; call-site needles for `scaleUsd`, the four lane
  arguments, `laneLast`, the gate's demotion note, `TS_MAX_EMPLOYEES`, the
  large slice, and a negative needle on the old `BLOCKED … employees` line.
  `FIND ICP GATE CHECK` compares the kind, adds a franchise-title-plus-city-
  pages case and a PE-backed franchisee, and pins the franchise-only drop
  lines and the two marks.

### Deliberately NOT done

Mike's 30/30 split; any change to `index.html` (the Read tab's Too small
caption still says "$30M ceiling" and its older-row fallback still files a
pre-Round-111 layered row under email - both wait for PR 2); a change to
the email itself for a marketing director (a later round, once one is
sent); headroom on franchise evidence, nonprofits or the buying floor.

### What the falsification runs found in the checks themselves

Nine reverts, each alone against the green baseline, each RED on the check
named for it, restored byte for byte (CR count = line count throughout):

| revert | red on |
|---|---|
| the hedge off (layered back out of the call lane) | SIZE AND LAYERS CHECK (the layered core case) |
| the cap back to 30e6 | SIZE AND LAYERS CHECK (the cuts and the $35M pin) |
| `over_ceiling` out of the email tiers | SIZE AND LAYERS CHECK (the email lane's ceiling) |
| the $50M reach line off | SIZE AND LAYERS CHECK ($40M owner-run) |
| the floor headroom off | SIZE AND LAYERS CHECK (a guess under the floor) |
| `kind` collapsed to franchise | FIND ICP GATE CHECK (ClearChoice dropped again) |
| the ownership drop back for `owned` | FIND ICP GATE CHECK (the franchise-only needle) |
| the discovery gate back to a delete | SIZE AND LAYERS CHECK (the negative needle) |
| TheirStack back on the ceiling cut | SIZE AND LAYERS CHECK (the TS_MAX_EMPLOYEES needle) |

**275 boot checks green.** `bash ci-gates.sh` all stages. **The contract
stays 20260929 on both sides; index.html is untouched, so nothing for
Netlify.** Render env: `GP_LARGE_SHARE` is optional (default 0.1). Hands:
the Apify token, the verifier top-up, DataForSEO. The next batch's proof:
`🎯 TARGET` prints "lane call + email (… on the call sheet last …)" on a
layered lead under the cap, "branch network" / "PE-owned" with lane email
on the large ones, no chain-shaped company dropped unless the evidence is
franchise, `📉 FIND YIELD` shows large companies served, and the rep's
sheet ends with the layered rows.
