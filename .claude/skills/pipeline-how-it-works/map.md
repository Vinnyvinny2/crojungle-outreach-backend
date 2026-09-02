# Line map of server.js and index.html

Measured 2026-09-02 at commit b01d952. **Line numbers drift with every edit; `grep -n` the name is the truth, this map is the starting point.** server.js is ~79,000 lines in one file; index.html is ~17,300 lines of `React.createElement` (no JSX, no build step).

## server.js — the shape of the file

| Region | Lines | What |
|---|---|---|
| Boot verdict, /healthz, spend ledger, CORS | 1–470 | `BOOT_STATUS` 122, `CONTRACT_VERSION` 161, `installBootRecorder` 172, `/healthz` 235 |
| Firecrawl/Hunter gates, `fetchT` | 470–1150 | `fetchT` 1111 — every outbound call goes through it |
| Enrichment and evidence sources | 1150–13,000 | Claude route 3748, Firecrawl, Hunter, Google, SMTP verify ~10151, catch-all ~10321 |
| Harm ladder, measurements, composer | 13,000–34,000 | see functions below |
| Contact and email resolution | 32,800–36,500 | `findDecisionMaker` 32880, `findEmailFireproof` 33467, `_findEmailFireproofCore` 33515 |
| Discovery (Find) | 36,500–41,400 | `runDiscovery` 37239, brand lists ~36918, `AD_TAG_SIGNATURES` 38740 |
| Rank / SERP / batch report | 41,384–52,150 | the largest banner region |
| Research routes + job queue | 51,229–52,213 | `preflightResearch` 51255, `runResearch` 51315, `/api/research` 51370, `/api/research-async` 51647 |
| **`app.listen` and ALL 161 boot checks** | **52,213–74,795** | 28% of the file; first check ~53,414, sentinel `FIRECRAWL GATE CHECK` ~73,588 |
| Routes registered after listen | 74,800–78,972 | `/p/:token` 74856, `/api/find-contact` 76796, `/api/send-to-hunter` 77208, `/api/compose-email` 78166 |

## Key functions

| Function | Line | Stage |
|---|---|---|
| `fetchT` | 1,111 | every outbound HTTP call |
| `GP_CATEGORIES` | 5,686 | Find — the searched trades |
| `parseTeamRoster` | 12,480 | Find/Research — owner from a team page |
| `RUNG_PILLAR` / `RUNG_FUNNEL_STAGE` | 14,919 / 15,030 | Audit — declared tables every rung must appear in |
| `HARM_LADDER` | 15,339 | Audit/Generate — the 48 rungs (located by text scan in a check; its declaration string is load-bearing) |
| `resolveMeasurements` | 17,421 | Audit — everything the ladder reads |
| `buildEmailEvidence` | 19,749 | Generate — ASSERT vs CONTEXT split |
| `verifyBrainEmail` | 20,493 | Generate — the last gate before sending |
| `buildProblemList` | 23,463 | Audit — leak numbering |
| `NICHE_BRIEF_EXPECT` | 24,502 | Audit — every category declares its brief |
| `FACTS_RENDER` | 26,168 | Audit — every facts-strip key declares a home |
| `buildFunnelStory` | 26,252 | Audit — the funnel walk |
| `buildFactualSpine` | 26,727 | Generate — the one verified sentence |
| `OWNER_KNOWS` | 27,209 | Generate — what it cost the owner to know |
| `rankHarms` | 27,466 | Generate — opener ordering |
| `findDecisionMaker` | 32,880 | Find/Research — the owner ladder |
| `KEY_SOURCES` | 35,002 | where every API key comes from |
| `CONTACT_RANK_TERMS` | 35,744 | Find — contact ranking terms |
| `STEM_COMPLETE_WORDS` | 36,874 | the declared stem list (regex word-boundary trap) |
| `runDiscovery` | 37,239 | Find |
| `AD_TAG_SIGNATURES` | 38,740 | Research — ad/chat/scheduler markers |
| `preflightResearch` | 51,255 | Research — refuse before a penny moves |
| `readFindIcpSignals` / `findIcpScore` | 75,437 / 75,754 | Find — contact-list signals and score |

## Every Express route

`/healthz` 235 · `/api/spend` 371 · `/` 1144 · `/api/claude` 3748 · `/api/scrape` 3987 · `/api/email` 4011 · `/api/find-website` 4356 · `/api/verify-website` 35967 · `/api/audit-leads` 36013 · `/api/cron/discover` 37118 · `/api/discover` 38563 · `/api/research` 51370 · `/api/research-async` 51647 · `/api/discover-async` 52006 · `/api/discover-job/:id` 52073 · `/api/research-job/:id` 52090 · `/api/session-report` 52156 · **app.listen 52213** · `/p/:token` 74856 · `/api/sending-domain` 75098 · `/api/call-outcome` 75103 · `/api/call-outcomes` 75108 · `/api/export-sheet` 76746 · `/api/find-contact` 76796 · `/api/find-options` 76890 · `/api/firecrawl-credits` 76897 · `/api/hunter-credits` 76918 · `/api/hunter-sequences` 76937 · `/api/hunter-outcomes` 76975 · `/api/test-contact-engine` 77040 · `/api/send-to-hunter` 77208 · `/api/linkedin-drafts` 77720 · `/api/compose-email` 78166 · `/api/diagnostics` 78900.

## index.html

`leadToRow` / `rowToLead` (~200–560) are the ONLY door between Supabase and the app; `CLIENT_CONTRACT` must equal server.js's `CONTRACT_VERSION` (checked by `clientcheck.js`). The file deploys to Netlify by hand, so a client fix is dark until it is dragged in.

## The check scripts beside server.js

`ci-gates.sh` is the one executable list. tdz.js, dupkeys.js, scopecheck.js read the source; fetchtest.js, pngscale.js, clientcheck.js, batchcheck.js execute lifted functions; servercheck.js boots the real server over a fake network; fuzz.js / fuzzcore.js / auditfuzz.js fuzz the gates. Every one hard-codes the single filename `server.js`.
