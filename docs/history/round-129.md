# §129 — the contact list produces addresses you can actually send to — 2026-09-09
Written 2026-09-09 for docs/history (one file per round; CLAUDE.md carries no history). Not a moved section: verify-split.sh skips it.

## 129. the contact list produces addresses you can actually send to — 2026-09-09

Vin, on the blocker: *"we need verified emails this is a big blocker for our
email sequence myemeialverifer api runs out of creidts very fast not scalable or
suystainable we need somehting free."* And on what done means: *"getting high
quality leads on a lot of the reads we do so a high likleyhood of each batch
having a lot of sendbale leads. also i want to be able to send 100 leads a day
eventually but volume and good volume is importannt."*

A live ten-lead contact read on 2026-09-09 produced ten owner names, ten phone
numbers and **zero addresses the operator could send to**. The Find tab works;
the email motion had no input at all. This round is about who we can reach, not
what we tell them. No finding, no email copy and no scoring rule for what to say
is touched.

### What was actually wrong (four things, none of them the one we assumed)

The verifier was **not** out of credits. It is 100 free checks a day and credits
never expire (`src/all.js`). It was being spent at up to thirteen a lead.

1. **The screen was harsher than the truth.** `emailVerifiedRow` counted only
   published or SMTP-confirmed addresses, so five leads whose addresses the
   engine had already cleared showed as "With email 0", and the Move-to-Research
   button therefore offered nothing.
2. **No published address was ever found**, because the free page reader stopped
   the moment a team page named an owner. On a practice that names its founder on
   `/about`, `/contact` was never fetched — and the address lookup needs a
   different page than the owner lookup.
3. **The size lookup took 20 of the run's 30 Firecrawl credits and found nothing
   on 5 of 7 leads.** It was bought whenever size was not already "measured", and
   the bar for measured was a team page of six or more, so a practice listing
   four people on its own site still paid for a directory search that could not
   answer.
4. **`'{first}'` was not a pattern name.** Two sites wrote a token
   `buildCandidates` does not know, so the learned-pattern fast path was dead and
   the bad token rode into the contact cache. Fixed first, because a durable
   table must not inherit it.

### Vin's rulings (interview, 2026-09-09)

1. Owner first, then another decision maker, then a shared inbox as last resort.
2. **No invented confidence score.** He asked directly whether a 1-to-10 score
   could be honest. For the case that matters — a constructed first-name address
   on a small practice — it cannot: nothing on their website says how they set up
   their mail. He chose measurement over a number.
3. Hunter: free plan only (~50 lookups a month). Its home is the research route.
4. Sends come from a separate outreach domain.
5. Spend the free 100 a day well rather than buying more.
6. Remember per-domain mail facts in the database.
7. Read the contact page free, buy it when free fails, funded by the size cut.
8. Sweep the unconfirmed nightly, and sweep the existing backlog.
9. A shared inbox gets its own email shape, no personal greeting.
10. 50+ leads a day now, 100 eventually.

### What shipped, in ship order

**P5 — the card stops lying.** `emailSendableRow` beside `emailVerifiedRow`
(the word "verified" was NOT widened); the card splits three ways — confirmed,
more we can send to, held back — and the bulk-move button reads sendable.
`index.html` changed, contract bumped to 20261009.

**P2 — published-address yield, at zero verifier cost.** The free read now stops
only once a contact page has also been read, or none remains. `pickFindPages`
round-robins the intents on the free path so a contact page is always in wave
one, and the corpus is sorted separately by the rank table. A third mode,
`'unfound'` (the new default), buys the contact page only when the free read
produced no address and the site answered — not `'always'`, which spends about
five credits on every lead including the solved ones. The `FIND CONTACT` line
now prints the address source.

**P4 — the size lookup restricted.** `sizeSettledSmall` beside `sizeMeasured`:
a team page of three to five is a measured floor that already answers the only
question asked, and a `'solo'` trade cannot be over the cut by construction.
`sizeSecondQueryWorth` reads the RAW review count — the agent refused the brief's
bare deletion of `_rv <= 0`, because `signals.reviewCount` is `null` when nothing
was measured, `Number(null)` is 0 and 0 is finite, so the bare fix would have read
"never looked" as "measured zero". A veto on the `'mixed'` capacity class was
rejected: that bucket means "one truck or twelve" and holds Electrical and
Plumbing alongside Dental.

**P1 — a verifier budget that survives 50 leads a day.** `domain_mail_facts`
persists the accepts-everything verdict, the mail host and the confirmed pattern;
each fact carries its own clock (90/90/30 days) and past it reads as "we do not
know", never as "we measured no". The UNKNOWN verdict is never written at all —
it is a fact about the probe's moment. `api_day_spend` holds the day's count,
seeded at boot, so a slept instance resumes the day instead of spending the
allowance twice: `verifierMayTry` read the *latch*, and the latch was only ever
set by hitting the wall and cleared by every restart. Four places stopped
spending where they could not change an answer — the catch-all verdict is bought
at the moment a candidate is accepted rather than up front on every lead; the
waterfall guesses twice not five times; the shared-inbox upgrade costs one check
or none instead of six on leads that already have an address; and a host that
stalls probes by design is read free from DNS and skipped, with the row saying
why. Worst case per lead 13 → 9; a 50-lead day ~340 → ~70-75 checks.

