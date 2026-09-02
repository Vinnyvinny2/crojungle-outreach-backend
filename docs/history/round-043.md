# §43 — One 402 shut Firecrawl down for the life of the process — 2026-08-21
Source: CLAUDE.md lines 2905-2988, moved verbatim 2026-09-02 from commit b01d952e4f95d7b69686bc2c4063ca2aa0cb7546 (branch backup/claude-md-monolith). Nothing below this line was edited.

## 43. One 402 shut Firecrawl down for the life of the process — 2026-08-21

Vin: *"when auditing in bulk they all come back saying firecrawl out of credits
even tho its not out of credits - when i ran one singular lead it worked and
audited so its a bug."* Two defects, both introduced by §41's own credit fix,
and each is enough on its own.

### What tripped it: a throttle read as an empty balance

`isCreditError` matched the phrase **"upgrade your plan"**. Firecrawl appends
that to several different errors, and their CONCURRENCY limit message is one of
them — which returns **429, not 402**.

A bulk run is three leads each fanning out seven page reads against a
two-browser cap, so it meets that message constantly. A single lead never
reaches the cap. That is the whole bulk-versus-single asymmetry: the same
account, the same balance, and only the concurrent run latched itself broke.

`fcAsk` also tested credits BEFORE throttling, so the throttle never got a
hearing. Fixed at the predicate rather than by reordering call sites: the two
are mutually exclusive now and a throttle always wins, so the verdict cannot
depend on which one a caller happens to test first. A 402 is still definitive
and short-circuits ahead of everything. "upgrade your plan" is gone from the
credit test entirely — on its own it is marketing copy attached to whatever went
wrong, not a statement about the balance.

### What made it permanent: a latch with no way back

§41 moved the reset off "a request started" — where three concurrent leads
cleared it for each other — and onto "a paid call SUCCEEDED". That half was
right and the consequence was not thought through:

- every Firecrawl door fails fast while the latch is set
- the queue refuses the lead before it starts
- so **no paid call can ever be made**
- so `fcNote(true, …)` can never run
- so the latch can never clear

A circuit breaker built without its half-open state. One 402 — or, given the
defect above, one concurrency throttle — shut Firecrawl down for the whole
process until Render restarted it. Vin topped the account up and the server had
no way to find out.

It re-tests now: after a cooldown, exactly ONE call is let through to find out
whether the balance is back. If it answers, the latch clears for every lead; if
it is refused again, the clock restarts. Only one probe per window, so a
fifty-lead batch cannot hammer a closed door.

Time-based on purpose. An in-flight flag would have to be released on every exit
path — success, credit error, timeout, 429, throw — and the one path somebody
forgets is a second deadlock wearing different clothes. A clock cannot be
forgotten.

And the queue **holds** rather than refusing instantly. Refusing in one second
turned a five-lead batch into "4 audit failed" on an account that had credits;
an empty balance is usually a top-up away, and a lead that waits two minutes and
then runs properly is worth more than a lead failed immediately. The wait is
bounded, so a genuinely empty account still ends the batch rather than hanging
it, and nothing is spent while it waits.

`CREDIT BREAKER CHECK` — five falsifications, every one red alone. Its own first
run failed on a false positive of its own making: it counted the CLEAR inside
`fcNote` as a door, because that clear also reads the latch. A check that cries
wolf is one somebody switches off, taking the real assertions beside it, so the
exclusion is what the branch DOES (assigns false) rather than a line number.

### And the screen said the same thing four times

Vin: *"this page is just very busy still."* The audit-integrity strip rendered on
every audited lead, and on a healthy one it read "Confirmed: auditing
https://x.com" **with the same URL repeated on the line beneath it** — under a
header already reading "✓ real domain resolved", beside a Website field carrying
it a fourth time.

Same rule the colour pass established in §38: a panel confirming the ordinary
case appears on nearly every lead and is exactly what drowns the two that mean
DO NOT AUDIT THIS. It speaks only when the domain is wrong, unconfirmed, or no
site was read at all — and the second line carries the REASON, never an echo of
the URL already in the line above it.

**`index.html` changed, so this needs a Netlify deploy.**

---

