# §66 — Leak 1 became the deepest break, and the walk said "top three" off a null — 2026-08-25
Source: CLAUDE.md lines 5644-5745, moved verbatim 2026-09-02 from commit b01d952e4f95d7b69686bc2c4063ca2aa0cb7546 (branch backup/claude-md-monolith). Nothing below this line was edited.

## 66. Leak 1 became the deepest break, and the walk said "top three" off a null — 2026-08-25

Vin's decisions after the Conner's Kitchens read, in his words: leak ranking by
funnel depth, bottom first ("the bottom is where it actually makes money and
the bottom can cost the most revenue loss wise"); "yes always the biggest one
1 and second worse 2 and third worse 3. but if there arent big ones then fill
the 2 and 3"; and the 7.9/10 chips block left to us. Plus his line-by-line
critique: "a site cant be set up for facebook ads", "no clue wtf a free
searcher is lol", the leak-1 sentence "like what the fuck is this", the
truncated grey quote, and "the layout and fomratting of the audits is still
unorganized and a disaster."

### The numbering: depth first, always three, one loop

`leakRank` now sorts by funnel DEPTH — after-contact beats the door beats
getting-found — because money already in hand dying at the bottom nullifies
every dollar spent above it. Inside a stage, a complaint a customer WROTE
beats a finding we inferred, then harm. Copy observations top the count up to
three at the route merge and can never anchor at 1. Never numbered, as ever:
internal metrics, ambient conditions, the workmanship row.

**Two findings from the falsification runs, both structural.** The first
version split the rows into a "big leaks" pool (moneyRank ≤ 5) and a filler
pool — and the falsification proved the filler pool UNREACHABLE: every TAXED
rung is INTERNAL_ONLY, so every row that can be numbered at all is already a
money row, and "fill with the not-so-worse" is the same sorted list
continuing. One loop now; a mechanism no fixture can reach is exactly the kind
that rots. And the explicit workmanship exclusion was dead code the same way —
the workmanship row's stage is 'work', 'work' has no depth, and both guards
read the same flag, so they could never disagree. Deleted; the stage gate is
the guard.

### The walk claimed "in the top three" off a NULL rank

The Conner's contradiction — the story saying "they are in the top three"
while the chip said "search read on the fallback — no position possible this
run" — needed no Render log. `Number(null)` is 0, 0 is finite, and 0 <= 3, so
every fallback-source lead (rank nulled by the §52 trust wall) rendered the
strength sentence. The recorded null-laundering trap, in the one sentence Vin
asked to be crystal clear. `typeof m.rank === 'number' && m.rank >= 1` now; a
found-without-position lead says NOTHING about position, and the genuine
top-three case gained "That part works." — the crystal-clear strength called
out. The fallback caveat now travels WITH the stage it scopes: a quiet
Getting-found on a fallback read renders PARTLY MEASURED, never NO FAULT
FOUND.

### "X's ad code is on their site" — the fifth wording, one formula

Every ads-family sentence said "set up for X ads" or "has X tracking on it",
and the owner of this system could not parse either. All five rungs
(`paid_traffic_leaks`, `paying_for_a_search_they_lose`,
`social_spend_no_search`, `no_retargeting`, `ads_untracked`) and the walk's
money-out lines now share one concrete formula: "Google's ad code is on their
site" — a named company's code in a named place, checkable by view-source.
The bound is unchanged: code proves an account, never a live campaign.
"Conversion tracking" became "nothing counts what those clicks turn into...
the code that ties a paid click to a phone call or a booked job." The five
fix-first paragraphs (`bottleneckWhy`) got the same pass — "They capture
interest (a quote/contact form)" is a retired formula the boot now refuses by
needle.

### The rest of the critique list

- **The truncated quote** — "Waiting months for them to fi" — was
  `slice(0, 140)` cutting mid-word. `clipQuote` cuts at the last word
  boundary inside the budget and marks the cut with an ellipsis; one copy,
  all three mined-evidence call sites, executed at boot.
- **Review-quote copy rows are staged by their THEME** through the same
  classifier that ranks them — a callback complaint quote lands after
  contact, never at the door while "After they reach out" reads clean.
- **The chips block is one sentence** — "8.1/10 site build · the build is
  fine — the leaks are in the path around it" (`scoreSentence`, code-
  assembled, reads the score and the stage statuses). The graded components
  moved to the reference; every ads/booking/form fact the chips carried now
  renders AT its funnel stage as the walk's grey evidence line, which is the
  approved mock's shape: stage header → what was measured (grey) → what is
  broken (rows, numbered) → the money line.
- **Inside a stage the numbered leaks lead in rank order** — the first
  sample of this layout printed LEAK 3 above LEAK 2.
- **The synthesis got the register rules as instructions** (the mechanical
  gates already run): never coin a noun phrase ("free searcher" → "the
  people already searching Google"), the headline names real nouns (the live
  "Every door on the site leads to the same phone call" is now a negative
  example in the prompt), and leak 1 is named the PRIMARY ANCHOR per the
  goal doc — the read hangs off it, the smaller two prove the pattern.

### What the falsification runs found in the checks themselves

Sixteen falsifications this round — eleven server, five client — each red
alone, and two of them caught fixtures that measured nothing: the fill
fixture's "filler" rows were both LEAKING (money pool), so deleting the
filler loop left it green until the pools were collapsed; and the
workmanship revert stayed green because the stage gate already covered it,
which is what proved the clause dead. The client falsifications run through
clientcheck's own exit code — the recorded harness rule — and each fired on
its named assertion.

**229 boot checks green.** `index.html` changed, so this needs a Netlify
deploy.

---