*Deviation, deliberate:* the spec said buy a **single** nonsense probe on a hit.
Two that must agree were kept, because one sample would re-earn the recorded
dtaylorcpa.com bug (the same server called "normal" at 01:38 and "catch-all" at
02:48) and would delete a guard `ADDRESS ROUTE CHECK` pins. The saving came from
buying lazily, not from buying less, so the arithmetic is unchanged.

**P3 — the false blocks.** `looksLikeJobTitle` refused any title over six words,
and "Owner and founder, Doctor of Dental Surgery" is seven — and the caller
*filters rows* on it, so the dentist who owns the practice was deleted along with
his title. The cap now counts the words that describe the job, after a
comma-separated credential tail comes off; an eight-word line of copy is still
refused. The two eponymous rules printed the same "named after X" sentence on
either arm (one matches the surname, the other also a first name in the domain);
there is one rule now that reports which arm matched. `_unvouchedSendGuard` keeps
its block but adds `verifyToSend`: both recorded bounces came out of the
eponymous branch on owners who *were* vouched, so the guard was inert on both and
what caught them was the send boundary. An unvouched constructed name now gets one
check there instead of deletion, and an `unknown` answer does not send.

### Deliberately not built

Lowering `DM_AUTHORITY_FLOOR` (the print gate, not the send gate; twelve readers,
four pinned checks). `FIND_EMAIL_FIRECRAWL='always'`. Off-domain addresses from
the free extractor, which admits a webdev's or an insurance broker's inbox.
Hunter in the contact read. **A confidence score of any kind**, per ruling 2.
`pattern_source` exists as a column but is not written: threading a third argument
through `rememberPattern` would break two pinned needles for no behaviour today,
and the column existing means adding the write later needs no SQL. `verifier` is
in the budget table but NOT in route admission — the four existing ceilings gate
our own spend, while the free hundred is an external allowance, and running out
of it costs the *address*, not the lead.

The roster parser returning form labels and city names as people is real but out
of scope: the model rescues every one, so it costs calls rather than leads.

### Proven

`node build.js --check` byte-exact (85,421 lines, CRLF) · `bash ci-gates.sh` all
stages **ALL GATES GREEN** · `BOOT VERDICT: GREEN — 291 checks passed` (284 at
the start of the round; +1 `PATTERN NAME CHECK`, +3 `TITLE CREDENTIAL` /
`EPONYMOUS ARM` / `VERIFY TO SEND`, +3 `MAIL FACTS` / `VERIFIER DAY` /
`CHECK BUDGET`) · `servercheck.js` 205 assertions · **65 reverts in
`round-129-reverts.js`, each red on its own named line.**

Graceful degradation was proven by a run, not on trust: booted against a
PostgREST answering `PGRST205` for everything, the schema probe named both tables,
`VERIFIER DAY` said NOT SEEDED, and the boot was still GREEN; with the fake
PostgREST refusing exactly these two tables, all 205 route assertions still passed.

### Needs your eyes

- **Two `create table` statements to run in Supabase, before this deploys.**
  PostgREST refuses a whole row on one unknown column (§42). Until they exist the
  boot names both tables and the system behaves exactly as today, just with no
  memory. Both are in `.claude/skills/deploy-and-accounts/schema.sql`.
- **`index.html` changed** (wave one), so it needs the Netlify drag-in. One drag,
  not two — wave two did not touch it.
- **A rep now sees an address the ladder could not vouch for**, where the card
  used to say "No usable address found". The row carries the reason and the send
  route refuses it unless the mail server confirms it, so a batch can come back
  "sent 0, failed 1" with a plain reason instead of the lead silently having
  nothing. Intended, but it is the first thing you will notice.
- **Whether skipping the probe on Microsoft 365 domains costs real addresses** on
  a live batch.
- The three new log lines (`MAIL FACTS`, `MAIL HOST`, `VERIFIER DAY`) reading
  right to you.
- **The honest limit:** 100 leads a day does not fit in 100 free checks unless
  roughly two thirds of leads yield a published address. At a 25% yield a 50-lead
  day lands near 100 rather than 75. The residual is almost entirely the
  company-mailbox probe and the nickname pass, which this round did not cut —
  that is the next place to look if a live day still overruns.
- **Nothing here proves a send.** The round ends with addresses that are
  measurements. Whether the sequence delivers, and at what bounce rate, is the
  round after, and it is the only thing that can validate any of this.
