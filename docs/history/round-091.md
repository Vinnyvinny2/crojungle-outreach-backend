# §91 — The first live contact run: four nav labels became the decision-maker — 2026-08-28
Source: CLAUDE.md lines 11850-11999, moved verbatim 2026-09-02 from commit b01d952e4f95d7b69686bc2c4063ca2aa0cb7546 (branch backup/claude-md-monolith). Nothing below this line was edited.

## 91. The first live contact run: four nav labels became the decision-maker — 2026-08-28

Vin ran the new Find-tab contact button for real and sent the whole Render log,
the screen and the file: *"the numbers are all wrong saying export this but 14
read etc... the stop button does not work... i download the csv is goes ot
donwload i try to open it and nothing happens."* And the standing order first:
*"i want you to diagnosis all of the issues first befoer building anythign so i
want you to analzye hard to make sure evryhtigns working proeply."*

The run itself worked and it was cheap — **$0.0021 to $0.0092 of model per lead
and zero Firecrawl credits on every plainly-readable site**, against a $62/month
estimate I had given him from arithmetic. That much is measured, from the run's
own meter lines. What the log carried underneath it was ten defects, and four of
them put a fabricated person in the one column a rep dials from.

### The four false owners

Every one of these is a live string from that run, and every one became the
DECISION-MAKER on a sheet:

| business | what we printed | what it actually is |
|---|---|---|
| Alliance Animal Health | Alliance Academy, "Partner Track" | a navigation label |
| American Heart Association | Donate Monthly, "CEO Roundtable" | a navigation label |
| West Coast Wound | Care Experience, "Our Founder Dr. David Kay" | a sentence about the founder |
| Penske Truck Leasing | "Art Vallely Named", President | a headline verb inside the name |

The Heart Association one did not stop at the sheet: the email engine took the
fabricated name and built **donate.monthly@heart.org**.

There were four separate causes and they compound, so fixing any one of them
alone would have left the column wrong.

- **An ownership word must be the HEAD of the title, not a modifier.**
  `OWNER_TITLE_RE` matched all of "Partner Track", "CEO Roundtable" and "Why
  Partner Our Support", and it was right to: the words are there. What separates
  them from a real title is grammatical rather than lexical — in "Founder & CEO"
  the ownership word is the head of the phrase, and in "Partner Track" it
  modifies the noun after it. `ownershipIsHead` looks at what FOLLOWS the match:
  end of string, punctuation or another title word is a title; a plain following
  word means the ownership word was an adjective. A list of banned phrases would
  have caught none of these four and would need a new entry for every site.
