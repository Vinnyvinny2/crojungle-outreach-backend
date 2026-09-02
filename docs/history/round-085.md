# §85 — Round 107 — the sheet stopped arguing with itself, and the log stopped telling its own history — 2026-08-27
Source: CLAUDE.md lines 11193-11357, moved verbatim 2026-09-02 from commit b01d952e4f95d7b69686bc2c4063ca2aa0cb7546 (branch backup/claude-md-monolith). Nothing below this line was edited.

## 85. Round 107 — the sheet stopped arguing with itself, and the log stopped telling its own history — 2026-08-27

Vin: *"take ur time i need auidts at 8.5 logs at 9.5 audits ready to send to
sales guy in bulk"*, then *"build everything at the highest quality ever... fix
everything at the root build from the ground up."* Twenty-six defects across
three clusters, every one falsified by reverting it ALONE against a green
baseline — **37 reverts, each red on its own named assertion** — and four of
those came back STILL GREEN first, which is the entire reason the discipline
exists. **264 boot checks green**, all gates green.

### A — the sheet said two things about one measurement

- **"Their Google listing has 0 photos on it", on leads with photo-rich
  listings.** The Places photos array saturates at **10** — that is our API's
  ceiling, not their count — and `fetchGBPHealth` correctly travelled a
  saturated read as null. The DataForSEO finder row then re-mapped the same
  number through `Number.isFinite(Number(x.totalPhotos))`, and **`Number(null)`
  is 0 and 0 is finite**, so the null minted one hop earlier came back as a
  measured ZERO. Its sibling field on the very next line, `isClaimed`, is
  `typeof`-guarded and was immune — the contrast that proves the guard was lost
  rather than never written. `readPlacePhotos` is one pure derivation now
  (`photosSeen` / `photosAtCap` / `photoCount`), `gbpPhotoPhrase` is the one
  sentence every consumer prints, and every photo total is coerced with
  `strictNum`, which refuses null, undefined, booleans, arrays and the empty
  string. A saturated listing states **"at least 10 photos, so the real number
  is unknown and must never be stated"**; a genuine measured zero still fires
  `thin_profile`, because the finding is real when the measurement is.
  **And the same laundering was inside the gate built to catch it**:
  `verifyFiguresTrace` calls `add()` for eleven fields, so one unmeasured
  measurement — which is nearly every lead — put the digit **0** into the
  allowlist the figure gate quotes back at a refusal.
- **"Nobody responds — 5 mentions" printed one line under "After they reach
  out — NOT MEASURED".** The complaint and the size of the sample it was read
  from are ONE measurement and they travelled separately: five different places
  wrote `publicPainSignals` and only some of them wrote `reviewsRead`. One
  setter now (`takePain`), and it carries three things — the strings, the
  denominator, and **whether the complaint came from their reviews at all**.
  The funnel walk gained a third state between "no fault found" and "not
  measured": **PARTLY MEASURED**, for a stage we looked at and cannot say
  enough about. A complaint from a WEB SEARCH is no longer described as their
  customers' own written record; it is not, and it cannot license the pattern
  rung.
- **"The only way in is a form"** on sites with a phone number in the header.
  `booking === 'form'` has always meant *a route exists and nothing books a
  time* — the critique prompt says so in those words — and the rung's own
  sentence had never been told. Only the word "only" was false, so only it was
  removed: widening the test to demand no phone would delete a real, sellable
  finding on most trade sites, which is the guard-too-tight failure.
- **"Every one of those is a job that went somewhere else"**, on a lead whose
  review mine found no complaint at all. Four of the rungs in that pillar are
  measured off the WEBSITE and need no review evidence to fire, so the money
  line takes an evidence argument now: with the customers' own written record
  behind it the loss is stated; without it the sentence says what was measured
  and hands the rest to the one place that can answer it — his own phone log.
- **"None of the earlier stages measured as the problem"** printed above a door
  stage rendered BROKEN with two red leak rows on it. That branch never measured
  what it claimed; all it knew was that no condition ABOVE it matched. The
  door-leak fact was computed 190 lines up and read by one other line —
  computed-but-not-passed inside one function.

### B — what a junior rep reads as sloppiness

- **Four human-facing cuts ended mid-word.** One word-boundary clip now, at
  every one of them.
- **A quoted span that begins inside a sentence is marked as the excerpt it
  is.** It read as a whole sentence otherwise, and the reader could not tell
  which he was holding.
- **`replyLatencyPhrase(null)` returned "the same day"** — my own null
  laundering, written in the same round that fixed the class three functions
  away, and caught by this round's own assertion.
- **A door finding priced by an after-stage template.** The financing leak
  carried *"a quote that sits unanswered is one of those jobs"*; it says the
  monthly-payment thing now.
