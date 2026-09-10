# §131 — a guess stops outranking the truth — 2026-09-10
Written 2026-09-10 for docs/history (one file per round; CLAUDE.md carries no history). Not a moved section: verify-split.sh skips it.

## 131. a guess stops outranking the truth — 2026-09-10

Round 130 fixed the money: the ten-lead read cost **39 Firecrawl credits against 58**.
With cost off the table, three read-only investigations executed the real code against
the same run and found what was left. Vin's own analysis of **484 dialled leads across
ten tabs** had already predicted the first one in his words: *"a wrong name INFLATES
the score... bad enrichment gets rewarded by the ranking rather than filtered by it."*
His callers had hit *"Jerry passed away 9 years ago"*, *"Wrong name, there is no
Robert"*, *"Masoud has no affiliation with Texas Floors."*

### The framing I got wrong first, on the record

I opened this round telling Vin that **a guess scores the same as the truth, 89/96/96**.
That table was measuring **grade C against grade A** — an eponymous owner against a
confirmed one — not a guess against a verified name. Grade D already scored lower
before this round: 74 against 83 and 90. I repeated the wrong framing several times
before an agent executing the real terms corrected it.

The defect underneath is real but narrower, and it is worth stating precisely because
the wrong version would have justified a much wider change than Vin ruled for:

- a name **the buying floor held back** scored 74 while the engine still built it a
  pattern address it could not send to, and
- the A-D grade was **computed, printed on the sheet and exported to CSV, and never
  handed to the number the rep sorts by** — this repo's most-recorded class,
  computed-but-not-passed.

The code already knew. A comment at what is now `src/all.js:34918` records the
eponymous path never getting the confidence bar the roster path got, names a real lead
that settled at score 25 through it, and calls it *"an accident of which rule was
tightened."* It was written down instead of fixed.

### Vin's rulings, 2026-09-10

1. **Grade D only.** D ("the buying-floor gate held this name back") scores lower and
   builds no address at all. **C ("the business is named after them") does not move**
   in score or address — it is a structural fact, not a model guess, and it is how most
   addresses in this ICP get built.
2. **Fix the false website sentences, leave the score wiring.** Stop printing claims a
   prospect could disprove; do not touch the lift bands or the Fit 70+ threshold.
3. Raise address yield **the free way**: the `mailto:` harvest.
4. The website grade is **internal only** — no number or verdict from it is ever said
   to an owner.
5. **The name stays on the sheet even at D.** `owner_confidence` carries the doubt.
6. Plumbing only. **No sends this round.**

### A — the grade reaches the score, and a held-back name builds no address

Executed on four leads identical but for the owner, before and after:

```
                     before   after
no owner at all        72       72
grade D (held back)    74       73
grade C (eponymous)    83       83
grade A (confirmed)    90       90
```

The reach term now reads the grade. A held-back name scores **2**, deliberately
between the **1** a read that produced neither a name nor an address scores and the
**4** this same lead scored while a pattern address was still being built for it. Two
was the only value in that gap that survives the eight-term ratio: 3 rounds to the same
FIT as 4 (73.55 against 74.19, both 74) and would have said nothing at all.

Three things deliberately did **not** move, and each is asserted in both directions:

- **A published or SMTP-confirmed address keeps its 8 points.** It is a measurement of
  their own site or their mail server and has nothing to do with a doubt about a name.
- **The founder term is not graded.** On a readable lead `founderPhrase` is `false`,
  never null, so the term already measures a held-back name at its floor. The only
  leads a "symmetry fix" could reach are ones whose pages we could not read — and
  scoring who runs the place off a page nobody looked at is an absence claimed off
  nothing (§106).
- **The eponymous, confirmed and no-owner lanes score exactly what they scored before
  the grade reached this route.**

On the address half, `_unvouchedSendGuard` no longer marks a constructed address for
a later check — it does not build one. Tier 1, tier 2 and an SMTP-confirmed tier 3
survive untouched, because each of those was measured rather than assumed. **The name
still goes on the row.**

**This reverses Round 129 deliberately.** Round 129 stopped *deleting* the address of
a held-back name and gave it one check at the send boundary (`verifyToSend`), on the
finding that the guard "blocks a population with no evidence against it." Vin has now
ruled the other way twice. Recorded here so the next round knows the Round 129
reasoning was **overridden, not forgotten**.

