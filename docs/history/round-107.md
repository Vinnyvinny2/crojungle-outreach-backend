# §107 — Forty leads for the rep, seven defects at their roots — 2026-09-02
Written 2026-09-02 for docs/history (one file per round; CLAUDE.md carries no history). Not a moved section: verify-split.sh skips it.

## 107. Forty leads for the rep, seven defects at their roots — 2026-09-02

Vin ran a 40-lead Find + contact batch into Excel for the sales rep, so the rep
has leads while the server.js reorganisation waits, and sent the Render log and
the CSV: *"analyze the logs and the leads and tell us how everything looks out
of 10 ... we ran out of firecrawl credits i thought we were good i had like 118
left."* Then: *"push all of these fixes and fix at the root of the bugs? please
fix at the highest level."* And, on cost: *"are we getting a bunch of info we
are throwing away that can help us produce a better signal?"* — that question
is Round 108, not this one.

The run scored 5/10 on the leads, 6/10 on the signals, 5/10 on the logs. The
118 credits went where the meter said they went: the free read settled the
owner on about one lead in five, every other lead bought the full paid wave
(two web searches, a licence search and a chamber search, ~12 credit slots),
and the meter counted a dozen more credits for searches that were refused.

### What was found

Every defect below was reproduced by executing the real function on the exact
string from the log or the sheet, at `main` f92e380.

