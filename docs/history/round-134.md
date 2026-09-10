# Round 134 — the batch list stops being one batch at a time

**Shipped 2026-09-10. Client only (`index.html`), contract `20261014`.**

## What Vin asked for

> *"i need us to add something into the front end so i need to be able to select
> multiple last batches and extract leads as csv and email only leads to pipeline
> so if im just running batches for calls they get exported but not imported to
> research for the email ones."*

He also raised a fear — that leads moved to Research early "may get lost".

## The fear was already covered, and checking that changed the round

Before building anything, his own claim was tested against the code rather than
taken on trust:

> *"this actually may not be a problem since i redid the research tab to show
> which leads have been audited and which haven't."*

He is right. `leadHasAudit` files every lead into one of four states
(`running` / `queued` / `audited` / `not_audited`), each carries its own count,
and audited sorts above not-audited. A lead moved early sits under "not audited
yet" with a number beside it.

So the "lost leads" half of the ask needed no code. **The round shrank to the
mechanism he actually lacked.** Worth recording: the earlier incident he was
remembering (2026-08-21, *"i added 5 to pipeline most certainly didnt hit run
research and some of the leads started running research"*) was closed by the
`RESEARCH_TRIGGERS` gate — nothing can spend without naming the human action
behind it.

## What was actually missing

Only the newest read batch had buttons. Every older batch collapsed to one line
with a CSV and a Review link and nothing else. There was no way to act on
several runs at once, which is what a week of call batches actually is.

## Vin's rulings, 2026-09-10

1. **Only rows never exported.** The file across five ticked batches keeps the
   existing withholding rule; the bar says how many were held back and the
   override re-admits them.
2. **A both-lane lead goes to both** — *"who cares if the rep may have already
   had a convo with owner etc, more touch points the better."* So no lane filter
   was built at all: the move keeps using `emailSendableOf`, the engine's own
   answer to "can we send to this".

Ruling 2 is why this round adds no new rule. The lane filter that was planned
would have been a second copy of a decision the code already makes.

## What shipped

- **Every finished batch has a tick box**, newest card included, plus a master
  tick in the bar that shows a half-ticked state when only some are selected.
- **A selection bar that holds its space.** With nothing ticked it reads "Tick
  batches to export or move several at once" at the same height, so the batch
  list does not jump down under the cursor when the first box is ticked.
- **`runLeads(ids)`** fetches the ticked runs in parallel through the SAME
  per-batch route and merges them.
- **`dedupeById`** — a re-read can put one business in two runs, and without it
  one file carries the row twice and the rep dials it twice.
- **`sendableIdsIn`** — extracted so the one-batch and many-batch move buttons
  share one rule. This was introduced as two copies and Round 129's guard caught
  it in the same hour; see below.
- Counts in the bar are summed from the run rows the list already holds, so the
  bar can never disagree with the cards above it.

**Ticking spends nothing.** No stamp, no credit, no request until a button.

## The guard that caught the round's own bug

The first version wrote the move filter twice — once in `moveSendableOfRun`, once
in the new many-batch handler. Round 129's needle
(`filter(l => l && queueStateOf(l) === 'read' && emailSendableOf(l))`) went red
immediately, because the rewrite no longer contained the text it pins.

That could have been "fixed" by restoring the string. It was fixed properly: the
filter became one named function both buttons call, which makes the original
needle match again untouched and now cover both paths. **Two hand-kept copies of
one rule is the class this repo records most, and it was about to ship again.**

## Falsification (2026-09-10, all three red on their own line)

| revert | printed |
|---|---|
| the merge stops deduping | `one CSV across several batches carries the same business twice - the merge kept 3 of 3 rows` |
| the many-batch CSV gets its own exporter | `the many-batch CSV does not go through the one exporter, so it loses the fixed column order and hands the rep rows that already went out` |
| the many-batch move gets its own filter | `the many-batch move does not use the one move rule, so it can move a lead already in Research or one we cannot send to` |

Baseline restored green after each. `docs/history/round-134-reverts.js`.

## Verification

`node build.js --check` byte-exact → `GATES=static` → `node clientcheck.js` →
`bash ci-gates.sh` all stages: **ALL GATES GREEN**, boot 300 checks, 0 failures.

## Design

The selection pattern was taken from a 21st.dev component at Vin's request
(`Data Table Row Selection`). Its code could not be used — it is TypeScript, JSX,
Tailwind, shadcn, Radix and TanStack Table, and this page is one file with no
build step and no Tailwind. Four things were taken as pattern: the bar holding
its height, the half-ticked master control, an explicit Clear, and the ticked row
changing colour rather than only its box. The destructive framing was not taken;
nothing here deletes.

## Needs your eyes

- **`index.html` must be dragged into Netlify.** The server half of contract
  `20261014` goes live on merge; the tick boxes do not exist until the file lands.
- Whether "Tick batches to export or move several at once" is the right wording.
- Whether ticking should survive a page reload. It does not today — deliberately,
  since a stale selection acting on a batch you forgot you ticked is worse than
  re-ticking.