**An open hand that came out of it:** `verifyToSend` now has **no producer anywhere**.
`sendUnknownIsNotAYes` and its send-route wiring are live code nothing can reach — the
"a mechanism no fixture can reach" class. Part A deliberately did not delete it: that
is the send boundary, out of its lane, and it would break three more Round 129 reverts.
**It is a decision for the sending round.**

The `EPONYMOUS` settle line also stopped saying their own site confirmed the name when
the only corroboration was the business name itself, and stopped printing twice.

### B — no sentence ships that the owner could disprove by opening his own site

The guard that stops a JavaScript site being charged with faults it does not have
required **12,000 characters of markup**. Modern React and Vue builds ship 2-4KB.
Executed on the same site at two markup sizes:

```
24KB markup:  gap 4/25,  grade 9   — "jsOnly", correct
 2KB markup:  gap 12/25, grade 6   — "no enquiry form anywhere we read",
                                      "phone not tappable"
```

Both sentences are very likely false and are the two most checkable things on the
list — an owner disproves them on his phone in four seconds. The gate now reads
**readable characters of the home page**, not total markup: under 500 readable
characters is a shell, and a shell is not charged with what it does not show. On the
2KB fixture the gap falls **12 → 5** (`noSchema` only).

**My first suggested predicate for this did not work, and the agent proved it by
executing rather than arguing:** `rawReadableChars(allHtml)` measures 1,754 characters
on the live shape, so the gate stayed open. It must be `homeHtml`.

`datedBuild` fired on two **invisible** markers — a keywords meta tag and an old
jQuery — and printed "the build is years out of date" over a modern responsive site.
It now needs at least one marker a human can actually see. **My second instruction
here was also refused, correctly:** making that change in `readSiteAge` would have
broken a recorded §100 ruling and turned `SITE AGE CHECK` red. It went in at the Find
path's consumer instead.

A page carrying a known chat widget is no longer charged "no enquiry form" — the
signatures already existed and this path never asked them.

Ruling 3, the free yield: `mailto:` addresses are harvested from the free page read.
A `mailto:` on a host that is **not their own domain** is never taken as their address.
The plain fetch now records where it actually landed, so a redirect to another host
cannot launder a foreign address into the row.

**The honest limit, unchanged by this round:** the website grade is trustworthy at both
ends (10 = nothing found, 1 = a genuine fossil, unread = no grade) and the middle band
is not. A "6" is as likely to mean a modern React app as a broken site. By Vin's
ruling 4 it stays an internal sort signal with its weighting untouched, and **nothing
from it is ever said to an owner.**

### C — every export opens on the same 23 columns

The CSV was never drifting. Four layouts came from a sticky full/lean checkbox saved
per browser, **two different download buttons** with different names for the same
field, and a column set that changed between builds. The second button is retired.

`FIND_CSV_PREFIX` is now the unconditional leading 23 columns of every export, in fixed
order, whichever toggle is set — the toggle only appends detail after them:

```
batchId, exportedDate, company, owner, ownerTitle, ownerGrade, email, emailGrade,
phone, bestTime, size, cityState, trade, website, rating, reviews, payingForAds,
hiringMarketing, lastContact, convoHad, directPhoneObtained, directEmailObtained,
repNotes
```

`cityState` replaces a street address. **The rep's own five columns are exported empty
every run** — `Contacted Y/N` and `Convo Had? Y/N` are typed by hand by the rep, zero
hits in the code, and the system does not fill in his answers. Export state already
existed (Round 128 stamps `exported_at` / `exported_to`) and nothing read it; pressing
CSV twice on the same batch now returns zero already-exported rows the second time and
says which batch they went out in.

**Two things here are Vin's call and are NOT decided by this round:**
- the headings are snake_case keys (`company`, not "Company");
- the website grade no longer sits beside the website column, which **overrides his
  §119 ruling**.

### The score delta, measured rather than assumed

