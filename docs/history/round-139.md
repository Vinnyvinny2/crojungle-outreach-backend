# Round 139 — the grade decides the send, and the press stops paying to read businesses it can already tell are wrong

**Shipped 2026-09-11. Server only, no client change, contract unchanged.**

Vin: *"the whole find tab needs a revamp — is our ICP being hit with the correct businesses, are we
targeting size correctly, are we checking and getting emails correct."* And what started it:
*"no wonder our rep is getting all receptionist and not a lot of calls answered."*

Built by five agents in parallel worktrees, each owning a disjoint region, merged serially.

---

## The number that governs the round

Vin, mid-round: **"we need 50 emails a day."** Measured on the 20-lead run, 9 of 20 leads produce a
sendable email — 45%. Under this round's send rule, 7 of 20 — 35%.

| Yield | Reads/day for 50 emails | Firecrawl/month (4.6 cr/read, 22 days) |
|---|---|---|
| 35% (after this round) | 143 | ~14,500 |
| 45% (before) | 111 | ~11,200 |
| 60% (naming gap closed) | 83 | ~8,400 |

`cost-model` sizes 50 **reads** a day at ~6,970 credits. 50 **emails** a day is 2–3× that. **The
binding constraint is the 9 of 20 leads that name nobody, not the confidence line** — which is why
the filings probe is in this round rather than the next.

Asked which he meant, Vin ruled: **50 sendable addresses must exist**; what is actually sent stays
governed by the sending policy (25/day, Mon–Thu, one domain). Those two have not been reconciled and
that is a separate decision (`owner-decisions`).

---

## 1. The grade decided nothing, on either half of the pair

`ownerEvidenceGrade` has graded every owner since it was written — `confirmed`, `stated`,
`inferred`, `unconfirmed`. Executed:

```
three sources agree           -> confirmed   | "Confirmed — 3 independent sources agree. Ask for Rick."
their own site only           -> stated      | "Their own site says so, nothing else confirms it..."
named after him, nothing else -> inferred    | "Likely, not confirmed..."
held below the buying floor   -> unconfirmed | "NOT confirmed..."
```

Every reader of that grade was a counter, a letter on a sheet, or one scoring term. **No send-path
code asked it.** So a name settled only by the business carrying it got a cold email opening with
his first name — a greeting that asserts to a stranger that he owns the place — identically to a
name three independent sources agree on. `index.html` already required confirmed-or-stated to count
a row rep-ready (`repReady`, index.html:6026); the server required nothing. One rule on one half of
a pair: the class of §121→§137, §125→§138 and §136.

**Vin's ruling:** confirmed or stated may be written to; `inferred` may not. Confirmed-only was
measured on the same run — **6 of 9 addresses held against 2 sends** — and refused. A lead dropped
from the email lane keeps its name, its address and its pivot line and goes to the rep's call sheet.

Graded across the run's 11 named leads: 3 confirmed, 4 stated, 2 inferred (Jay Murray, Ward & Ward),
2 unconfirmed.

### The first gate governed the sheet and nothing that went out

Gating the Find read was not enough, and finding that out was the most valuable hour of the round:

- The Find contact read **never writes the contact cache** — `cacheContact`/`getCachedContact` live
  entirely inside `/api/research`.
- **Every send has been through `/api/research`.** The Send tab needs a pitch; a pitch needs
  Generate; Generate needs research.
- `/api/send-to-hunter` blocks on `lead.emailResult.sendable === false` and **reads no grade**.
- `emailResult` is assigned in **four** places on that route, and the last — the **vision recovery**,
  which reads an address off a picture of the homepage — writes `{ tier: 1, sendable: true }` by
  hand, never touching `findEmailFireproof`.

So a guard at the email engine would have missed the vision path. The gate sits downstream of all
four assignments, immediately before the first consumer of `emailResult`. Executed:

```
BEFORE: sheet says "not sent to" -> research rebuilds it -> SEND DOOR: PUSHED INTO THE SEQUENCE
AFTER:  sheet says "not sent to" -> research asks the grade -> SEND DOOR: BLOCKED: no email
```

**Corrections owed, both made on the record before anything was built on them:**

1. `jay@jaymurraylaw.com` was cited as *currently* shipping while BounceBan called it undeliverable.
   **§138 already closed that address** — `PATTERN_INFERRED.sendable` is false. The *class* is live:
   an `inferred` owner whose address arrives as tier 1, 2 or 3 still shipped sendable.
