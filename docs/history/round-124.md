# §124 — The Find stage rebuilt: the queue and the reads move to the server, and a closed tab is no longer a dead batch — 2026-09-08
Written 2026-09-08 for docs/history (one file per round; CLAUDE.md carries no history). Not a moved section: verify-split.sh skips it.

## 124. The Find stage rebuilt: the queue and the reads move to the server, and a closed tab is no longer a dead batch — 2026-09-08

Vin handed over a build spec for the Find tab (*"Build to it exactly"*): two
screens — an unread queue with two exits, a paid read or a free move to
Research, and a dense review table per batch — with the reads running on the
server so that he can *"start a 50-lead read, close the tab entirely"* and come
back to a finished batch. Four questions were his to rule on and he ruled:
**Render stays on the free plan; no Slack; CSV only, no Google Sheet push; one
PR, all at once.**

### What the spec assumed that was not so (reported before code, as it asked)

- **The schema.** There was no `leads.batch_id`. The Find queue was the
  Supabase table `discovered_queue`, one row per lead with the whole company
  object in a jsonb column `extra` — written as a JSON **string** — and the
  browser rewrote the WHOLE table on every action (delete all, upsert all) from
  localStorage. "Move to Research" was a copy into `leads` plus a delete.
- **The background run.** The contact reads ran in the browser: a pool of six
  over `POST /api/find-contact`, one lead per request. Close the tab and it
  stopped. The server had no persisted job of any kind, every merge restarted it
  and lost the reads in flight, and the free instance idles after fifteen quiet
  minutes.
- Smaller corrections on the record: the audit runs on Haiku, not Sonnet; a
  contact read costs **4.3–7.8 Firecrawl credits measured**, so the estimate
  is `count × 5`, never the spec's 1.5; the file is **44 columns with 19 lean**,
  not 37/12; and moving the trigger-lanes and Google-listing controls into
  Settings reverses Round 99's rule that every control that spends lives on the
  Find tab — Vin chose the spec, recorded as his ruling.

### What the system does to a lead now

**The Find press writes the queue on the server.** After the ICP filters and
before the bench is cleared, every scored lead is upserted into
`discovered_queue` with `ignore-duplicates`: a lead the press finds again can
never overwrite a row that already carries its read and its stamps. The
server's own queue and pipeline are merged into the dedupe sets, so the browser
no longer has to remember what it has seen. A failed queue write logs
`⛔ FIND QUEUE`, leaves the bench alone (a served lead must not vanish from
both), and reports `queued: 0` on the payload.

**A read is a row.** `POST /api/read-run {count}` inserts a `read_runs` row
and returns `{runId}` at once. The driver claims the top N unread rows —
readable first (a website or a listing), then the free owner-findable guess,
then the Find score; a missing number sorts below zero — stamps them with the
batch id, and reads them six at a time through the SAME gates as
`/api/find-contact`, in the same order: the name gate (a national brand or an
institution is ruled out, nothing spent), the day ceiling (the run stops
`partial` and says which ceiling), nothing-to-read (a failed read with the
reason), then the shared in-flight counter (`_findInFlight`, so the foreground
route and the background run share one ceiling and never double it). A read
merges into what the row already held (`Object.assign({}, oldExtra, fields)`)
— the wipe guard this project has recorded before — and stamps
`contactReadBuild` with the server's own contract number. After every lead the
run row's counters and `progress_at` move, so the page polls a fact, not a
promise. Cancel is a flag read between draws; whatever was claimed and never
reached goes back to the queue (`batch_id: null`). A run ends `done`,
`partial` (a failed read, Cancel, or the ceiling) or `failed` (the run itself
broke, with the error on the row) — never stuck on `running`.

