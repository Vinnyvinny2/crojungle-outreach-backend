# Handover checklist — say each one out loud

- [ ] **Is a batch running?** Ask Vin before EVERY merge to `main`, and never merge while a run is in flight. Render replaces the server on every merge - a docs-only merge included - and the old instance is killed with its reads in flight: on 2026-09-03 a wording-only merge (PR #106) landed mid-batch, six reads died, the page hit its three-strike dead-server stop and 17 of 35 leads were never started ([§113](../../../docs/history/round-113.md)).
- [ ] **Render**: does `server.js` change? If yes, it redeploys on merge to `main`; the health check at `/healthz` holds a red boot back (PART 8 step 1).
- [ ] **Netlify**: does `index.html` change? If yes, it is dark until dragged in (or until the repo is connected, PART 8 step 2), and the contract number was bumped in BOTH files.
- [ ] **Supabase**: any `create table` / `alter table`? Paste it here and into `deploy-and-accounts/schema.sql`. Row-level security OFF on tables the server writes (the bench and the query memory were refused for weeks, [§93](../../../docs/history/round-093.md)).
- [ ] **Render env vars**: any new setting? Name it, its default, and what happens when it is unset (`knobs-and-env`). An unlinked environment group is why credentials never reached the instance once ([§58](../../../docs/history/round-058.md)).
- [ ] **Accounts**: Firecrawl credits, Apify token, DataForSEO balance, email-verifier credits, Anthropic balance — which one the next run will hit first.
- [ ] **The proof run**: which log lines the first live run must be grepped for, and what number would prove the round worked.
- [ ] **What was deliberately NOT done**, so the next round does not re-derive it.
