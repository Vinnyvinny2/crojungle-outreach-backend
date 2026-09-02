# §104 — Seven leads, twelve reads, and four names that were not people — 2026-09-01
Source: CLAUDE.md lines 9949-10181, moved verbatim 2026-09-02 from commit b01d952e4f95d7b69686bc2c4063ca2aa0cb7546 (branch backup/claude-md-monolith). Nothing below this line was edited.

## 104. Seven leads, twelve reads, and four names that were not people — 2026-09-01

Vin ran the Find contact button for 7 and sent the screen, the CSV and the whole
Render log: *"i need this find and read section running flalwessy. determine all
fo the issues eveyr single one... keep in mind our gola is top quality leads that
are all in our ICP."* Three parallel traces read the owner resolver, the Find
route and the client. **Every finding was reproduced by EXECUTING the real
functions against the exact strings from that log**, not by reading them.

**Two of the three things he reported were already fixed and merely undeployed,
and that is the round's first lesson.**

- **He asked for 7 and 12 were read.** `CONTACT_POOL` is 6, and the pre-Round-102
  runner checked `kept >= want` BEFORE drawing, so the ceiling is
  `want + (pool - 1)` = 12. The log carries exactly 12 `FIND READ` lines. The
  reservation fix shipped in Round 102 and the page was never dragged into
  Netlify. The five extra reads bought Roof King (10 credits plus four Firecrawl
  scrapes), Pella (a map call plus the full paid wave), Four Peaks and Unlimited
  Windows — **about forty credits he never asked for.**
- **The CSV has no header-counting bug.** Every user-facing count is over an
  array of company objects; the header is added only inside `findContactCsv` at
  the `join`, and that array's `.length` is never read. The button said 8 because
  8 of the 12 leads genuinely produced contact data.

### And the reason nothing said so: the contract had not moved in three rounds

`CLIENT_CONTRACT` sat at 20260923 for R101, R102 and R103. The staleness warning
is `if (s <= CLIENT_CONTRACT) return`, so a browser on the Round 101 build
against a Round 103 server was **indistinguishable from an up-to-date one** — no
banner, no console line — and `contactReadBuild` is stamped with the same
constant, so no read that client took could ever show as stale either.

I set that number three times on the reasoning that the change was not
server/client INCOMPATIBLE. That was the wrong test. This number is the only
staleness signal there is, and the rule is now written where it lives: **a round
that changes index.html bumps it.**

## The row must not name someone who is not a person

- **A CTA button became the decision-maker, and it SETTLED stage 1.**
  Performance Windows Raleigh shipped `Schedule My Consult` / `OUR FOUNDER` to
  the sheet. `CTA_VERB_RE` was declared for exactly this in the round before and
  given ONE call site, inside `titleHeadIs` — which is only ever handed a TITLE.
  The name slot was on shape alone. Executed:
  `CTA_VERB_RE.test('Schedule My Consult')` was true the whole time and nothing
  on that path asked. One declared list, both slots now. **Disclosed cost:** the
  list contains `read`, which is a real surname, so a person whose FIRST name is
  Read is refused — the only real-name collision in it.
- **"Our Founder" is NOT a heading, and the boot check proved it.** I added a
  guard refusing a possessive determiner with the ownership word as the whole
  remainder. `OWNER TRUTH CHECK` went RED, and it was right: *"Our Owner, Carl"*
  is a real roster line off Ecoview's own page and *"John Smith / Our Founder"*
  is the ordinary shape of a one-person leadership block. Refusing the title
  deletes the owner in both. The failure was entirely in the NAME slot and the
  imperative rule closes it alone. Reverted, with the reasoning left at the site
  the next person will reach for.
- **A correct owner row was demoted by the company's own name.** The Roof
  Detective: *"Shane Kaylor, Owner of The Roof Detective"* — a correct row with a
  correct ownership title — had `isOwner` STRIPPED, because `nameTailOfTitle`
  read "Roof Detective" as a second human (it clears the name pattern, and
  `BUSINESS_TAIL` carries "roofing", not "detective"). The lead then printed *"no
  owner-level title found"* beside that very row, in one sentence. The question
  is asked at the shared tail gate, so both readers inherit it, and it is bounded
  to candidates of two or more words: a single token that matches the company
  name is the eponymous owner himself. **Disclosed cost:** a title whose trailing
  words are ALL words of an eponymous company — "Founder Luke Smith" at Luke
  Smith Plumbing — loses the name inside the title.
