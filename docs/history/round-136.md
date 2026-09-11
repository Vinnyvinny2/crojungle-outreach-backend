# Round 136 — the owner's own mailbox is asked for before the front desk is accepted

**Shipped 2026-09-11. Server + client, contract `20261016`.**

## Why: "we need to always hit decision makers personal email"

Vin, 2026-09-11, after being shown that 3 of 10 leads on the 2026-09-10 run ended with
the decision-maker's own mailbox:

> *"we need to figure out how to always hit decision makers personal email — like lowkey
> we should never email shared inbox unless its a very small crew and the owner only
> checks his shared inbox."*

The measured baseline that prompted it, batch `9bc0dd09`, ten leads:

| | |
|---|---|
| The decision-maker's **own** mailbox | **3** — Mighty Dog `nparadiso@`, Outdoor Kitchen `griffin@`, Benton `jeff@` |
| A real **front desk** | 2 — Solartime `contactme@`, Fuicelli `contact@` |
| No address at all | 1 — EEC Windows |
| Nobody named, so no lane at all | 2 — All Engineered, EcoView |
| Correctly out of the email lane | 2 — Royal Outdoor (below the floor), Precision (entry tier) |

**Round 135 is live and it worked.** `jeff@thebentonlawfirm.com` carries
`address source none` — no page published it. The engine built it and the mail server
confirmed it. That is the first owner mailbox this system has ever manufactured honestly.

## The main finding: the one route built for this was never handed its key

`hunterFindPersonEmail` takes the name we have **confirmed** and asks Hunter for that
person's own mailbox. It is the only route that needs neither a published address nor an
SMTP answer, so it is the only one that survives a mail host that refuses to answer
probes at all. Its own credit guard describes the situation exactly:

> *"Only spend it when it is genuinely the deciding factor — we have a confirmed
> decision-maker, no address yet, and every free route has already failed."*

It is gated on `worthACredit = hunterKey && name && ...`. **The Find read has held that
key the whole time and hands it only to the marketing lookup.** So `worthACredit` could
never be true, and the paid personal-mailbox route had never run in this tab. Computed
and not passed — the first class in `bug-classes`.

**And a second half.** Even with the key handed over, the company-mailbox probe sat above
it and **returned** on the first front desk that answered. On 2026-09-10 that is exactly
what happened to Fuicelli & Lee: Keith Fuicelli was confirmed, `keith@` was refused by
his own mail server, `contact@` answered, and Hunter was never asked whether it held his
address.

Round 121 put the Hunter finder where it is on purpose, so it stays reachable on a domain
whose catch-all verdict came back UNKNOWN. **So no rung moved.** The front desk is now a
fallback held in hand: a personal mailbox found below wins, and if none is found the
front desk is still returned, saying what it is.

## Three more, each proven by executing the real function

**A front desk graded exactly like the owner's own desk.** `emailConfidenceGrade` returned
`smtp_confirmed` on its fourth line, before any owner or mailbox-kind logic. The probe
writes `companyMailbox: true` on its result and says in its own comment *"we do not claim
this is his personal box"* — and that field was **written in one place and read in none.**
Executed on the live shapes, all four came back identical:

```
Fuicelli: contact@ COMPANY MAILBOX probe   -> smtp_confirmed  letter A | chip: CONFIRMED
a plain info@ company mailbox              -> smtp_confirmed  letter A | chip: CONFIRMED
the owner own mailbox, SMTP-probed         -> smtp_confirmed  letter A | chip: CONFIRMED
same company mailbox, NOBODY named         -> smtp_confirmed  letter A | chip: CONFIRMED
```

There are three states there, not one: his own desk, his firm's front desk, and a shared
inbox nobody is named against.

**The grade was thrown away on the way to Research.** The server writes 21 contact fields;
the promotion carried 10, and the email grade was not among them. With no grade the page
falls back to the tier, and tier 1 + sendable reads **verified, grade A**. So a
`published_role` `info@` that read **"Shared inbox"** on the Find tab read **"Confirmed,
grade A"** in Research — the stage that writes the cold email. Not one row per run: every
promoted row.

**A one-word owner name switched the whole engine off.** `buildCandidates` returned nothing
for a name with fewer than two parts, and the engine gives up on an empty list:

```
Kenny         -> 0 candidates -> ENGINE CANNOT RUN
Jeff Benton   -> 8 candidates -> jeff.benton@, jeff@, jeffbenton@
```

EEC Windows names Kenny as "Owner & President" on its own team page, spent five Firecrawl
credits and **zero** mailbox checks, and shipped no address.