2. "`unconfirmed` is already held back by the buying floor" was wrong. `_unvouchedSendGuard` returns
   early on `tier < 3`, so a man the floor explicitly held back still got an email whenever his
   address happened to be published on his own website. The hole was wider than diagnosed.

---

## 2. The ceiling had drifted from the written ICP; the reach line had not moved at all

`ICP_REVENUE_BAND.ceiling` was **35e6** and `15e6` appeared **nowhere in the code** — only in five
comments and two skill docs, while `business-and-icp` has said $800k–$15M since the day it was
written. Two hand-kept copies of one number disagreed for over a week and nothing measured the gap.
Vin ruled the written ICP wins: **the cap is $15M**, reversing his own $35M of 2026-09-03.

Everything derived follows automatically — `scaleCuts(200000).ceiling` is 15e6/2e5 = **75 people**
(was 175), trucks **50** (was 117), and `ICP_EMPLOYEE_BLOCK` moves with them.

**The reach line did NOT move, and that was nearly shipped wrong.** The first draft scaled it to
$21M on the arithmetic that $50M is ten sevenths of $35M — and the agent that built it argued
against its own work, naming the cost: DMI Paving, $24M, owner-run, founder named with his own
mailbox, the exact lead §114 wrote the reach line for. Put to Vin as a business question — a $24M
roofer, ~120 people, still run by the founder, phone him or email him? — he ruled:

> *"id say do both for sure we should email him and phone him."*

**The two numbers answer different questions.** The cap asks whether a business FITS what we sell,
and it moved. The reach line asks whether the PHONE reaches the person who signs, and nothing about
a founder answering his own phone changed. It stays a literal `50e6`, deliberately **not** derived
from the cap — a ratio nothing else reads is the same fact kept in two places, waiting to drift,
which is the failure this round exists to correct.

---

## 3. A branch network was marked, not dropped — and marked after the money was spent

`readChainEvidence` dropped `kind === 'franchise'` but only set `signals.branchNetwork = true` for
`kind === 'network'`, and every gate that stops a spend asks `notIcp`. **Alpha Foundations Repair
Tampa** was read as a branch network on a live run and still cost the whole contact read; the
detection's own comment says the read *"is already spent and cannot be refunded."*

One declaration, `chainIsOutOfIcp`, called by the press, the contact read and the sitemap re-read.
It stays **false on an unmeasured read** — a site we could not open is not a chain.

And the press half, which is where the money is: `readOutletTell` reads the URL Google already
returned with the listing — a `locations.`/`stores.` subdomain, a `/locations/<city>` path, a town
slug inside a longer segment — and drops before a credit moves. **No new request, no new credit.**
`GP_FRANCHISE`, the hand-kept brand list whose own comment says *"a list of names somebody
remembered is NOT the mechanism"*, is unchanged and now has a mechanical companion.

---

## 4. Two lane rules, and a nonprofit stops being deleted

- **A guess over the cap stays callable.** Mirror of §114's floor rule: the two ends of one ladder
  disagreed about what a guess is worth. Only a MEASURED size moves a business to email-only.
- **A business whose own site names a marketing director is written to, never dialled.** BLS OEWS
  May 2023 × Census CBP 2023: **one Marketing Manager per 442 specialty-trade establishments**, while
  General & Operations Managers run 1 per 3.3 — 135× as many. That title is near-certain evidence of
  a business more layered than the rep's sheet is for. It keeps the email lane; it is not benched.
  Read from **their own roster only**, never from Hunter — an index's claim is not the business's
  own page.
- **A nonprofit is kept.** The drop reasoned that a nonprofit has no owner whose money is on the
  line. Vin reversed it: a named, reachable CEO can say yes whoever files the tax return. The READ
  is untouched — its two hard cases (a contractor who BUILDS for a 501(c)3, a sign shop that SERVES
  nonprofits) still pass — and the note now tells the rep what he is calling. **Not a volume change:
  the detection fired on neither nonprofit in the 20-lead run.**

Institutions (`ICP_INSTITUTION` — churches, universities, government bodies) stay deleted at the
press. Vin said *"use your best judgement"*; a procurement-bound public body is the opposite of the
one-person-who-can-say-yes test, and it costs nothing to refuse.

