# Round 137 — the one route that needs no probe escapes the gate a probe-refusing host closes

**Shipped 2026-09-11. Server only, no client change, contract unchanged.**

## Why: Round 136 missed its target and this is the reason

Target was **5 of 10** leads ending with the decision-maker's own mailbox. Run `1307170f`,
2026-09-10 10:33 PM, ten leads, 45 Firecrawl credits: **1 of 10.**

Round 136 handed the Find read's Hunter key to the owner's address lookup. That half works — the
key reaches `_findEmailFireproofCore`, which destructures it correctly. **The block it unlocks
never runs.**

```js
const _mayProbe = (catchAll !== true) && !!verifierKey && !_stalls;   // src/all.js:36307
if (_mayProbe) {                                                       // :36308
  ...394 lines: pattern probes, company mailbox, AND the Hunter finder...
  return fail();
}                                                                      // :36703
```

`_stalls` is `mailProviderStalls(domain)` — true for Microsoft 365, which stalls address probes on
purpose to stop harvesting. **The Hunter email-finder does not probe anything.** It asks an index
for a named person's mailbox. It is the only route that survives a host that will not answer, and
it was locked inside the gate that host slams shut.

**Four of the ten leads were on Microsoft 365** — Ward & Ward, Jay Murray, Western Hills, Alpha
Foundations. Hunter was never asked on any of them.

### This is Round 121's defect with one term changed

Round 121's comment is still in the file and describes the identical shape for `catchAll`:

> *"that ONE gate wrapped the pattern probes, the nickname pass, the house pattern, the
> company-mailbox probe AND this block — whose own guard is already `catchAll !== true` and would
> have admitted null perfectly well. A guard written to handle UNKNOWN, sitting inside a block
> UNKNOWN can never enter."*

It fixed the `catchAll` term and left `_stalls` doing the same thing.

### And the guard it left behind had been silently disarmed

Round 121 left a positional check to stop exactly this recurring. It tested **indentation**, on the
rule its own comment states: *"the gated block's contents sit at six spaces, everything at function
level sits at four."* A later refactor moved the gate to **two** spaces — which makes its body
**four**. So four spaces stopped meaning "function level" and started meaning "inside the gate",
the needle kept matching, and the check stayed green through the entire life of the defect.

**A guard nobody can trip is worse than no guard, because it still reads as coverage.** Re-aimed,
not retired: it no longer looks at indentation at all. It asserts the finder is *called* from a
site no probe gate encloses — the property that actually matters and the one that broke.

## Second defect: the route could not be proven to have run

`hunterFindPersonEmail` logged a hit and a dead account. On "asked, and the index has nothing" it
logged **nothing**. So on Meyer Windows — the one non-M365 lead where the finder was reachable —
the log cannot settle whether it ran and found nothing or never ran at all.

**Never looked is not measured zero**, and this round's whole subject is a route nobody could prove
had run. Every lead now prints one line: asked and found, asked and empty, or not asked and why.

## What shipped

The finder is defined **once** as `_askHunterForTheirOwnMailbox` and called from **two** sites:
inside the probe branch where it already was, and on the fall-through path a stalling host takes —
placed after every free route (published address, learned pattern, catch-all, eponymous) and before
the tier-4 guess, so a credit is only spent when the alternative is nothing.

Defined once rather than moved or copied. Moving the block meant restructuring 400 lines to
relocate one call, which is how a regression gets earned; copying it is the two-hand-kept-copies
class this repo records most. Exactly one call can execute per lead — the probe branch returns
before the fall-through site is reached — and a boot check asserts the credit guard exists in only
one place.

Also: the finder no longer SMTP-confirms its answer on a stalling host. The point of this route is
that it needs no probe; without that guard, every domain it was just opened up for would burn the
30-second cap per address for nothing.

## What was proven

`ADDRESS ROUTE CHECK` (re-aimed) and `OWNER MAILBOX FIRST CHECK` (extended) — boot GREEN, 301
checks, 0 failures. Falsification: **5 of 5 red on their own named line**, tree restored byte for
byte. `bash ci-gates.sh` all stages green.

One of those checks went red while being written, for the right reason: the needle counting copies
of the credit guard matched **this file's own check source**, where the same text sits inside a
string literal. That is the self-matching needle `check-writing-traps` opens with, walked into
while writing a check about a disarmed check. The needle now carries its own newline and
indentation.

## What this round does NOT settle

It makes the route reachable. **It does not prove Hunter holds these people's addresses**, and
research done the same day says it probably holds fewer than hoped: Hunter's independently measured
coverage is **48–58%**, the lowest but one of the major finders, because it is pattern and
website-derived rather than indexed. Two rounds have now been built on it.

The next ten-lead run answers it for good, because every lead will say what the lookup did.

## Needs your eyes

- **Nothing to drag.** Server only; `index.html` is untouched and the contract is unchanged.
- Hunter's free plan is 50 email-finder credits a month, and this round spends more of them —
  roughly four more per ten-lead run, so about 8 runs a month.
- Carried from Round 136 and still true: `findSizeViaSearch failed: Cannot read properties of
  undefined (reading 'length')` fired twice on the 2026-09-10 run (Western Hills, Meyer), leaving
  both size bands a guess. A real crash, caught and swallowed. Not fixed here.
- Three of ten leads on that run were treatment centres or a national's branch, and the single
  Confirmed address belonged to a **nonprofit**. Worth asking whether the Find press is drifting
  off founder-led trades.
