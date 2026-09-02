# §101 — The row could not tell a confirmed owner from a guess — 2026-09-01
Source: CLAUDE.md lines 9440-9628, moved verbatim 2026-09-02 from commit b01d952e4f95d7b69686bc2c4063ca2aa0cb7546 (branch backup/claude-md-monolith). Nothing below this line was edited.

## 101. The row could not tell a confirmed owner from a guess — 2026-09-01

Vin, on the only thing that matters now: *"the only goal right now is to get the
highest quality possible leads of our ICP to our sales guy. thats the only goal
right now nothigni else. so lets think on how quality can be increased."* And he
asked for a number out of ten.

**The honest answer was 5, and it was about 3 before Round 100.** Rated against
the only two live logs this project has saved rather than against impressions:

| | | why |
|---|---|---|
| Right company | **7/10** | discovery's ICP filters are strong; the contact route re-checks almost nothing |
| **Right person** | **4/10** | the weak link, and most of the gap |
| Reachable | **5/10** | one SMTP-confirmed address in eleven |
| Rep can act | **6/10** | phone, calling window, three signals; no reason to call |

From `vinlogs.txt` — eleven leads, running the same owner and email machinery
this list uses: an owner name was emitted on **11 of 11** and ten cleared the
buying floor, but only **4 of 11** settled on the free read, only **1 of 11**
produced an SMTP-confirmed address, and **4 of 11** ended with both a usable
owner and a usable email. From the 2026-09-01 nine-lead contact run: free-settle
**2 of 9**, four of the owner rows navigation labels or another company's owner —
those four fixed in Round 100.

**The one-sentence diagnosis: the row cannot tell a confirmed owner from a guess,
and neither can the rep.** `findDecisionMaker` has computed `canBuy`,
`authority`, `sources` and `corroborated` since it was written. The card rendered
the name and the title and threw the rest away, so a name the buying-floor gate
HELD BACK shipped looking exactly like one three sources agree about.

### The best free owner source was wired and structurally unreachable

`findOwnerViaReviewReplies` is weighted 35 and guarded on `(placeId &&
apifyToken)`. The contact route passed **`placeId: ''`** and **`apifyToken: ''`**
for its whole life. At an owner-run shop whoever answers the Google reviews IS
the owner, and he signs them — it is the best free read of who to ask for that
this system can buy, and it could never fire on the one list a rep dials from.

Both values already existed: `placeId` on the queued company, `apifyToken` a
declared Settings field already sent on the research path. Neither was sent.

**It runs as a stage 1.5, not in stage 1**, because it bills an Apify review
pull. Stage 1 is genuinely free; this runs only on the leads stage 1 could not
settle — which are exactly the leads about to buy the ~10-credit stage-2 search
wave. That is the owner's own rule for it: only when free fails.

**And the first placement was wrong in a way only the end-to-end check caught.**
It sat below the dead-site early return, which silenced it on precisely the leads
that need it most: a site that returned nothing is the one case where their
Google reviews are the ONLY place an owner's name can still come from. The 402
scenario in `servercheck` went red, and the fix was to move it above that return.
A boot fixture could not have seen it.

### Four grades, and the two thin settles are named rather than removed

Vin's rule for a weak name: *"we really need the woners name to be correct
because if we are asking for them and its wrong its not good but we are able to
pivot like is jogn not the owner?"* The name **ships, graded**, and the row tells
the rep how to open.

| grade | when |
|---|---|
| **confirmed** | corroborated across two independent sources |
| **stated** | their own site says so, one source, nothing corroborating |
| **inferred** | the business is named after him and nothing else names an owner |
| **unconfirmed** | the buying-floor gate held the name back |

`eponymousConfident` carries no confidence floor at all and `rosterConfident`
fires on one uncorroborated roster row. Both are **kept** — each saves ~10
Firecrawl credits and §99 recorded the decision to leave the first open — and
what changed is that their output is labelled. `ownerAskLine` builds the pivot
sentence ONCE on the server, so the card, the CSV and the Google Sheet cannot
describe one row three ways.

### The demotion finally reaches the number

`contactRequestBody` never sent `outsideBand` or `aboveSizeCeiling`, so
`findIcpScore` could not see them and a 4.9-star business the star band demoted
scored exactly like an in-band one. Vin, asked what should happen: *"i mean if
its already demoted ti would be shown in its overall rating out of 100."* It was
not; now it is.

**The numbers come from the table that already declares them.**
`demotionPenalty` reads `CONTACT_RANK_TERMS`, the same list the contact ranker
reads, so the two can never disagree about what a demotion costs — and the boot
check asserts the delta EQUALS that table rather than a literal. Applied after
the ratio and never as a term: a negative max would change the denominator, so a
demoted lead would be scored out of a different total than a clean one.

