# §94 — Find stopped asking the star rating what a business can afford — 2026-08-28
Source: CLAUDE.md lines 8000-8264, moved verbatim 2026-09-02 from commit b01d952e4f95d7b69686bc2c4063ca2aa0cb7546 (branch backup/claude-md-monolith). Nothing below this line was edited.

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

