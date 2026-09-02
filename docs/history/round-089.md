# §89 — Fifty leads ranked, with an owner email and a phone number — 2026-08-27
Source: CLAUDE.md lines 11668-11849, moved verbatim 2026-09-02 from commit b01d952e4f95d7b69686bc2c4063ca2aa0cb7546 (branch backup/claude-md-monolith). Nothing below this line was edited.

## 89. Fifty leads ranked, with an owner email and a phone number — 2026-08-27

Vin, after the strategy read: *"I need 50 leads ranked with owner email and phone
number that are in our ICP."* One goal, and the app could not serve it. Phone and
ICP were already free at Find time; the owner email existed only inside the full
research route, which also buys the review mine, the whole search half, PageSpeed,
the sitemap, up to seven interior pages, three renders and four model calls —
about 16 Firecrawl credits and $0.13-0.19 of model — to produce two fields. And
there was no CSV anywhere in the client.

Seven recon agents mapped the paid surface, the queue, the client and the checks
before a line changed; two adversarial critics were then pointed at what the recon
had NOT looked at. **They found the two things that would have made this build
destructive**, and both are recorded below because reading the code would not have
found either.

### The blocker nobody had looked at: a contact run destroyed audits

`applyResearchResult` writes `L.brainAudit = data.brainAudit || null` and then
runs `Object.assign(L, measuredFieldsFrom(data.brainAudit))` **unconditionally**.
A critic lifted `measuredFieldsFrom` out and EXECUTED it with null: seventeen keys,
every one an empty default. So a contact pass over the existing 200-lead pipeline
to harvest addresses would have **blanked every audit already paid for** — on the
lead, and via `leadToRow` permanently in Supabase — flipping the whole board from
Audited to Not audited with nothing on screen saying why. §47's "the audit lost its
findings whenever no EMAIL could be written", through a new door.

The mode flag is the guard, not a truthiness test on the audit: an audit that
legitimately came back empty on a FULL run still has to clear the lead, and only
the server can say which run this was.

**The merge check could not have caught it.** It builds a response where every key
is present, so the destructive shape is structurally unreachable by it. THE WIPE
is its own executed test now: the real merge, over an already-audited lead, with a
contact-only response, asserting the audit survives and the contact fields land.

### The second blocker: the render is an EMAIL source, not decoration

The first build skipped the homepage render on a contact run — it looked like pure
audit cost, and it is the single most expensive Firecrawl item on a lead. A critic
traced it: `visionAuditPage` is asked for `"visibleEmail"` and normalises the
obfuscated forms a scraper cannot read (*"jill [at] x dot com"*), and the recovery
branch writes a **tier 1, sendable** result and logs *"EMAIL RECOVERED BY VISION:
the text scraper was blind to it"* — firing precisely when the cheap engine
returned NOTHING. Cutting it would have cost the deliverable on exactly the leads
where the cheap path already failed. The claim is true of `_findEmailFireproofCore`
in isolation and false of the route.

The render stays. Only the PHONE render — which no email path reads — is skipped.
`FC_CONTACT_VISION=off` drops it for an operator who would rather keep the credit.

### What the mode is, and why it is a mode

`contactOnly` is a flag on the research route, not a second route. The contact half
is a strict PREFIX of that function — the homepage read, the domain confirmation,
the owner ladder, the email engine — and a second implementation of it is the
disease this file records more than any other. A mode also inherits the boot-window
gate, the preflight, the credit latch, the concurrency slot, the RSS gate, the day
ceilings, the per-lead spend ledger and the kill clock for free. `/api/test-contact-engine`
is the standing proof of what a second route costs: it double-buys every source,
skips the contact cache in both directions, and bypasses preflight and the day
ceiling while still charging the day ledger.

Ten guards, each pinned at its CALL SITE by the boot check, because a fixture
supplies its own arguments and cannot see a caller: the Companies API (whose only
email-facing output is `verifiedEmployees`, and the email engine destructures
`employees` and never reads it), the Apify mine and its Places fallback, the whole
search-visibility block, the interior pages, the web-pain search, the careers read,
the phone render, the Facebook Ad Library, the audit model call, and the brain gate.

**Three model calls stood down by one guard.** Skipping the audit call makes
`parsed` null, which makes `auditRefusalKind` truthy, which makes the EXISTING
early gate skip the story writer and the fact-check on its own — a mechanism
already in the file rather than a second copy of it.

**And the gate must not refuse a lead that never asked for an audit.** Without the
exemption every contact lead 422s and the run reports as failed with the owner and
the address already resolved and thrown away — §44's "one blank field destroyed
the whole lead", four of five leads in one batch, money already spent.

### The ranking is not a second scorer

`scoreReachability` has answered "can we put this in front of the decision-maker"
on a 0-100 scale since the day it was written. `contactRankFor` takes that as the
BASE and adds only what it does not know: a dialable number (+8 — reachability is
an email question and this list is for calling), a confirmed buyer (+6 — PART 3's
own rule, and `canBuy` was only ever in a log line), and the two discovery
DEMOTIONS (-10 each, or a decision taken at Find time is silently undone at
ranking). Small against a 0-100 base on purpose: this orders CLOSE CALLS, and the
boot check asserts a phone number can never lift an unreachable lead over an
SMTP-confirmed one.

