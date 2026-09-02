# §76 — The search stood in the wrong country, and the pacing never reached production — 2026-08-26
Source: CLAUDE.md lines 6634-6837, moved verbatim 2026-09-02 from commit b01d952e4f95d7b69686bc2c4063ca2aa0cb7546 (branch backup/claude-md-monolith). Nothing below this line was edited.

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

