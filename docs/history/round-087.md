# §87 — The repetition I built, and one document in two places — 2026-08-27
Source: CLAUDE.md lines 11514-11601, moved verbatim 2026-09-02 from commit b01d952e4f95d7b69686bc2c4063ca2aa0cb7546 (branch backup/claude-md-monolith). Nothing below this line was edited.

## 87. The repetition I built, and one document in two places — 2026-08-27

Vin, on the first live pair of the two-tier sheet: *"this is cleaalry
reprtitive and for the actualy audit screen its even mroe detial then before i
wnat it to macth the export sheet."* Both were mine, both from §86, and both
were structural rather than cosmetic.

### The index was reprinting the cards

The leaking column carried the three numbered leaks VERBATIM and the cards
printed the identical sentences ten centimetres below. I had deduped the *cost
line* and left the *sentence*, which is most of the row.

The column is now **what is NOT already on a card** — headed "Also leaking, the
biggest N are written out below". Nothing is lost and the owner's rule still
holds: a finding is either on a card or in this list, never buried and never in
both. On a lead where the three leaks are all there is, the column says so.

### Two leaks priced by one template said the same thing twice

`paid_traffic_leaks` and `ads_untracked` are both BURNING, so leak 1 and leak 2
carried a **word-for-word identical So-what** and the same product line. A
takeaway the reader has just read is not a takeaway. `trimRepeatedJobValue`
already trimmed a repeated first SENTENCE; it now also refuses an exact repeat
outright.

### And eight identical opening words

Both leaks opened *"Google's ad code is on their homepage, and…"*. The two
rungs are correctly separate — `RUNG_CLAIM_FAMILY`'s own rule is that a family
is for rungs that read one measurement **and say the same thing about it**, and
these say different things — but the shared preamble buries the difference and
the pair reads as padding.

`trimRepeatedLead` drops a leading clause the card directly above has already
stated. **Display only, and bounded**: never a whole sentence, only where what
remains is a substantial sentence in its own right, and never in an email —
the rung sentences themselves are untouched, because they ship without this
neighbour to lean on. Falsified in both directions, including the floor.

### One document in two places

Three sections differed between the sheet and the screen: **the sell** existed
only on the screen (the sheet had it as a line inside the story), the same
block was headed **"The call"** on one and **"The conversation"** on the other,
and the **score** sat in the sheet's header while the screen buried it in a
card halfway down — a card that also carried internal reference notes inside
the call tier.

All three closed by moving each to the same place on both, not by writing a
second copy: the sell is its own section after the leaks, the heading is "The
conversation" everywhere, the /10 renders with the contact details and its
internal notes render in the record.

`SHEET_ORDER` is ONE declared list of the nine sections, asserted against the
exported page and against the audit screen. A section added to one surface and
not the other now fails the build.

### What the falsification runs found

**Seventeen reverts, each red alone.** Two guards did not guard and three
reverts were stale:

- The So-what fixture used a ONE-sentence money line, which the head-trim that
  already existed also reduces to '' — so the revert changed nothing and the
  assertion proved nothing. A two-sentence line is the only shape that isolates
  the new rule.
- The screen's order check matched section labels as SUBSTRINGS, so renaming
  "The conversation" to "The conversationX" still satisfied it. Exact match now.
- Three reverts written against §86's code no longer applied after this round's
  edits. A revert that does not apply is NO VERDICT, not a pass, and each was
  rewritten against the live bytes.

And two defects of my own, caught by rendering rather than by reading: a stray
`_leakSeen.length = 0,` became a fourth ARGUMENT to `cat()`, so the body was
`0` and every leak card vanished; and both surfaces recorded a card's own
opening clause BEFORE rendering it, so every card trimmed itself against
itself.

**264 boot checks green**, every gate green, and 7 audits of a seven-finding
lead render in 15 pages.

**`index.html` changed, so this needs a Netlify deploy.** The contract is
**20260909** on both sides — a page still on 20260908 renders the repetitive
version and says so by number.

---