---

## 5. The yield report could not name its own worst loss

`_findYield.notIcp` was created and **never assigned**, so the row came out `undefined`, the line's
own finite-number filter dropped it before printing, and the *"largest single loss"* sentence could
never name the gate that deletes the most. Seventeen refusal paths across two gates — thirteen in
the ICP filter, four in the size gate (the verified-headcount branch **demotes** since §114, so every
block it still counts is a name or an industry tag, never a size).

Counted as **the difference each filter made**, not by a counter inside it: a counter must be
remembered by whoever adds the fourteenth branch; a difference cannot be forgotten.

---

## 6. A job title still passed as a person, and a records name was read backwards

The name door took **`Design Consultant`** for a person — and it was one of eight. Also passing:
`Comfort Advisor`, `Project Engineer`, `Field Technician`, `Sales Representative`,
`Senior Estimator`, `Marketing Analyst`, and `Master Plumber` — the exact example
`FIND_ROLE_NOUN`'s own comment cites. The door read **one** of this file's two role-word lists while
the roster parsers have always read **both**.

Two law firms walked it too: **`Smith, Jones & Ward LLP`** and **`Baker, Donelson`** both returned
`null` and the sheet would have read *"Ask for Smith,"*.

**A records system writes a person surname first**, and nothing reversed it. The same shape failed in
two opposite directions: `Hoffman, Henry` passed and the sheet said *"Ask for Hoffman"* — his surname
offered as his first name, with the email greeting built from the same token — while `HOWES, LUCAS B`
was refused outright, because the real-name test reads the last token as the surname and the last
token was his middle initial. One fabricates a first name in front of a stranger; the other silently
drops a real owner we paid to find.

The flip is licensed by **evidence, never by shape** — no shape tells `Baker, Donelson` from
`Hoffman, Henry`. It needs one comma, a single surname-shaped word before it, a tail of at most two
name-shaped words with no `&` and no legal word, and then **either** a known given name **or** a
middle initial. Anything else is refused rather than guessed at. Resolved once at
`rankOwnerCandidates`, where all five sources funnel, and the **candidate is rewritten** — the sheet,
the ask line, the greeting and the mailbox guess all read that name.

**3,710 first-name × surname combinations executed** to prove the door still passes real people:
Baker, Carpenter, Foreman, Mason, Marshall, Butler, Gardner, Carver, Steward, Cooper, Sawyer,
Chandler, Bishop, Dean, Knight all survive. Six new refusals, every one two role words stuck
together (`Comfort Foreman`, `Chief Foreman`), no real name among them.

**Disclosed costs, both in the safe direction:** a bare signature reading exactly `Comfort`,
`Design`, `Master` or `Advisor` is refused as a title; and a surname-first record whose given name is
not in `GIVEN_NAMES` and carries no middle initial — `Kowalczyk, Martyna`, a real lead from the run —
is **refused rather than mis-addressed**. Today it would ship as *"Ask for Kowalczyk,"*. Widening
`GIVEN_NAMES` is the cheap lever if a live run shows it costing leads.

---

## 7. The filings probe — a measurement, wired into nothing

`probe-state-filings-officers.js` answers one question: of the leads on the live run that named
**nobody**, how many would a state business filing name, judged by **this repo's own officer rules**?

**1 of 7 today. 2 of 7 with two repairs. 5 of 7 best case.** The denominator is 7, not 8 — Window
Wise was excluded because the log says it got its owner from the paid wave and no domain or city ties
it to any one company. Refusing to pad the denominator was the right call.

| State | Publishes officers? | Leads |
|---|---|---|
| Florida | **Yes, free, openly** — read today, no key | Jax Paver Guys, Paver Rescue |
| Texas | Yes, free, behind a POST form or a free API key | EcoView (DFW), Together Design & Build |
| Arizona | Yes, free, but `noindex` to a crawler | Above & Beyond Pool |
| **Ohio** | **No. By policy** — charter number, name, statutory agent, filer | All Engineered, Everguard |

**Vin's "95% of registered companies" belief does not survive this.** Officer disclosure is a
per-state policy, not a national norm, and two of seven leads are unreachable by any filings route at
any price.

**Buy nothing.** OpenCorporates is £2,250/yr for 500 calls/month — **16 a day** against a pipeline
needing 83–143, and ~$3.35 per named lead at today's yield. Everything that exists is free.

