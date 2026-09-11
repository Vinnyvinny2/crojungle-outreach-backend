# Round 140 — the owner's own mailbox is asked for before ANY other person's, not only before a front desk

**Shipped 2026-09-11. Server only, no client change, contract unchanged.**

## Why: the run of 2026-09-11 named eight owners and produced one owner's mailbox

The ten-lead read after Round 139 shipped. Every lead that was read got a named owner — eight of
eight, which is the naming problem this round was originally scoped to fix and which turned out not
to be the problem at all:

```
NOAT Outdoor Living   Nick Veilleux     email: noat@              not Nick
JFK Window & Door     John F. Karle     email: megan@             not John
Ward Wood Products    Dale Ward         email: wardwoodcabinets@  held (R139 grade rule)
Arch Design           Russell Clabough  email: russell.clabough@  a guess, blocked
Wasatch Recovery      Mark Richards     email: ryan@              not Mark
Suburban Cabinet      Brent Hale        email: brent@             HIM
Higher Ground         Wes Priddy        email: none
Liberty Addiction     Roger Williams    email: info@              shared inbox
```

The batch card agreed: **1 confirmed · 0 more we can send to.**

**Naming and mailbox-finding are two different problems**, and the round that was going to buy more
names would not have moved this number at all.

## What was broken, shown by executing the real code

`findEmailFireproof` picks the published address in this order, and then decides whether to look
harder:

```js
const nameMatch = scraped.emails.find(e => localMatchesName(e.split('@')[0], nameParts));
const personal  = scraped.emails.find(e => mailboxKind(e, _mbCtx) === 'person');
let best = nameMatch || personal || _nonRecruit || scraped.emails[0];
let isGeneric = ['role', 'company'].includes(mailboxKind(best, _mbCtx));
...
if (isGeneric && name && verifierKey) {   // <- the owner-mailbox search
```

`best` prefers the owner's own address and then falls through to **any** personal one — a colleague.
And the search that builds the owner's mailbox and asks the mail server whether it exists, **the one
route in this file that produces an owner's address**, was gated on `isGeneric`.

A front desk opened that gate. A colleague did not. Executed on the run's own addresses:

```
address                              kind      owner's mailbox tried?
noat@noatoutdoorliving.com           person    NO
megan@jfkwindowanddoor.com           person    NO
ryan@wasatchrecovery.com             person    NO
info@libertyaddictionrecovery.com    role      YES
wardwoodcabinets@wardwood.com        company   YES
```

So on three leads **nothing was tried for the owner at all** — no probe, no Hunter ask, no guess —
and the colleague shipped as the lead's address with tier 1, score 100 and a label reading
"Published on their site", identical to what the owner's own would have carried.

The one lead that worked proves the machinery is sound:

> `⇄ EMAIL [suburbancabinetshop.com]: their site publishes only info@…, a shared inbox.
> brent@suburbancabinetshop.com is Brent Hale's own mailbox and SMTP confirms it exists, so the
> email reaches the person it argues with instead of whoever reads enquiries.`