- **The cause of the second one is the INPUT, not the parser.** The audit path
  hands `parseTeamRoster` a leadership page; the Find tab's free read hands it a
  WHOLE PAGE — navigation, hero, footer. So a nav label sits exactly where a
  name sits and the marketing line under it sits exactly where a title sits.
  `looksLikeJobTitle` filters on shape only, no phrase list: a title is not a
  sentence, is not longer than six words, and is not a statistic ("250+ partner
  practices"). Removing everything is the honest answer on a page we cannot read
  this way — it is the same state as a page with no roster, and it sends the
  resolver on to the model.
- **The owner was picked by DOCUMENT ORDER.** `_owners[0]`, on a page listing
  fourteen people, is whoever the layout puts first. It is ranked by the same
  `authorityScore` the rest of the resolver uses now, with the SHORTER title as
  the tiebreak, because a real title is "Founder & CEO" and prose that happens to
  carry an ownership word is always longer.
- **A headline verb is not part of a name.** "Art Vallely Named President of
  Penske" is a headline, and the verb sits exactly where a surname would.
  `stripHeadlineVerb` is a declared list of the words a personnel headline uses,
  because there is no other way to tell.

`OWNER TRUTH CHECK` runs all four rules against those live strings AND against
twelve real ownership titles that must survive — "Founder & CEO", "Managing
Partner", "Owner/Operator", "Partner, Litigation" and the rest. A filter tuned
until it refuses everything stops resolving the owners this whole system exists
to find, which is the more expensive failure.

### A leadership page is not a headcount

Alliance Animal Health scored **75/100 — the highest in the run** — because its
team page lists fourteen people, and fourteen reads as "squarely the size we sell
to". The fourteen were a CFO, a COO, three Senior Vice Presidents and four Vice
Presidents, and the same page says "250+ partner practices". A two-person
wound-care practice in the same run scored 26. **The score was upside down.**

What a leadership page states is not how many people work there; it is how DEEP
the org chart is, and a business with three SVPs is not a business with three
SVPs and nobody else. Two or more corporate titles now score as the SCALE
evidence they are. One VP at a fifty-person contractor is ordinary, so the bar is
two, and the check asserts that direction too.

### Six national brands, read at full price

The Washington Post cost 2 Firecrawl credits and 109 seconds, Herc Rentals 3 and
101, Lodging Dynamics 4 and 155, plus Penske, Highmark Health and the American
Heart Association. `looksLikeEnterpriseByName` already exists, is already
falsified against seventeen real owner-operated names that must survive it, and
ran only inside `/api/discover`. Reading it here is free and happens before a
single byte moves — asserted at its CALL SITE and asserted to sit ABOVE the day
ceiling, because a refusal that happens after the money moved is not a refusal.

**HONEST SHAPE, and it is the important half: executed against those six live
names, that filter catches NONE of them.** It is an institution and scale-word
filter, and "Penske Truck Leasing" reads exactly like a local business by name.
It is worth having and it is not the fix. **Keeping enterprises out of this queue
is a Find-side job**, and the Find queue that produced these six is stale
job-board leads rather than Places leads — which is also why almost none of them
carried a phone number.

### The CSV downloaded and would not open

A 4KB file, and nothing happened on a double-click. The row terminator is CRLF
and two of the columns carry PROSE — the score explanation and the notes — which
can contain a newline. RFC 4180 permits one inside quotes; plenty of readers do
not, and the file then opens as nothing. A line break inside a spreadsheet cell
carries no information anyway, so it becomes a space. The check now parses the
WHOLE FILE and counts cells per row, which is what a spreadsheet actually does.

### Two numbers about one thing

"14 read" counted the leads ON SCREEN and "Download CSV (8)" counted the WHOLE
QUEUE, so two numbers about the same thing disagreed on one panel and the
operator could not tell which was wrong. One population now. The two can still
legitimately differ — a lead can be read and carry no owner, no address and no
number — so the panel SAYS so rather than leaving the gap to be guessed at.

### Stop had worked, and was waiting on six requests

`contactStop` is a flag the worker loop reads BETWEEN leads, and one lead in that
run took **155 seconds** (Lodging Dynamics). So Stop appeared not to work: it had
worked, and there was nothing to see for two and a half minutes. It aborts the
requests in flight now — and an abort is the operator, not a failure, so it is
neither recorded on the lead nor counted toward the dead-server tally.

### And how many to run is the operator's choice

A number box plus 5 / 25 / 50 chips. Fifty is the daily rate; five is what you
press when you want to see whether it works before spending on fifty.

### What the falsification runs found in the checks themselves

**Ten reverts, each applied ALONE against a green baseline and each red on its
own named assertion.** Two defects were in the checks rather than the code:

- **`OWNER TRUTH CHECK` failed a CORRECT build on its first boot**, on a needle
  carrying one closing paren too many. Section 81 records this exact trap in
  those words — counting parens in a guard is how a green build gets called red —
  and it came straight back. The needle stops before them now.
- **The enterprise refusal had no guard at all** until the falsification pass
  asked what would happen if it were removed. A fixture supplies its own
  arguments and therefore cannot see a caller, so the filter is asserted where it
  RUNS and in the ORDER it runs.

**267 boot checks green.**

**`index.html` changed, so this needs a Netlify deploy**, and the contract is
**20260913** on both sides.

---

