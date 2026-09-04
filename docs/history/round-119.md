# §119 — The grading was off: a broken website lifts a lead, and the quiet ones stop being punished — 2026-09-04

Written 2026-09-04 for docs/history (one file per round; CLAUDE.md carries no history). Not a moved section: verify-split.sh skips it.

## 119. The grading was off: a broken website lifts a lead, and the quiet ones stop being punished — 2026-09-04

Vin ran the Round 118 build within the hour and sent the panel, the export and
the whole log:

> *"im not sure if the email leads are rolling over — i think def not, ive had
> mutiple runs theres only 18 in there??"*

> *"for the websote piece — like can we just get a grade on the website 1-10,
> lower being worse, in a column to the right of the websiste name."*

> *"also these icp ratings are pretty low — i mean are we just getting bad leads
> here or is our grading off or are our signals off? study eveyrthing
> metilckouslty, analzye hard."*

The answer to the third one is that **the grading was off, and Round 118 is what
made it off.**

### A. The website term lowered every lead in the run and lifted none

Measured with the real scorer on one real lead from the run (Rocky Mountain
Electric's shape: 19 on the team page, owner named, "family-owned", 180 reviews,
4.7 stars, premium fit, a pattern-built address), its website read four ways:

| the website | score |
|---|---|
| not read at all | **74** |
| **strong** (gap 0) | **65** |
| fair (gap 5) | 68 |
| weak (gap 13) | 72 |

**A clean website cost that lead nine points.** The arithmetic is the whole
story and it is not a tuning opinion: in a ratio over the terms measured, a term
can only lift a lead above its own average by scoring ABOVE that average. On a
lead averaging 74%, a term with a maximum of 25 can move the score about three
points either way, and it needs a gap of **20** just to break even. The worst
site in that entire 25-lead run was **13**. So the term lowered all 25 leads and
lifted none — the exact penalty Vin had ruled against the day before
([§118](round-118.md): *"No points, but no penalty"*).

Asked how hard a bad website should lift, Vin took none of the three options and
wrote the rule himself:

> *"bad website should def lift a lead — it should espiclaly lift it more if
> they're doing good for other singles like they're spending ads, have high
> revenue etc, because it becomes more of a bleeding thing if there sure
> successful."*

So the gap is **no longer a term**. It is `siteLift`, an offset applied AFTER
the ratio, beside `demotionPenalty` and `alreadyDialledIn` — and for the reason
already written at those: an offset does not touch the denominator, so a good
website costs a lead **nothing at all** rather than costing it the ratio. The
table is back to ten terms and 195 points.

| the website | lift |
|---|---|
| strong (gap 0–3) | **0** — it is out of the score entirely |
| fair (4–9) | +2 |
| weak (10–15) | +5 |
| poor (16+) | +8 |

**times the bleed**: +40% if their site carries ad code (they are *paying* to
send traffic to a site that cannot convert it or be read by AI search), +40% if
they carry 150+ reviews (real volume is landing on it). Both, and a poor site is
worth **+14**, the cap. That is Vin's sentence executed: the same hole leaks
more when more is flowing through it. Neither fact is scored twice as goodness —
they **price** the gap, which is a different job from the one `ads` and `demand`
already do in the table.

### B. The quiet ones stop being punished

The second half of the low scores, and Vin ruled it directly:

- a local business with **no jobs page** scored 4 of 20 on `hiring`;
- with **no chat, booking or call tracking** it scored 5 of 15 on `invests`.

