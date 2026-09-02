# §97 — The contact list had no ICP filter on it, and the score rewarded the businesses we cannot sell to — 2026-08-31
Source: CLAUDE.md lines 8623-8837, moved verbatim 2026-09-02 from commit b01d952e4f95d7b69686bc2c4063ca2aa0cb7546 (branch backup/claude-md-monolith). Nothing below this line was edited.

## 97. The contact list had no ICP filter on it, and the score rewarded the businesses we cannot sell to — 2026-08-31

Mike's brief, via Vin: **"we just need to focus on getting good quality leads in
our ICP."** Vin's three complaints from the live five-lead run: he could not move
what he had just read into Research, the Find tab is *"way too much going on"*,
and *"the read 16 like i just ran 5 leads and im not sure where they are now im
not sure where 16 came from."*

Three recon passes read the code behind each. All three complaints were real and
every one had a root cause. The run's own log carried a fourth that nobody
reported, and it was the biggest.

### The contact route ran one content check, and it catches none of them

`/api/find-contact` had exactly one business-identity gate,
`looksLikeEnterpriseByName`. Executed against the six live businesses that
check's **own comment** names as the reason it was added — The Washington Post,
Herc Rentals, Lodging Dynamics, Penske Truck Leasing, Highmark Health and the
American Heart Association — it returns **false for all six**. A guard in the
wrong function, under a comment claiming a capability it does not have.

Meanwhile `GP_FRANCHISE`, `brandNameHit` and the four brand sets — the filters
that DO know what a national brand is — were declared with `const` **inside the
discovery handler**, so the route that builds the list somebody dials could
reach none of them. Four guards in the wrong function at once. They are at
module scope now, moved verbatim, and `nameIsOutOfIcp` is the one door: the
franchise list, all four brand sets and the institution pattern. `icpFiltered`
calls the same door, which matters because that is the ONLY place a **benched**
lead is re-filtered — a lead banked under last month's rules re-enters the
pipeline right there, and GP_FRANCHISE never ran on it.

### The evidence was in hand and free

Truly Nolen's own team page told us: **John Sanders is "Majority Franchise
Owner"**. `titleKind` reads that string, matches "Owner", returns owner — and
the word FRANCHISE sitting in the middle of it was read by nothing, anywhere.
Window Nation's own URL is `/locations/north-carolina/charlotte`. We fetched
both and read neither.

`readChainEvidence` reads two signals off pages we already hold, both
unambiguous by construction because Vin's ruling is that a chain is **dropped**
— so a false positive deletes a real lead, which is §14's guard-too-tight
failure and the expensive one:

- **ROLE** — a roster title naming the franchise relationship itself.
- **PLACE** — a locations URL scoped to a STATE and then a city. A two-branch
  independent publishes `/locations/downtown`, which cannot match; a
  three-branch single-state operator publishes `/locations/austin`.

Deliberately NOT signals: *corporate office*, *all locations*, *find a location
near you*. Each appears on independents with two branches. And the word cuts
both ways — *"locally owned, NOT a franchise"* is a selling point independents
print, so a negated mention can never fire. Twelve cases fixtured in both
directions, including a franchise lawyer.

**The drop happens before the expensive half.** The site read is already spent
and cannot be refunded; the paid owner wave and the address lookup behind it are
about ten Firecrawl credits and they can. Truly Nolen's own team page named it a
franchise on the FIRST page we read, and the run went on and bought the rest of
the lead anyway.

### The chain detector had no memory, and the memory already existed

`detectChainOutlets` needs three metros and three distinct names **inside one
run**, so a franchise that surfaces once per run is invisible to it forever.
That is how Ram Jack — the franchise §24 is an entire entry about — was still
third from the top of the live list. The bench is loaded before the search runs
and every row on it IS a lead, restored whole, carrying its own `marketsSeen`.
Passing it in costs nothing, needs **no new table and no SQL**, and only ever
adds evidence: the bar is unchanged and the filtering still applies to this
run's own results.

### Six lists answered "is this a person's mailbox" and disagreed

`JUNK_LOCAL` (17 words), `ROLE_LOCAL_S` (24), `GENERIC_LOCAL` (13),
`ROLE_INBOX` (30), `ROLE_RE_M` (45) and the client's own `GENERIC_MAILBOX_RE`.
**The word "recruiting" was in none of them** — which is how
`recruiting@windownation.com`, scraped off their CAREERS page, shipped as a
tier-1 *"Published on their site"* address, sendable, score 100, to cold-pitch
marketing services at. Same-domain addresses skipped every filter outright.

`mailboxKind` is the one vocabulary now, in two grades: **junk** (not a human at
all) and **role** (a real mailbox a department reads — still worth having, per
Vin's standing ruling that a front-desk address stays on the sheet marked, but
never the owner). And `person` is the honest name for the third answer: NOT
RECOGNISABLY a department mailbox. It has never meant we know a human reads it,
and jacksonville@ is a location mailbox this cannot tell.

**Tier 1 stopped being unconditional.** The tier is right — it really is
published on their site — and the LABEL was not. A careers-page address scores
70 and says a recruiter reads it; a role inbox 85; an off-domain address 90 and
says which domain it is on.

**And the careers-page intent finally travels.** `freePages` mapped to
`{ url, text }` **one line after** the owner path keeps `intent` — so the
extractor was handed a page fetched on purpose BECAUSE it is a careers page,
with no way to know. That is the same fix already made for the roster reader and
never applied to its sibling. The careers page is now read LAST rather than
skipped, because a small business whose only published address sits there is
still reachable.

The `"using personal off-domain email"` log line was unconditional and false
whenever the siteConfirmed fallback admitted the address — `service@hspools.com`
printed as "personal". Third recorded instance of a message naming the wrong
cause.

