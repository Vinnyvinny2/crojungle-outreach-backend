---
name: knobs-and-env
description: "Every environment variable and daily budget knob on Render - FC_DAILY_BUDGET, PLACES_DAILY_BUDGET, ANTHROPIC_DAILY_BUDGET_USD, APIFY_DAILY_BUDGET, DATAFORSEO_LOGIN/PASSWORD, APIFY_MAX_REVIEWS, REVIEW_CORPUS_CHARS, APIFY_ACTOR, SITUATION_EFFORT, PAGESPEED_KEY, RENDER_ENV, FAKE_UPSTREAM - with defaults, what each does, and what breaks when it is unset or sized for the wrong plan. Use when a log shows a budget refusal or 'no position on this run', a lead has no search position, or a setting needs changing."
---
# Knobs and environment variables

**Goal:** List every setting the server reads, its default, and what goes wrong when it is missing or set for the wrong plan, so a refusal in a log can be traced to the knob that caused it.

Copied verbatim from CLAUDE.md (commit b01d952) lines 10624-10646 (PART 8, the knobs table). The client handshake (CONTRACT_VERSION / CLIENT_CONTRACT) lives in the `ship-round` skill; the one-time Render / GitHub / Netlify steps live in `deploy-and-accounts`. Where every API KEY comes from is declared in code as `KEY_SOURCES` in server.js and checked at boot — search for it rather than guessing.

## The knobs this build added

| setting | default | meaning |
|---|---|---|
| `FC_DAILY_BUDGET` | 1500 | Firecrawl credits per UTC day; 0 = off (loud) |
| `PLACES_DAILY_BUDGET` | 600 | Places calls per UTC day |
| `ANTHROPIC_DAILY_BUDGET_USD` | 20 | model dollars per UTC day |
| `APIFY_DAILY_BUDGET` | 150 | review pulls per UTC day |
| `FAKE_UPSTREAM` | unset | servercheck's test seam — NEVER set in production; fetchtest proves it inert when absent |
| `RENDER_ENV` | unset | shown by /healthz so staging and production cannot be confused |
| `DATAFORSEO_LOGIN` / `DATAFORSEO_PASSWORD` | unset | the REAL Google local pack. Without both, no lead gets a search position at all — see §52. About $0.60-2.40 per 1,000 against Places at $35 per 1,000 |
| `APIFY_MAX_REVIEWS` | 90 | reviews bought per lead. Apify bills per review, so this IS the Apify line |
| `REVIEW_CORPUS_CHARS` | 30000 | how many of them the pain miner actually reads. Raise the pull without raising this and you are paying for reviews no model sees — see §54 |
| `APIFY_ACTOR` | unset | override the Google-reviews actor (owner~name form, validated). The default actor is proven; a cheaper one (~half the per-review rate, −~$22 per 1k leads) is a flip Vin makes deliberately, and the log names which one ran — see §57 |
| `SITUATION_EFFORT` | high | the situation-read's thinking effort (low/medium/high). The priciest call on the lead (~$0.14 of ~$0.27); medium roughly halves the model bill at the cost of story depth — see §76 |
| `PAGESPEED_KEY` | unset | FREE from Google Cloud (enable the PageSpeed Insights API on the same project as `GOOGLE_PLACES_KEY`). Without it `slow_mobile` cannot fire on any lead, and it is the only rung measured from the prospect's own visitors. There is deliberately no Settings field — see §54 |

**Set the budgets to the PLAN, not the default.** The defaults (1500 Firecrawl
credits, 600 Places calls, $20 of model) are a runaway-day safety net sized for
paid tiers. On the free Firecrawl tier (1,000 credits ONE TIME) or inside the
Places free allowance (1,000 Enterprise calls a month), the default ceiling sits
ABOVE what the account can afford — the ledger will happily meter the account to
zero before the ceiling speaks. When the plan is small, set the ceiling small.
