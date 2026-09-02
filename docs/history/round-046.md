# §46 — The verify-at-send gate had never once executed — 2026-08-21
Source: CLAUDE.md lines 3358-3489, moved verbatim 2026-09-02 from commit b01d952e4f95d7b69686bc2c4063ca2aa0cb7546 (branch backup/claude-md-monolith). Nothing below this line was edited.

## 46. The verify-at-send gate had never once executed — 2026-08-21

Vin, on the free Firecrawl tier: *"make sure other than that that's the only
issue... I want you to work extremely hard to identify issues we are close to the
finish line."* A ten-dimension adversarial sweep found the biggest defect this
send path has ever had, and it was hiding behind a green check.

### The gate reads a field that does not exist

```js
const _tier = Number(lead.emailTier || (lead.emailMeta && lead.emailMeta.tier) || 0);
let _verified = lead.smtpVerified === true || _tier === 1 || _tier === 2;
if (_tier > 2 && !_verified) {   // ← never true
```

`emailTier` and `emailMeta` appear **nowhere else in this system**. The tier lives
on `emailResult.tier` — `EMAIL_TIERS` declares it (1 published on their site,
2 SMTP-verified, 3 pattern-learned, 4 pattern-inferred, 5 none) and index.html
reads `L.emailResult.tier` when it builds a research request. So `_tier` was 0 on
every lead, `_tier > 2` was false on every lead, and **the SMTP check at the send
boundary has never run.**

PART 4 §3 has carried *"there is now a verify-at-send gate but it is untested at
volume"* for weeks. It is not untested. It is inert, and it has been since the day
it shipped.

The cost is precisely the failure it was built to prevent. Both hard bounces this
project has had came from addresses the system itself *"labelled 'pattern-built,
not confirmed' and marked sendable"* — tier 3 — and a hard bounce is charged to
the sending **domain**, the one asset here that cannot be rebuilt in an afternoon.

**And `SEND VERIFICATION CHECK` was green the entire time**, because it declared
its own `_ok` reading its own `emailTier` fixtures and tested THAT. Two
implementations of one operation, with the second copy inside the guard — and
both copies read the same non-existent field, so they agreed perfectly and were
both wrong. The check now runs the real functions against the real lead shape,
and restoring the shipped expression verbatim turns it red on the first
assertion: *"the tier is not being read from emailResult.tier."* It would have
caught this the day it shipped.

**An unknown tier now verifies rather than waving through.** The old rule read
`if (!t || ...) return true` — no measurement meant no check. "We did not measure
it" has never meant "it is fine" anywhere else in this file.

### The concurrency default assumed the smallest plan and the pace assumed the largest

`FC_CONCURRENCY`'s own comment says *"Default 2 — the Free tier's concurrent-browser
cap, so this is safe on the smallest plan Vin could be on."* The gap between
starts defaulted to 350ms, which dispatches **171 requests a minute against a free
tier that allows ten**. Two settings describing one plan, one conservative and one
maximally aggressive.

And the limit can only be **learned from a response**. A lead's first fan-out is
seven page reads dispatched inside two and a half seconds, long before any answer
comes back to teach us anything. So on a small plan the burst is refused, the
retries are spent, and the audit runs blind — while Places, Apify and the model
have already been paid for that same lead. Live 2026-08-21: three of five leads
read ZERO pages, each with `FIRECRAWL THROTTLED 3x` and one second of gate wait,
which is the 350ms default having applied throughout.

Assume the smallest plan they sell until their header proves otherwise, and let
the measurement RELAX it. Wrong the safe way costs one gap interval, once per
process. Wrong the fast way costs a blind audit plus every other API already spent
on that lead. `FC_GAP_AT_START` is captured before anything can move it, because
the boot fixtures set the live pace by hand and the starting value would otherwise
be unobservable — and the starting value is the whole point.

**The measured price of a lead, from that run's own log:** 16 Firecrawl credits,
4 Places calls, $0.095 of Anthropic. At fifty a day that is **800 Firecrawl
credits a day, 24,000 a month**. The free tier is **1,000 credits ONE TIME** (corrected
2026-08-28 against the account itself; this file said 500 for weeks), which is
about 62 complete audits, ever — not one fifty-lead day.

### A judgement about a page we never opened

`positioningScore` reads `content` and `visualAnalysis` in every one of its terms.
On a lead Firecrawl refused, content is empty and visualAnalysis is null, so the
scorer runs over nothing and returns 0-2 out of 10 — and **0 is not "we did not
look", it is "we looked and it is terrible"**. Three consumers then acted on it: a
`weak_positioning` flaw was pushed, the audit prompt was told *"Dunford
positioning: 0/10"*, and the rule-based product fallback declared `isBroken` and
recommended a rebuild because *"Homepage has critical conversion failures"*.

Three of five leads on 2026-08-21 were in exactly that state. It is the recorded
unmeasured-as-zero class pointed at the softest, least defensible judgement in the
system — and the bucket text for `weak_positioning` already says it is *"our
opinion, not a measured fact, and the owner cannot verify it"*.

null, not zero, and every consumer asks `Number.isFinite` first. The product
fallback's catch-all also stopped naming a homepage it may never have opened: the
product does not change, because a business with no readable site is still a
rebuild candidate — the REASON stops claiming we saw something.

### A product no model chose, shown exactly like one that was

Two branches stamp `fromBrain: true`. Nothing in server.js or index.html has ever
read it, so a product the AUDIT chose and a product a five-line rule guessed are
indistinguishable everywhere they are shown — including the handoff brief's
`BRAND + OFFERING FIT`, which is what Mike walks into the call with. Live: Thrive
Dental's audit returned no product at all (`Brain audit complete: null`), the rule
picked Website Rebuild, and the sheet showed it like a choice.

### The boot was eleven megabytes from Render's crash ceiling

`selfSource()` is memoised to ONE copy for the reason `BOOT HEAP CHECK` records:
47 checks each grew a private `readFileSync`, boot settled ~140MB over, and a
build that was green locally crash-looped on Render.

The comment-stripped view never got the same treatment. **Fourteen checks each
wrote `selfSource().split('\n').filter(...).join('\n')`** — a 55,000-element array
AND a fresh multi-megabyte string, every time. Adding five more this session
pushed the settled heap from 184MB to 211MB and `BOOT HEAP CHECK` went red, which
is the check doing exactly its job on the same disease one level down. One
memoised copy: **211MB → 171MB**.

The blanket rewrite of the fifteen call sites caught the new function's own body
too, and every check died on *"Maximum call stack size exceeded"*. The boot found
it in one run.

### What the falsification runs found in the checks themselves

- **A falsification that went red by CRASHING.** Poisoning the property access
  instead of restoring the shipped expression made the check die on a TypeError.
  That proves the check runs the real function; it does not prove the assertion
  fires. Redone with the original expression verbatim, which trips the assertion
  cleanly — the difference between "it broke" and "it caught it".

**200 boot checks green.** Every fix falsified individually and every one red
alone; the full gate list green, 20,000 cases per in-process gate, and 2,035
emails composed over HTTP with every invariant holding.
---

