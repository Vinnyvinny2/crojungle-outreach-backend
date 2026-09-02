---
name: deploy-and-accounts
description: "L2 OPERATIONS: The one-time Render, GitHub, Netlify, staging and Supabase actions that make merge = deploy and stop half-live fixes: the /healthz health check, branch protection on the gates check, linking the repo so netlify.toml publishes index.html, a staging pair with RENDER_ENV, and every CREATE/ALTER statement the server expects (schema.sql). Use when asked why a red build still deployed, why Netlify still needs a drag-in, how to set up staging, or which SQL a SCHEMA PROBE line is asking for."
---
# Deploy and accounts — the one-time setup

**Goal:** After reading this, Claude can name the one-time Render, GitHub, Netlify, staging and Supabase actions that make a merge a deploy, tell whether each is done, and hand over the exact SQL the server expects.

Copied verbatim from CLAUDE.md (commit b01d952) lines 10568-10622 (PART 8, steps 1, 1b, 2, 3). `schema.sql` beside this note collects every CREATE/ALTER block from the round notes, each labelled with its round, because the server's `SCHEMA PROBE` line sends the operator to look for them. The knobs table is the `knobs-and-env` note; the contract number is in `ship-round`.

Three one-time account actions turn the 2026-08-22 build into a pipeline where
a merge to main IS the deploy, and a build that cannot pass its own checks
cannot land. None of them is a code change; until each is done, everything
keeps working exactly as before.

## 1. Render: point the health check at /healthz

Render dashboard → the service → Settings → Health Check Path → `/healthz`.

The endpoint answers 503 until the BOOT VERDICT settles green and 503 forever
if any boot check failed — so with the health check set, Render holds a deploy
on a red build and keeps the PREVIOUS build serving. A red boot stops being a
grey log line and becomes a deploy that visibly did not land. Nothing to
configure in code; the endpoint is already live.

**The honest trade-off.** Render uses the same path for deploy gating AND for
runtime monitoring. Deploy gating is pure upside: a red build never starts
serving. Runtime is the edge case: if a LIVE service crash-restarts and a
flaky check happens to go red on that one boot, the service stays 503 until
the next restart — there is no previous build to fall back to at runtime.
That trade is accepted deliberately: every check in the file exists because
its failure shipped something false, and serving with a failed truth gate is
the worse outcome. A crash restart also re-runs the checks with POSTs held
(the boot-window gate), so the ~20-second window costs retries, not leads.

## 1b. GitHub: make the gates a merge BLOCKER, not a report

CI runs on every PR and every push to main — but GitHub only refuses a red
merge once branch protection requires it. One-time: repo Settings → Branches
→ Add branch protection rule → branch `main` → tick "Require status checks to
pass before merging" → select `gates`. Until this is done the gates are
visibility, not enforcement, and a red PR can still be merged by hand.

## 2. Netlify: connect the repo (ends the hand-deploy)

Netlify dashboard → the site → Site configuration → Build & deploy → Link
repository → `Vinnyvinny2/crojungle-outreach-backend`, branch `main`. The
committed `netlify.toml` does the rest: it copies index.html into `dist/` and
publishes that — never the repo root, which would serve server.js and every
check as public files.

After this, the client half of every merge deploys in the same motion as the
server half — which removes the single biggest structural bug source this
repo has: the server half of a fix going live on merge while the client half
sits on a desktop, the shape that makes a bug look intermittent. Until it is
done, the drag-in keeps working; the toml is inert.

## 3. Staging: a second pair, same repo, one env var

A second Render service and a second Netlify site pointed at the same repo,
branch `staging`. Set `RENDER_ENV=staging` on the Render side — /healthz
reports it, so a screen and a log always say which world they are. Merge to
`staging`, click through the app against real APIs with small budgets
(`FC_DAILY_BUDGET=50` etc.), then merge `staging` → `main`. A bad build costs
nothing and touches no lead Vin is calling.

## How to tell whether each step is done

- Render health check: `curl -s https://<service>/healthz` answers `{"status":"green", …}` with 200 once booted, and a deploy of a red build does not replace the previous one.
- GitHub: the `gates` check appears as REQUIRED on a PR, and the merge button is disabled while it is red.
- Netlify: the site's deploy log shows `mkdir -p dist && cp index.html dist/index.html` from `netlify.toml`, and a merge to `main` produces a Netlify deploy without a drag-in.
- Supabase: `SCHEMA PROBE` in the boot log names nothing missing; `LEAD BENCH` and the query memory report writes, not refusals (row-level security OFF on the tables the server writes, [§93](../../../docs/history/round-093.md)).

## The SCHEMA PROBE line, and what schema.sql covers (verified 2026-09-02)

The boot's `SCHEMA PROBE` log line still tells the operator that each missing table or column "has its exact CREATE/ALTER statement in CLAUDE.md" — that sentence is in `server.js` and was not edited (it is a server change, see `what-not-to-do`); the statements are in `schema.sql` beside this note. The probe expects exactly what `SB_EXPECTED_SCHEMA` declares: the tables `places_query_state`, `lead_bench`, `business_observations`, `call_outcomes`, `lead_pages`, `send_log`, and two columns on `leads` (`held_back_contact`, `corpus_read`). All eight have their statement in `schema.sql`. If a future probe names something not in that file, the SQL is written from the server's own column list and added here with its round pointer — never guessed.
