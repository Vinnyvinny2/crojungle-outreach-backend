# §133 — the decision-maker mailbox, and one door for the checker — 2026-09-10
Written 2026-09-10 for docs/history (one file per round; CLAUDE.md carries no history). Not a moved section: verify-split.sh skips it.

## 133. the decision-maker mailbox, and one door for the checker — 2026-09-10

Vin, after the 2026-09-10 ten-lead run: *"shared inbox isn't bad but decision-maker
inbox is preferred — is our email searching not good enough to get decision-maker
inboxes?"*, *"whatever is better than myemailverifier and is free"*, *"I want 50 emails
out a day regardless and I'd prefer them to be decision-maker mailboxes."*

### I gave him the wrong answer first, and the correction is the round

I told him the checker had been asked **once across ten leads** and was therefore not
worth replacing. The count was right. The conclusion was backwards.

`src/all.js` holds the branch that turns a published shared inbox into the owner's own
mailbox. Its own sentence, when it works:

> *"their site publishes only info@, a shared inbox. `matt.hennebry@…` is Matt's own
> mailbox and SMTP confirms it exists, so the email reaches the person it argues with
> instead of whoever reads enquiries."*

It builds candidate patterns for the named owner and confirms each with a mailbox check.
**That is the decision-maker-mailbox engine, and it is gated on the checker.**

The latch fires on the first refusal and holds for a **ten-minute cooldown**
(`VERIFIER_COOLDOWN_MS`). The run's `OUT OF CREDITS` line lands on **lead one**, and the
whole run takes about three minutes. So the upgrade path ran **zero times on nine
leads**. "One check across ten leads" was never evidence the checker was unnecessary —
it was evidence it died on call one and everything after it was skipped.