### A real owner was missed and a licence qualifier bought instead

Aqua Blue Pools' page reads *"Jerry Owner Kyle General Manager Jim Operations
Manager"*. `ROSTER_NAME_RE` structurally requires two capitalised tokens, so
Jerry was discarded before the title lookahead ran — and the run then spent about
fourteen Firecrawl credits on paid search and came back with a name off a licence
record. The log even said so: *"An ownership word IS in the text, so the page is
here and the layout is what we cannot read."*

The mononym pass is bounded four ways: only when the main pass found no owner,
the next run must be an unambiguous ownership title, the word must not be a
title or a declared section heading, and the row is marked `mononym` so nothing
downstream treats one first name as a settled identity — `foldFirstNameClusters`
is already the mechanism that corroborates it. **The check caught the missing
guard on its first boot**: "Careers" above an ownership word parsed as a person.
There is no dictionary in this process that can tell "Jerry" from "Careers", so
the headings are DECLARED, the way `STEM_COMPLETE_WORDS` and the chain stoplist
are.

And `findOwnerViaLicense` returned `title: parsed.title || 'Owner'` — the exact
`|| 'Owner'` default §41 removed from the merge, back again. Its query asks for
`"license holder" OR qualifier OR owner`, so the name is routinely the tradesman
a company EMPLOYS to hold its state licence. No title is invented now, and a
qualifier is labelled as one.

### The screen

- **Where the five you just ran went.** `contactAt` was stamped on every read and
  consumed by nothing. Every number on the panel counted the whole filtered
  queue, cumulatively, across every press this browser has ever made. One toggle
  now: **This run (5)** beside **The whole queue (16)**, and the stats, the tally
  and the CSV all read whichever is chosen.
- **From a contact read to Research, in one press.** The existing button acts on
  `filtered` top-50-by-score — never the leads just paid for. There is a tick box
  on every card now (the same shape the Research tab's batch runner already
  honours) and a **"Move the N you just read"** button. With nothing ticked the
  old behaviour is untouched.
- **A refused lead does not cost a slot.** The runner takes a POOL plus a number
  and keeps drawing until it has that many GOOD leads, so "read 5" returns five.
- **The duplicates go.** The queue size was rendered twice in identical words a
  few hundred lines apart; the "narrow the list" sentence was printed by two
  panels.

### A read knows how old it is

Contact results are stored whole and re-rendered and re-exported forever.
*"America's Home Place / Last Name / Principal's Contact Info"* — a form-field
label parsed as the decision-maker — was still on the sheet after the parser that
produced it had been fixed, because nothing recorded which build a read came
from. Stamped and FLAGGED, never auto-cleared: a silent re-read spends money the
operator did not ask to spend.

### What was deliberately NOT built

- **No new Supabase table and no SQL.** The bench already carried the cross-run
  memory the chain detector needed.
- **No paid size or revenue source.** Revenue stays unmeasured and the row says so.
- **No `independent` score term.** The plan called for one, and with chains
  dropped outright it could only ever score on the ABSENCE of chain evidence —
  which is precisely what this round's own rule forbids. §66: a mechanism no
  fixture can reach is the kind that rots. What was built instead is the one
  remaining real defect in `size`: its anti-scale carve-out knew only SVP/VP and
  C-suite words, so a 200-person regional operator staffing Regional Directors
  scored the full 35 as though it were a ten-person crew.
- **No audit, ladder or email-copy changes.** PART 6 holds.

### What the falsification runs found in the checks themselves

Twenty reverts, each applied ALONE against a baseline the harness refuses to
start without proving green first. **Two came back GREEN, and both were checks
that could not see what they named.**

- **The denial fixture could not reach the denial guard.** "We are not a
  franchise" trips none of the franchise-SELLING phrases, so the fixture was
  proving `CHAIN_SELF_RE`'s narrowness and nothing at all about
  `CHAIN_DENIAL_RE` — reverting that guard left the boot green. The only shape
  that reaches it is a page that uses the vocabulary and then denies it, and
  that case exists now. §66's rule aimed at a guard rather than at production
  code: a mechanism no fixture can reach is the kind that rots.
- **The tier-1 generic decision had no call-site assertion.** Every mailbox
  fixture exercises `mailboxKind`; `isGeneric` is the CALL SITE, and reverting
  it to the old thirteen-word list left all 23 of them green while a recruiting
  inbox went back to shipping at score 100. Tenth recorded instance of *a check
  that does not assert its call site is half a check* — and the one this round
  was written to close, committed by me inside the round.

Both re-armed reverts then went red on their own named assertions. Final:
**20/20 red alone.**

**273 boot checks green**, and every gate: tdz, dupkeys and scopecheck on both
files, fetchtest, pngscale, clientcheck, batchcheck, auditfuzz over 5,000
vectors, fuzzcore over 20,000 cases, and servercheck's **77** assertions over a
fake network — including a new scenario J that refuses a national franchise on
the contact route with **zero network calls** while an owner-operated pool
company beside it is still read in full.

**HONEST SHAPE: none of this has run against a live press.** The name gate, the
chain evidence, the mailbox vocabulary and the mononym pass are executed at boot
against the exact strings the live run produced, and scenario J drives the route
end to end over a fake network. What a real fifty-lead press returns is settled
by the next run's `📇 FIND CONTACT`, `📇 FIND RUN TALLY` and `🔗 CHAIN OUTLETS`
lines.

**`index.html` changed, so this needs a Netlify deploy**, and the contract is
**20260919** on both sides — without the new server the panel would render a
chain drop as an ordinary read.

---