That is a **26-point hole out of 220 on nearly every owner-run local business** —
the exact business this system exists to sell to. And three terms above,
`ads` pays **18 of 25** for the very same silence (*"nothing marketing-related on
their site at all — untouched, and the whole budget is still to play for"*). One
fact cannot be worth +18 and −16 in one denominator; the table's own rule is
that one fact must not sit in two terms of it.

Both absences now **leave the score**. Hiring for a marketing role still scores
the maximum — it is the first thing Vin named when he redefined a good prospect.

`findIcpScore` gained one branch to make that honest: a term may answer
`{ points: null, say }` — it leaves the denominator, because the ratio is the
only place a penalty can hide, but the row does not print *"not measured"* about
a careers page we actually read.

### What the same leads score now

| lead | before | now |
|---|---|---|
| Rocky Mountain Electric (19 on the team page, owner, 4.7, fair site) | 71 | **89** |
| B-Dry Systems (11 people, nobody named, weak site) | 72 | **78** |
| Windows Doors & More (entry, owner named, weak site) | 68 | **74** |
| Carolina Center (layered, strong site) | 42 | **47** |
| Greenberg Dental (515 staff, 70 offices, a branch) | 33 | **26** |
| the perfect prospect (money, owner, hiring marketing, poor site) | — | **100** |

The spread is 26 to 100, the good owner-run leads sit at 74–89, and the
wrong-shape ones sink. The top of the scale is reachable for the first time.

### C. Two dead accounts, worth 6 points a lead, and not a code problem

Worth stating because it is the other half of "are the leads bad":

- **Apify is answering 403**, so nobody's Google review replies are read on any
  lead, and the `founder` term is capped at 18 of 25 for the whole run.
- **The email verifier ran out of credits mid-run**, so almost every address is
  a pattern-built guess and `reach` scores 10 of 15 instead of 15.

The same lead with both alive scores **six points higher**. Neither is a defect
in this repo. `ownerAnswersReviews` is `true` or `null` and never `false`, so the
dead token does not produce a false absence — it just costs the points.

### D. The email lane WAS rolling over

The count was scoped to one press. The lane buttons, the export and the "move
the N in the email lane to Research" button all read `_scoped` — **this run**,
because the scope switch sat three bands lower on the panel in the Result
section and is sticky across browser sessions — while the cards rendered under
them read the **whole queue**. So the screen said 18 and showed hundreds, and the
move button only ever moved the newest press.

One population now, decided above everything that reads it, with the switch on
the same row as the numbers it re-points and a line under it saying so.

### E. The website grade, where Vin asked for it

`site.grade`, computed on the server so the log line, the CSV, the Google Sheet
and the card are one number: **10 is a build with nothing we sell missing from
it, 1 is the worst this read can measure.** 0→10, 5→8, 10→6, 13→5, 20→3, 25→1.
A site we could not read gets **no grade at all** — a 1 there would be the
absence claim this whole read exists to refuse. It sits in the column
immediately right of `website`, in both the lean file and the full one, and a
check pins that seat.

### F. Freeway Insurance: 13 credits for nobody

The most expensive lead of the run, and a branch by **both** of the branch
tell's own tests. Its listing points at `locations.freeway.com/tampa-fl-33603`.

- The segment match was **exact**, so `"tampa"` never matched the segment
  `"tampa-fl-33603"`. Matched on a hyphen boundary now, so it catches
  `tampa-fl-33603` and never `tampax`.
- The host was read as its **first** label, so `locations.freeway.com` read as
  host `"locations"` — and the "named after its own town" guard was comparing
  the town against the word *locations* on every branch host a brand publishes.
  It reads the label before the public suffix now.
- And a `locations.` / `stores.` / `offices.` subdomain is now a tell on its
  own: nobody puts their only website on `locations.<brand>.com`.

### The falsification

**Fifteen reverts, each fix alone against a green baseline, each RED on its own
named check, each restored byte-for-byte.** Two came back **GREEN** first time —
the hyphen-boundary match and the brand label were both unreachable, because the
new subdomain arm caught the Freeway fixtures before either could matter. A
fixture that cannot fail proves nothing about the rule it names, so two that
reach them were added (`pella.com/tampa-fl-33603` on a plain host;
`sales.tampabaydental.com/tampa-fl-33607`, which must NOT fire), and only then
did both go red. Same lesson as `jsFormGuard` the round before.

### Still owed by hand

`index.html` at contract **20261004** must be dragged into Netlify. **The Apify
token (403) and the email-verifier top-up are worth six points a lead** and
neither can be fixed from here.