1. **A title and a business name reached the sheet as the decision-maker.**
   "Owner-Operator" (a review signature's title in the name slot) and "Synergy
   Ministry" (the business itself) were ranked and won. Five sources feed
   `rankOwnerCandidates` and each validated its own output by its own rule;
   nothing asked, once, whether the string was a person. Two upstream causes:
   the regex backstop's shape B ("Mike Taft, founder") was treated as being
   about OUR company unconditionally, so a testimonial naming a supplier's
   owner passed; and `looksLikeRealName` did not know a ministry, a church or a
   foundation ends an organisation's name. Class: a shape-only name test
   accepts a title ([§104](round-104.md), [§106](round-106.md)).
2. **A template placeholder shipped as a grade-A address.** `mymail@
   mailservice.com` sat in a footer; the placeholder-domain list did not know
   the domain. And grade A ("a person, not a department") was given to any
   person-shaped mailbox, whoever it belonged to — the resolver's name match
   was an unbounded substring test ("ann" inside hannah@), and the grade never
   compared the local part to the owner we had named. Recruiting boxes
   (jobs@, careers@) were picked ahead of info@ when they came first on the
   page. Class: computed-but-not-compared ([§101](round-101.md), [§106](round-106.md)).
3. **A ministry, recovery centres and a memory-care home were read, scored
   and bought a paid owner wave.** Two hand-kept copies of the institution
   rule: the discovery filter knew "ministry", the contact route's
   `ICP_INSTITUTION` did not. And no rule read the one thing a nonprofit
   cannot hide — its own donate page and "501(c)(3)". Class: two copies of one
   rule ([§97](round-097.md)).
4. **Every lead that bought the wave bought all of it.** Stage 2 fired the web
   search and the licence search with `Promise.all`, and the web search fired
   its own two queries the same way, so a win on the first query could not
   stop the credits already in flight. The licence executor already ran one
   query at a time with an early exit — the pattern existed one level down.
5. **`FC PAID [search x4]` printed a dozen times on an empty account.**
   `firecrawlSearch` was the only Firecrawl door that noted its spend at
   dispatch instead of after the answer — and `fcNote` is where the credit
   latch clears. The one probe let through after the cooldown printed FC PAID,
   counted a credit, re-opened every door for the whole process, and came back
   402; the next caller repeated it. That is why the meter passed 118.
6. **The `📇 FIND CONTACT` line printed an address the sheet would never send
   to**, with nothing saying it was blocked.
7. **The `💸 OWNER WAVE` line misread its own sources** (a lead settled free by
   a review signature read as a paid win, because the free-source test forgot
   `google_review_replies`), labelled the regex backstop as the brain, and
   repeated a two-sentence reading guide on all forty leads.

### What changed, at the root

- **One name door.** `ownerNameDoor(name, companyName)` runs on every
  candidate before `rankOwnerCandidates` scores anything: a string made only
  of role words is a title, the business's own name (minus "The") is the
  company, a multi-word string that fails `looksLikeRealName` is not a name; a
  bare first name still passes for `foldFirstNameClusters`. Refusals print
  once per name as `DM/door`. `BUSINESS_TAIL` gains ministry, church, chapel,
  foundation, institute, association, academy, university, college,
  corporation. Shape B of the backstop now reads the words after the role
  through `ownerSentenceIsOurs` (module scope, executed by the check): an
  "of / at / for X" naming somebody else is not ours; no tail stays ours. The
  backstop labels itself `own_website_regex` (weight 30, collapsed with the
  brain and the name test as one homepage), so it can no longer wear the
  brain's label into the settle rules.
- **The owner's name decides grade A.** With an owner named, a tier-1 person
  mailbox is `published_personal` only when `localMatchesName` ties the local
  part to him; otherwise `published_role`, whose sentence now says "not the
  owner's own mailbox". With nobody named, nothing changes. The resolver picks
  by the same rule instead of `.includes`, a recruiting box (`RECRUIT_LOCAL_RE`)
  is picked last among shared inboxes and scored like a careers-page address,
  and `JUNK_DOMAIN` knows mailservice, mailprovider, yourdomain, sample, test
  and their kin. Deliberately NOT done: requiring a confirmed site's addresses
  to be on the site's own domain — a med spa publishing info@ on a second
  domain is a real address ([§97](round-097.md)), and the placeholder list is
  what the live defect needed.
- **One institution list, and a nonprofit read.** `ICP_INSTITUTION` gains
  school district, public school, ministry, ministries, church of / named
  churches, memory care, nursing home, hospice, government agency; the
  discovery filter's private copy is gone and calls `looksLikeEnterpriseByName`.
  "Treatment center" and "recovery" are deliberately NOT on the name list:
  `addiction treatment center` is a searched category and a name rule would
  delete it. Those leads drop by evidence: `readNonprofitEvidence({pages,
  links})` beside `readChainEvidence`, same shape (pure, `measured:false` when
  nothing was read, a denial guard), reads 501(c)(3), tax-deductible, donation
  wording and a /donate page from the pages already in hand, and the contact
  read sets `icpReason='nonprofit'` before the paid wave. The drop line says
  which reason it was.
- **The wave is bought one search at a time.** Stage 2 runs the web search,
  re-checks `settled()`, and only then the licence wave; inside the web
  search, query 2 is bought only when query 1 did not name the owner. Honest
  expectation: the licence wave is skipped only when the web search actually
  settles the lead (two independent sources or an eponymous confirm), which is
  the settle rule Vin owns, not a new one; the inner early exit saves two
  credits on every lead the name query answers.
- **The search door notes its spend after the answer**, like map, scrape and
  batch. A 402 is no longer a paid call, does not count a credit, and cannot
  clear the latch.
- **The two per-lead lines.** `📇 FIND CONTACT` prints `address (BLOCKED:
  reason)` for an address the sheet will not send to. `💸 OWNER WAVE` names
  every free source, and the reading guide prints once per process.

### What the falsification runs found in the checks themselves

Eleven reverts, each alone against the green baseline (274 checks), each RED
on the check named for it, then restored byte for byte (CR count 79594 =
line count):

| revert | red on | the assertion that caught it |
|---|---|---|
| name door returns null | OWNER CORROBORATION CHECK | "Synergy Ministry" ranked as its own decision-maker; "Owner-Operator" ranked alone |
| shape B always ours | OWNER BACKSTOP CHECK | a testimonial naming a supplier's owner is tied to our company |
| grade A ignores the owner | FIND CONTACT CHECK | jane@ for "Bob Smith" graded published_personal |
| mailservice off the placeholder list | FIND CONTACT CHECK | the source needle on JUNK_DOMAIN |
| ministry off the institution list | FIND ICP GATE CHECK | "Synergy Ministry" and "Harbor Light Ministries" survive by name (and STEM MATCH CHECK, for the now-orphaned declarations) |
| nonprofit read blind | FIND ICP GATE CHECK | the 501(c)(3) page is not read as a nonprofit |
| nonprofit verdict not applied | FIND ICP GATE CHECK | the call-site needle on `out.notIcp` |
| stage 2 back on Promise.all | OWNER CORROBORATION CHECK | the source-order rule between `stagesRun = 2` and the licence call |
| search notes spend at dispatch | CREDIT BREAKER CHECK | fcNote appears before the credit-error branch |
| contact line prints a blocked address | FIND ICP GATE CHECK | the call-site needle on `sendable` |
| free-source test forgets signatures | FIND ICP GATE CHECK | the needle on `google_review_replies` |

Two things the first boot caught in the round's own work, recorded as traps:
a function declaration placed after the `try` could not see `domain` and
`loc` declared inside it (SCOPE CHECK, the feature would have thrown on
first use); and a check that took `const queries = [` as its start marker
found an earlier one in the file and scanned a stranger's code (scoped to the
function's own declaration). The shape-B fixtures were first written outside
the block that holds the compiled regex (COULD NOT RUN), and moved.

**274 boot checks green.** `bash ci-gates.sh` all stages. The contract is
20260926 on both sides — `index.html` did not change.

**`index.html` did not change, so this needs no Netlify deploy.** Nothing to
run in Supabase, no env vars. Accounts: the email verifier's free 100 a day
was exhausted in this run (top-up is about $4 per 1,000 at myemailverifier);
a 40-lead batch wants about 250 Firecrawl credits at today's free-settle rate,
fewer once fix 4 and the nonprofit drop are live — the next run's
`💸 OWNER WAVE` lines are the measurement.
