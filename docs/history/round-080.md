# §80 — The finds were never deleted. Their only rendering was. — 2026-08-26
Source: CLAUDE.md lines 7428-7583, moved verbatim 2026-09-02 from commit b01d952e4f95d7b69686bc2c4063ca2aa0cb7546 (branch backup/claude-md-monolith). Nothing below this line was edited.

## 80. The finds were never deleted. Their only rendering was. — 2026-08-26

Vin: *"I remember the audits would state code and behind design of websites. I
haven't seen that in recent audits since I complained not being able to
understand it. I feel it was cut from the audits. This was very strong, just
needed it in simple terms to understand. The audits spoke about bad code,
websites not being set up well for seo, code being built prior to smart phones
etc. It was great finds."*

He was right, and the cause is a NEW SHAPE of the class this file records more
than any other. The usual shape is computed-but-not-passed: a value never
reaches its consumer. This one looks healthy at every wire. `readSiteAge`
measures eleven markers and writes each as a finished plain sentence ("the
copyright line at the bottom still reads 2014", "the code behind the page is
the kind used before smartphones existed"). The value is delivered, persisted,
and survives a reload. What was deleted was the only place a person could READ
it: §71 correctly made the customer-credibility CLAIM require a marker a
customer can see, and `buildAuditFacts` passed only the COUNT. So the sheet
said *"3 old-build markers in the source"* — jargon, unverifiable, the exact
opposite of the translation he asked for — while three finished sentences sat
in memory. **A count IS a render, so nothing downstream could tell.**

The words travel again, with the honest scope on a code-only build ("all in the
page code — a visitor never sees these; it is the build that is dated"). The
CLAIM stays gated on visible markers; the FINDING does not.

### Every fact must have a home

The root fix is not the age markers. `FACTS_RENDER` declares, for every key the
facts strip returns, either `client` (a person reads it), `derived: <sibling>`
(another key carries it, named), or `internal: <reason>`. `FACTS COVERAGE
CHECK` executes `buildAuditFacts` and fails the boot on a key with no home;
`FACTS RENDER CHECK` in clientcheck — the only file that can see both sides —
fails when a key marked `client` is read by nothing in index.html, and when a
held-back key's reason is not a reason. A field can still be dropped from the
sheet, but only by a person writing down that they meant to. **The table's own
first boot caught a key missing from its first draft.**

### Two live truth bugs found on the way, both worse than the render gap

- **The review count in "what is working for them" could belong to another
  business.** §44 settled that a review COUNT comes from Place Details on the
  exact place id, never the rank-search row (matched on placeId, else domain,
  else an exact NAME). §56 found two more raw call sites and fixed them. THREE
  were still raw, all running before `resolveMeasurements` and so unable to
  read the resolved figure — and the worst was `measureValueEquation`, whose
  numerator reaches the audit brief under *"WHAT IS WORKING FOR THEM (do NOT
  call these problems)"* and the fact-checker under *"do NOT flag these as
  unverified"*. The one gate that would catch a wrong number is explicitly told
  to stand down on it, and `likelihood` and `earnedButBlocked` are scored off
  it — so a name-matched row changed the STORY, not just a figure. The rule is
  `reviewFigureAuthority` now, called by all five sites including
  resolveMeasurements, because five hand-kept copies is how the fifth stays
  wrong.
- **The buying-authority floor was bypassed on one arm.** §41 removed the
  `|| 'Owner'` default and built the held-back path INSIDE the resolver arm.
  The cache-hit arm one branch above kept the old behaviour, so a contact
  cached within 60 days was promoted to verifiedCEO with the word "Owner"
  invented for a row with no title — the exact live sheet §41 exists to stop,
  shipping on every re-research of a cached lead. A row cached before §41
  carries no `canBuy`, so an absent verdict is re-derived through the same
  `authorityScore` the resolver uses.

### And the one mechanism that produces evidence could never write a row

`recordCallOutcome` stamped `crypto.randomUUID()` into `id` — a column declared
`id bigserial primary key`. Postgres refuses a UUID string for a bigint (22P02),
PostgREST answers 400, `sbRest` returns null on any non-ok response, and the
grey ⛔ line printed on every press. **Every call outcome ever logged was
discarded, and `/api/call-outcomes` has always answered zero.** §35 calls this
capture *"the lever, and it is the only one that is not inference"* — the single
mechanism in this project that produces evidence rather than the system grading
its own homework. The two siblings written the same week (`writeObservation`,
the send_log write) both omit the id and let the sequence assign it; this was
the odd one out. The id is gone, and the row shape is now a pure function
(`buildCallOutcomeRow`) the boot check EXECUTES — it never could before, which
is exactly why a defect in the shape survived: every assertion exercised the
REPORT over hand-made rows, and a report can only be right about rows that
exist.

### A milestone is not a state

§70's follow-along setter wrote into `job.phase` — the field the kill clock,
the stale sweeper and the concurrency counter all read as a STATE ENUM. From
the first milestone onward that enum held prose, so every consumer comparing it
to a state was comparing against a sentence. The milestone has its own field;
the status route still hands it outward under the name the client reads, so
nothing on the wire changed.

### The rest of the dark measurements, now in words

- **The SECONDS, not the adjective.** Google's CrUX field data — the only
  measurement in this system taken from the prospect's own customers — was
  collapsed to `slow`/`fine`. The row now states the p75 wait, and the band
  travels from the server so the sheet never holds a second copy of Google's
  2.5/4.0 thresholds. It also carries WHICH metric failed, so a good load time
  beside a failing layout shift can never print a strength above the numbered
  leak that says otherwise.
- **The booking LABEL over a door that cannot book.** Measured on every branch
  in §79 "for the call sheet" and delivered nowhere. Only the contradiction
  earns a row.
- **The SEO bands were measured and invisible except at their extremes** — a
  title naming the trade but not the city, two of forty images, a sitemap eight
  months cold. All three render now, and a site with all three in order is
  still given no fault, because a row that flags every site tells a caller
  nothing.
- **The calling window says the hours are THEIRS.** §77 bought
  `utcOffsetMinutes` for exactly this and never delivered it, so a caller three
  zones away read "opens around 8am" as his own clock. Stated as a difference
  from the caller's clock, never as a named zone, and silent when no offset was
  measured.
- **A hidden address is not an absent duplicate.** A pure service-area listing
  hides its street address on Google by design, so the address half of the
  duplicate proof standard can never be satisfied — and "no duplicate found"
  was reporting our own blindness as a fact about their listings.
- **Google's own review summary and the listing's other categories** reach the
  story and the fact-checker as INTERNAL lines. Both were bought in the billed
  Place Details mask and parsed by nothing.
- **The first h1 was not the first h1.** `[\s\S]{0,200}?` does not safely yield
  '' on a long heading: `String.match` advances on a failed attempt, so a first
  h1 running past 200 characters was SKIPPED and the SECOND h1 came back as the
  headline — silently, and most often on builder pages that wrap an h1 around a
  whole hero block. Proven by execution, not by reading.

### Two neutered guards

`NICHE BRIEF CHECK`'s structural wall sliced a fixed 6,000 characters of each
function it polices; those functions run to 3,000, 7,600 and 9,700, so a niche
read in the TAIL of two of them sat outside everything the loop could see and
the wall reported itself intact. It reads to the function's own closing brace
now, and asserts that it got there — the assertion is on the SLICE, not on the
variable that computes it, because a revert that breaks scope proves nothing.

### What the falsification runs found

Nineteen reverts, each red alone — and **six came back STILL GREEN on the first
pass**, which is the whole reason the discipline exists: nothing guarded the
cache-hit authority gate, the booking-label wire, the h1 read, the speed
seconds, the timezone clause, the service-area guard or the widened SEO bands.
Each now has an executed guard.

Two more found in my own new work by my own new fixtures: the timezone clause
laundered a null offset into UTC (`Number(null)` is 0 and 0 is finite — the
recorded trap, arriving on schedule inside the round that fixed it elsewhere),
and the FACTS RENDER parser stopped at an escaped apostrophe, which is exactly
the character a written REASON contains.

**249 boot checks green.** The contract is unchanged at 20260903 — no field the
client must have moved.

**`index.html` changed, so this needs a Netlify deploy** — the old-build finds
in words, the real-visitor seconds, the booking-label row and the widened
search-setup bands are dark until the file lands.

---

