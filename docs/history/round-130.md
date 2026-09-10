# §130 — stop paying twice, stop losing the owner — 2026-09-10
Written 2026-09-10 for docs/history (one file per round; CLAUDE.md carries no history). Not a moved section: verify-split.sh skips it.

## 130. stop paying twice, stop losing the owner — 2026-09-10

Round 129 answered the question it was built for. The first live ten-lead contact
read on the new code turned **zero sendable addresses into six of nine** — the card
read `3 confirmed · 3 more we can send to · 0 held back`. It also cost **58 Firecrawl
credits against 30 before**, which is the opposite of what the round promised.

This round is what that run exposed. Vin's ruling: **cut the waste, keep the yield.**
Only spend that bought nothing comes out. The owner wave and the contact-page buy
stay, because they are what produced the six addresses.

### What the live run proved about Round 129, from Render

Pulled from the Render log at 23:55 UTC, seven minutes before the read:

- `SCHEMA PROBE: all 14 expected tables and columns answered` — the two `create table`
  statements landed.
- `VERIFIER DAY (UTC 2026-09-09): 0 mailbox check(s) spent of the 100 free ones...
  Seeded from the day table at boot, so an instance that slept resumes today instead
  of starting it again.` The seed works and says so.
- `BOOT VERDICT: GREEN — 291 checks passed`.

**The whole ten-lead run spent zero of the hundred free mailbox checks.** The design
target was about one per lead in discovery; the measured figure is nought. Every
address was either read off a page or sat on a host `MAIL HOST` now skips. So the
budget half of Round 129 did better than it was designed to. The credits went up for
an unrelated reason, which is Part A.

### A — the address lookup stops buying what it already holds

**The diagnosis I started with was wrong, and the agent corrected it.** The Round 129
gate did not misfire: `allowBuy` is exactly as designed — the site answered and the
free passes found no address, so the buy is permitted. What Round 129 actually did
was make this branch **reachable for the first time in the tab's life**, and the
newly reachable branch is wasteful. That is the whole 30 → 58.

The waste, on `Kelly Window and Door`: the free read fetched six pages including
`/contact` for nothing and harvested 53 same-host links off their own navigation.
Pass 2 then bought `firecrawlMap` unconditionally (1 credit) and re-bought four of
the same pages it already held (4 credits).

Two gaps closed, both narrow:
- the free read never called `rememberHtmlLinks`, so `cachedSiteMap` was empty on this
  route. It does now, and the map is skipped once five same-host links are known.
- the shared scrape cache **was** already consulted — it sits inside `firecrawlScrape` —
  but the free read is a *plain fetch*, so its pages were never in it. A target whose
  page a free fetch already returned with 800 or more characters of text is now dropped
  before a credit is spent. A nearly-empty free fetch is not a page we read, so it is
  still bought.

**Honest saving: 15-20 of the 58, floor 8, ceiling 28.** The map credit is guaranteed
on every lead reaching pass 2; the re-buys depend on the overlap between the free
read's nav-picked pages and the ranked targets, which was four of four on Kelly. Two
new log lines make the exact figure measurable on the next run rather than argued.

**A yield risk, disclosed and deliberately not fixed:** `freePages` carries text only,
and `plainTextFromHtml` strips tags, so a `mailto:` href whose anchor text is not the
address is invisible to the free passes. The paid re-buy could previously find such an
address; the new rule may skip it. This extends blindness that already existed on
pass 1 for every free-settled lead rather than creating a class, and the 800-character
floor bounds it. The clean follow-up — harvest `mailto:` targets out of the free markup —
is additive, cheaper than any buy, and raises the free-settle rate. Out of scope for a
round bounded to removing spend that bought nothing.

### B — a business named after its owner keeps its owner

`David B. Brothers, MD - Plastic Surgery Centre of Atlanta`. The paid owner wave
bought his name from licence records, correctly, **with his title**. The name door then
threw him out and the lead came off the call sheet with nobody on it, after 6 credits.

**My hypothesis was wrong.** I expected the round-98 guard that refuses a candidate
matching the business name. That clause exists and **never fired**. Executed against
the real function, the refusal is a per-token vocabulary test: the word **"Brothers"**
is on the organisation-word list that keeps "Smith Brothers" and "Atlanta
Journal-Constitution" off the sheet. The company name is irrelevant — `David Brothers`
with no company at all is refused too. One of the batch's eight owners was lost, and
**any** owner surnamed Brothers, Sons, Post, Chamber, Bank, Banks or Bros is refused
regardless of the business.

Why `John H. Krell` and `Mike Kelly` survived has nothing to do with eponymy: "Krell"
and "Kelly" simply carry no organisational meaning.

**Vin's ruling as written was not sufficient, and shipping it alone would have
re-earned Round 113.** Executed: `Smith Brothers` at `Smith Brothers Roofing`
satisfies eponymous-surname + a licence source + the title "Owner", and would have
shipped a family signature as a person; an existing fixture pins it as `'not-a-name'`.
So the licence takes a third condition, evidence rather than shape: **a marker no
collective carries** — a middle initial, or a professional suffix (MD, DDS, DMD, DVM,
PhD, Esq, Jr, Sr, II, III, IV, CPA) in the name or the business name. "David B.
Brothers, MD" carries both. "Smith Brothers Roofing" and "Larsen Family" carry neither.