- **The eponymy clause was printed without the eponymy test.** `DM/bizname` said
  *"the business is named after them"* on every result and the function never
  called `isEponymousOwnerRule`. Executed, the rule is **false** for both live
  rows: Jerry Zapf is not Sure Thing Pest Control, and Cassidy Cook is not High
  Bridge Development.
- **The title beside the name was unvalidated model prose.** The CSV's "Their
  title" column read **"locally owned and operated owner"**. The NAME on that
  path has had an anti-fabrication gate since it was written; the TITLE had none.
  Four declared rules, each of which the live string breaks; a title that fails is
  dropped and the name is kept.
- **The model's own confidence was switching off the one defence.** The
  place-name check is a role word near the surname, and it was skipped entirely
  when the model returned `confidence: 'high'`. The corpus is the whole homepage,
  testimonials included, and both live evidence quotes were customer reviews.
- **A first name was hard-rejected.** `MONONYM_RE` reaches only `parseTeamRoster`
  and its two helpers, so `"Levi" is not a usable full name — REJECTED` fired on
  the same lead where a CTA button won the row. It ships marked now, which is the
  owner's standing decision.

## Stop buying answers we already hold or cannot get

- **The eponymous settle could never fire on the source that produces it.** §83
  shipped a diagnostic instead of a fix because the cause could not be resolved
  from source. **This run answered it**, on Lukes Asphalt Paving, in one line:
  `eponymousRule=true eponymous=false brainConfidence=none`. The settle demanded
  the candidate come from `own_website_brain` AND that the BRAIN return high
  confidence; a `findOwnerViaBusinessName` candidate carries `business_name` and
  sets no `brainHit`. So on the one source whose whole job is spotting an
  eponymous owner it was false by construction, and the lead bought the 8-credit
  wave plus a 12-credit negative web search for a name we were already holding.
  The evidence floor is unchanged — the name read off their own site at high
  confidence, and the business named after them. Both sources read the same
  homepage; `independentSourceCount` says so itself by collapsing them into one.
- **No city guard on the paid wave.** Every branch of `findOwnerViaLicense`
  interpolated a bare `${loc}`, which on Four Peaks Roofing shipped
  `"Four Peaks Roofing LLC"  contractor license ...` — the double space is the
  missing jurisdiction. A licence board is a STATE thing. The audit path has had
  this guard since §101; the SPEND path never got it. Per his decision the
  licence query is skipped and the domain-scoped search still runs, and the guard
  is also the fix for the malformed string: past that line `loc` is always a real
  "City ST", so the double space is impossible by construction rather than
  patched at ten interpolation sites.
- **The OWNER WAVE line guessed whether the wave fired.**
  `(out.spend.firecrawl || 0) > 2` — a threshold on TOTAL lead spend, whose own
  comment admitted it did not hold the fact. A site that refuses a plain fetch
  costs four Firecrawl page reads, so a lead whose roster settled the owner for
  FREE printed *"the paid wave was BOUGHT"* — in the one line whose entire job is
  measuring the free-settle rate, which is the number that sets the monthly
  Firecrawl plan. `stagesRun` has been computed inside `findDecisionMaker` since
  the ladder was written and was **never returned**.

## A lead with no Google listing gets the same read

Vin, pushing back on a question rather than answering it: *"well what are we
going to do when we dont run google place leads like i dont want it to cost
anymore moeny then when we do but i want the smae qualioty produced"*, and then
*"i have a bunch of leads in there that are not google places leads but guess
what i dont care i want them to cost the same to read while ahving the same
quality as places."*

Six of the twelve leads printed *"this lead carries no Google place id"*. Every
ICP judgement this system owns reads a Places field — the rating band, the trade
review floor, the capacity class, the affordability band — and so does the free
review-reply owner source, which is why **four of the five paid owner waves in
that run were bought on leads with no place id.**

**So it costs LESS, not more.** `resolvePlaceId` was already written, is already
metered as `place-id-recovery`, and its match bar is DOMAIN PROOF — the site
Google lists must be the site we hold, so it cannot resolve the wrong business.
One Places text search replaces a ~10-credit Firecrawl wave often enough to pay
for itself, and Google's free Enterprise allowance is 1,000 calls a month against
roughly 550 recoveries at this volume: **$0 marginal here, $0.035 each beyond
it.** Its field mask widened to the whole record — rating, phone, hours, address,
category — for nothing extra, because `userRatingCount` already put the call on
the Enterprise SKU.

