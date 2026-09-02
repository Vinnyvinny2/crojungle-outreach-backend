# §59 — The first credentialed run: DataForSEO answered nothing, and the audits said four things we could not stand behind — 2026-08-24
Source: CLAUDE.md lines 5028-5133, moved verbatim 2026-09-02 from commit b01d952e4f95d7b69686bc2c4063ca2aa0cb7546 (branch backup/claude-md-monolith). Nothing below this line was edited.

## 59. The first credentialed run: DataForSEO answered nothing, and the audits said four things we could not stand behind — 2026-08-24

Vin ran three leads with the DataForSEO credentials finally on the server and
sent the screen, all four exported audits and the whole log, with the standing
order: *"analyze at a sickening level of detail... we need to be doing 50 at a
time by tm with no issues."* Seven falsified server fixes, two falsified client
fixes, and the run's own numbers behind each.

### Every DataForSEO call failed, and the log swallowed their answer

`DataForSEO did not answer usefully - no tasks in the DataForSEO response` on
every rank, organic and duplicate call. Three fixes, because the failure had
three parts:

- **The request sent a location their database has never heard of.**
  `location_name` was handed the lead's city — "San Antonio, TX" — and DFS
  locations must come from THEIR database, where an abbreviated state is not.
  It is `location_code: 2840` (United States) now; the query string already
  carries "in San Antonio, TX", which is exactly what a real searcher types.
- **The parser swallowed DataForSEO's own status.** A task-less response now
  reports their `status_code` and `status_message` — 40xxx names the
  credentials — and "not JSON at all" is reported as the network failure it is.
- **A FREE call settles wrong-password before any lead spends.** Their
  `/appendix/user_data` endpoint costs nothing and answers with the account.
  It runs once after the boot verdict settles, beside the schema probe, and
  prints either the balance or "the CREDENTIALS were refused."

### "#0 of 20 ... both returned #null, so this position is real"

All three leads printed it. On the Places fallback the source refuses to hand
over a position, so both stability samples carry `rank: null` — and
`Math.abs(null - null)` is 0, which the drift branch read as two agreeing
samples. They ARE in the results (the true fact, now said plainly); the
position stays unsayable. The `#0` half was `Number.isFinite(Number(null))`
at the log line — the recorded null-laundering trap, at a printf.

### Four sentences the audits carried that we could not stand behind

- **"Seven of forty recent Google reviews mention the same thing"** — the deep
  mine TIMED OUT, the fallback read the 5 reviews Google exposes, and both
  numbers were invented. Two fixes: the mine call now carries the same
  timeout retry the critique earned in §39 (it was the only Anthropic call on
  the lead path without one), and `stripImpossibleReviewCounts` removes any
  review-count sentence whose numbers fit neither the reviews we READ nor the
  profile's own total — a true count and the profile total both survive, and a
  lead with no measured read strips nothing.
- **"reading the same interchangeable language on all three sites"** — the
  audit asserted the content of competitor sites nobody opened. §52 named the
  audit-narrative claim gap; `stripCompetitorSiteClaims` is its first
  mechanical piece, deliberately narrow: it cuts sentences asserting what
  competitor SITES contain, and the named-competitor spine — measured — is a
  fixture that must survive.
- **"Nothing here is broken enough to lead an email with" beside a composed
  email.** Legacy Bath's sheet carried the dismissal three lines above a leak
  card and an email both built on a harm-74 finding. `buildTheOneThing` now
  replaces the dismissal with the honest version whenever the ladder holds a
  sendable finding; a genuinely clean lead keeps it.
- **"Nothing on the pages we read lets a customer pay over time" on a lead
  whose sitemap lists PRICING pages we never opened.** Its own fact-checker
  called the claim imprecise. `no_financing` now rides the same
  `unreadPricing` guard every other absence carries.

### The money line must fit the finding it sits under

Gurian's leak #1 — miscoded expenses in his reviews — carried "a quote that
sits unanswered is one of those jobs." A per-pillar template reads wrong under
a specific finding, so `review_pain_pattern` and `no_recurring_offer` carry
their own lines now; everything else keeps the pillar's.

### Speed, for the 50-batch

The run's own ⏱ TIME lines: 143–272 seconds of wall clock per lead WAITING for
one of ten Firecrawl browser slots, on a Standard plan that publishes fifty.
The 5000/min tier now maps to 25 browsers (still half the published cap);
`RESEARCH_CONCURRENCY` and the client pool both go 6 → 8; and
`REVIEW_CORPUS_CHARS` goes 30,000 → 36,000 because Legacy Bath bought 23
reviews the model never saw (~$0.002 of Haiku per lead buys them back).

### The screen and the export

- **The batch bar survives a tab switch.** ResearchView owned the run's state
  and unmounted the moment another tab opened — the status bar vanished and
  the "export just this run" option went with it, which is why the run-scoped
  export was missing when Vin exported. ResearchView stays mounted (hidden)
  and the bar rides a portal, so a running batch is visible from every tab.
- **The segment brief renders once per trade, not once per lead.** A 50-lead
  export printed the identical crew-trades brief fifty times. Each distinct
  brief renders once in an appendix; each lead's article carries a one-line
  pointer. `clientcheck` renders two leads sharing one brief and asserts one
  body and two pointers — falsified in both directions.

### What the falsification runs found in the harness itself

Two reverts reported STILL GREEN on the first pass: the review-count fixture
was covered by a second redundant branch (the recorded two-fixes-hide-each-
other class — the revert now kills the whole stripper), and a revert that
unbalanced a regex crashed the boot before any verdict printed, which the
harness read as green. A falsification harness that cannot see a crashed boot
proves the opposite of what it appears to prove; it reports NO VERDICT as its
own failure now.

**226 boot checks green.** Nine falsifications, each red alone.
**`index.html` changed, so this needs a Netlify deploy.**

---

