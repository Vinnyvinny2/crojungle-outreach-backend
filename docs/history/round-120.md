# §120 — The email lane repeated the call list, the website cell was a sentence, and four terms is not a fit score — 2026-09-04

Written 2026-09-04 for docs/history (one file per round; CLAUDE.md carries no history). Not a moved section: verify-split.sh skips it.

## 120. The email lane repeated the call list, the website cell was a sentence, and four terms is not a fit score — 2026-09-04

Vin ran the Round 119 build (ten leads) and sent the panel, the export and the
whole log:

> *"need it to shwo total amount of email ones we have too, it just shows per
> run. also we need to also make sure theyre accurately email only ones. also
> dont need a descritpion on why theyre good or bad, jsut good fair bad. dont u
> think the why is not impoertnnt?"*

> *"and how are we looking overall out of 10 with the quality of leads and the
> find tab … i do not like thouhg that call volumne per run has dropped."*

### A. The email lane was repeating the call list

The panel read **Call list (4)** and **Email lane (4)** — and they were **the
same four businesses**. Round 112's rule was that a lead in both lanes is in
both lists, and on this press every call lead was an owner-run core lead, which
is in both by construction. A lane that repeats the lane beside it answers no
question.

The email lane is **email AND NOT call** now: the leads the rep will never dial,
which is the population the Research batch exists for. A call+email lead is
still emailed when the call does not connect — it reaches Research from the call
sheet, and its chip still reads `CALL + EMAIL`. It leaves the email BUCKET, not
the email lane.

### B. The total, on the same button

`Email lane (4 of 37)` when the panel is scoped to a press: what this one
produced, and what the queue holds. Counted over every read lead the filters
show and never over the scope, because the whole point of the number is to
answer a question the scope cannot.

### C. The website cell is a token, not a sentence

`poor`, not `poor (DIY build, no schema)`. He asked whether the why matters, and
the answer is that it matters **somewhere else**: this is one of nineteen columns
a rep scans, the **grade beside it already carries the detail as a number**
(Round 119), and the whole sentence is one tick box away in the `siteWhy` column
of the full file. It was a sentence pretending to be a token — the same defect
Round 117 fixed in the "who to go to" cell.

### D. The defect the log showed: four terms is not a fit score

Two leads on that press scored **75/100 on FOUR of ten signals**:

| lead | score | terms | what we actually had |
|---|---|---|---|
| American Dream Solar and Window | **75** | 4 of 10 | website returned nothing, no owner, no address |
| Delta Solar Power | **75** | 4 of 10 | resolved domain un-stamped, no owner, no address |
| Oklahoma Foundation Repair | 70 | 8 of 10 | named co-founder, published mailbox, phone |

Three maxed terms over a four-term denominator is a perfect score on a business
we know nothing about, and it outranked a complete lead. That is the exact
failure `FIND_ICP_MIN_TERMS` was created for: *"a ratio over one term is not a
fit score."* Three was the right floor when the table had seven terms and every
one measured on a readable site. With ten terms — two of which now leave the
score by design ([§119](round-119.md)) — a lead sitting at four has told us
nothing but its Google listing.

**The floor is six.** Below it there is no score at all and the lead sorts under
every scored one — not a low score, which would say we checked and it is a bad
fit.

### E. A sentence must not decide whether a term scores

Raising the floor turned a fixture's silence into a crash, and the crash was a
live defect. The `hiring` term built its sentence from
`s.hiringMarketingTitles.slice(...)` — an array the caller may not have set — and
`findIcpScore` catches whatever a term throws and records it as **NOT MEASURED**.
So a lead **hiring for a marketing role**, the loudest signal in the table and the
first thing Vin named when he redefined a good prospect, silently left the score
whenever the titles list was missing, and nothing anywhere said so. Both arms of
the term are defensive now, and a check asserts each scores without a titles
list.

### The answer to "how are we looking, and why has call volume dropped"

**Call volume, honestly.** 4 call leads from 9 read is 44%, against 19 of 26
(73%) on the Round 117 press. But three of those ten were **never callable, and
correctly so**:

- **1-800 Water Damage of Kansas City North** — DROPPED as a franchise territory
  (its own pages sell franchises). Cost 4 credits instead of ~12.
- **System Pavers** — 600+ employees on their own pages, over the $35M call cap,
  a branch network. Email lane by the ladder.
- **American Dream Solar and Window** and **Delta Solar Power** — their websites
  could not be read at all (one returned nothing, one resolved to a domain its
  own pages never confirmed). No pages means no roster, no brain, no owner.

So the real miss is **two leads with readable sites and nobody named**: A2Z
Construction and American Driveway of Charlotte, which between them bought 22
credits of paid searches and returned nothing. That is the free-settle rate, not
a regression.

**The money.** 43 credits over 10 leads = **4.3 a lead**, against the 7.8 of the
Round 117 press and the 6.6 target — the Round 118 cuts are holding. Zero
chamber searches. One lead, American Driveway, took **14** of the 43 on its own.

**Two things in the log that are costing money and are not code:**

- `⛔ REVIEW CORPUS` fired twice: **15 reviews on System Pavers and 9 on A2Z were
  bought from Apify and never shown to the model**, because `REVIEW_CORPUS_CHARS`
  (36,000) cannot hold `APIFY_MAX_REVIEWS` (90). The two must move together —
  `cost-model` has said so since round-054.
- The **BBB profile refused a plain fetch (HTTP 403) on four leads**, so the free
  size source Round 116 added is dark. Round 117's browser headers did not fix it.

### The falsification

Seven reverts, each fix alone against a green baseline, each RED on its own named
check, each restored byte-for-byte. Three boot fixtures pinned the OLD three-term
floor and were rewritten to pin the new one — including the live four-term shape
that caused the round.

### Still owed by hand

`index.html` at contract **20261005**. `REVIEW_CORPUS_CHARS` raised (or
`APIFY_MAX_REVIEWS` lowered) on Render. The email verifier is answering again but
still refuses per-domain probes; Apify is back.
