# Round 135 — the owner's mailbox is actually asked for

**Shipped 2026-09-11. Server + client, contract `20261015`.**

## Why: Round 133 fixed a door nobody walks through

Round 133 made the mailbox checker swappable and alive. The first live ten-lead run
after it, 2026-09-10:

```
VERIFIER DAY (UTC 2026-09-10): 0 mailbox check(s) spent of the 100 free ones
```

**Zero checks, zero owner mailboxes, identical to the run before it.** Five of the ten
leads sat in the exact shape the upgrade exists for — a named owner and only a shared
inbox — and every one was refused.

## The root cause, executed

The three lines that decided it (`src/all.js`, pre-round):

```js
const _learned     = domainPatternMemory.get(domain);
const _tryPatterns = _learned ? [_learned] : [];
const _catchAll    = _tryPatterns.length ? catchAllKnown(domain) : undefined;
if (_catchAll === false) { /* ask the checker */ }
```

Run on the real cases:

```
a domain we have never learned (every new lead)   patterns=0  catchAll=undefined  -> runs? NO
a domain whose pattern we already learned         patterns=1  catchAll=<probe>    -> runs? NO
```

Two locks in series. `_tryPatterns` is empty unless a convention was already learned
**for that exact domain**; because it is empty, `catchAllKnown` is never even consulted
and `undefined === false` is false. And a convention is only learned from a personal
address already found on that domain — one of the `rememberPattern` call sites sits
*inside the block that cannot run*.

**A closed loop. On a first-time domain the engine was unreachable, not merely rare.**
It could only fire on a business that already publishes a personal address, which is
exactly the business that does not need it.

## What this reverses, on the record

**Round 129 shut this deliberately and wrote two boot needles to keep it shut**
(`the shared-inbox upgrade guesses at four mailboxes again…`, `…buys the two-probe
catch-all verdict again for a lead that already has a published address`).

Round 129's arithmetic was 100 free checks a day with the verifier out of credits. At
Reoon's price the whole month is about five dollars, and Vin's standing ask since
2026-09-10 is decision-maker mailboxes at 50 sends a day. Put to him with the four costs
priced, he ruled **"probe + top 3 patterns"** (2026-09-11).

The two needles are **re-aimed, not retired**. What Round 129 was really protecting is
that the spend stays BOUNDED and DECLARED, and that is what they assert now: unbounded
blind guessing may never come back, and the probe must actually happen.

## What shipped

- **The gate probes instead of only reading the cache.** `isCatchAllDomain` is the one
  prober and already refuses honestly: a host that stalls probes by design — every
  Microsoft tenant — returns `null`, as does a spent day and a verifier that did not
  answer. `null` is not `false`, so none of those becomes a guess. **The Microsoft
  ceiling holds without a line being written for it.**
- **`SHARED_INBOX_TRY_MAX`**, default 3, settable as `VERIFIER_PATTERN_TRIES` on Render
  so the cost dials without a rebuild. The pattern names are taken from
  `buildCandidates`' own frequency order and never listed a second time.
- **The refusal sentence names the real reason.** It used to say "we do not know how
  this company builds its addresses" on every lead, which read as a fact about them and
  was a fact about a gate that could not open.
- **Confirmed names somebody.** On the same run the batch's ONLY Confirmed address was
  `lucas@paverrescuellc.com`, on a row whose own owner cell read "no owner named" — and
  the log shows the ladder had already discarded that person (`DM/bizname: Lucas
  confidence low — discarded`). Both halves now require a named owner before a personal
  mailbox counts as Confirmed. It keeps its grade, stays sendable, still exports.

## A correction made mid-build, on the record

The first attempt moved the **grade**: no owner named → `published_role`. Three guards
and a written 2026-09-02 ruling went red, and they were right. Grade A's own definition
— *"published on their own site, and it is a person, not a department"* — is a true
sentence about `lucas@`. The lie was the **chip**, which has meant "the owner's own
mailbox" since Round 133. The grade was put back untouched and the rule moved to
`emailStatusOf` / `emailVerifiedRow`, where the claim is actually made.

The round also briefly created a guard nothing could reach: naming an owner on all ten
personal fixtures left no fixture in the disagreeing shape, so the two-halves wire test
passed with the client rule reverted. Falsification caught it (`135-d` GREEN on the
first pass). Shape 8 — a personal mailbox with nobody named — now exercises it.

## Falsification (2026-09-11, 4 of 4 RED on their own line, tree restored byte for byte)

| revert | printed |
|---|---|
| the upgrade reads the cache instead of probing | `…reads the catch-all CACHE without ever probing, which on a domain we have never seen is always empty` |
| the guesses go unbounded again | `…guesses at every mailbox its builder knows again, unbounded, instead of the declared number` |
| Confirmed stops needing a name | `a personal mailbox on a lead where NOBODY was named still counts as Confirmed…` |
| the two halves disagree about Confirmed | `the page and the server disagree about whether…` |

## Verification

`node build.js --check` byte-exact → `GATES=static` → `node clientcheck.js` → boot
(**300 checks, 1 expected decline, 0 failures**) → `node falsify.js
docs/history/round-135-reverts.js` → `bash ci-gates.sh` all stages: **ALL GATES GREEN**.

## Carried, not done

**The roster admits a job title as a person's name.** Live on Above & Beyond:
`Read 1 name/title pair(s) — Design Consultant (Superintendent)`, from a page listing
`Design Consultant Don · Design Consultant William · Superintendent Janet`.
`looksLikeRealName('Design Consultant')` returns true — the same class as Round 132's
strapline. It cost nothing on this run (nobody on that page is owner-level) and the fix
touches the role vocabulary, which carries its own two-copies trap. It gets its own
round rather than a rushed edit on the end of this one.

## Needs your eyes

- **`index.html` must be dragged into Netlify** (contract `20261015`), or the Confirmed
  chip keeps counting the unattributed mailbox on your screen while the server has
  stopped.
- **The live proof, and it is one number:** a ten-lead read where `VERIFIER DAY` is not
  zero, and at least one row prints the `⇄ EMAIL` line replacing a published `info@`
  with the owner's own mailbox. Round 133 claimed that proof and never produced it; this
  round has not produced it either until that run happens.
- `VERIFIER_PATTERN_TRIES` is 3. One setting on Render moves it.
