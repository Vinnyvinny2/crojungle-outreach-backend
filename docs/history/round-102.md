# §102 — The owner was on the page and the parser could not read it — 2026-09-01
Source: CLAUDE.md lines 9629-9785, moved verbatim 2026-09-02 from commit b01d952e4f95d7b69686bc2c4063ca2aa0cb7546 (branch backup/claude-md-monolith). Nothing below this line was edited.

## 102. The owner was on the page and the parser could not read it — 2026-09-01

Vin asked for 25 contact reads, got 31, and read the file: *"im seeing a lot
with no decion maker thats a problme id say thats more important than capturing
the email."* He is right, and the cause is not the paid lookups. **Every finding
below was reproduced by EXECUTING the real functions against the exact strings
from his run.**

### First, the honest finding: that run was on a build two steps behind

Three strings on his screen cannot be produced by HEAD — `every column (27
instead of 9)` where the arrays hold 30 and 11, a tally with no `ready to work`
clause where index.html always emits one, and a CSV header reading `ICP score
out of 10` where it reads `out of 100`. And no `♻ DM` line appears anywhere in
the log, which server.js prints on every lead stage 1 fails to settle.

**So PR #92 was unmerged and the Netlify file was never dragged.** Round 101's
review-reply owner source — the free source that names an owner-run shop's
owner — did not run on a single one of the 19 leads that went on to buy the
paid search wave. Some of what he was looking at was already fixed and
undeployed, and this entry must not take credit for it.

### What his log measures (30 leads with an OWNER WAVE line)

| | |
|---|---|
| free settle producing a buyer | **8 of 30** — two of them garbage (below) |
| paid wave bought | **19 leads, 160 Firecrawl credits** |
| paid wave that produced **nobody at all** | **7 leads, 71 credits** |
| **paid credits that bought nothing usable** | **77 of 160 — 48%** |
| rows with no usable decision-maker | **13 of 30 — 43%** |

And the number that decided the round: **21 of the 25 sites we read returned
`Read 0 name/title pair(s)`.** The roster parser worked on four. On **ten** of
those 21 the log itself said *"An ownership word IS in the text, so the page is
here and the layout is what we cannot read"* — and seven of those ten then
bought the paid wave anyway: Ecoview 6, Bid-Rite 8, Red's 10, Andrew's 6,
Today's Dentistry 11, Premier 6, American Roofing 13 = **60 credits spent
re-finding an answer we had already read**, two of which still came back with
nobody.

### Six defects in the roster parser, each with a live example

The parser validates the name by SHAPE (`ROSTER_NAME_RE`) and the title by SHAPE
(`looksLikeJobTitle`). Neither side ever asked whether the thing in the name slot
is a person or whether the thing in the title slot contains one.

- **`parseTeamRoster` never called `looksLikeRealName`.** That one function holds
  `BUSINESS_TAIL`, `jobWord` and `junkWhole` — the three guards written for
  exactly this — and the roster was the ONE owner source that skipped it.
  Executed: `ROSTER_NAME_RE` MATCHES `"Iron Sharpens Iron"`, `"Trefoil
  Holdings"`, `"National Paving Solutions"` and `"Our Owner"`, while
  `looksLikeRealName` refuses `"Trefoil Holdings"` on `holdings` and `"Our
  Owner"` on `our`. **Live consequence: Cooper CPA Group shipped with
  decision-maker "Trefoil Holdings" at the TOP of the exported file, score 88.**
  A guard in the wrong function; one call site closes three live failures.
- **A title carrying a person's name.** Executed: `titleHeadIs("President & CEO
  Jon Schilling", OWNER_TITLE_RE)` returns **true** — the ownership word matches
  at index 0, what follows starts with `&`, so the "punctuation means head"
  branch returns true and the real person downstream of it is never examined. JR
  & Co shipped **"Iron Sharpens Iron" / "President & CEO Jon Schilling"**, and
  its two siblings the same way. Two outcomes now, and the split is the safety:
  if the name slot is not a person the person in the title IS the row and we
  recover it; if BOTH slots name somebody the row keeps its pairing and loses its
  ownership claim, because an owner we cannot identify beats the wrong one on a
  sheet somebody dials from.
- **Title-before-name was structurally unreachable.** The name is always the
  first comma-segment, the inline title is always what follows it, and the
  lookahead runs strictly forward. Scott Roofing's own page says **"CEO Brian
  Scott and president Mike Scott"** and the parser returned `[]`. Splitting on
  " and " first is what keeps the pairing honest: taken whole the trailing name
  is Mike, and the CEO is Brian.
