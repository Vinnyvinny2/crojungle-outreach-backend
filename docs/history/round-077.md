# §77 — Round 100 — every leak signal checked for truth, and the leaks that had no signal at all — 2026-08-26
Source: CLAUDE.md lines 6838-7111, moved verbatim 2026-09-02 from commit b01d952e4f95d7b69686bc2c4063ca2aa0cb7546 (branch backup/claude-md-monolith). Nothing below this line was edited.

## 77. Round 100 — every leak signal checked for truth, and the leaks that had no signal at all — 2026-08-26

Vin: *"Also make sure that we have all the correct and best find signals to
identify every possible leak within these business funnels. Take ur time on
this as well this is importnant."* Five recon agents mapped the ground first —
the complete rung-by-stage matrix, every paid response field we throw away, the
industry's own evidence-graded playbook, an adversarial pass on how each
existing signal can be WRONG, and the known-deferred list. What came back
sorted into two piles: signals that could put a FALSE sentence on a sheet, and
leaks no signal covered at all.

### The signals that could be wrong, fixed at the root

- **A site's own /book-now link counted as a vendor scheduler.** The relative
  URL shapes sat inside SCHEDULER_SIGNATURES, so the harvest logged "a
  scheduler signature is in the SOURCE" and the verdict said "a third-party
  scheduling tool is embedded" about a nav link — a checkable false statement.
  The shapes moved to BOOKING_ACTION_PATHS with the honest why ("the page
  links its own booking page"), and the vendor list gained the 2026 trade
  stack it was missing: GoHighLevel/LeadConnector booking (the most common CRM
  on home-service sites), Schedule Engine (its embed loads from
  js.scheduleengine.net — the word "servicetitan" never appears in that
  markup), OnceHub and Workiz. LeadConnector's webchat and Chatra joined the
  chat list the same way.
- **A WordPress comment form read as a contact route.** htmlHasRealForm judged
  the whole document, and an open-comments blog post carries textarea + name +
  email by construction — one such interior page set forms:true for the host
  and upgraded a true phone_only verdict. It judges PER FORM BLOCK now;
  comment forms and newsletter-only embeds are excluded by what they are.
- **"The money goes out blind" was never provable.** Google's own setup wizard
  puts the conversion EVENT snippet on the thank-you page alone — routinely
  noindex, unlinked, and therefore never read by us — so a correctly tracked
  account presents exactly the shape ads_untracked fired on. Same reasoning
  that made the GTM container a stand-down, missed on the sibling. Every
  renderer of the blind state now carries the conditional and hands the
  question to the one place that can answer it: "whether anything ties those
  clicks to jobs is a question only their ads account answers." The rung and
  its scoped say() survive; the false certainty does not.
- **An LSA-only advertiser read "Ads: none found".** The §74 Axiom label,
  still live in the facts strip: an LSA campaign needs zero site code by
  design. A new 'lsa_only' facts state says what is true — their pay-per-lead
  ad was SEEN on our pull, and that product runs through Google's own call
  flow. The plain 'no' is scoped to "no ad code on their pages" everywhere.
- **The two Google regexes disagreed on the AW id floor** (8 digits vs 6), so
  an older account's conversion label could sit in the markup beside
  "nothing for Google". One floor.
- **no_financing could not see a Financing page.** The unread-page guard
  matched /pricing|price|rates|fees|cost/ and a /financing/ URL matches none
  of those — the §59 defect reintroduced one URL-regex short. existsButUnread
  gained a financing entry and the rung rides it. BIG_TICKET stopped matching
  the cleaning trades ('window' caught "Window cleaning service"), the lender
  list gained EnerBank, Wisetack-peers Aqua Finance, Lyon Financial, Mosaic
  (anchored), PowerPay and HFS, and "Join the Comfort Club" finally reads as
  a recurring offer.
- **A homepage hero price was structurally invisible.** Published prices come
  from the interior-corpus extractor by design, so "$89 tune-up special" in
  the hero shipped under "no price anywhere on the pages we read" — disproved
  in one glance. A dollar figure in the homepage's own rendered text now
  SUPPRESSES the no-price family (rung, constraint and value equation, one
  rule at three call sites). Suppression only; the claim never widens.
- **Two vocabularies answered "is this a delivery complaint" and had
  diverged.** OPS_PAIN_WORDS was a strict subset of the bucket definitions —
  §57 and §67 widened the buckets for live misses and the copy never got the
  same words — so the leak ranking called a theme contact-shaped while the
  THROUGHPUT read counted zero operational themes: two verdicts about one
  string on one sheet, the §41 class. readOperationalPain reads the SAME
  bucket definitions now, plus the three ops-only words (paperwork, lost my,
  disorganiz) that deliberately never stage a theme as contact. The
  no_response bucket also learned the vernacular: ghosted, left us hanging,
  blew us off, never returns calls, no one picks up.
- **jQuery UI 1.13 read as 2016 code.** jQuery UI's current major is still
  1.x — released 2021-2024 and shipped by WordPress core today — and the
  oldjquery marker matched it, so a maintained site carried a dated-build
  marker. The ui alternative is gone; core jquery 1.x/2.x is the real signal.
  And the dated-credibility sentence may now name only VISIBLE markers: the
  visible-first sort used to put an invisible marker in slot 2 whenever
  exactly one visible marker existed, inside a customer-perception claim.
- **slow_mobile fired in Google's needs-improvement band.** The LCP finding
  pushed at 2.5s — where GOOD ends — while Google's own failing line is 4.0s,
  so a 2.6s site (better than half the web) carried a harm-83 rung under a
  caption reading "failed Google's thresholds". Only the poor band is a
  finding now; the middle survives as a note in the verdict. And the p75 is
  said honestly: "one phone visitor in four waits more than X seconds" — the
  typical visitor waits less, and he can read the same distribution on
  PageSpeed Insights.
- **"Too few visitors" was said about sites whose CrUX record existed one
  field over.** A URL with no page-level record often has an ORIGIN record;
  it is consulted now, with fieldScope recording which.
- **"Mobile Bay Roofing" in Mobile, Alabama narrowed to the mobile-roofer
  search** — the §30 failure rebuilt by the fix for it. A modifier that is a
  word of the city can never narrow; 'custom' narrows only the build trades
  ("Custom Plumbing Inc" is a name, not a specialty).
- **The marketplace guard was synonym-blind.** Trade "attorney" against
  returned categories "Law firm"/"Lawyer" shared no 4-character prefix, so
  the guard refused the whole rank read and killed outranked_by_weaker — the
  reply-proven rung — on a correct search. A small DECLARED synonym table
  (attorney/lawyer/law, dentist/dental, hvac/heating/cooling…) closes it; the
  parking-garage refusal still stands.
- **service_invisibility was structurally dead on Squarespace/GoHighLevel
  architectures**, which publish service pages at the ROOT. Root slugs that
  name a service (a declared vocabulary, 2-3 words, articles refused) count
  now.
- **absent_from_search on the Places fallback rested on the bias it was
  supposed to survive.** §52's rationale — the lookup BOOSTS name matches, so
  absence despite the boost is strong evidence — inverts exactly for a
  business whose name shares no word with the query ("A Team Services",
  garage doors). On the fallback source, harm 96 now additionally requires
  the name-token overlap that makes the rationale true; DataForSEO absences
  are untouched.
- **A 240-day-old JobPosting co-signed the capacity read.** Recruiting
  plugins leave JSON-LD in place for filled roles; a DATED posting past the
  rung's own 120-day window now drops the "hiring right now" flag while
  keeping its honest date, so every consumer can refuse for itself.
- **review_pain_pattern's pillar finally moved with its theme.** RUNG_PILLAR's
  own comment promised since §64 that a contact-shaped complaint would move
  to UNCAUGHT, and pillarForRung read the table flat — so the finding both
  real replies came from was always priced by ROTTING's cold-quote line. The
  move lives in buildProblemList's _pillarOf beside the workmanship→TAXED
  move, off the SAME classification the stage and the rank use.
- **Garage door, appliance repair and water heater joined
  RECURRING_NORMAL_TRADES** — trades where a maintenance plan is standard and
  §69's RETENTION layer could never bind.
- **Nine orphan fields, resolved by name.** rankOrderTrusted, the resolver's
  open24 copy, the unreadReviews forward, obsDays, adsStartedDays,
  scrapeTrustworthy, pageChars and siteVeryDated were computed and read by
  NOTHING — dead freight that reads as a wire. Deleted (open24 became ONE
  copy, the resolver's). The two dead literals reading
  _measured.copyrightYear — rescued only because the measureAbandonment
  spread sits later in the literal, one reorder from silently killing rungs 5
  and 7 — are deleted with the hazard documented at the spread. And the
  in-ranker LOCAL_ONLY branch now states its honest state: at the production
  call site the business model resolves AFTER the ladder runs, so the branch
  is defence for future call sites, exercised by fixtures, with the route's
  _kept filter as the real mechanism.

### The leaks that had NO signal

The rung inventory said it plainly: 48 rungs — 22 at the door, 17 at
getting-found, 7 internal review metrics, and TWO at after-contact, the stage
that wins leak #1 by depth. And whole leak classes fired nothing:

- **buried_in_results (harm 71, INVISIBLE, found).** A trusted #7 with no
  weaker rival above fired NO rung at all — the walk printed the digit and the
  ladder could not number the fact. Bands, never digits (§52), trusted source
  only, standing down for the pack, the paid door, and outranked_by_weaker's
  sharper version of the same fact.
- **unclaimed_listing (harm 87, INVISIBLE, found).** The DFS finder row we
  already buy carries is_claimed, and an unclaimed listing cannot answer
  reviews, fix its hours, or refuse a stranger's edits — Google prints "Claim
  this business" on it, so the owner checks it in one look. Fires only on an
  IDENTITY-matched row (placeId or domain — a name-guess licensing this would
  be §19 at a stranger's listing) with an explicit boolean false. HONEST
  SHAPE: the field has never been read from the live endpoint by this
  codebase; an absent field is null and null licenses nothing.
- **campaign_page_dead (harm 78, LEAKING, door).** The campaign-shaped
  unlinked pages were counted, named, and never OPENED — so an ad landing
  page that died was indistinguishable from one that works. A plain status
  probe (fetchT, never Firecrawl — Firecrawl bills a 404 as a fetch) opens up
  to four of them; only a page answering 404 or 410 to TWO probes counts,
  because a 403 is routinely a bot wall in front of a healthy page. Its first
  wording said "landing page" and "sitemap" and PLAIN ENGLISH CHECK refused
  the boot — the gate doing its job on my own words, again.
- **Owner reply LATENCY.** responseFromOwnerDate was in every Apify row and
  dropped at normalize — the one after-contact measurement this system can
  take without ever contacting the business. Median days between a review and
  its reply, three measurable pairs or nothing, over the same mined set as
  every other count. INTERNAL, like everything review-derived. The
  whole-profile star histogram (reviewsDistribution) rides the same rows.
- **The §28 checklist six were consumed by NOTHING.** submitOnlyButton,
  wrongKeyboardFields, multiStepForm, proofOnlyInFooter, sharedInboxOnly and
  firstFoldCtaKinds — measured off CROJungle's own published Autopsy and
  Ledger, boot-checked, and read by no rung, no prompt line, no facts chip,
  and zero client renders. The recorded computed-but-not-passed class applied
  to an entire feature. They reach the audit prompt's SITE REVENUE SIGNALS
  block and the facts strip now (tri-state, so an unread page never renders
  clean), and the multi-step signal SOFTENS the long-form line — a stepped
  form is the fix, not the fault.
- **"Is anything measuring the site at all."** Distinct from the ads question:
  a site with no GA4, no pixel, no counter of any kind means no dashboard
  anywhere can tell the owner how many people came last month. One signature
  beside its siblings in AD_TAG_SIGNATURES, copied back the same day (the AD
  WIRE lesson), internal.
- **The benchmark rows the after-contact stage could never cite.**
  five_minutes and response_42h have been declared in REVENUE_BENCHMARKS
  since §52 and read by nothing. On a lead whose own mined theme is
  contact-shaped, the call sheet now gets both industry rows — each a segment
  fact with its source and year, structurally unable to mention him.
- **Google's own reviewSummary was a dead field in a billed call** — in the
  Place Details mask, parsed by nothing. Consumed now (internal), alongside
  three more free fields on the same call: utcOffsetMinutes (the calling
  window in THEIR timezone), the authoritative city off addressComponents,
  and pureServiceAreaBusiness (the one listing shape the duplicate-listing
  address match can never work on).
- **The People-Also-Ask questions and the advertisers whose ads were SERVED
  on the search** both ride the organic SERP response we already buy and were
  thrown away. Both positive-only, both internal: the questions customers
  actually type, and who is paying for the click.
- **The finder row's total_photos** finally answers the photo question past
  the Places API's 10-photo cap (§53) — identity-matched rows only.

### Deliberately NOT built, and why

- **The mystery-shop lead-response test.** The entire top-evidence tier of the
  industry's own playbook — speed-to-lead, missed calls, follow-up cadence —
  is measured by submitting a real enquiry and clocking what happens. It is
  the single biggest gap left, and it CONTACTS the business, which is not a
  decision this system gets to make on its own. Flagged to Vin as a
  recommendation, not a build.
- **GBP posts, Q&A and photo recency** need a profile-scraping actor — new
  spend, and "if anything it needs to get cheaper" stands.
- **Per-service ORGANIC positions (intent_mismatch)** stay deferred: the
  map-side service read — revived this round for root-slug architectures —
  covers the sellable claim, and the organic nuance costs ~1¢/lead for an
  internal-only distinction.
- **Firecrawl's metadata.statusCode** stays unconsumed for now: the
  duplicate-page fingerprint already catches the redirect-to-homepage harm,
  and a captured-but-consumed-by-nothing field is the disease, not a feature.
- **Message-match as a mechanical signal**: we cannot read their ad copy with
  Transparency off, so there is no substrate; the model's copy quotes already
  surface it.
- **No harm renumbering, no rung reordering** beyond the declared pillar move:
  PART 6's rule holds — no tuning until real replies exist to tune against.

### What the round's own guards caught while it was being built

- **The gates caught my own new rung twice.** PLAIN ENGLISH CHECK refused
  campaign_page_dead for "landing page" and "sitemap"; RUNG PHRASE CHECK
  refused it again for repeating "built to receive ad clicks" across its own
  sentences. Both rewritten; both checks were doing exactly their jobs.
- **The five new response fields landed in the WRONG LITERAL first** — inside
  scoreReachability's arguments instead of res.json, where they would have
  been computed and never returned. clientcheck's executable contract named
  all five the moment they reached the real response object and the merge did
  not carry them. The check built in §18 caught the §18 disease, mid-build.
- **My own P5 edit script died half-applied and the fixture caught it.** The
  first site-age script failed on a byte mismatch AFTER the jQuery and
  visible-naming fixes were staged; the atomic save dropped both, the rerun
  carried only the speed half, and the new dated-say fixture went RED on the
  very next boot naming the missing slice. A fixture written the same hour it
  was needed.
- **SITE AGE CHECK then went red on a fixture that predated the visible-count
  contract** — its say() fixture passed markers with no count, which the new
  slice correctly reads as "name nothing". The fixture now carries the count
  the production wire always carries.

### What the falsification runs found in the checks themselves

- **The ops-vocabulary revert came back STILL GREEN**, and the reason is the
  recorded half-a-check trap, committed by me in the same session that fixed
  it elsewhere: the new phrasings ("unresponsive", "never heard back") were
  fixtured on the PREDICATE alone, while every function-level fixture used
  phrasings BOTH vocabularies match — so reverting readOperationalPain's
  call site to the old narrow list left every fixture green while the sheet
  went back to two verdicts about one string. The guard now runs three
  new-vocabulary complaints through the full function and counts the themes;
  the re-run went red on exactly that assertion.
- **One revert script died on a needle written from design notes instead of
  live bytes** — the real function carries two comment lines the notes did
  not. A failed revert proves nothing about the guard; rewritten from a byte
  probe of the live source and re-run red.

**240 boot checks green.** 39 server falsifications and 3 client
falsifications, each reverted alone and each red on its named assertion —
the one mechanism-free change (deleting two dead literals) has no
falsification, because there is no behaviour to revert. The full gate suite
green. The contract is 20260901 on both sides.

**`index.html` changed, so this needs a Netlify deploy** — the LSA-aware ads
label, the checklist and analytics rows, the reply-latency and
customer-questions notes, and the five new merge fields are dark until the
file lands, and a stale page says so by contract number.

---

