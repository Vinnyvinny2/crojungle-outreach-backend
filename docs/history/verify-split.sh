#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════
# PROOF THAT NOTHING WAS LOST when CLAUDE.md was split (2026-09-02).
#
# The 105 round entries in this folder were CUT out of CLAUDE.md, never
# rewritten. This script re-joins them in their original order and compares
# the result byte-for-byte against the CLAUDE.md saved before the split
# (commit b01d952, kept whole on branch backup/claude-md-monolith). Any
# difference fails loudly. Run it any time:   bash docs/history/verify-split.sh
#
# Steps 1, 2, 4 and 5 hold from the day of the split. Step 3 becomes
# meaningful once CLAUDE.md itself has been slimmed: it then asserts that
# every unique line of the original still exists somewhere in CLAUDE.md,
# docs/history or .claude/skills, apart from the short allowlist in
# dropped-lines.txt (which is printed, so a reviewer can see exactly what
# was let go).
# ═══════════════════════════════════════════════════════════════════════════
set -u
cd "$(dirname "$0")/../.."
BASE="${SPLIT_BASE:-b01d952e4f95d7b69686bc2c4063ca2aa0cb7546}"   # the 105-round split
FULL="${SPLIT_FULL:-fd76271}"                                          # the last complete CLAUDE.md (main after Round 106), for step 3
FAIL=0
ok()   { echo "✓ $*"; }
bad()  { echo "✗ $*"; FAIL=1; }

ORIG=$(mktemp)
if ! git show "$BASE:CLAUDE.md" > "$ORIG" 2>/dev/null; then
  if git fetch -q origin backup/claude-md-monolith 2>/dev/null && git show "origin/backup/claude-md-monolith:CLAUDE.md" > "$ORIG" 2>/dev/null; then :; else
    echo "✗ cannot read the pre-split CLAUDE.md (commit $BASE / branch backup/claude-md-monolith)"; exit 1
  fi
fi

# 1. the saved original is what we think it is
n=$(wc -l < "$ORIG"); b=$(wc -c < "$ORIG")
if [ "$n" = 12295 ] && [ "$b" = 725701 ]; then ok "1. the saved original CLAUDE.md is 12295 lines / 725701 bytes"; else bad "1. saved original is $n lines / $b bytes (expected 12295 / 725701)"; fi

# 2. byte-exact re-join, in the ORIGINAL order (by source line number, not by § number)
count=$(ls docs/history/round-*.md 2>/dev/null | wc -l)
[ "$count" -ge 105 ] && ok "2a. $count round files present (105 from the split, plus any archived since)" || bad "2a. $count round files (expected at least 105)"
JOIN=$(mktemp)
for f in $(for f in docs/history/round-*.md; do s=$(sed -n '2p' "$f" | sed -E 's/^Source: CLAUDE.md lines ([0-9]+)-.*/\1/'); echo "$s $f"; done | sort -n | awk '{print $2}'); do
  tail -n +4 "$f" >> "$JOIN"          # the first three lines of every file are the header added at the move
done
if diff <(sed -n '206,10358p;10655,12295p' "$ORIG") "$JOIN" > /dev/null; then
  ok "2b. the 105 files re-join BYTE-FOR-BYTE to lines 206-10358 and 10655-12295 of the original"
else
  bad "2b. re-joined text differs from the original — first differences:"; diff <(sed -n '206,10358p;10655,12295p' "$ORIG") "$JOIN" | head -20
fi

# 2c. EVERY round file (including ones added after the split) re-joins byte-for-byte to
#     the commit its own header names — so a round archived later is proven the same way
n2c=0; bad2c=0
for f in docs/history/round-*.md; do
  hdr=$(sed -n '2p' "$f")
  a=$(echo "$hdr" | sed -E 's/^Source: CLAUDE.md lines ([0-9]+)-([0-9]+).*/\1/')
  b=$(echo "$hdr" | sed -E 's/^Source: CLAUDE.md lines ([0-9]+)-([0-9]+).*/\2/')
  c=$(echo "$hdr" | sed -E 's/.*from commit ([0-9a-f]+).*/\1/')
  if ! git show "$c:CLAUDE.md" 2>/dev/null | sed -n "${a},${b}p" | diff -q - <(tail -n +4 "$f") > /dev/null; then echo "   ✗ $f does not match commit $c lines $a-$b"; bad2c=$((bad2c+1)); fi
  n2c=$((n2c+1))
done
[ "$bad2c" = 0 ] && ok "2c. all $n2c round files match the commit and lines their own header names" || bad "2c. $bad2c round file(s) differ from their source (listed above)"

# 3. after the slim: every unique line of the original still lives somewhere
if [ "$(wc -l < CLAUDE.md)" -lt 1000 ]; then
  ALLOW=docs/history/dropped-lines.txt; touch "$ALLOW"
  FULLF=$(mktemp); git show "$FULL:CLAUDE.md" > "$FULLF" || { bad "3. cannot read CLAUDE.md at $FULL"; FULLF="$ORIG"; }
  MISSING=$(sort -u "$FULLF" | comm -23 - <(cat CLAUDE.md docs/history/*.md .claude/skills/*/*.md .claude/skills/*/*.sql 2>/dev/null | sort -u) | grep -vxF -f "$ALLOW" | grep -v '^\s*$' | grep -vx -- '---')
  if [ -z "$MISSING" ]; then ok "3. every unique line of the last complete CLAUDE.md ($FULL) exists in CLAUDE.md, docs/history or .claude/skills (allowlist: $(grep -c . "$ALLOW") lines, see $ALLOW)"; else bad "3. lines of the original that exist NOWHERE now:"; echo "$MISSING" | head -40; fi
else
  ok "3. skipped — CLAUDE.md has not been slimmed yet ($(wc -l < CLAUDE.md) lines), so nothing has left it"
fi

# 4. line accounting
moved=$(cat "$JOIN" | wc -l)
[ "$moved" = 11794 ] && ok "4. moved lines = 11794 (10153 from PART 4 + 1641 trailing), remaining in the original = $((12295-11794))" || bad "4. moved lines = $moved (expected 11794)"

# 5. no CRLF crept in
cr=$(cat CLAUDE.md docs/history/*.md | grep -c $'\r' || true)
[ "$cr" = 0 ] && ok "5. no CR bytes in CLAUDE.md or docs/history" || bad "5. $cr lines carry a CR byte"

rm -f "$ORIG" "$JOIN"
[ $FAIL = 0 ] && echo "VERIFY-SPLIT: GREEN" || echo "VERIFY-SPLIT: RED"
exit $FAIL