- **The name-is-a-title guard was switched off by a comma.** It read `if
  (!p.inlineTitle && titleKind(runs[i]))` — conditioned that way because "Jenny
  McDowell, Owner" reads as a title end to end — so any run carrying an inline
  title never got asked. That is how **"Branch Manager"** became a person. The
  question is asked of the NAME SLOT now, which is both stricter and correct.
- **A first name ships, marked.** *Vin's decision.* Ecoview's page says **"Our
  Owner, Carl"**; we discarded it and paid 6 credits for the surname. It is
  emitted with `mononym: true`, counts as an owner for the caller, and never
  builds an email address — the held-back email rule already refuses an unvouched
  name.
- **A role noun is not a surname.** `FIND_ROLE_NOUN` moved up beside the parser
  so both readers ask one question. This is the expensive half: "Master Plumber"
  is name-SHAPED by every pattern in the file, and the falsification proved it —
  reverting that one test turns the correct row "David S Graham / Owner, Master
  Plumber" into **a person called Master Plumber**.

**Corroboration is unchanged** (*Vin's decision*): their own team page settles the
owner for free and the row says "stated on their own site".

### The counts — four separate causes, all verified

- **The overshoot.** The runner checked `kept >= want` **before** the draw with a
  pool of six workers, so at `kept === want - 1` all six passed the guard and
  drew. Ceiling was `want + 5`. **25 asked, 31 read — exactly this.** The slot is
  reserved before the work now.
- **A failed read consumed a slot** while the lead stayed in Not-read and the
  panel promised "the button above picks them up again". Only a lead we actually
  read consumes one of the N; the three-strike dead-server stop is what bounds
  the loop when every read is failing.
- **A chain drop was counted twice and exported never.** `contactFieldsFrom` sets
  both `contactReadOk: true` and `contactNotFit: true`, so the tally counted it as
  read while the tabs filed it as Ruled out — it was inside "31 read" AND inside
  "Ruled out 4" and in no file. One membership rule now, read by both.
- **The move bar ignored the scope checkbox.** It read `filtered`, one link above
  `_cShown`, so "Move all 92" offered to move the 32 leads the panel directly
  above says it is hiding — and those 32 are the non-Places lanes that panel
  warns about by name.

### Deliberately NOT in this round

- **Raising the free page budget.** Tempting, and the evidence refuses it: Today's
  Dentistry read ONE page and that page contains `"Dr. Ryan L. Olson, DDS"` in the
  parser's own hint text. The answer was already in the corpus. Fix the reader,
  not the budget.
- **Widening `looksLikeRealName` to accept mononyms globally** — it decides which
  mailbox an owner-addressed email is sent to. The first-name rule is scoped to
  the roster and to the caller.
- **The email half.** The verifier ran out of credits mid-run and **13 domains
  came back `Catch-all probe: COULD NOT RUN`** — ~42% of the run had no SMTP
  check at all, which is what "1 mailbox-confirmed, 6 a guess" is. That is a
  top-up at myemailverifier.com, not a build; §94's latch recovered on its own
  twice in the same log, exactly as designed.
- **Any paid revenue or headcount source**, and **no ranking or audit-copy
  change.** PART 6 holds.

### What the falsification runs found

**Ten reverts, each applied alone against a baseline the harness proves green
first, each red on its own named assertion.** Two things worth recording:

- **The rep-ready fixture had no `name` on its rows**, and the one membership rule
  it now shares (`contactTabOf`) refuses a row without one. Production rows always
  carry a name, so this was the fixture bending to an old private rule rather than
  to the shared one; both were corrected, and the ruled-out row's owner is now
  deliberately outside the run's own grade split.
- **The role-noun revert printed the invented person by name** — `{"name":"Master
  Plumber"}` beside a demoted David S Graham — which is the clearest evidence in
  this round that the must-survive half of a filter is the expensive half.

**273 boot checks green**, every gate: tdz, dupkeys and scopecheck on both files,
fetchtest, pngscale, clientcheck, batchcheck, auditfuzz over 5,000 vectors,
fuzzcore over 20,000 cases, servercheck's 86 assertions over a fake network, and
2,070 emails composed over HTTP.

**HONEST SHAPE: none of this has run against a live press.** The parser is driven
against the exact strings the 2026-09-01 run produced; what a real 25-lead press
returns is settled by the next run, and the number to read is `Read 0 name/title
pair(s)` — today it is 21 of 25.

**The contract does NOT move this round.** The parser fix is server-only and the
count fixes are client-only, so a new client works against an old server and the
other way round. `index.html` changed, so it still needs a Netlify deploy.

---