**An unmeasured reachability refuses to rank rather than laundering into a
confident 0** — eight shapes asserted, because `Number(null)` is 0 and 0 is finite.

### The CSV, and the four states one caption was hiding

The first CSV in this repo. Both existing confidence captions derive their answer
by REGEX over the human-readable label, so four materially different states
collapse into one sentence: a learned pattern, a **catch-all domain** (delivery
certain, RECIPIENT unknown — a wrong-person risk, not a bounce risk), an eponymous
inference, and a tier-4 guess the resolver refused outright while the screen still
rendered it. Tier, sendable and the block reason are their own columns now, read
from the TIER and never from prose that happens to contain the word "verified".
A cached address up to 60 days old says so on its row. A free-page-builder site
carries a warning, because an address built at a domain the business does not own
is well-formed and undeliverable.

**A formula-injection guard**, which the one existing CSV writer has none of: a
cell beginning `=`, `+`, `-` or `@` executes when the file opens in Excel or
Sheets, and this file carries business names scraped off arbitrary web pages,
opened by a junior rep. Every rule is EXECUTED in clientcheck, both directions —
a guard that eats real data is the more expensive failure.

**"Rank" means SEARCH POSITION nearly everywhere else in this codebase**, so the
column says on its face that it is not one.

### What the falsification runs found

Nine reverts, each applied ALONE against a green baseline, each RED on its own
named assertion. Three found something real:

- **Two reverts did not APPLY** and the harness reported NO VERDICT rather than a
  pass — the anchors were written from a stale line number. Rewritten from a byte
  probe of the live source and re-run red.
- **One fixture measured nothing.** The unranked-last rule was fixtured with every
  other rank ABOVE zero, so laundering an absent rank into 0 still put the
  unranked lead last and the revert stayed GREEN. The only shape that isolates
  the rule is a MEASURED zero beside an unranked lead whose name sorts first.
- **My own needle minted a phantom Anthropic call site.** The call-site needle
  contained the literal `anthropicFetch(`, and ANTHROPIC LABEL CHECK scans this
  file for exactly that string to build its inventory — so it found a "call site"
  inside my own check with no name after it and failed a correct build. The
  seventeenth recorded instance of a needle finding something it should not, and
  the first where it invented a call site rather than matching itself. The join
  now falls INSIDE the function name.

**And the CRLF trap fired from inside the editing machinery again.** A replacement
authored in a Python triple-quoted string carries LF, and 83 LF-only lines went
into a CRLF file that still passed `node --check`. `ed.py` now REFUSES a bare LF
rather than trusting the author to remember.

### What is deliberately NOT built

- **No ICP size gate on the research route.** A critic verified that
  `looksLikeEnterpriseByName` and `sizeGated` are called only inside `/api/discover`
  — so a contact list has no institution filter on any lead that did not come
  through Find. Recorded rather than patched: it is a discovery concern and the
  fix belongs there.
- **The `icpFiltered` per-word defect.** The same critic lifted the real
  `BLOCKED_COMPANIES` set and EXECUTED the real per-word test: **Fox Plumbing,
  Kelly Roofing, Apple Roofing, Volt Electric, Target Pest Control, Block Electric
  Company, Square Deal Plumbing** and **Cascade Veterinary Hospital, Federal Way
  Plumbing, County Line Roofing** are all dropped at discovery, and `sizeGated` —
  which carries §14's small-practice escape — runs only afterwards, so that fix is
  unreachable for them. Verified, costly, and NOT fixed here: it is a supply bug in
  a different function and it deserves its own round rather than being folded into
  a feature the same night.
- **The VERIFIER_EXHAUSTED / VERIFIER_DEAD latches** are one-way with no cooldown
  and no half-open probe, unlike the Firecrawl credit latch. On a 50-lead run that
  exhausts at lead 12, the remaining 38 silently fall to tier 3/4. Real, recorded,
  not fixed tonight.

### HONEST SHAPE

**None of this has run against a live lead.** The mode, the ranking and the CSV are
executed at boot and over a fake network; no contact-only batch has been run for
real. The per-lead cost is therefore an estimate from the guards, not a
measurement: expect roughly 2-6 Firecrawl credits plus one render, three to nine
Haiku calls, one Place Details call and a handful of SMTP probes, against 16
credits and four model calls for an audit. **The first real run is what settles
it**, and the `📇 CONTACT RANK` and `FIRECRAWL SPEND` lines answer it outright.

**265 boot checks green**, every gate green: tdz, dupkeys on both files, scopecheck
on both, fetchtest, pngscale, clientcheck, batchcheck, auditfuzz, fuzzcore,
servercheck's 41 assertions and 2,000+ emails composed over HTTP.

**`index.html` changed, so this needs a Netlify deploy**, and the contract is
**20260911** on both sides.

---