Only the **strong (surname) arm** licenses: the rule is asked with the company name
alone and no site, so the weak first-name-in-domain arm is structurally unreachable,
not merely unused.

**Disclosed cost, written into the code:** a real owner surnamed Brothers with no
initial and no professional suffix anywhere is still refused. That is the safer
direction.

**Gap found:** no existing fixture exercised an eponymous owner name through the door
at all. The eponymous rule was only ever fixtured in isolation, never against the door
that refuses names.

### C — a contact read reports its own mailbox spend

The only per-lead `VERIFIER DAY` emitter sat inside `_runResearchInner`, the
`/api/research` footer. **A Find contact read never reaches it.** The round motivated
by a contact read burning checks attached its day line to the route that was not the
problem. The `FIND CONTACT` footer now carries both figures — this lead's checks and
the day's — off the per-request ledger the Firecrawl and model meters already use, with
one increment at the single verifier door so it cannot double-count.

Zero reads as a measurement, not as a missing value; outside a ledger frame the line
says "not measured" instead. `Number(leadCount)` was explicitly refused there, because
`Number(null)` is 0 and 0 is finite — this repo's most-recorded bug class.

### D — the two durable writes stop being silent

**Half this brief was wrong and the agent refused it.** I said the saves had no failure
log; failures are already fully visible, because `sbRest` prints
`Supabase REST error <status> on <table>` with the cause read out of the response body,
and the `.catch(() => {})` is near-dead code. So no second diagnosis was added. What was
genuinely missing is whether anything landed at all, and **which** row went missing — the
table is shared by every lead and the caller never sees the result. A failure now names
the domain and the fact and points at the existing cause line; a success is said once per
domain per process. Both stay non-blocking, reporting from the promise's settlement.

`_mailFactsLoaded.add(d)` **stays above the read**, against my instruction and correctly:
it is the re-entrancy guard for an awaited read two leads can enter at once, and it is the
denominator of the per-lead rate in `verifierDayLine`. Moving it would make the rate
overstate itself and, with Supabase unconfigured, make the day line claim "no lead has
asked for an address yet", which is false. The failure is recorded separately instead, so
a retry is possible and the log says the read did not come back.

Also fixed there: `Array.isArray(rows) ? rows[0] : null` collapsed "the table did not
answer" into "there is no row". They are different facts.

### E — the batch chips partition

`Confirmed 3 | Can send 6 | Held back 0 | All 9 | No email 6 | Fit 70+ 1` — twelve chip
slots for nine leads. Three leads sat under **Can send and No email at once**, because
`noemail` was written as `!(read && verified)`. Only three of the nine had no address.
The same "screen harsher than the truth" defect the Round 129 card work existed to kill,
surviving in one filter.

Two more chips were wrong, found in the fixing: **"Can send" was a superset containing
every confirmed row**, and "Held back" could double-count the verified-but-refused shape.
Rows and counts now come out of one filter, so a chip can never show a different set from
its number, and the four buckets sum to the read leads. "Can send" is relabelled
**"Unconfirmed"** — "Can send 3" beside a button offering to move 6 would be one screen
contradicting itself.

"All" is unchanged and honest: a lead that is unread, failed or already moved is in **no**
bucket, and that is asserted — an absence claim needs a look.

### Deliberately not built

The `mailto:` harvest (above). The batch view's default chip, which still opens on
`email` and pre-selects only confirmed rows, so the in-batch Move button offers 3 while
Screen A offers 6 — pre-existing, same family. The server's `heldBackEmail` counter,
which still counts the verified-but-refused shape: unreachable from a fresh read today,
but two hand-kept copies of one rule. The research footer's own day line still gates on
`> 0`, so a research run that spent nothing prints nothing — the same zero-reads-as-missing
shape Part C fixed on the contact route.

### Proven

`node build.js --check` byte-exact (85,903 lines, CRLF) · `bash ci-gates.sh` all stages
**ALL GATES GREEN** · `BOOT VERDICT: GREEN — 294 checks passed` (291 at the start of the
round; +2 `CONTACT READ SPEND` / `WRITE LANDED`, +1 `EPONYMOUS DOOR`, Part A's assertions
inside the existing `FIND CONTACT CHECK`) · `clientcheck.js` assertion sites 657 → 671 ·
**40 reverts in `round-130-reverts.js`, every anchor unique in the shipped tree.**

### Needs your eyes

- **`index.html` changed**, so it needs the Netlify drag. Contract `20261009 → 20261010`
  on both sides. **No new SQL this round.**
- **The word "Unconfirmed" on the chip**, and the chip order. Only Vin can call those.
- **The live proof, and it is the only one that counts:** a second ten-lead read.
  Credits materially below 58 with the sendable count still at or above six, a
  `FIND CONTACT` line reporting mailbox checks, and an owner-named business arriving
  with an owner instead of `lane no name yet`. The two new Part A log lines make the
  exact saving measurable rather than argued.
- **Nothing here proves a send.** Zero mailbox checks were spent on the live run, so the
  send boundary — where the one check decides whether mail actually goes out — has still
  never run against a real mail server. That is the next round, and the only thing that
  can validate any of this.
