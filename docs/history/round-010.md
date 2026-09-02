# §10 — The writer was judged on thirteen rules and told about three — FIXED 2026-08-19
Source: CLAUDE.md lines 539-607, moved verbatim 2026-09-02 from commit b01d952e4f95d7b69686bc2c4063ca2aa0cb7546 (branch backup/claude-md-monolith). Nothing below this line was edited.

## 10. The writer was judged on thirteen rules and told about three — FIXED 2026-08-19

On three of the four leads in the 2026-08-19 run the model's draft was refused,
the rewrite was refused too, and the flat composed template shipped. That
template is the output that gets called garbage every time it is seen, so this
was not a tidiness problem. It was the email-quality problem on those leads.

Every refusal named a rule that appeared in neither prompt:

| lead | first refusal | second refusal |
|---|---|---|
| Aire-Flo Heating | RANKING CAUSATION | OWNER SELF-LOOKUP CLAIM |
| Big Ben's Tree Service | a paragraph of 5 sentences | invented the figure "40" |

Two causes, both the recorded disease of two hand-kept copies of one rule:

- **The fact-checker refuses 27 phrasings in 13 families and the brief summarised
  three of them.** The eight families added since the summary was written —
  ranking causation, owner behaviour, owner self-lookup, customer behaviour, the
  unmeasurable "near me" query, the invented timeline, the invented comparison,
  the prospect claim — were enforced in silence. Both briefs are now GENERATED
  from `BACKEND_CLAIM_PATTERNS`, so adding a row adds a line to the brief. The
  banned SAMPLE sentences are deliberately not disclosed: the brief's positive
  examples have come back as copy word for word in live sends, which is what
  `exemplarLeak` exists for.
- **`rewriteEmailWithBrain` has taken `parts` as its first argument for its whole
  life and never read it.** The second attempt received the draft and one
  sentence. The permitted figures, the finding, the ask, the twelve-word opening
  tokens and the banned vocabulary were all sitting in that argument, unused —
  which is why a rewrite asked to fix a paragraph break wrote a plausible "40".
  Its one shape instruction was "50-90 words" against a gate that refuses under
  25 and over 150, so every rewrite was told to cut a correctly-sized email
  roughly in half, on the one path whose entire purpose is to rescue it.

Both prompts are now built by pure functions (`buildWriterBrief`,
`buildRewriteBrief`) that a boot check executes, rather than assembled inside the
API call where the only possible guard is a regex over the source. The compose
route builds ONE brief object that the writer and both rewrite paths read.
`WRITER RULE DISCLOSURE CHECK` fails the boot if any family the gate refuses is
missing from either prompt.

**And two more first sentences that nothing was reading.**

- **The insight line had no readability gate.** It is the first sentence of every
  composed email, and Aire-Flo's opened *"Phone-only intake without an automated
  response or after-hours capture layer"* — grade 14.3, audit prose written for a
  briefing. Eleven gates asked whether the ladder's sentences are true and
  `READABLE FINDING CHECK` asks whether an owner can read them; the line sitting
  ABOVE them in the same email was exempt from both the reading-grade ceiling and
  the shared fabrication table, carrying a private list of eight rules instead.
  It now runs both.
- **The cost-first skeleton opened on a pronoun with nothing behind it.**
  Variant B, live: *"Aaron, right now somebody looking for exactly this is picking
  from the names above you."* Exactly what, which names — both point at the
  finding, which was in the next paragraph. Every cost line in the ladder is
  written as the so-what that FOLLOWS the fact, and eight of the thirty break this
  way, including both SPENDING rungs and `outranked_by_weaker`. The fact goes
  first, as it already does in the other three skeletons.

**And a boot check that cried wolf on every deploy.** `FIRECRAWL GATE CHECK`
reported `gaps were [95, 350, 350, 350, 351, ...]` on a gate that was exactly
right: it timed each job's BODY, one microtask after the gate released it, and
boot starves the first microtask by a quarter of a second. An earlier pass had
added 20% of tolerance and written a comment explaining that the ruler was wrong;
tolerance is not a fix. The gate reports its own dispatch times now and the floor
is the exact setting.

---