**And the two demotion reasons were described with the same words.** Both strings
said "review ceiling", so the RATING-band demotion read as a review-count one and
the new CSV column would have disagreed with the card about the same lead.

### Six email states, not one word

Published-personal, SMTP-confirmed, a **role mailbox** (a careers-page
`recruiting@` on another domain ships tier 1 `sendable:true` by decision, with
only its score and label moved), a **catch-all** domain (cannot bounce, may not
be his box), a **pattern guess**, and the one that is not about the address at
all — **the verifier was down**, so tier 2 was unreachable and every later lead
silently fell to tier 3 or 4.

Graded at the single wrapper every one of the core's returns passes through, so
nothing re-decides it. This also replaces the client's regex-over-the-label
derivation, which was a fourth copy of a rule that already had three. A missing
verifier KEY is deliberately not an outage: it is a setting nobody filled in, and
reporting the two as one makes every run by an operator without the key read as
a failure.

### An absence claim needs a look

`readChainEvidence` has computed `measured` since it was written and the consumer
read only `isChain` — so a site we could not open returned `isChain:false` and
was treated exactly like a business we proved independent. It says what is
unknown now, and it does NOT score against the lead: charging a business for our
own blindness is the guard-too-tight failure.

### The number that decides everything

Nothing in this project has ever counted whether the owner resolver and the email
engine work. `findRunTally` now counts **rep-ready** rows — the company was kept,
the name is one we stand behind, the address will deliver, and there is a number
to dial — plus **pivot-ready**, the rows a caller can still work on an
unconfirmed name, because that was the owner's own decision about weak names.
`findTallyLine` prints it FIRST: a counter computed and never shown is the exact
defect this round exists to close, and the check asserts the print as well as the
count.

**And `verifierOff` was dead.** It grepped `contactNotes` for the word
"verifier", and no note written anywhere on the contact path contains it — so the
counter printed nothing on precisely the runs where every address was silently
downgraded. It reads the server's own flag now, and a fixture asserts that note
prose can no longer be counted.

### What the falsification runs found

**Thirty-one reverts, each applied alone against a baseline the harness proves
green first. Ten came back GREEN on the first pass, and every one of the ten was
a mechanism with no guard at all** — which is the whole reason for running them:

- Nothing asserted the Apify token was READ off the request. The wire forwards a
  variable, and a variable hard-coded to `''` satisfies it perfectly.
- Nothing asserted stage 1.5 was LIVE. The position needle finds the call
  wherever it sits, so neutering its condition left the call in place.
- Nothing asserted WHICH rule settled the owner was recorded. The grade fixtures
  are handed `settledBy` directly, so they prove the reader and never the writer.
- The catch-all return's own declaration, the verifier-down override on the
  catch-all branch, and the string-tier laundering case each had no fixture that
  could reach them.
- And four client wires — the place id, the token, the demotion flags and the
  chain measurement — were sent and never asserted.

Two more things were wrong in the harness rather than the code. **The Apify
assertion counted the whole run's requests**, and the golden lead legitimately
buys a review pull, so it was measuring another scenario's spend — scoped to the
lead's own window now. And **a global find-and-replace of a needle helper name
renamed 39 lines it had no business touching**; caught by diffing every changed
line against HEAD and restoring the ones whose only difference was the rename.

**273 boot checks green**, every gate: tdz, dupkeys and scopecheck on both files,
fetchtest, pngscale, clientcheck, batchcheck, auditfuzz over 5,000 vectors,
fuzzcore over 20,000 cases, servercheck's **86** assertions over a fake network,
and 2,045 emails composed over HTTP.

### Deliberately NOT in this round

- **Re-weighting `findIcpScore`.** `ads` 25 + `hiring` 20 of 135 rewards
  marketing maturity rather than ICP fit, and only `rating` and `afford` are
  fit-shaped. Real, and it re-orders every list — so it should be measured
  against a baseline rather than changed at the moment the baseline is created.
- **Running `contactRankFor` on this path.** Two rankers over one list is the
  disease; the resolution is one ranker, and that is a bigger decision.
- **Any paid revenue or headcount source** — the owner's standing decision. The
  proxies are named as proxies and there is no dollar band anywhere.
- **Removing the two thin settles** — they save credits and grading them is the
  honest fix.

**HONEST SHAPE: none of this has run against a live press.** Every fix is
executed at boot, in `clientcheck`, or driven end to end over the fake network.
The quality number becomes real on the next fifty-lead run, when the
`📇 FIND RUN TALLY` line reports how many rows a rep could actually work — and
until it is read, every judgement in this section is inference.

**`index.html` changed, so this needs a Netlify deploy**, and the contract is
**20260923** on both sides — a stale page sends no place id, no Apify token and
no demotion flags, so the free owner source stays dead and every demoted lead
scores like a clean one.

