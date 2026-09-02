---
name: gates
description: "DO: Run this repo's checks (bash ci-gates.sh, or one stage: static, checks, fuzz, auditfuzz, e2e, boot, http), read the BOOT VERDICT, and explain every red line in plain English with the bug class behind it and the file to open. Use when asked to run the tests, check the build, see if it is safe to push, or explain a failing gate, a red boot, or a 503 from /healthz."
argument-hint: [stage]
allowed-tools: Bash(bash ci-gates.sh*) Bash(GATES=* bash ci-gates.sh*) Bash(npm ci*) Bash(node *) Read Grep
---
# Run the gates and explain the red lines

**Goal:** After reading this, Claude can run the checks (or one stage), read the verdict, and say in plain English what each red line means, which class of bug it is, and which file to open.

The list of checks is **`ci-gates.sh`** and nothing else — this note never re-lists them, because two hand-kept copies of one list is the disease this repo records most, and `ci-gates.sh` says in its own header that it is the executable truth. What this note adds is how to run it and how to READ it. The reasons written beside CLAUDE.md's gate list are quoted at the end, commands omitted.

## How to run

1. Once per machine: `npm ci` (a fresh container has no packages; the first symptom is `Cannot find module 'acorn'` from a checker, which is the environment, not the code).
2. Everything: `bash ci-gates.sh`. One stage: `GATES=static bash ci-gates.sh` (fast: syntax, reads-before-declaration, duplicate keys, out-of-scope names on both files), `GATES=checks` (fetchT, the PNG scaler, the client contract, the 50-lead batch), `GATES=fuzz` / `GATES=auditfuzz` (thousands of synthetic cases), `GATES=e2e` (the research route driven over a fake network), `GATES=boot` (the real server booted with the 256MB heap cap until it prints `BOOT VERDICT`), `GATES=http` (emails composed over HTTP).
3. It keys on exit codes only and runs every gate even after one fails, so a red run lists every problem at once. The last line is `✓✓ ALL GATES GREEN (<stage>)` or `✗✗ GATES RED — do not merge, do not deploy`.
4. The boot stage is the one that matters most and the slowest (about 20 seconds locally, longer on Render): `BOOT VERDICT: GREEN` is the same fact `/healthz` serves to Render's deploy gate (200 on green, 503 while checking or on red), so a red boot is a deploy that will not land ([§48](../../../docs/history/round-048.md)).

## How to read a red line

- Every failing check prints `⛔ <NAME> CHECK: <sentence>`. The sentence is written to name the live failure that created the check; above the check in `server.js` is a comment recording that failure. Open it: `grep -n '<NAME> CHECK' server.js`.
- Classify it before touching anything, using the `bug-classes` note (an APP defect) or `check-writing-traps` (the CHECK itself is wrong — it happens: a needle that finds itself, a wall-clock ruler on a slow machine, a preference written as an invariant).
- Say three things back: what the check measures, what it saw, and what the consequence for a lead would have been. Not "assertion failed".
- `red-lines.md` beside this note is a glossary of the lines the gate script and the boot can print, with what each actually means.

## Do not

- Never skip, disable or quarantine a check to get green; never set the duplicate-key baseline above 0; never push an empty commit or close-and-reopen a PR to re-run CI (`what-not-to-do`).
- Never read "no errors scrolled past" as green. The verdict line is the only green.
- A check that fails on a slow afternoon and passes on the next run is not a flake to shrug at; the file records those as rulers measuring the dyno ([§39](../../../docs/history/round-039.md), [§55](../../../docs/history/round-055.md)).

## Why the list is what it is

The reasons written beside CLAUDE.md's gate list (commit b01d952, the comment lines of the gate block that starts at line 10389), with the COMMANDS deliberately left out — the executable list is `ci-gates.sh` and it must exist in exactly one place:

> # Run these before proposing any change
>   These two are the only gates that RUN index.html. It deploys to Netlify by
>   hand and nothing in this repo could execute it, so every client change until
>   2026-08-20 shipped on a read-through — which is how nine duplicate-key
>   collisions, seventeen disagreeing request fields and eleven dropped server
>   measurements all reached live at once.
>   Two real boots, six scenarios: the golden lead, a preflight refusal, a dead
>   Apify token, a brain husk, a 402 day, the day ceiling. The seams BETWEEN
>   functions are where every computed-but-not-passed has lived, and until
>   2026-08-22 nothing walked them. bash ci-gates.sh runs this whole list —
>   ONE executable copy, and CI runs it on every push.
>   This was NOT in the gate list for the life of the project, and nothing in
>   server.js ever executed fitWithin either — the only guard was a source regex
>   asserting the CALL SITE exists, which passed on the run that lost every
>   image on a lead. SCREENSHOT SCALER CHECK now runs the real function at boot.
>   The heap cap is not optional. Render's ceiling is near 256MB and on
>   2026-08-18 a build that booted fine here crash-looped there — 47 boot
>   checks had each grown a private readFileSync of this 2.9MB file. Every
>   gate was green on a build that could not start. BOOT MEMORY prints the
>   settled heap; BOOT HEAP CHECK fails the build above 200MB.
