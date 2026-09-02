# §71 — Two sheets read word by word, and the reviews correction Vin made to his own correction — 2026-08-25
Source: CLAUDE.md lines 6238-6389, moved verbatim 2026-09-02 from commit b01d952e4f95d7b69686bc2c4063ca2aa0cb7546 (branch backup/claude-md-monolith). Nothing below this line was edited.

## 71. Two sheets read word by word, and the reviews correction Vin made to his own correction — 2026-08-25

Vin ran David Alan Wolf (personal injury attorney) and First Coast Plastic
Surgery, sent both sheets and the whole log, and ordered the deepest read yet:
*"read every single word in the audit... make sure the core story is right and
the findings and the leaks are right... work harder than you ever had before."*
Eight parallel recon agents mapped the code behind each symptom before any
edit — one of them ran 252 combinations through the REAL numbering pipeline —
and every fix below was falsified individually.

### Two LEAK 1 badges on one sheet — and the cause was in the DATA

Wolf's sheet carried LEAK 1 at Getting found (the Baggett row) AND LEAK 1 at
The door (the dated build). The recon's executed sweep proved today's code
cannot CREATE that state — the client's legacy branch has been exclusive in
every shipped version, and the server's numbering yields unique 1..k on every
fresh run. The two 1s are STORED rows from two numbering eras sitting in one
Supabase array (the pre-depth money order gave rank 1 to the outranked row;
the depth order gave 1 to the door row), and every reader trusted stored ranks
blindly, forever. Plus one real live-code bug the sweep caught by execution:
the route top-up treats the COUNT of ranked rows as the MAX rank, so stored
{2,3} plus one copy row minted a duplicate 3.

The durable fix is normalization at the chokepoints, which makes the symptom
impossible regardless of data history: `normalizedLeakRows` is ONE client
helper (internal and ambient rows can never take a number, order is
stored-rank-then-position, duplicates become sequential, nothing past three
survives) read by the funnel badges, the board's leak-1 line and both
Worth-asking lists; the server top-up mints past the HIGHEST stored rank; and
duplicate ranks in a merged list are named in the log instead of passing in
silence.

### The FCPS follow-up leak the brain "completely missed" was a tag short-circuit

FCPS's top mined theme — *"poor surgical outcomes not addressed or revised
adequately"*, second pattern *"doctor hard to reach after complications"* —
was tagged workmanship by the miner, and the tag returned BEFORE the contact
vocabulary ran. So the complaint Vin ranked above the copy findings was filed
as context, the after-contact stage read NO FAULT FOUND, and the email led on
the same complaint the audit had buried. Two roots: the contact vocabulary is
tested FIRST now (contact wins on a mixed theme even against a workmanship
tag — the tag decides only strings the vocabulary cannot see), and the
vocabulary itself learned the live misses: "hard to reach" (with a
place-not-person guard so "hard to reach areas" stays workmanship), "not
addressed", "never heard back", "unreachable", and communication phrasing.
The miner's own "contact" definition also now names a problem raised AFTER
the work that nobody responds to.

### Reviews and rank: the correction, then Vin's correction to the correction

The Baggett sentence — two review counts beside a position — was read by the
owner of this system as *"they are above him because of reviews."* The first
fix made the sheet say reviews are NOT deciding. Then Vin, same day: *"i may
have been a little hard on the reviews piece... having more reviews and better
rating is def important but its def a sign if someone ranks higher than you
with less reviews... it means theyre doing the other stuff better."* And a
second research drop settled the split: the ORGANIC map weighs relevance,
distance and prominence — the listing's PRIMARY CATEGORY heaviest, proximity,
the site, engagement with the listing — while phone responsiveness ranks
Google's PAID local ads (LSA), a different surface.

So the outranked row now carries `rankNote`, code-assembled, with BOTH halves:
reviews do count and this business is ahead on them — which is the tell that
the other inputs are deciding — and, only when the lead's own mined theme is
contact-shaped, the join Vin asked for: their customers describe calls that
never come back, and Google's own guidance for its local ads ranks businesses
partly on how reliably they answer. Scoped to the ads surface by name, a
candidate for the call, never a crowned cause. The synthesis register rules
and the audit brief carry the same two-surface split, and "reputation" was
scoped to the public review record everywhere reviews were being called
reputation — the signalReads label "Reputation" and its own worked example
("the position is not being earned on reputation") were teaching the exact
conflation Vin flagged with *"we cant base their entire reputation off of
that can we??"*

