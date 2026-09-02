# §63 — V2: one story, leaks with their evidence nested, nothing said twice — 2026-08-24
Source: CLAUDE.md lines 5379-5441, moved verbatim 2026-09-02 from commit b01d952e4f95d7b69686bc2c4063ca2aa0cb7546 (branch backup/claude-md-monolith). Nothing below this line was edited.

## 63. V2: one story, leaks with their evidence nested, nothing said twice — 2026-08-24

Vin, after the plain-language pass: *"do u think we have too much info...
we should really think of the strucdture of these audits."* The diagnosis he
signed off on via mock: it was never too much info — it was the same fact
said up to five times, and three sections (the leaks, the one-thing, the
going-on read) each written like the conclusion. And two constraints he
added while approving: *"all of our importnant audit signals for reveneu
leak [must be] cleanly and simply displayed"*, and the audits will branch
into *"cold calls emails and even linkeind messages"* — so the structure has
to be channel-neutral.

The research backed the shape before it was built: the one-page pre-call
brief (account context, a hypothesis on pain, discovery questions, one
outcome) is the proven format; pre-call planning lifts win rates ~34% while
most reps spend under five minutes, so the sheet must survive a 60-second
skim; prospects decide in the first 8-30 seconds and openers grounded in a
specific real observation beat scripts — which is what our leaks are; and
calls + email + social together lift results ~30%, which is the argument for
one canonical record feeding three renderings.

### The structure

strip → **THE STORY** (one flow: what it is, where the money leaks, the
sell) → **THE LEAKS** (top three, every supporting fact NESTED under its
leak) → **THE SMALLER LEAKS** (every remaining money-pillar finding, one
line each — none buried) → **THE CALL** (worth asking, likely pushback, the
email as sent) → **REFERENCE** (their own words, also-measured, internal
intelligence, could-not-check, Do-not-say last).

### The mechanism

`groupAuditFindings(problemList, oneThing)` is ONE module-scope function the
record and the screen both call, so the two can never group differently.
Every finding lands in exactly one place: nested under a top leak when it
shares that leak's money pillar; in The smaller leaks when it carries any
other pillar (the owner's rule: a revenue signal may never fall to the
reference tail); in the reference tail only with no pillar at all; internal
rows marked as ever. The buying-path friction nests under the intake-shaped
leak (UNCAUGHT/LEAKING) and falls back to the story when no such leak
exists, so it cannot be lost — the fixture lead in clientcheck exercises
exactly that fallback. Dedupe by normalised text runs across all sections,
because "appears exactly once" is the entire point.

The story is the three old prose blocks rendered as ONE flow — background,
headline, read, the one-thing diagnosis with its why and fix-first folded to
a dim line, then **"The sell:"** in bold — not a model rewrite, so the prose
still varies with the model; the structural win is that it reads top to
bottom as one argument instead of three.

`clientcheck` executes the grouping both ways (a same-pillar fact must nest,
a money-pillar finding must reach The smaller leaks, nothing may appear in
two sections) and re-renders both surfaces; the 30-marker export assertion
held throughout — it caught `t.why` being dropped from the merged story on
the first build. Falsified: gutting the nesting branch and deleting the
smaller-leaks branch each went red alone.

**`index.html` changed, so this needs a Netlify deploy.** server.js is
untouched this round — the grouping is a client concern because the server
already ships pillar and rank on every row.

---

