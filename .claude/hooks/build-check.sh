#!/bin/bash
# PostToolUse hook (Edit|Write). A file under src/ was just changed, so the built
# server.js is stale until `node build.js` runs. Prove it now, in the same minute,
# instead of at CI: run the byte proof and hand Claude the first difference.
# Exit 2 puts the message in front of Claude; any other path is silent.
set -u
ROOT="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "$0")/../.." && pwd)}"
FILE=$(node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{process.stdout.write(String((JSON.parse(s).tool_input||{}).file_path||""))}catch(e){}})' 2>/dev/null)
case "$FILE" in "$ROOT"/src/*|src/*) ;; *) exit 0 ;; esac
[ -f "$ROOT/build.js" ] || exit 0
OUT=$(cd "$ROOT" && node build.js --check 2>&1) && exit 0
echo "build-check: server.js no longer matches src/ after editing $FILE — run: node build.js (then node build.js --check). First difference:" >&2
echo "$OUT" | head -3 >&2
exit 2