Two bugs the probe found by executing the real rules: **Florida files an LLC owner as `AMBR` or
`MGR`** and `OC_OWNER_POS_RE` knows neither, so the picker discards the only person on the filing;
and the surname-first problem above, which this round fixed. The title-code expansion is
**deliberately not shipped** — the route it lives on cannot execute without a key, and a fix to a path
nothing can run cannot be verified end to end. It is the first item of Round 140.

**The redirect worth more than the number:** in both Ohio leads, where filings can never help, a
**contractor licence record named a person** (All Engineered → Stephen I Schlesinger, whose LinkedIn
says "Owner at All Engineered HVAC"; Above & Beyond's AZ ROC record → four names with filed roles).
Licence boards are free, they name a human by law, and they cover exactly the trades this app
searches. That is the larger lever and it deserves the next probe.

---

## Proven

```
node docs/gen-refs.js                 ✓
node build.js --check                 ✓ 88,046 lines, CRLF, byte for byte
GATES=static bash ci-gates.sh         ✓ 533 round pointers resolve
node clientcheck.js                   ✓ exit 0
boot                                  ✓ GREEN — 303 checks, 1 expected decline, 0 failures
node falsify.js round-139-reverts.js  ✓ 22 of 22 RED on their own named line, tree restored byte for byte
bash ci-gates.sh (all stages)         ✓ ALL GATES GREEN — fuzz: 2,085 emails, every invariant held
```

Four checks are new or re-aimed and **none was deleted or disabled**: `OWNER GRADE SEND CHECK` (new),
`FIND YIELD CHECK` (new), `SIZE AND LAYERS CHECK` and `FIND ICP GATE CHECK` (re-aimed, with each
reversal recorded in the check's own comment beside the ruling it reverses — a reversal with no record
of what it reversed is how the same drift happens twice).

**A trap worth recording for the next round that edits by script:** `String.prototype.replace` treats
`$` specially in the *replacement* string, and six money figures silently lost their dollar signs
mid-round — *"the call cap is 15M"*. Nothing functional, but these are the sentences a human reads
when a gate goes red. Use `split`/`join`, and scan for the sign afterwards.

---

## Needs your eyes

- **Nothing to drag.** `index.html` was not changed by any of the five agents; contract stays
  `20261016`. Server only.
- **One line of SQL, and the reason matters.** The contact cache has no grade column, so an owner
  reused from an earlier research run arrives ungraded and the new send rule cannot judge him:
  ```sql
  ALTER TABLE contact_cache ADD COLUMN IF NOT EXISTS owner_grade text;
  ```
  Re-deriving the grade from the columns it does keep would turn *"the business is named after him"*
  into *"his own site says so"* — manufacturing evidence, which is worse than the gap. `cacheContact`
  only stores a corroborated or high-confidence owner with a tier-1/2 address, so the exposed
  population is narrow. **An undeclared key makes PostgREST refuse the whole row (§42), so the column
  goes in before the code that writes it.**
- **Watch the first live Find run for `🔗 BRANCH URL [Places]`.** The press-side branch drop is an
  unconditional delete with no bench and no second chance — the same shape `GP_FRANCHISE` has burned
  this project on twice ("rainbow", "one hour"). It has a must-die fixture (Alpha Foundations,
  Freeway Insurance) and a must-live one (an ordinary business whose listing points at its own home
  page), and `readOutletTell` has been hardened three times (§117, §119, §122) — but a delete deserves
  one watched run before it is trusted at volume.
- **50 emails/day vs the 25/day sending policy** are not reconciled in writing. Recorded as a
  production floor, not a send rate. If you meant 50 *sent*, the sending policy and the mailbox count
  both have to change.
- **Unverified until a live run:** that nothing new is spent per lead. Every pipeline change here is a
  refusal or a threshold and the probe is a separate script, but the `FIND CONTACT` footers on a
  ten-lead read are the proof and that run does not exist yet.
- Carried: `findSizeViaSearch` crashes twice per run and is swallowed; the 66-vs-36 credit jump is
  unexplained; `contactMarketingLeadCanBuy` is written and read by nothing; the BBB profile read is
  off after 403s on 8/8; the Supabase secret key and `APP_TOKEN` that passed through chat should be
  regenerated.
