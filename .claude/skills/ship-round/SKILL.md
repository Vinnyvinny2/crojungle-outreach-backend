---
name: ship-round
description: "DO: Close a round the way this repo does: write docs/history/round-NNN.md in the house shape, add its INDEX.md line, bump CONTRACT_VERSION (server.js) and CLIENT_CONTRACT (index.html) together whenever index.html changed, shape the commit message and the PR, and hand over what needs hands (Netlify drag-in, Supabase SQL, Render env vars, credit top-ups). Use when a change is ready to merge or the user says ship, close the round, write the round note."
disable-model-invocation: true
argument-hint: [round number]
---
# Ship a round — the note, the contract number, the handover

**Goal:** After reading this, Claude can close a round without shipping half of it: the round note in docs/history, its INDEX line, the contract bump when index.html changed, the commit and PR shape, and a handover that names what needs hands.

New text (2026-09-02). The client-handshake paragraph is copied verbatim from CLAUDE.md (commit b01d952) lines 10648-10651. A round is not shipped when the code is pushed; it is shipped when the note exists, the numbers agree, and the operator knows what to drag, run and top up ([§37](../../../docs/history/round-037.md), [§104](../../../docs/history/round-104.md)).

## 1. Before the note: the gates and the falsification

`bash ci-gates.sh` all green (`gates` note) and every new guard falsified (`falsify` note). A push that turns CI red costs a cycle and trust.

## 2. The contract number (verbatim from CLAUDE.md PART 8)

**The client handshake.** `CONTRACT_VERSION` (server.js) and `CLIENT_CONTRACT`
(index.html) are one number in two files, asserted EQUAL by clientcheck. Bump
both when a change needs the new client live; a stale Netlify page then shows a
banner naming both numbers instead of silently reintroducing fixed bugs.

The ruling since [§104](../../../docs/history/round-104.md): **a round that changes `index.html` bumps it**, even when server and client are compatible, because the number is the ONLY staleness signal — three rounds shipped without a bump and a client two builds behind was indistinguishable from an up-to-date one. Format is a date-like integer (e.g. `20260925`), and `clientcheck.js` asserts the two are equal.

## 3. The round note

- File: `docs/history/round-NNN.md`, NNN = the next § number after the highest in `docs/history/INDEX.md` (105 at the split). Use `round-note-template.md` beside this note; the heading form is `## N. <title> — YYYY-MM-DD` and the header lines the archive uses are in the template.
- Voice: what Vin reported (his words, quoted), what was found — reproduced by execution, each defect in terms of what it did to a lead — what changed and why at the root, "what the falsification runs found in the checks themselves", the boot-check count, and the closing line stating whether `index.html` changed and therefore needs the Netlify drag-in (every round since [§25](../../../docs/history/round-025.md) ends on it).
- Add one line to `docs/history/INDEX.md` (§, date, title, stage, file). **Never paste round history back into CLAUDE.md.**
- Any new Supabase table or column: the SQL goes in the note AND in `deploy-and-accounts/schema.sql`, because `SCHEMA PROBE` points the operator there ([§42](../../../docs/history/round-042.md), [§49](../../../docs/history/round-049.md)).

## 4. Commit and PR

- Commit subject: `Round N: <one lowercase clause>, and <second clause>` (the house form; recent examples in `git log --oneline`). Body: what changed, what was falsified, whether index.html changed. Never a model name in a commit or PR.
- One PR per round, squash-merged to `main` — a push to the branch is NOT a deploy; the sweep that found two pushes never merged started by diffing `origin/main` against the tested tree ([§37](../../../docs/history/round-037.md)). CI (`gates.yml`) runs the whole gate list on the PR; branch protection makes it a blocker once PART 8 step 1b is done.

## 5. The handover (use `handover-checklist.md`)

Say plainly, in this order: whether Render redeploys (server.js changed?), whether Netlify needs the drag-in (index.html changed?), any SQL to run in Supabase, any env var to set on Render, any account to top up (Firecrawl, Apify, DataForSEO, the email verifier, Anthropic), and what the first live run should be grepped for to prove the round (`OWNER WAVE`, `FIND YIELD`, `LOCAL PACK`, …). A stale page will say so by contract number; say that too.