- **`"repair replace"` was bought as a real search** and `"seal coating"` had to
  survive. Anchored whole-word forms only, both directions fixtured — widening
  the list one step eats real service pages, which deletes `service_invisibility`
  in silence.
- **Two renders under one intent key printed as "proof · proof"**, the campaign-
  shaped half of the unlinked-page read was dropped at the return, and the route
  top-up could mint a SECOND leak number for a claim family that already had
  one — two rows saying the same thing, numbered 2 and 3.
- **One display form for the website**, so the Contact block and the export
  cannot spell one fact two ways.
- **The Do-not-say quote had two homes.** The stored entry BEGINS with the
  quoted span, so the fallback reason printed it a second time — three of five
  entries on two separate live sheets.

### L — the log names the real cause, once

- **Every DataForSEO failure printed "the CREDENTIALS were refused — check
  DATAFORSEO_PASSWORD in Render."** A 40200 is an EMPTY BALANCE and the
  credentials are perfect. A guess printed as an instruction reads exactly like
  a measurement, and it sends whoever reads it to inspect the one healthy part
  of the system — the Supabase-table failure this file already records, in a
  second costume. The cause is READ from their own code now (balance / auth /
  location / request / notfound / theirs), each with what to do about it.
- **And it was said once per QUERY.** A lead asks the pack up to ten times, so
  one account fact printed ten times and the reader scrolled past all ten. An
  account-level failure latches like the Firecrawl balance and the Apify token
  do — with the same half-open probe, because a latch with no way back is the
  deadlock recorded in §43 — and the doomed attempt is skipped while the Places
  fallback is untouched.
- **The CONSEQUENCE was never said at all.** What matters is not that a call
  failed, it is that this lead's sheet will carry **no search position, no named
  competitor above them and no sponsored block**. One `RANK SOURCE` line per
  lead, beside the spend, with the count of Places searches bought as the
  fallback.
- **Thirteen per-lead log lines carried the codebase's history** — what the code
  used to do, which live lead it broke, on what date — in the middle of a fact
  about THIS business. Every measurement and every scope note stays; the
  changelog goes. A boot check scans the 440 per-lead log lines for it, with a
  population floor, because a scan that matches nothing reports a clean pass.
- **A second rank sample could print after its own function had returned**, so
  its failure landed under the NEXT lead's name, and a settings line about the
  Firecrawl PLAN was announced once per lead as though it were about the
  business.

### What the falsification runs found in the checks themselves

- **The mid-sentence fixture measured nothing.** Widening the quote's lead
  window to 160 characters — the same round — made the whole sentence fit, so
  the span began at a capital letter, the marker could never fire, and
  reverting the marker left the check green. The fixture's lead-in is now
  longer than the window, which is the only state in which a span CAN begin
  mid-sentence, and it asserts the marker itself rather than a proxy.
- **A fixture that handed in the flag it was testing.** The review-provenance
  fixture passed `reviewPainIsReviews: false` to the consumer, so it could only
  ever prove the consumer reads it — reverting the one WRITER that sets it left
  every fixture green. Tenth recorded instance of *a check that does not assert
  its call site is half a check*.
- **One needle covering two surfaces.** The partly-measured state is rendered by
  the screen AND the export, and a single `indexOf` was satisfied by either, so
  reverting the export alone passed. It counts both now.
- **A fix with no guard at all.** The one website display form had been added to
  the harness's lift list so the code would compile, and nothing asserted it.
- **Five needles with an EMPTY half** — one written by me this round, four
  standing. A needle assembled from a real half and an empty one is one
  contiguous literal sitting in the check's own body, so `indexOf` finds
  ITSELF and the guard passes on a build where the thing it protects is gone.
  Sixteenth recorded instance. Two of the four turned out to be guarding
  something real: with the halves split, reverting the review-figure authority
  and the cached-contact buying floor now both go red, and neither did before.

### Two smaller things settled on the way

- **`\bused to\b` is not the substring "used to".** The first changelog scan
  flagged *"the spine refused to build on it"* — `ref**used to** build`. A
  boundary, not a substring, and the fixture that found it is in the check.
- **"Invalid Field" is not automatically a LOCATION field.** Matching the bare
  words made every malformed field read as a market their database does not
  hold, which would buy a second identically malformed request while reporting
  a problem that does not exist. Found by this round's own fixture on a 40502.

**HONEST SHAPE, stated rather than implied.** None of this has run against a
live lead — the last live run is what these defects were read out of. The
DataForSEO account is out of balance, so the cause reader's `balance` branch is
the one that will fire first on the next run, and that is the branch to check
the wording of against a real log.

**`index.html` changed, so this needs a Netlify deploy**, and the contract is
**20260907** on both sides — a stale page would render a thin read as a verdict
and send a complaint to the server with no sample size behind it.

---

