# Glossary of gate and boot output

| Line | Means |
|---|---|
| `── node xyz.js` | ci-gates.sh starting one gate |
| `✗ GATE FAILED (exit N): <command>` | that gate's process exited non-zero; its own output above says why |
| `✗ GATE FAILED: the boot never printed a BOOT VERDICT` | the server died or hung before the checks settled — a NO VERDICT, not a red; read the last 15 lines it prints (a stray process on the port, a missing package, a syntax error) ([§59](../../../docs/history/round-059.md), [§76](../../../docs/history/round-076.md)) |
| `BOOT VERDICT: GREEN` | every counted check printed ✓, the one allowlisted ⛔ was the expected one, at least 150 checks were counted, and no async check was still pending ([§48](../../../docs/history/round-048.md)) |
| `BOOT VERDICT: RED` | at least one ⛔ that is not allowlisted, OR fewer than 150 checks counted (a recorder that sees almost nothing must read as broken, never healthy) |
| `⛔ MODEL DECLINED [selftest]` | EXPECTED — the one red the boot allowlists by name; it is not a failure |
| `⛔ <NAME> CHECK: …` | a real failure; the sentence names what was measured |
| `⛔ <NAME> CHECK COULD NOT RUN — …` | the check threw before asserting anything — usually a renamed function or a needle that no longer matches; treat as red |
| `BOOT MEMORY: … heap NNNMB` | settled heap; `BOOT HEAP CHECK` fails above 200MB because Render crash-loops near 256MB ([§46](../../../docs/history/round-046.md)) |
| `⛔ STALE BUILD — …` | the server's own source does not contain something the boot expects — a half-deployed or half-edited file |
| `✓✓ ALL GATES GREEN (all)` | safe to push |
| `✗✗ GATES RED — do not merge, do not deploy` | at least one gate failed; every failure is listed above it |
| `/healthz → 503 {"status":"checking"}` | the boot has not settled yet (~20-90 s after start); POSTs are refused with `{booting:true}` until it does ([§48](../../../docs/history/round-048.md), [§55](../../../docs/history/round-055.md)) |
| `/healthz → 503 {"status":"red", "failures":[…]}` | red boot; the failures array carries the ⛔ lines |
| `Cannot find module 'acorn'` | packages not installed on this machine — run `npm ci` |
