# §83 — PR C: the cuts that touch no measurement — 2026-08-27
Source: CLAUDE.md lines 10837-11008, moved verbatim 2026-09-02 from commit b01d952e4f95d7b69686bc2c4063ca2aa0cb7546 (branch backup/claude-md-monolith). Nothing below this line was edited.

## 83. PR C: the cuts that touch no measurement — 2026-08-27

Vin: *"lets build at the highest level the PR C Build Map... DO NOT BREAK
ANYTHING BE SURE OF IT."* Every item below is a setting whose default is
today's behaviour, or the removal of work nothing reads. **No measurement was
removed, no claim was widened, and no sentence an owner or a caller reads
changed.** 16 falsifications, each reverted alone against a green baseline and
each red on its own named assertion. 256 boot checks green, all gates green.

### What the meter settled first

One live lead (Miller's Fancy Bath, 2026-08-27) answered the cost question
outright: **$0.1871 across 13 model calls, and 81% of it is two** — the story
writer at $0.0785 and the audit at $0.0738. Both show `cacheRead=0
cacheWrite=…`, so that is the FIRST-lead price; the story writer's system
prompt interpolates only static blocks, so every lead after it reads at 10%.
Steady state is **~$0.117 a lead**, and blended across a 50-lead batch **~$0.128
= $190/month**, not the $253 that had been scaled from a three-lead balance
delta. `DFS_LABS` was confirmed already off. The corrected baseline is **$513**,
not $613.

The same log carried three defects, and the first two are the same money.

### The free owner source could never corroborate

Their own site named **Rick Miller** at high confidence; the Google review
replies were signed **Rick**. `sameName` refuses any name under two tokens
outright — correctly, because it decides which mailbox an email addressed to
the owner is sent to — so the two never clustered. Instead of corroborating,
they COMPETED, stage 1 did not settle, and the run bought the paid websearch
and licence wave to rediscover a name it was already holding.
`findOwnerViaReviewReplies`' own prompt says *"A first name alone is fine and
useful"*, and the source is weighted 35 because at an owner-run shop whoever
answers the reviews IS the owner. It was structurally unable to be useful.

`foldFirstNameClusters` folds a bare first name into the one full name it can
belong to, and three properties are the whole design: the FULLER name always
survives, it only ADDS a source, and **ambiguity refuses** — two different
people sharing that first name means the signature does not say which, and a
guess there would credit a real source to the wrong person. `sameName` is
deliberately untouched; the first-name rule it kept inline moved to module
scope so the two questions cannot become two hand-kept copies.

**And the eponymous settle should have fired on this lead and did not.**
`isEponymousOwnerRule('Rick Miller', "Miller's Fancy Bath & Kitchen")` returns
TRUE — executed, not read — the brain returned high confidence, and the winning
cluster carries `own_website_brain`. All three conditions compute true on that
lead's own values and stage 2 was bought anyway. **That could not be resolved
from source and no guess was shipped for it.** What shipped is the diagnostic:
`settled()` now records which of corroborated / ownSite / eponymous / roster
was false, plus the brain's confidence and the eponymous rule's own answer, and
the stage-2 branch prints it. The next run answers the question instead of
posing it again.

### We paid for the homepage four times, then deleted the fourth

`/index.html` came out of their own sitemap, the backfill bought it as an
interior page, and the duplicate-page fingerprint threw it away one step later:
*"1 of the 5 page(s) we read came back with text identical to the HOMEPAGE"*.
That lead fetched its homepage four times — corpus text, full-page render,
phone render, and this.

The old guard excluded an EMPTY path, so `/` was caught and every server
default document walked past it. `isHomepageAliasUrl` drops `index.*`,
`default.*` and `/home` **before the picker can spend**, on an exact SEGMENT
match: a homebuilder's `/homes`, a services page at `/home-improvement` and a
folder's own `/a/index.html` are real pages on exactly the trades we target,
and a filter that ate them would cost a page read to save one. `clean` itself is
untouched, because `findUnlinkedPages` reads it and its denominator is a fact
about their sitemap rather than about our page budget.

### Calling mode

Stage 2 and 3 of the owner ladder buy a NAME. On a batch that exists to be
dialled the rep gets that name in four seconds by asking whoever picks up, so
the wave is ~10 Firecrawl credits and two model calls spent on a question the
call itself answers. `callOnly` rides `buildResearchBody` — the one request
builder — and takes the same branch `settled()` takes, with its own log line
naming why. Stage 1 is untouched and still runs on every lead.

**What it costs, stated: no TITLE.** An uncorroborated stage-1 name is held back
exactly as it is today and the sheet says "(no title found)" rather than
inventing one. That is a fair trade for a call and a bad one for an email, which
is why it is a per-request flag and not a new default.

`batchcheck` runs it both ways through the real runner — a flag stuck ON is the
worse half, because it would stop resolving the owner an email is addressed to —
and **servercheck drives it end to end**: on a lead built so stage 1 cannot
settle, the control buys 5 owner searches and the calling-mode lead buys 0,
`CALL MODE` prints, and both read the same homepage.

### The gate that refused a lead after buying two more calls

The BRAIN GATE lives ~2,000 lines below the audit call, and both inputs it
decides on exist the moment that call returns. So a husk still bought the STORY
WRITER — the most expensive call on the lead — and the fact-check before being
refused, on a lead that was always going to 422. Four of five leads died that
way in one live batch.

One rule (`auditRefusalKind`) now decides, asked as soon as the audit parses and
again at the gate. **The refusal itself did not move**: same place, same
wording, same status. What changed is that two calls are not made first.

The safety rests on one claim, so the check EXECUTES it rather than arguing it:
the early answer is asked of `parsed` and the late one of `brainAudit`, which is
built field by field FROM parsed, and the two fields that can differ both LOSE
content on the way (`situationRead` becomes the synthesis object; `whatHeNeeds`
never reaches the literal). So the early answer is always at least as
PERMISSIVE — **an early refusal implies a late refusal, never the reverse** —
and no lead can be refused that the old gate would have shipped. Executed across
six shapes in both error states, with the field sourcing asserted so it holds
for fields we have not thought about, and a `_seen < 6` floor so the scan cannot
report a clean pass while matching nothing.

### What was NOT built, and why

- **DataForSEO Standard task queue.** `docs.dataforseo.com` is blocked by this
  environment's egress proxy, so the endpoint shape and the discount could not
  be verified. Writing an API contract from memory — for the call that produces
  leak 1 on most sheets — is the fabrication failure this file exists to
  prevent. It needs one look at their live docs, and then it is a small build:
  the parser does not change, only the submit-and-collect handshake.
- **Widening the audit cache to four calls.** The plan assumed the audit key
  would serve all four. Reading the code says it will not: the story writer's
  input includes the funnel walk and the ranked leaks, and **none of that is in
  `auditKeyFromContent`**. Caching the story under the audit key could serve a
  story built on a different funnel walk — §19's class pointed at a new door.
  Each cached call needs its own key over its own inputs, which is a bigger
  build than the plan allowed for, worth ~$8 a month, and only on re-runs. Not
  something to ship the night before a fifty-lead run.

### What the falsification runs found in the harness

- **The runner read `tail`'s exit code, not the gate's.** Two client
  falsifications came back STILL GREEN against a wire that is genuinely
  guarded — the recorded harness-that-lies class, committed here by piping the
  gate through `tail` inside a command substitution. Both went red on their
  named assertions once the pipe was removed.
- **The first calling-mode fixture settled at stage 1**, so the scenario would
  have reported a clean pass having exercised nothing. The cause was not the
  model's answer: the page TEXT names the owner, so the roster reader (code, not
  the model) found the title and settled on authority alone. The fixture now
  serves a business that names nobody, which is the state in which the paid wave
  is actually bought.
