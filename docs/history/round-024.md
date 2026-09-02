# §24 — Ten faults from one live log, and the two worst were silent — FIXED 2026-08-20
Source: CLAUDE.md lines 1245-1415, moved verbatim 2026-09-02 from commit b01d952e4f95d7b69686bc2c4063ca2aa0cb7546 (branch backup/claude-md-monolith). Nothing below this line was edited.

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

