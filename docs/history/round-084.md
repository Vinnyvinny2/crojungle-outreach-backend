# §84 — The eight from five live sheets — 2026-08-27
Source: CLAUDE.md lines 11009-11192, moved verbatim 2026-09-02 from commit b01d952e4f95d7b69686bc2c4063ca2aa0cb7546 (branch backup/claude-md-monolith). Nothing below this line was edited.

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

