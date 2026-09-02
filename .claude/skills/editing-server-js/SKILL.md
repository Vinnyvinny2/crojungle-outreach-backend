---
name: editing-server-js
description: "RULE: The checklist for changing server.js or index.html without turning a boot check red or shipping half an edit: CRLF line endings, runtime-assembled needles, the declared tables a new rung must appear in, the CONTRACT_VERSION / CLIENT_CONTRACT bump, the 256MB heap cap, named Anthropic and Places calls, every returned field merged and persisted, no changelog prose in per-lead log lines, and the gates to run before pushing. Loads automatically when those files are being edited."
user-invocable: false
paths: ["server.js", "index.html", "*.js", "*.sh"]
---
# Editing server.js and index.html safely

**Goal:** After reading this, Claude can change server.js or index.html without turning a boot check red, breaking line endings, or shipping half an edit.

New text (2026-09-02). Short on purpose: it points at the rules rather than restating them. The reasons live in `bug-classes`, `check-writing-traps` and `what-not-to-do`; the record lives in `docs/history`. Every item below was a live failure at least once.

## Before touching anything

1. **Read the boot check that guards the area first.** Every mechanism in `server.js` has one, named in capitals (`grep -n 'CHECK:' server.js`), with a comment above it recording the live failure that created it. Read that comment; it usually names the trap you are about to walk into.
2. **Run the static gates once** so you know the baseline is green: `npm ci` (once per machine), then `GATES=static bash ci-gates.sh`. A red baseline proves nothing about your change ([§74](../../../docs/history/round-074.md), [§93](../../../docs/history/round-093.md)).
3. **Say which of the two files you are changing.** `server.js` deploys to Render the moment `main` merges; `index.html` deploys to Netlify only when somebody drags it in. A fix that touches both goes half-live, which reads as an intermittent bug.

## Line endings (the one that silently rewrites the whole file)