**The row on Vin's own screen said so:** `FBC Remodel — Matt Hennebry, CEO — held
matt.hennebry@fbcremodel.com — "held back: the email verifier is unavailable"`. The
system found the decision-maker's mailbox, and the dead checker is why it never left.

### What 50 decision-maker emails a day actually costs

At ~60 leads read a day and 2-4 candidate patterns each, that is **3,600-7,200 checks a
month**. Real free tiers, checked 2026-09-10: **Reoon ~600/month**, ZeroBounce 100/month,
Bouncer 100 one-off. **There is no free tier at this volume.** The honest price is about
**$30-60/month** at the ~$0.008/check rate Bouncer and MillionVerifier advertise.

**A ceiling no vendor moves:** four of the nine domains on that run host mail on
Microsoft 365, which stalls RCPT TO probes by design. Those stay shared-inbox or nothing
at any price.

### Vin's rulings

1. **Reoon's free tier now**, then pay $30-60/month **based on results**.
2. **The shared inbox keeps the volume.** Owner mailbox first, fall back to `info@` so
   50 a day stays reachable. The row always says which.
3. **`Confirmed` counts owner mailboxes only.** Shared inboxes get their own chip.

### A — one door, any checker

`EMAIL_VERIFIERS` is a table. A provider declares four things: a label, its key env var,
how to build the URL, and how to read the answer. Adding a vendor is a row, and
`VERIFIER_PROVIDER` / `VERIFIER_PROVIDER_2` choose them without a rebuild.

**The latch is now per provider.** A spent primary latches *itself*; the same lead is
then offered to the secondary. That is the entire difference between one checker dying
and a run losing every owner mailbox after lead one.

**An unrecognised token is never guessed into a verdict.** Reoon's documentation is not
reachable from this network — the egress proxy blocks `reoon.com`, `coldiq.com` and the
WordPress plugin source — so the token lists are evidence, not gospel. Any token the
adapter does not know comes back **UNCHECKED** and the door logs it verbatim, so one
real call corrects the vocabulary. A guessed mapping that graded a live mailbox as dead
would be indistinguishable from a working one.

**Whose fault decides whether we try the next one.** A *timeout* is the recipient's own
mail server stalling the probe; asking a second vendor to hold the same conversation
with the same hostile server buys nothing and costs another 30 seconds, so a timeout
ends the attempt. A DNS failure, refused connection or broken TLS handshake is the
*vendor's* host — and that is exactly what a second vendor fixes.

### B — a dead key is known at boot, not on lead one

Two new boot lines. `MAILBOX CHECKER:` names which checkers are configured and warns
when there is no fallback. `HUNTER PROBE:` is the **first probe Hunter has ever had** —
and Hunter is the other source that produces a decision-maker address, so its state was
the one thing about this tab nobody could see. Neither spends anything it does not have
to: no key means no call, and the line says "not configured" rather than pretending to
have checked.

### C — Confirmed counts owner mailboxes only

The screen read `5 confirmed` on a run where **not one address was the owner's**. All
five were `info@` / `contact@` and one personal-looking address on a domain that is not
theirs. The system graded them correctly all along — `published_role`: *"not the owner's
own mailbox… somebody other than the owner reads it first"* — and the chip ignored the
grade. Computed and not passed, the class this repo records most, one screen over.

`Confirmed` is now grade A only. `Shared inbox` is its own chip with its own number.
**Volume is untouched**: a shared inbox is still sendable, still exportable, still moves
to Research, because that is what keeps 50 a day reachable.

**The server half had the same fault and it was found by the agent that did the client
half, not by me.** `emailVerifiedRow` fell back to "tier 1-2 and sendable" whenever the
grade was not in its verified list — and `published_role` is tier 1 and sendable by
construction. An explicit grade now beats the fallback. The fallback is not deleted: a
row with no grade still has nothing better than its tier.

**A union that would have hidden it.** While only the client was split, the wire test
between page and server was widened to `verified OR shared` to keep it green. That union
would have passed just as happily with the server still calling every `info@` confirmed
— the exact state this round exists to end. It is a plain equality again.

### Three older checks this round disarmed, and what was done

A change that makes an existing guard impossible to fail has disarmed it, not passed it.
All three were re-aimed at the same guarantee rather than deleted:

- the needle pinning **"the door counts the check before it spends it"** — the URL now
  comes from the provider table, so the old literal could never match again;
- the anchor pinning the **row-level availability gate**, which stopped reading
  `verifierBlocked` and started reading `verifierAnyAvailable`;
- clientcheck's **lift** of `emailVerifiedRow`, whose regex ended on `));` and silently
  truncated once the function grew a block body — surfacing as "the contact list no
  longer compiles" rather than as "the rule changed shape".

### Verification

`node build.js --check` byte-exact → `GATES=static` → boot → falsifications →
`bash ci-gates.sh` all stages.

`BOOT VERDICT: GREEN — 300 checks passed` (299 at the end of Round 132), one new named
check, `clientcheck` green, servercheck's 205 assertions, a 500-lead fuzz.
`CONTRACT_VERSION` and `CLIENT_CONTRACT` both **20261013**.

### What cannot be tested here (Vin's call)

- **Whether Reoon is accurate enough.** Only real bounces answer that, and that needs
  sending.
- **Whether ~600 free checks a month is enough** at a volume that has never run at 50/day.
- **Whether $30-60/month is worth it** — his "based on results" call.
- **Whether the owner reads the personal mailbox** once we find it.
- **Whether "Shared inbox" is the right word** on the chip.
- **The Microsoft 365 ceiling**, which no vendor moves.

### Needs your eyes

- **No SQL this round.**
- **`index.html` changed** — drag it into Netlify, contract `20261013`.
- **Set the keys on Render.** `VERIFIER_PROVIDER=reoon` and `REOON_KEY` for the free
  tier; add `VERIFIER_PROVIDER_2=myemailverifier` with its key so a spent account never
  stands the run down again. **And check the boot log for `HUNTER PROBE:`** — if it says
  no key, the source that finds a mailbox by name has never run.
- **Run a ten-lead read.** The live proof is a `⇄ EMAIL` line: a personal mailbox
  replacing a published `info@`.