Success line 8 asked for the delta to be measured. **10,368 signal combinations were
re-scored before and after. 244 change. Every one of them is grade D, and not one
crosses the Fit 70 line upward.** Pulled from Render's `SITE [...]` lines, no Fit 70+
lead on the live ten moves: Dan Davis gap 0, Justin gap 11 untouched, Garlock-French
gap 1. `Multi-Pro Roof Solutions` (gap 8) is the live case of the false "the build is
years out of date" sentence this round removes.

### What cannot be proven here — Vin's call

- **Whether a name is actually the right person.** Nothing at build time can tell us
  Jerry died nine years ago. Only a dial can. What is proven is that a name we are less
  sure of no longer outranks one we are sure of.
- **Whether the volume that disappears deserved to.** The Fit 70+ count may move a
  little; whether that is the right list is a judgement about his rep's day.
- **Whether the website grade's middle band is useful at all.**
- **Whether the chip word "Unconfirmed" reads right**, and the chip order.
- **Nothing here proves a send.** One mailbox check of the free hundred was spent on
  the whole last run, so the send boundary has never met a real mail server. That is
  the round after, and the only thing that can validate any of this.

### Three older falsifications this round broke, and what was done about them

A broken revert is a guard that has quietly stopped being falsifiable, so each was
repaired rather than left:

- **`129-p3-c-guard-deletes-the-population-again` — retired.** This round reverses its
  premise on Vin's ruling; a revert asserting the opposite of the current rule can only
  ever be noise.
- **`129-p5-i-card-stats-stop-counting-sendable` — re-aimed** at the line the batch card
  actually reads now.
- **`130-e-j-contract-not-bumped` — re-anchored** from `20261010` to `20261011`.

**181 reverts across four rounds, every anchor unique**, verified by executing each
`old` against the original file:

```
round-128-reverts.js: 31 entries, 0 broken  (7 of them move or create a file
                                             rather than edit text, so they
                                             carry no anchor by design)
round-129-reverts.js: 64 entries, 0 broken
round-130-reverts.js: 40 entries, 0 broken
round-131-reverts.js: 46 entries, 0 broken
```

### One revert of this round's own that was red for the wrong reason

`131-a1-grade-test-widens-onto-the-eponymous-lane` went red on a line it did not name.
The cause is worth recording because it is the third time this shape has appeared
(`129-p1-n`, `130-b3`): **the consequence I predicted could not happen.** An eponymous
owner clears the buying floor, so `ownerCanBuy === true` returns three branches *above*
the grade test — widening that test can only ever reach the **no-owner** lane, where
grade `'none'` is truthy and not `'confirmed'`. The harm is real and worse than the one
I named: a lead we found nobody on gets demoted like a name the floor held back, so
having looked stops being worth anything.

Renamed to `131-a1-grade-test-widens-onto-the-no-owner-lane` and aimed at the line that
actually fires. A **new** revert, `131-a1-eponymous-lane-docked-for-the-grade`, docks
the branch an eponymous lead with a pattern address really takes, so Vin's ruling that
grade C does not move is guarded by something that can go red.

### Verification

`node build.js --check` byte-exact → `GATES=static bash ci-gates.sh` → boot →
`node falsify.js docs/history/round-131-reverts.js` → `bash ci-gates.sh` all stages.

`BOOT VERDICT: GREEN — 297 checks passed` (294 at the end of Round 130). `clientcheck`
GREEN, `build --check` byte-exact, `GATES=static` green.
`CONTRACT_VERSION` and `CLIENT_CONTRACT` both **20261011**.

**The 46 falsifications ran in an isolated copy of the tree at this commit**, never in
the working tree — a deliberately-broken guard was committed to the branch once in
Round 129 because a falsification run was mid-revert when the commit was taken, and the
standing rule since is that falsify never runs where the commit is made.

### Needs your eyes

- **No SQL this round.** Nothing was added to the schema.
- **The merge**, then **drag `index.html` into Netlify** — the client half of Part C is
  dark until you do, and the server half is already live the moment `main` merges,
  which is the shape that makes a bug look intermittent.
- **Run a ten-lead read.** The live proof is a `FIND CONTACT` line showing a grade-D
  lead carrying a name and no address, and a CSV whose first 23 columns are identical
  to the previous run's.
- **Two decisions named in Part C**: snake_case headings, and the website grade moving
  away from the website column (which overrides §119).
- **Whether "Unconfirmed" is the right word on the chip**, and the chip order.
