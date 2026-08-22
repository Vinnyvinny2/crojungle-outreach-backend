#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════
# THE GATE LIST, EXECUTABLE. One copy.
#
# PART 6 of CLAUDE.md documents these gates for a human; this file RUNS them,
# and .github/workflows/gates.yml runs this file on every push. Two hand-kept
# copies of one list is the disease that file is mostly a record of, so: the
# CLAUDE.md list is the documentation, this is the machine, and if they ever
# disagree this one is the one that blocks a merge.
#
# Every gate exits non-zero on failure (that was made true on 2026-08-20 —
# tdz.js and dupkeys.js printed a red X and exited 0 for their whole lives),
# so this script keys on EXIT CODES only. It deliberately does not grep for
# glyphs: the recorded harness failure is a sweep that looked for one symbol
# while the tool printed another, and reported three broken builds as green.
#
# All gates run even after one fails, so a red CI names every problem at once
# instead of one per push.
#
# GATES=static|checks|fuzz|boot|http runs one stage group (default: all).
# CI_BOOT_PORT picks the boot port (default 4590).
# ═══════════════════════════════════════════════════════════════════════════
set -u
cd "$(dirname "$0")"
STAGE="${GATES:-all}"
PORT="${CI_BOOT_PORT:-4590}"
FAIL=0

run() {
  echo "── $*"
  "$@"
  local code=$?
  if [ $code -ne 0 ]; then echo "✗ GATE FAILED (exit $code): $*"; FAIL=1; fi
}

want() { [ "$STAGE" = "all" ] || [ "$STAGE" = "$1" ]; }

if want static; then
  run node --check server.js
  run node tdz.js server.js
  run node dupkeys.js server.js
  run node dupkeys.js index.html
  run node scopecheck.js --selftest
  run node scopecheck.js server.js
  run node scopecheck.js index.html
fi

if want checks; then
  run node fetchtest.js
  run node pngscale.js --selftest
  run node clientcheck.js
  run node batchcheck.js
fi

if want fuzz; then
  run node fuzzcore.js 20000
fi

if want e2e; then
  # The research route driven end to end over a fake network — two real boots,
  # six scenarios, the seams between the functions. See servercheck.js.
  run env SC_PORT=4560 node servercheck.js
fi

if want boot; then
  # ── THE 200+ BOOT CHECKS, JUDGED BY THE BOOT VERDICT ──────────────────────
  # The server counts its own checks (see BOOT VERDICT in server.js) and
  # settles a single machine-readable line — the same fact /healthz serves to
  # Render's deploy gate. This stage asserts that exact line rather than
  # re-counting glyphs, so CI, the health endpoint and a human reading the log
  # are all reading ONE verdict. The heap cap is not optional: a build that
  # boots here without it can still crash-loop on Render's ~256MB ceiling.
  echo "── boot: node --max-old-space-size=256 server.js (waiting for BOOT VERDICT)"
  BOOTLOG="$(mktemp)"
  PORT=$PORT node --max-old-space-size=256 server.js > "$BOOTLOG" 2>&1 &
  BOOTPID=$!
  VERDICT=""
  for i in $(seq 1 300); do
    if grep -q "^BOOT VERDICT" "$BOOTLOG" 2>/dev/null; then VERDICT=$(grep "^BOOT VERDICT" "$BOOTLOG" | head -1); break; fi
    if ! kill -0 $BOOTPID 2>/dev/null; then break; fi
    sleep 1
  done
  kill $BOOTPID 2>/dev/null; wait $BOOTPID 2>/dev/null
  if [ -z "$VERDICT" ]; then
    echo "✗ GATE FAILED: the boot never printed a BOOT VERDICT — the process died or hung before the checks settled. Last lines:"
    tail -15 "$BOOTLOG"
    FAIL=1
  elif ! echo "$VERDICT" | grep -q "^BOOT VERDICT: GREEN"; then
    echo "✗ GATE FAILED: $VERDICT"
    grep "^⛔" "$BOOTLOG" | grep -v "MODEL DECLINED \[selftest\]" | head -10
    FAIL=1
  else
    echo "$VERDICT"
  fi
  rm -f "$BOOTLOG"
fi

if want http; then
  # fuzz.js spawns its own server on port 4900 and composes emails over HTTP.
  run node fuzz.js 500
fi

if [ $FAIL -ne 0 ]; then
  echo ""
  echo "✗✗ GATES RED — do not merge, do not deploy. Every failure is listed above."
  exit 1
fi
echo ""
echo "✓✓ ALL GATES GREEN (${STAGE})"
