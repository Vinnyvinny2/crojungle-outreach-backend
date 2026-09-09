#!/bin/bash
# PostToolUse hook, matcher "Edit|Write" (.claude/settings.json). Claude Code runs it
# after every Edit or Write tool call and pipes that call's JSON on stdin:
#   { "hook_event_name": "PostToolUse", "tool_name": "Edit", "tool_input": { "file_path": ..., ... }, ... }
# It reads tool_input.file_path and is silent (exit 0) unless the file is under src/.
# Then: server.js is GENERATED from src/, so the file the tool just changed and the
# built file may now disagree. Prove it in the same minute instead of at CI: run the
# byte proof (node build.js --check) and put its first lines in front of Claude.
# Exit 2 is the only exit Claude sees (PostToolUse: the edit has already happened;
# stderr is fed back to Claude); every other path is silent.
#
# Two different reds, two different headlines — a headline naming the wrong cause
# sends the reader to fix the healthy half (check-writing-traps §6):
#   the build REFUSED a source file (a CR byte, no Goal line, a stray file, a
#     forbidden header string, ...): `node build.js` refuses the same way, so the
#     fix is in the source file it names, never a rebuild;
#   server.js is STALE (src/ now builds something else): run `node build.js`.
# The two are told apart by the word "refus" in the --check output (build.js prints
# "✗ build refused: src/file:N: ..." for every refusal; the stale case prints
# "first difference at server.js:N (src/file:L)" and never says refused).
#
# What this hook does NOT see: an edit made through the Bash tool (sed -i, a
# heredoc, a script) — the matcher is Edit|Write only, so those calls never reach
# it, and a src/ edit made that way must be followed by `node build.js` by hand.
# The backstop for that path is `bash ci-gates.sh` (its first static gate is this
# same `node build.js --check`) and BUILD CHECK at boot, both of which go red on a
# stale server.js; this hook only moves the same red earlier.
set -u
ROOT="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "$0")/../.." && pwd)}"
FILE=$(node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{process.stdout.write(String((JSON.parse(s).tool_input||{}).file_path||""))}catch(e){}})' 2>/dev/null)
case "$FILE" in "$ROOT"/src/*|src/*) ;; *) exit 0 ;; esac
[ -f "$ROOT/build.js" ] || exit 0
OUT=$(cd "$ROOT" && node build.js --check 2>&1) && exit 0
case "$OUT" in
  *refus*) echo "build-check: the build REFUSED a source file after editing $FILE — node build.js would refuse the same way, so fix the file it names (not server.js, which is generated). The refusal:" >&2 ;;
  *)       echo "build-check: server.js is STALE — it no longer matches what src/ builds after editing $FILE. Run: node build.js (then node build.js --check). First difference:" >&2 ;;
esac
echo "$OUT" | head -3 >&2
exit 2
