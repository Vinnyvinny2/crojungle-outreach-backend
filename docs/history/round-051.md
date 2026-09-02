# §51 — The clock charged every lead for our own queue — 2026-08-22
Source: CLAUDE.md lines 4127-4232, moved verbatim 2026-09-02 from commit b01d952e4f95d7b69686bc2c4063ca2aa0cb7546 (branch backup/claude-md-monolith). Nothing below this line was edited.

## 51. The clock charged every lead for our own queue — 2026-08-22

Vin ran five leads on the merged build. **Four died at "passed 8 minutes of
WORK"** — Lyons Roofing, Nicholson Builders, The LASIK Vision Institute,
Burbank Electric — each after a full paid research cycle. One audit survived.
*"its never fucking endnign with these bugs and issues these leads are taking
forveer to run and the logs look horrible."*

**The cause was the previous session's own speed fix.** `RESEARCH_CONCURRENCY`
went 3 → 6, and the kill clock counted a lead's wait in OUR Firecrawl gate as
work. The arithmetic is in that run's own ⏱ TIME line: at 3 concurrent, one
lead measured 409s of work of which **138s was queued in our gate**, so 271s
was real. Double the slots and the queueing roughly doubles: 271 + 276 = 547s,
past a 480s budget. Every lead died at exactly that boundary. The leads were
fine, the sites were fine, and the clock was charging them for our own
politeness — the Doc Tony failure one level down, where the queue in front of
the GATE replaces the queue in front of the WORKER.

Four things had to move together, because a browser that gives up first throws
away everything the server already paid for:

- **The budget is WORK NET OF GATE WAIT**, and a separate 30-minute wall
  ceiling catches anything genuinely stuck. Two numbers because they answer two
  questions: is this lead still doing something, and has it been alive too long
  whatever the reason. Gate wait can excuse the budget; it can never make a
  lead immortal.
- **Overlapping waits are ONE wait.** The existing `gateWaitMs` SUMS every
  request's queue time and a fan-out puts seven in the gate at once, so seven
  concurrent 60-second waits report as 420 seconds against 60 of wall clock.
  Subtracting that number would have made the budget unreachable and the hang
  guard would never have fired again. The clock reads a UNION — a counter with
  a start stamp, opened when the first request queues and closed when the last
  is dispatched — and it reads it LIVE, because the lead about to be killed is
  precisely the one still waiting.
- **The ledger is captured in the caller's own context**, not read from the
  async store at dispatch: the gate runs a queued job from whichever lead's
  continuation freed the slot, so the ambient store there belongs to somebody
  else. That is the audit-cache cross-lead failure pointed at time.
- **One verdict serves the timer, the poller and the browser.** The job timer
  kept its own private eight minutes as a fixed `setTimeout`; it re-arms
  against the shared rule now. The poller sends its budget to the browser
  (`workBudgetMs`) so the browser cannot hold a stale copy — the
  two-hand-kept-copies disease across a network. The stale sweep is derived
  from the wall ceiling rather than hardcoded, and the browser's outer abort is
  asserted by `clientcheck` to sit above both.

`QUEUE CLOCK CHECK` grew eight assertions and three call-site needles;
`batchcheck` executes the browser's poller against a server that says its
budget is twenty minutes. Fourteen falsifications, every one red alone.

### Three more from the same log

- **A number written in WORDS walked past every figure gate.** CTR's call sheet
  said *"forty-six dozen reviews"* about a business with **461**. Five hundred
  and fifty-two, said out loud to an owner, past eleven gates, because the
  sentence contained no digit — `permittedFigures`, the unsourced-number check
  and the money gate all match digits. `stripSpelledQuantities` refuses exactly
  two shapes, both fabricated scale by construction: a vague plural quantifier
  ("dozens of", "hundreds of") and a spelled number times a scale word
  ("forty-six dozen", "three hundred"). It deliberately does NOT touch a bare
  spelled number — "twenty-five years" is how a real fact gets written, and
  refusing it would need a corpus of every measurement rather than of every
  page. "one hundred percent", "twenty-four seven" and a scale genuinely in
  what we read all survive, because a gate that eats true sentences is one
  somebody switches off.
- **The altitude line asserted a rank it had never read.** The audit prompt
  hands the model one sentence under the words "THE FIRST SENTENCE STARTS HERE
  — THIS EXACT ALTITUDE", chosen by the binding LAYER. For LEADS it always said
  *"their name sits near the bottom of it"*, and the layer says nothing about
  where they rank — LEADS also binds on a thin profile or a service page nobody
  finds. CTR measured **#4 of 20**. It reads the measurement now: a confirmed
  absence says so plainly, #4 states the three names above them, and #1, #2, a
  suppressed position, an unmeasured one and a five-result field all produce
  **nothing** rather than something vaguer — a softer sentence that still
  implies a low position is the same false claim with the evidence hidden.
- **"We never read a single page of their website" sat above a confident
  description of the site.** Both were true, of different reads: the page TEXT
  was empty and the page SOURCE was not, and the source is where the tags, the
  forms, the phone link and the booking route are all measured. `corpusRead`
  reports both now and the banner says which half we hold. A reader handed a
  flat contradiction stops believing the whole sheet, which costs exactly what
  the missing warning cost.

### And the logs

- **The boot froze the process for eight seconds in one place.** `SCREENSHOT
  SCALER CHECK` builds eight 9000x300 PNGs, deflates, decodes, scales and
  decodes each again, and every millisecond of it blocked the event loop —
  about twenty seconds on Render, which is exactly what its "No open HTTP ports
  detected" line was reporting. It yields between shapes now, held open by
  `bootHold` so a late failure is still counted. Local boot 21s → 16s, and the
  process answers throughout.
- **A boot check is not a lead.** A clean boot printed fifteen copies of
  "INTERNAL ONLY: partial_owner_replies" about businesses that do not exist:
  the boot checks run the real ladder over fixtures and the ladder's
  diagnostics are written for somebody reading a LEAD. Not a filter over the
  text — a filter is a list somebody has to keep — but the one question that
  separates the two cases, which is whether a lead is being worked on at all.

**212 boot checks green.** Fourteen server falsifications and three client
falsifications, each red alone.

**`index.html` changed, so this needs a Netlify deploy.**

---