Also: the front-desk word list carried the "us" spellings and not the "me" ones, so
`contactme@solartimeusa.com` was classified as a human being. `contactus` was there;
`contactme`, `emailme`, `reachme` and `talktous` were not.

## Vin's rule, made testable

> *"never email a front desk lead unless its a very small crew … so we avoid the brutal ratio"*

He declined to set the number, so this is **my call and overridable**: a front desk ships
sendable only when the business is owner-run, the owner is named, and a team page or
directory puts the crew at **10 or fewer** (`FRONT_DESK_CREW_MAX`). Ten is where the
measured reply rate actually breaks (0–10 employees 0.72%, 11–50 0.49%), not a round
number. **A crew nobody measured is refused** — "we did not look" must never resolve to
the permissive side of a rule about what may be sent.

On the 2026-09-10 run: Solartime (3 on their team page) stays sendable; Fuicelli (31 per
LinkedIn) becomes phone-only. The address stays on the row either way — only permission
to send moves, and the row says why.

The reason this matters is not reply rate, which nobody has measured for shared inboxes.
It is that one email to `office@` read by five people needs one of them to press spam to
register a complaint, against a denominator of one send — and the damage lands on the
**sending domain**, so it is charged to every future lead rather than to this one.

## Cut on purpose: widening the Hunter domain search

The marketing lookup hard-filters `department=marketing&seniority=executive,senior`, so at
a family-owned trade business it returns zero every time — both unnamed leads printed
`0 marketing address(es) … none at director level or above`. Widening it names more people,
and that was nearly this round's headline.

**It would have made things worse.** A named non-owner sets the target to `marketing`,
which opens the email lane and makes the row exportable — and on promotion the recipient
resolves to **empty**, the send address is the **owner-side** one, and the writer brief
renders *"You are writing one cold email to **the owner**"* with no greeting. Those two
leads sit safely in "no name yet" today and are never exported. Opening the query without
wiring the recipient turns them into an owner-voiced email sent to a company mailbox.

A tripwire now guards it: if that filter is ever removed while the compose path still
resolves its recipient from the owner chain alone, `OWNER MAILBOX FIRST CHECK` goes red
and says why.

## What was proven, and how

`OWNER MAILBOX FIRST CHECK` — new, 301 checks at boot. It **executes** the grader on the
three live shapes, the candidate builder on a mononym, and the mailbox classifier on the
four spellings; and it **pins by position** the two things no fixture can see, because the
defect in both is which side of a call a value sits on.

`clientcheck` gained two fixtures — the SMTP-verified front desk, and a graded row the two
halves used to split on — plus a promotion round-trip that asserts **the word the rep sees
before promotion is the word after it**. Broken deliberately, it printed:

```
promoting a shared inbox to Research changes what the row claims about it -
"shared" on the Find tab becomes "verified" in the stage that writes the cold email
```

Falsification: **8 of 8 red on their own named line**, tree restored byte for byte.
`bash ci-gates.sh` all stages green; boot GREEN, 301 checks, 0 failures.

Two existing guards were **re-aimed, not retired**, and say so in place: the batch-card
counter needle (four counters became five) and the chip-order needle.

## What this round does NOT do

**It does not move the number on its own.** The change that would have — widening the
Hunter domain search — is cut as unsafe. Whether the count goes from 3 to 5 depends
entirely on whether Hunter actually holds Keith Fuicelli's and Martyna Kowalczyk's
addresses, and that cannot be known until the credit is spent. **If it holds neither, this
round misses its target and that is what gets reported.**

EEC Windows is not reachable at all this round: its mail is on Microsoft 365, which stalls
every probe by design, its site publishes no address, and Hunter's finder needs two name
parts. Three blockers stacked; the one-word fix closes a real gap but buys a different lead.

## Needs your eyes

- **`index.html` has still not been dragged into Netlify.** Rounds 134, 135 and now 136 are
  all dark on your screen until you do — they land together, contract `20261016`.
- **Hunter's free plan is 50 email-finder credits a month.** This round starts spending them
  — roughly one per lead that has a confirmed name and no personal address. At four such
  leads per ten-lead run that is about twelve runs a month before the ceiling.
- **The crew-size line of 10 is mine, not yours.** `FRONT_DESK_CREW_MAX` moves it without a
  deploy if it reads wrong.
- Still to price, as you asked: the OpenCorporates filed-officer lookup, with a real number
  and how many of your leads it would name.
- Carried: the roster admits `Design Consultant` as a person's name; the 66-vs-36 credit
  jump on the 6:47 run is unsettled; `contactMarketingLeadCanBuy` is exported and read by
  nothing.
