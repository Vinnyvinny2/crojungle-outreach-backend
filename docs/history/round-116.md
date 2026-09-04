# §116 — To an 8: no retired name on the sheet, three free size sources, and the score the proof runs are measured on — 2026-09-04
Written 2026-09-04 for docs/history (one file per round; CLAUDE.md carries no history). Not a moved section: verify-split.sh skips it.

## 116. To an 8: no retired name on the sheet, three free size sources, and the score the proof runs are measured on — 2026-09-04

After Round 115 went live Vin asked three things: *"we had one decision
maker named and it says (retired) on the site under his name"*; *"why is
there so much guessing still? we need to fix this"*; *"any way to do this
for free?"*; and then: *"let's get it to 8 tonight, no question, then we'll
run 2 more test runs to prove it's an 8, let's think hard."*

### What "8" means, so the two runs can prove it

| measure | last run (25 leads) | target |
|---|---|---|
| a retired / emeritus / late person, a franchise or a chain printed as Owner | 3 (one retired founder, Archadeck, ClearChoice) | **0** |
| size *likely* or *sure* | 6 (24%) | **≥ 50%** |
| a name on the row | 20 (80%) | **≥ 80%** (hold) |
| hedge rows at the bottom, website column present | not yet (Netlify) | yes |
| median read time | ~200s | **≤ 150s** (§115's second-query trim) |

The sizes were guesses because most small shops publish no headcount
anywhere a directory indexes: the revenue directories cover roughly $3M+,
the LinkedIn / BBB snippet query found nothing on 21 of 21 misses, and the
team pages we read yielded zero name-and-title pairs on most sites. Three
free sources were on the table and none was used fully.

### What changed (server.js; index.html for the score line, contract 20261001)

- **A retired person is never the decision-maker.** `RETIRED_RE` (retired,
  emeritus, in memoriam, the late, passed away, "(ret.)", former owner /
  president / CEO / founder, sold the business) and the pure `retiredNear(text,
  name, span)`: the window is the SENTENCE the full name sits in (bounded by
  `. ; ! ? |` or a newline, capped at `span` each side), keyed on the full
  name, so "Bob Smith retired in 2020. His son Mike Smith runs it" retires Bob
  and not Mike. `RETIRED_OTHER_RE` stands it down beside a service word: a
  retired firefighter who owns the shop is not retired from it. Applied on
  every source: `parseTeamRoster` marks a row `retired` (the title says it, or
  the text beside the name does) and `rankRosterOwners` skips it, with a
  ROSTER line naming who was skipped; the brain result and the regex
  backstop refuse the name (`DM/brain … is retired per their own page`); the
  web-search prompt warns and the acceptance rejects (`… retired per the
  results - REJECTED`); the candidate door refuses a retired title before
  ranking. The ladder then continues as if the site named nobody.
- **The team page counted without titles.** `countTeamNames(html)`: when a
  team-intent page parses to zero name/title pairs, the name-shaped runs are
  counted (the roster's own name pattern and name gate; nav and heading
  words refused; a name followed by a quote, "says", "wrote", a star or
  "review" is a testimonial and not counted). From three people up it is
  `signals.teamCount`, a FLOOR (`SIZE_TERMS.teamCount.floor`), so it lifts
  the band to medium from the core cut and never past *likely* on its own.
- **Their own words, read wider.** `STAFF_PROSE_RE` reads number words
  (one–fifty), "team / staff / crew / workforce of N", "N-person team",
  "N-man crew", "employs / employing over N", and the trades' own nouns
  (painters, landscapers, arborists, estimators, hygienists, attorneys,
  agents, stylists, caregivers, therapists, doctors, dentists, pros,
  specialists, licensed / certified …); `CREW_PROSE_RE` reads "N crews" as
  about three people each and the row says so; `FLEET_PROSE_RE` reads
  vehicles, rigs, bucket trucks, service vans and "N-truck fleet".
  "5-star", "24 hours", "10 years", "3 generations", "100%", "2 locations",
  "500 happy customers" and "20 minutes" stay silent: the noun decides.
- **The BBB profile, fetched free.** `BBB_PROFILE_RE` picks a profile URL
  out of the size search's results (its slug must share a distinctive token
  with the company name); `fetchBbbProfile` reads it with a plain `fetchT`
  and a browser user-agent, NEVER a Firecrawl credit — a refusal is one line
  ("BBB profile refused a plain fetch … - not bought") and nothing else;
  `parseBbbProfile` reads "Number of Employees" (→ `directoryEmployees`,
  source "BBB profile", exact so *likely* by the §113 rule), "Business
  Started" (→ `yearsInBusiness` when nothing else gave one) and "Business
  Management: Mr. X, Owner". When nobody else named anyone, the manager goes
  through `rankOwnerCandidates` as source `bbb_profile` (weight 38, the
  licence weight) and ships as `out.owner` graded *inferred* (C), sources
  `['bbb_profile']`, canBuy from the title's authority, with a note; no
  address lookup for it this round. A second `📏 SIZE LOOKUP` line prints
  what the profile said.
- **The score on the panel.** `findRunTally` counts `sizeSure / sizeLikely /
  sizeGuess / sizeUnknown` over kept reads; the Result line ends "Sizes: N
  measured (x%) - N sure, N likely; N a guess, N not measured." so the two
  proof runs are read off the screen. clientcheck executes it on a fixture
  (a ruled-out lead never counts).
- **Checks.** A new `RETIRED AND FREE SIZE CHECK` (276 boot checks): the
  retired window both ways including the firefighter and the son; the
  roster picking Jane Doe, Owner over John Doe, Founder (retired); the door;
  six untitled names → 6, testimonials → 0, headings and titles → 0; eight
  staff phrasings and four fleet phrasings read, eight non-headcount
  numbers silent; the BBB parser on a profile shape and on an ordinary page,
  the live GID Renovation URL shape recognised and a search page refused,
  the fetch proven to go through `fetchT` and never Firecrawl; needles on
  every call site.

### What the falsification runs found in the checks themselves

Seven reverts, each alone against the green baseline, each RED on
`RETIRED AND FREE SIZE CHECK`, restored byte for byte (CR count = line count
throughout): the roster mark off; the brain's refusal off; the door's refusal
off; the service-word guard off (a retired firefighter read as retired from
the business); the team page no longer counted; crews no longer read; the
BBB fetch off. Two first-cut reverts stayed GREEN and were fixed before the
push: a `!r.retired` filter in `rankRosterOwners` was redundant with the mark
(which already clears `isOwner`), so it was removed rather than kept as a
guard no fixture could reach; and the firefighter fixture kept the full name
in a different sentence from the word "retired", so it never reached the
service-word guard - the fixture now puts them in one sentence, plus a
positive twin ("a retired man who … sold the business") that must fire.

**276 boot checks green.** `bash ci-gates.sh` all stages. **Contract
20261001 on both sides — index.html changed, so Netlify needs the drag-in
(one drag covers §115's file too).** Render env: nothing new. Hands: the
verifier, Apify, DataForSEO. **The two proof runs**: 25 reads each; the
panel's Sizes and owner counts against the table above; grep `🎯 TARGET`
for "retired", `📏 SIZE LOOKUP` for "BBB profile" and the size term for
"people on their own team page"; the sheet's last rows are the hedge rows.
If either run misses a target, the next note says which and by how much.