**The free instance.** While a run drives, the process asks its own public URL
for `/healthz` every four minutes (Render sets `RENDER_EXTERNAL_URL`), so the
instance does not idle. If it sleeps anyway, or a merge replaces it, the next
boot's `resumeReadRuns` finds every run still marked running: one silent for
over an hour is failed as `stalled` and its unread leads released; a live one
is re-driven over the rows it had not answered. So **a merge mid-run now costs
only the reads in flight at that instant** (up to six leads' credits) instead
of the whole batch — the merge rule in `owner-decisions` says so.

**Keys.** A background run has no browser to hand it keys. It reads the
Settings row the app already keeps in Supabase (`user_settings`, the whole
settings object) at run start: the Anthropic key, Firecrawl, the verifier,
Apify, Hunter, the Companies API. Never logged, never stored anywhere else. No
key → the run fails with that sentence. This is one more reason the RLS round
that follows this one matters.

**The page.** Screen A: the unread count (with `N from trigger sources` only
when that Settings switch is on), the scope line with `edit scope` (the trade
and market picker, kept — Round 52's rule that the picker is visible before the
run), the count box with presets 10 · 25 · 50 · 100 clamped to the unread
count, `Read N · ~cr` and `Move N to Research`, then the batches: a running
row with a 2px bar and Cancel, polled every three seconds only while
something runs; the latest batch expanded (Review, Move the verified-email
ones, Move all, CSV, the `19 columns` / `44 columns` toggle, Retry on a failed
run); older batches as one line each, dimmed when nothing is left to decide;
and the archive line. Screen B (`#/find/batch/<id>`, loads cold): the grid
`24px 32px minmax(0,1fr) 122px 58px` so a sixty-character name cannot widen
the table; chips With email · All · No email · Fit 70+, opening on With email
with every visible row selected; failed reads in amber and never hidden; a
bulk bar in normal flow that says `already read · no credits`. The archive is
a read-only list with Restore. The address bar is the view now
(`#/find`, `#/research` …). Every colour, radius and size is the spec's
section 4, held in one object the check compares against the spec's values.
The review row keeps two honest marks the old card carried: an owner the read
could not confirm, and pages that name a different business.

**Moves are stamps, never deletes.** `move-to-research` stamps the rows and
hands the company objects back; the BROWSER builds the pipeline rows
(`leadFromCompany`, `saveLeads` with every added lead, not the last one) —
the server never writes `leads`. `move-unread-to-research` takes the top N by
the same draw order, stamps the move and **never `read_at`**: zero credits.
`rule-out` and `restore` stamp both the row and the company object's flags.
`exported` stamps when and where a row went out (Round 105's *"i have no clue
which ones ive already exported"*).

### What was retired

The browser-side runner (`runContactBatch`), the browser queue
(`cj_discovered_v1` and its wholesale Supabase rewrite), the seen and dismissed
ledger WRITERS (the read-only halves are still sent with a press for one round,
then go), the request builder and the flattening port (`contactRequestBody`,
`contactFieldsFrom` — the server owns both now), the Google Sheet push
(`findSheetPayload`, the Apps Script, the Settings field), the four-tab panel
and its bands. `predictReach` stays; the server's value orders the draw.

### The checks

- **`READ RUN CHECK`** executes the draw order (readable-first is the only
  thing separating the name-only lead with the best numbers from the website
  leads; a null guess sorts below zero; a string `extra` still reads its place
  id), the three statuses, the stall at 59 and 61 minutes, the server's
  `contactFieldsFrom` on a full answer, an empty one and a `notIcp` 200, the
  request port, the keys port, the queue id against the page's own rule, the
  letter rule for "with email" (a grade is a NAME, the flag and the tier arrive
  as text), and the constants' order; and pins the driver's gate order, the
  shared in-flight counter (count == 2), `ignore-duplicates`, the merge in BOTH
  branches that carry a read, the bench guard, the resume call, the self-ping
  URL, the `batch_id: null` release (≥ 3), the routes, and that the move-unread
  route's own body carries no `read_at`.
- **`servercheck.js`** grew a fake PostgREST (host `supabase.example`: an
  in-memory table store behind the slice of PostgREST's grammar the helpers
  send; the two new tables carry the migration's column list and REFUSE an
  unknown column with `PGRST204` the way PostgREST does, so a column the code
  writes and the SQL never added goes red here instead of on Render) and five
  scenarios: **R0** the Find press wrote the queue (skipped honestly when the
  fixture press returns no companies); **R1** three leads claimed, read, stamped
  and finished with no browser attached — the start answers at once, a second
  start is `busy`, the owner off their team page and the published address with
  its grade reach the row, the build stamp equals the contract, what the press
  knew survives the read, the name-only lead with the best numbers is left in
  the queue, the run's meter equals the size lookups bought on the wire and
  nothing else, and the six hand actions (move, a second move moves nothing,
  export stamp, rule out, archive lists it, restore takes it out, move-unread
  with `read_at` still null and zero Firecrawl calls); **R2** Cancel two seconds
  in: `partial`, what was answered is counted, what was never reached is back
  in the queue and nothing stays claimed; **R3** a `read_runs` PATCH that 500s
  ends the run `failed` with the reason and the server is not left busy; a row
  whose stored object is not JSON is one failure in a batch that still ends;
  no key in Settings is refused by name; the server never WRITES the Settings
  row; **R4** (a third boot) a run with no progress for three hours is failed
  `stalled` with its unread lead released, and a run interrupted with one lead
  left resumes to `done` with that lead read and the resume line in the log.
  **174 assertions green.** The first run of R1 went red on the credit
  assertion: the wire saw eleven Firecrawl calls against a meter of twelve
  credits — because scenario I leaves a research job running in the background
  and its scrapes landed in the window. The meter was right; the assertion
  now measures this scenario's businesses only.
- **`clientcheck.js`** lifts the SERVER's `contactFieldsFrom`,
  `readRunCompanyFrom`, the keys and options ports, `queueIdOf` and
  `emailVerifiedRow` from the CR-stripped source and runs the old fixtures
  through them, so a field dropped on either side of the wire fails in the same
  file as before; executes the page's pure functions (lead state, the verified-
  email rule against the server's on eight shapes, the batch card stats, the
  credit estimate, the route parser, the pipeline additions, the tokens, the
  contract equality, the queue id parity); pins every call site (start, cancel,
  review, move + `addManyToPipeline`, move-unread, rule out, restore, export
  stamp, the 3-second poll, the grid, the deep link, the pre-selected With
  email); and refuses the old shapes back (no `rest/v1/discovered_queue`, no
  browser queue writer, no `/api/find-contact` from the page, no runner, no
  sheet). Settings must hold both switches, default OFF, and the Find tab must
  not hold the lanes switch as well.

### What the falsification runs found

**Seventeen reverts, each fix alone against a baseline the harness proves
green first (boot GREEN, clientcheck GREEN), each RED on its own named
assertion, each restored byte for byte.** Eleven on the server: the
readable-first term dropped (`"acbed"` instead of `"cbeda"`); a read that
replaces the row instead of merging (both branches); the bench cleared on a
lost queue write; Cancel keeping its claim; `merge-duplicates` in place of
`ignore-duplicates`; the resume call gone; the self-ping at the wrong door;
the ceiling checked before the name gate; move-unread stamping a read; the
grade read as a letter instead of a name; the stall rule at half an hour. Six
on the page, each red in `clientcheck.js`: the checker-down grade counted as
verified (caught by the parity test against the server's rule); the deep link
gone; the pipeline save pushing one lead of fifty; the page reading a lead
itself through `/api/find-contact`; the trigger lanes on by default; the
review screen opening on All with nothing selected. One revert proved nothing
on its first two tries and said so — its anchor also matched the foreground
route — and went red on the third with an anchor unique to the driver, which
is the record this project keeps: a revert that does not apply is NO VERDICT,
never a pass.

### Migration (run in Supabase BEFORE this server deploys)

The full block is in `.claude/skills/deploy-and-accounts/schema.sql` under §124:
`discovered_queue` created if missing and given `batch_id`, `read_at`,
`read_failed`, `fail_reason`, `moved_to_research_at`, `ruled_out_at`,
`ruled_out_why`, `from_trigger_source`, `reach_predict`, `exported_at`,
`exported_to` and an index on `batch_id`; `read_runs` created; `user_settings`
created if missing; every old string `extra` turned into the object it holds;
and `revoke delete on discovered_queue from anon, authenticated` — because
until `index.html` is re-dragged into Netlify the OLD page still deletes the
whole queue on every action, and nothing on the server ever deletes a row.

### Contract, deploy, hands

`CONTRACT_VERSION` and `CLIENT_CONTRACT` are both **20261006**. **`index.html`
changed, so this round needs the Netlify drag-in, in the same hour as the
merge**: the server half goes live on merge and the old page against the new
server is the shape that makes a bug look intermittent (and the old page
deletes the queue — the revoke is the safety net). Order: (1) the §124 SQL in
Supabase, (2) merge (asks first; a merge mid-run now costs only the reads in
flight), (3) drag `index.html` into Netlify. `RENDER_EXTERNAL_URL` is set by
Render; nothing to add. No Slack. The RLS/security round follows and now
covers `user_settings` too. Live checks after deploy: start a 50-read, close
the tab, reopen — the running row is still moving or the batch is done; the
review opens on With email with every row selected and the bulk count equal to
the visible rows; Move N → Research shows N more and the batch line reads
`N in Research`; move unread → `read_at` null, no `💸` lines; a merge mid-run →
`📖 READ RUN … resumed after a restart` in the next boot's log.
