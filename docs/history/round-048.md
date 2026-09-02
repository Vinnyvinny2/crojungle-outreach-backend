# §48 — The three tiers: money that can say stop, a build that cannot ship red, and the seams finally walked — 2026-08-22
Source: CLAUDE.md lines 3690-3845, moved verbatim 2026-09-02 from commit b01d952e4f95d7b69686bc2c4063ca2aa0cb7546 (branch backup/claude-md-monolith). Nothing below this line was edited.

## 48. The three tiers: money that can say stop, a build that cannot ship red, and the seams finally walked — 2026-08-22

Vin: *"build 1 2 and 3 at the highest level diagnose at the root and build from
the groundup... Make sure the bill is perfectly flawlessly a 10 out of 10."*
Tier 1 is money, Tier 2 is bugs, Tier 3 is results. Everything below was
falsified individually — 30 reverts this session, each red alone — and the
build ends at **207 boot checks green** plus two whole new gates.

### Tier 1 — never waste money

**Nothing anywhere could say STOP.** A loop, a mistake, or one bad afternoon
ran the accounts to zero with every individual line item correctly logged. Now:

- **One UTC-day ledger, fed by the same four doors the per-lead meters already
  use** — `fcNote`, `notePlacesCall`, `meterAnthropic`, the Apify dispatch — so
  nothing can reach one meter and miss another. Ceilings per service
  (`FC_DAILY_BUDGET` 1500 credits, `PLACES_DAILY_BUDGET` 600 calls,
  `ANTHROPIC_DAILY_BUDGET_USD` $20, `APIFY_DAILY_BUDGET` 150 pulls), enforced
  at ADMISSION — research queue, Find, compose — and never mid-lead, because a
  half-lead is everything spent for an audit nobody gets. A refusal names the
  exact setting that raises it. 0 turns a ceiling off, loudly at boot. HONEST
  SHAPE: this is a safety net, not accounting — the day is UTC, a restart
  resets it, the invoice is the authority.
- **`/api/spend`** answers "what has today cost" with the ceilings beside it
  and a per-operation-kind split — which settles `FC_SCREENSHOT_CREDITS` at
  last: run one lead, read `byKind.screenshot`, compare the dashboard.
- **`leadSpend` rides every research response**, the client merge carries it
  (the executable contract check demanded that the moment the server returned
  it), the pure batch reducer sums it, and the batch bar prints *"this run:
  ~800 Firecrawl credits · 200 Places calls · $5.00 model"*.
- **The preflight gate.** The Apify-403 day is the shape it exists for: fifty
  leads burning at full price around one dead Settings field. Refused before a
  penny moves: a website that cannot be a URL, a missing Anthropic key, a
  missing Firecrawl key on a lead that has a site, a server with no Places key
  (eleven of forty-one signals dark, including both reply-earning findings —
  the §11 silent state). A missing Apify token WARNS once an hour instead of
  refusing or going silent. Deliberately NOT refused: a dead domain —
  `siteConfirmedDown` is a real lead and the pipeline already fails cheap on
  it; and an unreachable-but-existing site — refusing on reachability deletes
  bot-hardened leads, the §14 guard-too-tight failure.
- **The re-run doors carry the price.** The re-run confirm names the audit's
  age and what a cycle costs; the batch's re-audit tick box says what fifty
  re-runs multiply to.

### Tier 2 — a build that cannot ship red

- **`BOOT VERDICT` — one machine-readable fact for "did the checks pass"**,
  instead of three greps that could disagree. A console recorder brackets the
  boot window, counts the same two glyphs boot.sh always counted, allowlists
  the one expected decline BY NAME, settles on the recorded last check plus
  five quiet seconds (180s cap that makes a hanging check LOUD — a check that
  hangs is quieter than one that fails), then uninstalls itself so a lead's own
  ⛔ lines can never flip the build's health. A GREEN verdict counting almost
  nothing reads as broken, never as healthy.
- **`/healthz` serves that verdict**: 503 while checking or red, 200 on green.
  Point Render's health check at it (PART 8) and a red boot stops being a log
  line nobody reads and becomes a deploy that visibly did not land, with the
  previous build still serving.
- **CI: every gate on every push.** `ci-gates.sh` is the gate list made
  executable — ONE copy; PART 6 documents it, this runs it, and
  `.github/workflows/gates.yml` runs it on every push and PR. It keys on EXIT
  CODES only (the recorded harness failure grepped for one glyph while the
  tool printed another), runs every gate even after one fails, and judges the
  boot by the BOOT VERDICT line — the same fact /healthz serves.
- **`netlify.toml` ends the hand-deploy** the day the repo is connected (PART
  8). It publishes `dist/` and never the repo root, because the root would
  serve server.js and every check as public files. Inert until connected; the
  drag-in keeps working meanwhile.
