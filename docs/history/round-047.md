# §47 — Twenty-six from a ten-lens adversarial sweep — 2026-08-22
Source: CLAUDE.md lines 3490-3689, moved verbatim 2026-09-02 from commit b01d952e4f95d7b69686bc2c4063ca2aa0cb7546 (branch backup/claude-md-monolith). Nothing below this line was edited.

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