### "No potential customer is looking at the code of their website"

He is right, and the dated-build rung was claiming customer-visible age off
markers a customer cannot see. Every SITE_AGE_MARKER now declares
`visible` — tables, pre-CSS tags, Flash, fixed width, no viewport, plain
http and a stale copyright are things a visitor meets; the keywords tag, an
old code library, an XHTML doctype and a dead site builder are not — and
`dated_credibility` fires only with at least one visible marker, because "a
customer takes the fresher site as the safer company" is a claim about what a
customer sees. An invisible-only old build keeps the facts strip and the
website score (it is still measurably old) and loses the credibility claim;
the FOUNDATION prescription says which kind it is holding. Visible markers
sort first, so the sentence names what a visitor actually meets. The
keywords-tag find itself Vin called "insanely great" — it stays, as the
internal evidence it is.

### "They show up, but not in the top three" — and Wolf's paid question

The walk's found stage now carries the digit — *"they show up at #7 of the 20
listed — under the top three"* — because a #4 and a #17 read identically
before, which is a measurement flattened back into an impression. And it
states WHICH ranking a position is: when the markup was readable, no ad code
of either kind, no tag container that could hide one, and no sponsored row of
theirs appeared, the walk says *"That position is the unpaid ranking"* — on
the under-three case and on FCPS's #2 alike, which answers "is that organic
or are they running ads to rank that high" on the sheet itself. Gated on a
standing position sentence, so it can never claim a position nobody measured;
a live sponsored row suppresses it. The fix-order join was taught the new
wording in the same edit — the recon caught that it would otherwise have
silently died for every rank>3 lead.

### The rest of the round, each at its root

- **The VE's no-price friction** claimed "anywhere" and bypassed the
  unread-pricing guard every rung carries — FCPS's constraint said "no price
  appears anywhere" while a pricing page sat unread in the sitemap. Scoped to
  pages we read, suppressed entirely on unreadPricing, and the arithmetic
  honestly loses the unproven obstacle.
- **recommendedPrice reached both sheets blank** because the model echoed the
  prompt's own "from $20k" floor and the money gate's licence list had never
  been told about it. $20k is licensed now, and a gate-emptied price field
  gets the catalog's own declared line as a stand-in — code-assembled, every
  figure run through the real gate at boot.
- **A Team's garage-doors lead got "no trade resolved"** twice over: the §15
  stem trap a third time ('garage door' inside a boundary cannot match the
  'Garage Doors' label every Places lead carries), and a site-down lead had
  nothing to match — while the server held Google's own listing category.
  The category is tried SEPARATELY and LAST, raw: "Garage door supplier"
  still refuses (no brief beats the wrong bucket), a clean category resolves.
- **The critique false-flagged our own arithmetic** — "and 4 others above
  them have fewer too" beside a measured 5-of-10 is 1 named + 4 others = 5,
  and the critique read 4 ≠ 5. It is told the split arithmetic with the
  lead's own numbers.
- **CANDIDATE HYGIENE implied a defect on a down site** — the warning now
  names the honest cause (no trusted homepage copy captured) and reserves the
  alarm for a lead whose copy WAS captured. Third recorded instance of the
  message-names-the-wrong-cause class this file carries.

### What the falsification and fixture work caught in itself

The visible-sort fixture initially asserted `markers[0].visible` — and
`tables` is declared first AND visible, so the assertion passed without the
sort. The fixture-that-measures-nothing trap, caught at design time; the
second and last slots are where the sort actually shows, and the fixture
asserts those now. And the round added three call-site needles (the price
stand-in, the critique arithmetic, the hygiene message) before falsifying,
because a check that does not assert its call site is half a check.

**Twenty-four falsifications — nineteen server, five client — each red alone.
232 boot checks green; clientcheck, batchcheck and the static gates green.**
The contract is 20260828 on both sides. **`index.html` changed, so this needs
a Netlify deploy** — the duplicate-badge fix, the rank note and the normalized
Worth-asking lists are dark until the file lands, and a stale page says so by
contract number.

---