- **An equality assertion that was measuring the fixture's own name.** The
  calling-mode and control leads differ by two characters of homepage text —
  their own company name and host — so demanding equality failed a correct
  build. It asserts a full read on both sides instead, and says why equality
  cannot be used.
- **One revert went red at the wrong gate.** Removing the early-gate guards
  fails the boot check, so `/healthz` never goes green and servercheck cannot
  start — a RED that proves the boot check and says nothing about the
  end-to-end assertion. Re-run with the source needles removed as well, leaving
  a build that boots GREEN and is behaviourally broken, and scenario D went red
  on exactly its own two sentences.
- **A revert script that matched two places.** The unlinked-page wire already
  had a guard from an earlier round, so the naive revert hit both the production
  line and the check's own needle. Retargeted at the full production line; both
  guards then went red, which is stronger than one.

**HONEST SHAPE.** None of this has run against a live lead — the last live run
is what these defects were read out of. The eponymous settle is diagnosed rather
than fixed: the next run's `stage 1 did not settle` line is what answers it. And
the Anthropic figures above come from ONE lead, so the steady-state number is
arithmetic over a measured first call, not a measured second one; a fifty-lead
batch settles it.

**`index.html` changed (the calling-mode tick box and the request field), so
this needs a Netlify deploy**, and the contract is 20260905 on both sides.

---