- **`servercheck.js` — the research route DRIVEN, not read.** The server had
  200+ boot checks, every one exercising a FUNCTION, and nothing that ever
  drove a request start to finish — and the seams BETWEEN functions are where
  every computed-but-not-passed has ever lived. fetchT — already the one door
  for every outbound call — gained a test seam: `FAKE_UPSTREAM` rewrites
  non-local hosts to a local fixture server, provably inert without the env
  var (fetchtest asserts both directions). The harness boots the real
  server.js, waits for /healthz to go green (asserting the recorder over real
  HTTP on every run), and drives six scenarios: the golden lead (ladder alive,
  spine built, Place-Details review count, composed email, spend counted), a
  preflight refusal with ZERO network calls, a dead Apify token that thins the
  audit instead of deleting it, a brain husk that 422s, a 402 day (latch, no
  further Firecrawl spend, corpusRead at zero, the cause named in the log),
  and — on a second boot with `FC_DAILY_BUDGET=5` — the lead that crosses the
  ceiling FINISHING while the next one is refused naming the setting.

  **What its first runs caught, in order:** my own invocation masking its exit
  code behind a pipe; FIRECRAWL PACING CHECK correctly refusing the harness
  for configuring a pace faster than the free tier — the guard was right and
  the harness was wrong, so the fake now teaches the gate through its own
  x-ratelimit header instead of overriding it, which means the harness proves
  the pacing relaxation too; and its own assertions aimed at the response's
  top level while the client reads those fields off `brainAudit` — an aim
  error found by the trace it prints for exactly that case.

### Tier 3 — top tier results

- **A real quote no longer dies on an ampersand or an accent.** Two truth
  gates held two identical local copies of the quote normaliser — the
  two-hand-kept-copies disease inside the gates themselves. One module-scope
  canonicaliser now, and it decodes HTML entities (markdown holds "Smith &amp;
  Sons", the model quotes the rendered "Smith & Sons", and the old norm made
  the entity a WORD that split the match) and folds accents (José became
  "jos", Jose became "jose", one letter, whole drop). The rule has not moved:
  the span must exist in what we read, a fabricated sentence still matches
  nothing, and the falsification proves the loosening direction on every boot.
  The sliding window already healed one-word breaks in LONG quotes — the first
  falsification proved my fixtures worthless at that length — so the fixtures
  are the SHORT shape, which is where the recorded live drops were ("BOOK MY
  STRATEGY CALL", four of five words).
- **Every dropped quote names its nearest miss.** "Does not appear on any page
  we read" is true and unactionable; "0 of its 9 words run consecutively in
  the corpus" is the fabrication shape, "8 of 9" is a boundary problem, and
  the difference is the next tuning decision made on evidence.
- **The call-outcome report is finally reachable.** `/api/call-outcomes` has
  grouped every logged call by the finding that opened it since §35, with a
  CSV mode — and nothing in the client could open it, so the one report the
  entire quality question waits on was invisible. A button now, beside Export.
  PART 5 still stands: forty logged conversations is more evidence than this
  project has accumulated in its life, and no code produces it — the button
  after each call does.

### Two doors the refuters would have found, closed first

Found by asking what the new gates do NOT cover, before any independent
verification ran:

- **The synchronous `/api/research` route bypassed both admission gates.** It
  is the same worker with no job wrapper, kept because the client falls back
  to it when `-async` 404s on an old server — and a lead posted there started
  spending with no preflight and no day ceiling. It now clears the SAME gates
  with the same refusal sentences. servercheck drives it live in scenario B:
  refused by name, zero network calls.
- **A lead worked during the ~20-second boot window could flip the verdict.**
  The recorder counts every check glyph the process prints, and a lead's own
  refusal lines (a fact-check refusal, a credit latch) are the same glyphs. The
  root fix is not a cleverer filter: a server that has not settled its own
  checks is not ready to take work. Every POST under `/api/` answers 503 until
  the verdict settles; GETs (healthz, spend, job polls) stay open; a settled
  build — green or RED — takes work exactly as before, because refusing work on
  red would brick a build one flaky check turned red. With Render's health
  check on /healthz, production traffic never sees the window at all.
  `BOOT WINDOW GATE CHECK`, and fuzz.js now waits for the green verdict
  instead of sleeping nine seconds at a door that is deliberately closed.

### What was deliberately NOT built

- **No spend persistence to Supabase.** A safety net pretending to be a ledger
  adds a failure mode to every request; the invoice is the authority.
- **No DNS preflight.** NXDOMAIN is a real lead (`siteConfirmedDown`), and the
  pipeline already fails cheap on it — the map returns empty, so the interior
  reads are never bought.
- **No ranking or copy changes.** PART 6's rule holds: no tuning until real
  replies exist to tune against. Tier 3 here raises the SUPPLY of unique
  material and the visibility of evidence; it does not touch the ladder.

---