**What it does NOT fix, said plainly.** The listing filter was added in §97
because the other lanes produced Coca-Cola Bottling, Penn Medicine, Lennar and
Securitas. Recovering a listing gives the ICP rules something to read on those
rows; whether that is enough to keep every enterprise out is **not proven**,
which is why the tick box survives as a control rather than being deleted. It
defaults OFF now and its escape hatch is gone, so it means what it says.

## The TheirStack lane's own evidence must travel, and must win

*"Im going to fill up the theirstack credits so that we have quality companies
with actually job listings for marketing which is a huge timing signal. So that's
the most important out of all the non Google places leads."*

A TheirStack lead is built with a **verified headcount** (free, in the same call),
`industry`, `signalAgeDays`, the marketing role TITLES, `jobPostingUrl` and
`jobPostedAt`. **`contactRequestBody` sent none of it.** So on the one lane he is
about to fund:

- The verified headcount was dropped, and it is the strongest ICP measurement
  this system can hold — everything else is a proxy, and a team page is a FLOOR
  (a forty-person firm that publishes four reads as a four-person shop). §14
  already established the rule in the other direction and the contact score never
  got it.
- The marketing posting was dropped, so `readFindIcpSignals` re-derived the
  answer from their careers page — and a role posted on Indeed or LinkedIn and
  not on their own site comes back **no**. Every row of that CSV said `no` in
  that column. A lane bought for its clock had its clock deleted at the door.
  A posting in our hand is evidence; an absence on their site is not evidence
  against it, so it SETS the signal and the careers read can only corroborate.
- The role, the posting date and its URL never reached the sheet, so the rep lost
  the strongest cold opening this pipeline can produce. `When that role was
  posted` is a lean CSV column now, and an undated posting says so rather than
  inventing recency.

## The log and the file say what is true

- **`FIND READ` printed intent LABELS**, so five distinct URLs came out as
  `home, team, team, contact, careers` and read as a duplicate purchase. They ARE
  different pages, and the real paths were already on `out.pagesRead` and simply
  not printed. §24 recorded this exact class: *"a label that hides what was
  bought reads exactly like the thing not having been bought."*
- **The ROSTER hint was three bare `.exec()` calls over the corpus**, and it
  decides which of two OPPOSITE sentences the line prints. Executed, three of the
  four live hits were false — *"and **partner** locally"*, *"a commercial
  building **owner** who needs a new roof"* (their CUSTOMER), *"**Owner**
  supervised worksite"* — and each blamed the parser for a page that names
  nobody. It goes through the same head rules the parser uses now, over short
  runs, so "Owner" alone on a line still fires it.
- **`FIND RUN TALLY` does not exist in any code.** `findRunTally` and
  `findTallyLine` are client-render-only, printed into a DOM caption. The literal
  appeared **five times in this file and nowhere else in the repo** — and I told
  him twice to grep the log for it. Corrected: the free-settle rate is greppable
  from `OWNER WAVE`, which is true of it for the first time this round.
- **Noon printed as "12am".** `open > 12 ? (open-12)+'pm' : open+'am'` has no
  case for 12, in the one column whose job is telling a rep when to dial. And the
  fix laundered `Number(null)` into midnight on its first draft — **caught by the
  assertion written for it on the next boot.**
- A blank *When to call* cell now carries its reason, and an address resolved
  while the mailbox checker was down says that is **our outage, not a fault of
  the address**.

## What the falsification runs found

**Twenty-five reverts, each applied ALONE against a baseline the harness
proves green first, each red on its own named assertion.** The first pass
was 21 of 25.

Two of those came back GREEN because nothing guarded them at all — the ROSTER
headline's demotion clause and the mononym on the business-name path — and one
went green because its needle pinned the MESSAGE rather than the CONDITION:
reverting `if (!loc)` to `if (false)` leaves the sentence standing. A fourth
reported **NO VERDICT**, which is not a pass: the revert anchor matched the
check's own needle as well as the production line.

And the boot caught two things in my own work before any revert ran: the
"Our Founder" guard above, and the null-laundered noon.

**HONEST SHAPE: none of this has run against a live press.** Every fix is
executed at boot, in `clientcheck`, or driven over the fake network. What a real
seven-lead press returns is settled by the next run, and the lines to read are
`Read 0 name/title pair(s)` (21 of 25 on 2026-09-01), the free-settle rate in
`OWNER WAVE` (honest for the first time), and `LISTING RECOVERED` on any lead
that arrived without a place id.

**`index.html` changed, so this needs a Netlify deploy**, and the contract is
**20260924** on both sides — a stale page sends none of the TheirStack evidence
and hides the other lanes by default, and it will now say so by number.

---