**Round 136 wrote this rule with one half of it** — *"the owner's own mailbox is asked for before his
company's front desk"*. Nobody wrote "before ANYONE else's". One rule, one half live: the class this
file records most ([§121](round-121.md)→[§137](round-137.md), [§125](round-125.md)→[§138](round-138.md),
[§136](round-136.md), and [§139](round-139.md)'s own send gate).

## Vin's rulings, 2026-09-11

1. **Try the owner's first; if his mailbox cannot be confirmed, keep the colleague's, marked.** *"Keep
   Megan's, marked as not the owner."* It is a real address and the rep can still use it; nothing is
   lost against today, and the owner is gained whenever he is findable.
2. **Up to 3 tries per lead** — the limit the front-desk swap already used (`SHARED_INBOX_TRY_MAX`).

## What changed

**One condition.** `isGeneric` → `!_isOwnMailbox`, a strict superset: a role or company inbox can
never match the owner's name, so every lead that opened the gate before still opens it. It only adds
the colleague case.

**And the row now says whose desk it is.** A colleague's real mailbox read as identical to the owner's
own — same tier, same label, same score 100 — so a rep glancing at the row had nothing telling him
`megan@` is not John. It now carries *"a colleague's mailbox, not John F. Karle's"* and scores **80**,
below a shared inbox at 85: an owner-voiced email landing on a named colleague's desk reads as a
vendor pitch to forward, which is the same death as a front desk with a person's name on it.

**One phrase for what was published**, so the three outcomes cannot describe one lead three ways — a
per-lead line states what was measured about THIS business, and a colleague's mailbox must not be
reported as a shared inbox.

**Deliberately NOT done.** `noat@noatoutdoorliving.com` is the brand's own mailbox and
`mailboxKind` calls it a person. Widening the brand-token test would fix the label — and risks
misclassifying a real person whose name IS the brand, which is exactly Dale Ward at `wardwood.com`,
a lead that currently works. The gate change already gets Nick's mailbox tried, so the outcome is
fixed without the risk. Recorded rather than shipped.

## A bug found in this round's own work, before it shipped

Removing the `isGeneric` guard from the could-not-confirm log line made it print **after a successful
swap** — telling a lead whose owner mailbox had just been confirmed that it could not be confirmed.
That guard was doing two jobs at once and the second one silently. It is now
`if (!_isOwnMailbox)`, said plainly, with its own assertion and its own revert.

## Proven

```
node docs/gen-refs.js                 ✓
node build.js --check                 ✓ 88,136 lines, CRLF, byte for byte
GATES=static bash ci-gates.sh         ✓
node clientcheck.js                   ✓ exit 0
boot                                  ✓ GREEN — 303 checks, 1 expected decline, 0 failures
node falsify.js round-140-reverts.js  ✓ 4 of 4 RED on their own named line, tree restored byte for byte
bash ci-gates.sh (all stages)         ✓ ALL GREEN — fuzz: 2,073 emails, every invariant held
```

Executed on the live pairs, which is what the boot check runs too:

```
lead                  published   owner             is it his?  owner search runs?
JFK Window & Door     megan       John F. Karle     false       YES
Wasatch Recovery      ryan        Mark Richards     false       YES
NOAT Outdoor Living   noat        Nick Veilleux     false       YES
Suburban Cabinet      brent       Brent Hale        true        no - already his
(pattern) john.karle  john.karle  John F. Karle     true        no - already his
```

The last two matter as much as the first three: the lead that already worked is untouched, and a
mailbox we built for the owner is recognised as his, so a confirmed owner address is never re-searched
and never displaced by a guess.

`OWNER MAILBOX FIRST CHECK` extended rather than duplicated — one home for one rule. **No check was
deleted or disabled.**

**A falsification trap worth recording.** The first revert for `_isOwnMailbox = true` renamed the
variable, which reddened `SCOPE CHECK` (an undefined binding) as well as this round's guard. A revert
that trips a *different* check proves that check, not this one. Rewritten to a no-op that compiles,
so the red comes from the assertion it names.

## Needs your eyes

- **Nothing to drag.** `index.html` untouched; contract stays `20261016`. Server only.
- **Re-read these three leads and watch what comes back**: NOAT Outdoor Living, JFK Window & Door,
  Wasatch Recovery. Each should now carry Nick's, John's or Mark's own mailbox — **or a logged reason
  why not**. That is the success line and it cannot be proven here.
- **This spends mailbox checks that were not being spent.** Up to 3 per lead where a colleague's
  address is published; on the last run those three leads spent 0 between them. The run used 49 of
  100 free checks, so there is headroom, but watch the `FIND CONTACT` footer's check count.
- **Round 139's press-side rules have still never run.** The branch drop at the press, the $15M
  ceiling and the `FIND YIELD` row need a **Find press**, not a contact read. The two branch drops on
  the last run both happened at the read, after the site was paid for — the old behaviour.
- **Unknowable until live:** whether owner-addressed mail actually earns more replies than
  staff-addressed. The evidence says a non-owner reply is worth about a third as much, but that is
  other people's data on other people's campaigns.
- Carried: `hunterFindPersonEmail failed: timeout` on Arch Design was logged as *"their index has no
  address"* — a timeout reported as a fact about their record. `findSizeViaSearch` still crashes twice
  per run, swallowed. Higher Ground cost 8 credits, 6 mailbox checks and 116 seconds for a phone
  number and no email.
