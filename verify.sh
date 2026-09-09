#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════
# VERIFY BEFORE YOU BUILD — the fast pre-flight, one line per stage.
#
# Three stages, stopping at the first red:
#   1. node build.js --check          the byte proof: server.js equals src/ built
#   2. GATES=static bash ci-gates.sh  syntax, order, duplicate keys, scope, the notes
#   3. one boot on a free port        the real server under the 256MB heap cap,
#                                     judged by its own BOOT VERDICT line
# ci-gates.sh stays the authority (bash ci-gates.sh runs every stage); this is
# the habit with a name: run it before a change to prove the baseline, and
# after a change before the falsifications. Exit code is the verdict.
# ═══════════════════════════════════════════════════════════════════════════
set -u
cd "$(dirname "$0")"
PORT="${VERIFY_PORT:-4640}"
LOG="${VERIFY_LOG:-$(mktemp)}"

stage() { echo "── $1"; }
red()   { echo "✗ VERIFY RED at $1"; exit 1; }

stage "1/3 node build.js --check"
if [ ! -f build.js ]; then red "build.js is missing — server.js cannot be proven against src/"; fi
node build.js --check || red "build.js --check (server.js does not match src/; run: node build.js)"
echo "✓ 1/3 server.js matches src/ byte for byte"

stage "2/3 GATES=static bash ci-gates.sh"
GATES=static bash ci-gates.sh > "$LOG" 2>&1 || { grep -E "^✗|GATE FAILED" "$LOG" | head -5; red "the static stage (full output: $LOG)"; }
echo "✓ 2/3 static stage green"

stage "3/3 boot: node --max-old-space-size=256 server.js on port $PORT (waiting for BOOT VERDICT)"
PORT=$PORT node --max-old-space-size=256 server.js > "$LOG" 2>&1 &
BOOTPID=$!
VERDICT=""
for i in $(seq 1 300); do
  if grep -q "^BOOT VERDICT" "$LOG" 2>/dev/null; then VERDICT=$(grep "^BOOT VERDICT" "$LOG" | head -1); break; fi
  if ! kill -0 $BOOTPID 2>/dev/null; then break; fi
  sleep 1
done
kill $BOOTPID 2>/dev/null; wait $BOOTPID 2>/dev/null
if [ -z "$VERDICT" ]; then
  tail -8 "$LOG"; red "boot — no BOOT VERDICT was printed (the process died or hung; log: $LOG)"
fi
echo "$VERDICT"
echo "$VERDICT" | grep -q "^BOOT VERDICT: GREEN" || { grep "^⛔" "$LOG" | grep -v "MODEL DECLINED \[selftest\]" | head -5; red "boot (log: $LOG)"; }
echo "✓ 3/3 boot green"
echo "VERIFY: GREEN"
