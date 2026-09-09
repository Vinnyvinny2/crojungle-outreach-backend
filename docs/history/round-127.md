# §127 — The page stops talking to the database, sends the access code, and row-level security goes on — 2026-09-09
Written 2026-09-09 for docs/history (one file per round; CLAUDE.md carries no history). Not a moved section: verify-split.sh skips it.

## 127. The page stops talking to the database, sends the access code, and row-level security goes on — 2026-09-09

The second half of the security round (the first, §126, put the keys on
Render and taught the server to ask for a code). Vin: *"hurry it up."* This
round changes the page, the last of the server, and the database, and it is
the round where the exposure actually closes.

### What the page does now

- **It never talks to Supabase.** The database address and the publishable
  key are gone from the source. Leads are read a page at a time, saved and
  deleted through the server's store routes; Settings go out and come back
  through the same door. The halving ladder from §91 (a page that does not
  answer is retried smaller) is kept and executed in `clientcheck`.
- **Every call carries the access code.** One wrapper (`apiFetch`) sends it
  as a bearer from the browser's own storage, and all twenty server calls go
  through it (`clientcheck` refuses a bare `fetch(BACKEND`). A 401 lights a
  red line in the sidebar: *"This page needs the access code. Open Settings
  and paste the code Vin gave you."* A link ending in `#token=<code>` fills
  the code in and strips it from the address bar before the router reads it,
  so the rep can be sent one link and never types anything.
- **It holds no key.** The twelve password fields are gone from Settings.
  In their place: an **Access code** card (Save & test; green when the server
  accepts it, red with the reason when it does not) and a **Keys held on the
  server** card listing each key as *held* or *NOT SET* from the server's
  booleans, so the rep sees which sources are off without ever seeing a
  value. Every request builder stops sending keys; every guard that used to
  read a key from Settings now asks whether Render holds it. The browser-side
  Hunter call (the page used to call Hunter's API directly with the key) is
  deleted; the server does that read. Settings saved by this page are stripped
  of key fields on the way to the browser's storage and again on the server.
- Contract **20261008** on both sides.

### What the server does now

- **A key in a request is ignored.** The one-round fallback of §126 is gone:
  `keysFor` and `readRunKeysFrom` read the environment only, and the gate
  always rewrites the body, so a key pasted into any browser cannot spend.
  Every `KEY_SOURCES` row is an environment key. The credit testers and the
  website finder read the server's key and no longer accept one in the URL
  (one query-string secret remains: the cron's).
- **Refusals name the Render variable**: `ANTHROPIC_API_KEY`, `FIRECRAWL_KEY`,
  `APIFY_TOKEN`, `HUNTER_KEY`, so the rep's screen and the log say what to fix.
- **A live instance with the gate open is red.** On Render (where
  `RENDER_EXTERNAL_URL` is set) `ACCESS CHECK` refuses a boot with no
  `APP_TOKEN`, and a boot whose Supabase key is the anon one; on a laptop and
  in CI both stay warnings. The page beside the server (CI) must carry no
  database key and no bare fetch.
- The row-level-security refusal (42501) now says the true cause: the
  server's key is not the service_role one. No policy is ever added for anon.

### The database (Vin's hands, after the drag and the code)

`schema.sql` §127: row-level security ON on all thirteen tables, every grant
revoked from `anon` and `authenticated`, and the thirteen key fields removed
from the Settings row. Then the publishable key and every paid key that ever
sat in that row are rotated. Rounds 16 and 93 turned RLS off because the
server then used the anon key and policies refused its own writes; the
server's key is now the service_role one, which bypasses policies, so that
cause is gone. `what-not-to-do` records the rule.

### The checks

`ACCESS CHECK` gains: the body and the row are ignored (executed), one
query-string secret, the Render conditions, and the page scan as failures.
`clientcheck.js`: no database key or address, no bare fetch, the wrapper sends
a bearer and notices a 401, `#token=` handling, the store routes, Settings
stripped, every `KEY_SOURCES` row an environment key with no page field and
no payload; the leads read is executed through a fake store route.
`servercheck.js`: every spending scenario boots with the keys on the fake
Render; a fourth boot with no key on Render (and a key in the body and the
Settings row on purpose) proves research, the sync route, the contact read,
the read run and the credit tester all refuse by name and spend nothing.

### What the falsification runs found

FALSIFICATION_PLACEHOLDER

### Deploy (one sitting, in this order; each step works with the one before)

1. Render: add the keys you have (`ANTHROPIC_API_KEY`, `APIFY_TOKEN`,
   `HUNTER_KEY`, `THEIRSTACK_KEY`; confirm `FIRECRAWL_KEY`,
   `MYEMAILVERIFIER_KEY`) and `ALLOWED_ORIGINS`. The old page keeps working.
2. Netlify: drag this round's `index.html` in. Settings → paste an access code
   (32+ random characters) → Save & test is red (the server has no code yet).
3. Render: set `APP_TOKEN` to the same string. After the restart, Save & test
   is green. Send the rep `https://<netlify host>/#token=<code>` privately.
4. Supabase: run the §127 block of `schema.sql`. Rotate the publishable key
   and every paid key in the dashboard; update the Render variables.

Rollback: delete `APP_TOKEN` (one restart); re-drag the §126 page until step
4 runs; step 4's inverse is in the SQL comment.
