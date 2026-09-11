# Round 138 — an eponymous mailbox nobody could ask about stops shipping sendable

**Shipped 2026-09-11. Server only, no client change, contract unchanged.**

## Why: the premise was tested against a mail server for the first time, and it is false

The second eponymous placement opens with this argument, in its own words:

> *"It needs no verifier: if the company is named after the person, a first-name mailbox on their
> own domain is a **fact about the business, not a guess**."*

On 2026-09-11 Vin ran the previous run's blocked addresses through a catch-all-capable verifier.
The result that matters:

```
jay@jaymurraylaw.com          score 0    UNDELIVERABLE
jay.murray@jaymurraylaw.com   score 0    UNDELIVERABLE
jmurray@jaymurraylaw.com      score 0    UNDELIVERABLE
```

The firm is **Jay Murray Car Accident and Truck Accident Lawyers**. The owner is **Jay Murray**.
The business carries his name, which is the entire premise — and the mailbox does not exist.

It had shipped on the 2026-09-10 run as **tier 3, sendable**, with a Move-to-Research button beside
it on the rep's screen.

## Nothing downstream would have caught it

Their mail is on Microsoft 365, which stalls address probes by design, so the one check at the send
boundary answers UNKNOWN. And `sendUnknownIsNotAYes` lets a vouched person's unknown through on
purpose — the comment above it says so:

> *"The send boundary answers unknown with SEND, deliberately"*

Jay Murray cleared the authority gate (score 79, corroborated by his own site and his business
name), so he is vouched. **The mail would have gone out, and the hard bounce would have been charged
to the sending domain** — the one asset in this project that cannot be rebuilt in an afternoon.
Both of this project's previous bounces came from addresses it had itself labelled "pattern-built,
not confirmed".

## Round 125 learned this already, on the other branch

> *"the owner's eponymous mailbox is never asked about a second time, so a mail server that would
> not say once ships a guess the rep cannot send to (dean@davisfacialsurgery.com, 2026-09-08)"*

That fix is a second SMTP ask sitting above the guess, and it lives in the eponymous branch **inside**
the probe block. This placement is its twin, and it has no ask at all — it exists precisely for the
case where no ask is possible. **A fix applied to one branch and not its twin** is the same shape as
Round 121 (fixed `catchAll`, left `_stalls`) and Round 137 (which found that).

## What changed

The address still ships. The rep still sees it, and it is still the best guess at who to ask for on
the phone. It is no longer **sendable**, and the row says why in words — naming the live address
that falsified the rule.

The block is gated on `catchAll !== true`, so the "it cannot bounce" reasoning that legitimately
makes a catch-all address sendable never applied here: this domain **can** bounce and nothing ever
asked it anything.

## What it costs

One sendable address per run of this shape — on the 2026-09-10 run, exactly one: Jay Murray. That
address was never real, so the count it was inflating was never real either. Vin's rule, unchanged
since the beginning: *"I'd rather send nothing than tell them something's wrong when it isn't."*

## Proven

`OWNER MAILBOX FIRST CHECK` extended — boot GREEN, 301 checks, 0 failures. Falsification **2 of 2
red on their own named line**, tree restored byte for byte. All gate stages green.

One existing guard fired correctly while this was being written: `EPONYMOUS ARM CHECK` pins the
exact label text the research route reads to downgrade a cached tier-2 row, and the first rewrite
of that label dropped it. **Satisfied rather than loosened** — loosening a guard to fit an edit is
the failure mode, not the fix.

## Needs your eyes

- **Nothing to drag.** Server only, contract unchanged.
- The catch-all verifier that produced this evidence resolved **9 of 9** addresses across three
  Microsoft-365 and accept-all domains, where the current checker resolves none. It also found one
  real owner mailbox the system cannot currently reach: `jason@westernhillswindow.com`, score 99,
  deliverable, on an accept-all domain — while correctly rejecting two other patterns for the same
  person on the same domain. Wiring it in is a separate decision and needs its price.
- Carried: `findSizeViaSearch` crashes twice per run and is swallowed; the Find press is returning
  nonprofits and branch offices.
