#!/bin/bash
# PostToolUse hook, matcher "Edit|Write" (.claude/settings.json). Claude Code runs it
# after every Edit or Write tool call and pipes that call's JSON on stdin:
#   { "hook_event_name": "PostToolUse", "tool_name": "Edit", "tool_input": { "file_path": ..., ... }, ... }
# It reads tool_input.file_path, resolves it against the repo root (so "src/x.js",
# "./src/x.js" and the absolute spelling are one path), and is silent (exit 0) unless
# the file is under src/ or IS server.js. Then: server.js is GENERATED from src/, so
# the file the tool just changed and the built file may now disagree. Prove it in the
# same minute instead of at CI: run the byte proof (node build.js --check) and put its
# first lines in front of Claude.
# Exit 2 is the only exit Claude sees (PostToolUse: the edit has already happened;
# stderr is fed back to Claude); every other path is silent.
#
# Three different reds, three different headlines — a headline naming the wrong cause
# sends the reader to fix the healthy half (check-writing-traps §6):
#   server.js was EDITED BY HAND (the tool wrote the built file itself): the change
#     belongs in src/; the next `node build.js` would silently overwrite it;
#   the build REFUSED a source file (a CR byte, no Goal line, a stray file, a
#     forbidden header string, ...): `node build.js` refuses the same way, so the
#     fix is in the source file it names, never a rebuild;
#   server.js is STALE (src/ now builds something else): run `node build.js`.
# The last two are told apart by the FIRST LINE of the --check output: build.js
# prints "✗ build refused: <what it refused>" as its first line for every refusal
# (src/file:N: for a per-file refusal; src/manifest.js and the entry for a manifest one), and
# "✗ build: server.js is not what src/ builds — first difference at ..." for the stale
# case. Only the first line's prefix is keyed on: the stale case echoes the text of
# the differing line, and 900-odd lines of src/all.js carry the letters "refus" (line
# 3 of the banner included), so a match anywhere in the output once sent a stale edit
# to the REFUSED headline.
#
# What this hook does NOT see: an edit made through the Bash tool (sed -i, a
# heredoc, a script) — the matcher is Edit|Write only, so those calls never reach
# it, and a src/ edit made that way must be followed by `node build.js` by hand.
# The backstop for that path is `bash ci-gates.sh` (its first static gate is this
# same `node build.js --check`) and BUILD CHECK at boot, both of which go red on a
# stale or hand-edited server.js; this hook only moves the same red earlier.
set -u
ROOT="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "$0")/../.." && pwd)}"
FILE=$(HOOK_ROOT="$ROOT" node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{const f=String((JSON.parse(s).tool_input||{}).file_path||"");if(f)process.stdout.write(require("path").resolve(process.env.HOOK_ROOT,f))}catch(e){}})' 2>/dev/null)
case "$FILE" in "$ROOT"/src/*) KIND=src ;; "$ROOT"/server.js) KIND=built ;; *) exit 0 ;; esac
[ -f "$ROOT/build.js" ] || exit 0
OUT=$(cd "$ROOT" && node build.js --check 2>&1) && exit 0
FIRST=$(printf '%s\n' "$OUT" | head -1)
if [ "$KIND" = built ]; then
  echo "build-check: server.js is GENERATED — you edited the built file; put the change in src/ and run node build.js (the next build would silently overwrite this edit). The proof:" >&2
else
  case "$FIRST" in
    "✗ build refused:"*) echo "build-check: the build REFUSED a source file after editing $FILE — node build.js would refuse the same way, so fix the file it names (not server.js, which is generated). The refusal:" >&2 ;;
    *)                   echo "build-check: server.js is STALE — it no longer matches what src/ builds after editing $FILE. Run: node build.js (then node build.js --check). First difference:" >&2 ;;
  esac
fi
echo "$OUT" | head -3 >&2
exit 2
