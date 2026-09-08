# §126 — The keys move to Render, the server learns to ask for an access code, and the page gets a door that is not the database — 2026-09-08
Written 2026-09-08 for docs/history (one file per round; CLAUDE.md carries no history). Not a moved section: verify-split.sh skips it.

## 126. The keys move to Render, the server learns to ask for an access code, and the page gets a door that is not the database — 2026-09-08

Vin asked for the security round before the code is reorganised, and ruled
three things: every paid key lives on Render and nowhere a browser can reach;
one shared access code, pasted once; the reorganisation is its own project
after this. This is the first of two rounds. It changes the server only, so
the page the rep has open today keeps working, and nothing here needs a
Netlify drag or any SQL.

### What was found (a read-only survey, 2026-09-08)

- **Every paid key sat in a row anyone could read.** The page carries the
  Supabase address and a publishable key in its own source, and row-level
  security is off on every table (rounds 16 and 93 turned it off because the
  policies were refusing the server's own writes). So the `user_settings` row
  that holds the Anthropic, Firecrawl, Hunter, verifier, Apify, Companies API,
  TheirStack, PDL, NinjaPear, Facebook and Adzuna keys was readable, and
  rewritable, by anyone who viewed the page source. Since round 124 the
  background read runs took their keys from that row.
- **Every route but the cron answered anyone.** No login on the Render URL,
  CORS open to every origin. A stranger could start a read run and spend the
  credit, read every batch's owners and addresses, and rewrite the queue.
- **Four credit testers took the key in the address bar**, and two dead
  testers (`/api/email`, `/api/test-adzuna`) did the same for keys nobody uses
  that way any more.

### What changed (server only)

- **The keys come from Render first.** One table (`SERVER_KEY_ENV`) names the
  thirteen variables. A gate that runs after the body parser rewrites every
  `/api` request so the server's own key replaces whatever the page sent; a
  key in the request is honoured only when Render has none, for this one
  round, so the deployed page keeps working until its key fields are removed.
  The background read run reads the environment before the Settings row, and
  its refusal now names `ANTHROPIC_API_KEY`. `KEY_SOURCES` declares the
  Anthropic key as an environment key.
- **The access code.** `APP_TOKEN` on Render. A gate before every route
  answers 401, in words the rep can act on ("This page needs the access code.
  Open Settings and paste the code Vin gave you."), to any call without it.
  The health check, the root banner, the ask page a prospect opens from an
  email, and the cron are on a declared public list. The compare is constant
  time. When the variable is unset the gate stands open and says so on the
  boot log (`AUTH GATE OFF`) and on `/healthz` (`auth: off`), so a production
  boot with no code is visible rather than silent.
- **CORS by origin.** `ALLOWED_ORIGINS` on Render, comma-separated. A listed
  origin is echoed, an empty list keeps the old open door, and anything else
  gets no header and a 403 on the preflight. The boot-window 503 and the 401
  carry the same headers, from the same helper, so the page never sees an
  opaque network error where a sentence was meant. The `cors` package is no
  longer used.
- **The page's next door.** Four store routes behind the gate: a page of
  leads, an upsert, a delete, and Settings in and out. Settings leave with
  every key field removed and arrive the same way (`scrubSecrets`, one
  declared list), so a key can never again sit in that row once the page
  uses these routes. The response also says which keys Render holds, as
  booleans, so the Settings screen can show "held on the server" without
  ever seeing a value.
- **Housekeeping.** The credit testers read the server's key first; the two
  dead testers are deleted; the boot prints `SUPABASE KEY ROLE` from the
  key's shape (never the value); `.env` is ignored; the stray zip and the
  Railway file are deleted from the repo.

### The checks

`ACCESS CHECK` executes both gates on synthetic requests with the environment
saved and restored: no code with the variable unset passes; with it set, none,
a wrong one, a different length, and one without the Bearer scheme are refused
401 carrying the CORS header; the preflight and every public path pass; a path
that is only a prefix of a public one does not. It walks the router and
refuses any route registered before the gate that is not on the public list,
executes the origin rule on five shapes, sets every key variable and proves
the environment beats the body in all three resolvers, then unsets them and
proves the body still counts, checks the scrub list covers every key the
server reads, pins the gate's registration after the body parser, counts the
query-string key reads (five: the cron secret and the four fallbacks), and
refuses the dead testers by name. `servercheck.js` drives it over the network:
AUTH1, CORS1 and STORE1 (24 new assertions, 198 in all), the 422 names the
Render variable, and the third boot runs with no code and no key in the
Settings row, resumes its run on the environment's keys, and must print
`AUTH GATE OFF`.

### What the falsification runs found

Eleven reverts, each alone against a green baseline, each red on its own
named line of `ACCESS CHECK`: the gate unregistered; the preflight refused;
a body key beating Render's; the settings PUT unscrubbed; a dead tester put
back; the CORS middleware ignoring the list; the driver dropping the
environment; the background read preferring the row; an `/api` path added
to the public list; the public list matched as a prefix; the body rewritten
when Render holds nothing. The first run of the check itself went red under
`servercheck`'s environment, on a synthetic 401 sent with no Origin while
`ALLOWED_ORIGINS` was set: no header was the right answer, and the check
was wrong, so it now sends the listed origin and expects it echoed.

### Deploy (hands, after the merge)

`index.html` is untouched: no Netlify drag, no SQL, the old page keeps working.
On Render, add `ANTHROPIC_API_KEY`, `APIFY_TOKEN`, `HUNTER_KEY`,
`THEIRSTACK_KEY`, `PDL_KEY`, `NINJAPEAR_KEY`, `FB_TOKEN`, `ADZUNA_ID`,
`ADZUNA_KEY`, and confirm `FIRECRAWL_KEY`, `MYEMAILVERIFIER_KEY`,
`COMPANIES_API_KEY` (the values are the ones on the Settings screen today).
Set `ALLOWED_ORIGINS` to the Netlify address. Do **not** set `APP_TOKEN` yet:
the page that sends the code ships next round. Read `SUPABASE KEY ROLE` on
the boot log; if it says `anon`, replace `SUPABASE_KEY` with the
`sb_secret_` key now. Next round: the page uses the store routes and the
code, row-level security goes on, and every key that ever sat in that row is
rotated.