- `server.js` is **CRLF on all 78,972 lines**; `index.html` and every check script are **LF**. Never open `server.js` with a tool that normalises newlines (Python's default `open()`, most "pretty" editors). Write edits with `node` reading and writing the raw string, or `sed` on a single line.
- After ANY edit: `grep -c $'\r' server.js` must equal `wc -l < server.js`. If it does not, the file was flattened; restore from git ([§74](../../../docs/history/round-074.md), [§89](../../../docs/history/round-089.md)).
- The edit helper the round notes call `ed.py` lived outside this repo; its two rules are the ones that matter: **refuse a bare LF**, and **check every anchor against the ORIGINAL text and write once**, so a script that dies on edit two cannot leave edit one applied ([§77](../../../docs/history/round-077.md), [§93](../../../docs/history/round-093.md)).

## If you add or change a boot check

- Needles are assembled at runtime from two or more non-empty halves and searched in the comment-stripped copy; never a literal, never an empty half, never both halves on one line (see `check-writing-traps` §1).
- Read source through the memoised copies (`selfSource()`, `selfSourceNoCommentsLF()`) — a private `readFileSync` per check is what pushed the settled heap from 184MB to 211MB and crash-looped Render ([§46](../../../docs/history/round-046.md), [§68](../../../docs/history/round-068.md)). `BOOT HEAP CHECK` fails the build above 200MB.
- An async check holds the verdict open with `bootHold()` / `bootRelease()`; a wall-clock deadline measures the dyno, so measure STALL instead ([§48](../../../docs/history/round-048.md), [§55](../../../docs/history/round-055.md)).
- Prefer executing the real function with a fixture over reading source; then pin the call site too (`check-writing-traps` §2).
- The boot needs at least 150 printed checks (`BOOT_MIN_CHECKS`) and exactly one expected red (`MODEL DECLINED [selftest]`); a check that prints neither glyph is invisible to the verdict.

## If you add a ladder rung, a facts-strip key, a category or a model call

- **A rung** must have a row in every declared table or the boot refuses by name: `HARM_LADDER_LAYER`, `RUNG_PILLAR`, `RUNG_FUNNEL_STAGE`, `RUNG_CLAIM_FAMILY`, `OWNER_KNOWS`, `RUNG_CALL_OPENER`, a subject line under 30 characters, an ask, and a `PRODUCT_FAMILY` entry for a new layer ([§53](../../../docs/history/round-053.md), [§65](../../../docs/history/round-065.md), [§69](../../../docs/history/round-069.md), [§74](../../../docs/history/round-074.md)). Let the boot tell you which is missing; do not guess. Its sentences must pass `READABLE FINDING CHECK` (grade 12 ceiling), `PLAIN ENGLISH CHECK` and `EM DASH CHECK` — the gates refused their own author's wording more than once ([§69](../../../docs/history/round-069.md), [§77](../../../docs/history/round-077.md)).
- **A facts-strip key** declares a home in `FACTS_RENDER` (client / derived / internal) or the boot refuses ([§80](../../../docs/history/round-080.md)).
- **A searched category** declares its brief in `NICHE_BRIEF_EXPECT` and its tier, capacity class and job value, or `TRADE TABLE COVERAGE CHECK` refuses ([§50](../../../docs/history/round-050.md), [§94](../../../docs/history/round-094.md)).
- **A model call** goes through the labelled meter (a plain string name, unique) and states its thinking mode and budget (`ANTHROPIC LABEL CHECK`, `THINKING BUDGET CHECK`, [§28](../../../docs/history/round-028.md), [§54](../../../docs/history/round-054.md)); **a Places call** names itself (`PLACES LABEL CHECK`, [§84](../../../docs/history/round-084.md)); **an outbound call** goes through `fetchT` and, for Firecrawl, `fcCall` ([§76](../../../docs/history/round-076.md)).
- **A key** is declared in `KEY_SOURCES` with where it comes from ([§54](../../../docs/history/round-054.md)).

## If you return a new field from the server

- Merge it in `index.html`'s research merge AND persist it in `leadToRow` / `rowToLead`, or `clientcheck.js` fails by name — that check EXECUTES the merge and it has caught the missing wire in the same hour four times ([§18](../../../docs/history/round-018.md), [§56](../../../docs/history/round-056.md), [§77](../../../docs/history/round-077.md)). A field returned and read by nothing is the class this repo records most.
- A new Supabase column must exist before the client writes it: PostgREST refuses the WHOLE row on one unknown key ([§42](../../../docs/history/round-042.md)). The SQL goes in the round note and in `deploy-and-accounts/schema.sql`.
- If `index.html` changed in a way the server must match, bump `CONTRACT_VERSION` (server.js) and `CLIENT_CONTRACT` (index.html) together — and the ruling since [§104](../../../docs/history/round-104.md) is that **a round that changes index.html bumps it**, because the number is the only staleness signal there is.

## Log lines

- A per-lead log line states what was measured about THIS business, never the codebase's history; a boot check scans for changelog prose ([§85](../../../docs/history/round-085.md)).
- Name the true cause, read from the response, and say the consequence for the lead ([§85](../../../docs/history/round-085.md), `check-writing-traps` §6). A precaution recorded as a finding on every lead is a warning nobody reads ([§24](../../../docs/history/round-024.md)).
- Diagnostics written for a LEAD must not print during boot fixtures (`leadDiag`, [§51](../../../docs/history/round-051.md)).

## Before pushing

0. `node docs/gen-refs.js` — regenerates the four reference files the skills transcribe from the code (line map, niche tables, CSV columns, env vars); the static gates go red if you skip it.
1. `bash ci-gates.sh` — all stages. The boot stage needs the heap cap (`--max-old-space-size=256`) and a port; `ci-gates.sh` sets both. Green means `BOOT VERDICT: GREEN`, not "no errors scrolled past".
2. **Falsify the fix**: revert it alone against the green baseline and watch its guard go red (the `falsify` skill). A guard that stays green with its fix reverted is not a guard.
3. Never: skip, disable or quarantine a check to get green; set the dup-key baseline above 0; push an empty commit to kick CI; split `server.js` (`what-not-to-do`).
4. Write the round note (`ship-round` skill) and say plainly whether `index.html` changed and therefore needs the Netlify drag-in.
