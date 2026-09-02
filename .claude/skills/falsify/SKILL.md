---
name: falsify
description: "DO: Prove that a fix's guard actually guards, by reverting that one fix alone against a baseline proven green and demanding the guard go red on its own named assertion: green baseline first, the revert must reproduce the original defect, restore byte for byte, NO VERDICT is never a pass, one revert at a time. Use after any fix that added or relies on a boot check, before it is called done."
disable-model-invocation: true
argument-hint: [fix to revert]
---
# Falsify a fix — prove its guard guards

**Goal:** After reading this, Claude can prove a fix's guard actually guards by reverting that fix alone against a green baseline and getting a red on its own named assertion, and recognise a falsification that proves nothing.

New text (2026-09-02) from the discipline the rounds built one failure at a time; each step cites the round that earned it. The principle: **a guard that stays green with its fix reverted is not a guard**, and roughly one revert in ten comes back green the first time — that is the whole reason for running them ([§90](../../../docs/history/round-090.md), [§101](../../../docs/history/round-101.md)).

## The procedure

1. **Prove the baseline green first.** Boot the current tree (`GATES=boot bash ci-gates.sh`, or the relevant gate) and require GREEN before any revert. A harness whose baseline is already red proves reds too cheaply; refuse to start otherwise ([§74](../../../docs/history/round-074.md), [§93](../../../docs/history/round-093.md)).
2. **Revert ONE fix, verbatim.** Restore the SHIPPED expression exactly as it was, from a byte probe of the live file — not "a line near it", not a design note's memory of it ([§77](../../../docs/history/round-077.md), [§87](../../../docs/history/round-087.md)). Keep CRLF (`server.js`) and LF (everything else); the harness once flattened 64,887 line endings and made every run red ([§74](../../../docs/history/round-074.md)).
3. **Run the guard and demand the original symptom.** The check must go red on ITS OWN named assertion, and the reproduced failure must be the one the fix was written for. Reverting a comma while a later block recomputes the answer proves nothing ([§45](../../../docs/history/round-045.md)); a revert covered by a sibling fix leaves the fixture green — split it so only the mechanism under test can save it ([§44](../../../docs/history/round-044.md), [§95](../../../docs/history/round-095.md)).
4. **Restore byte for byte and verify** (`git diff --stat` empty, or `cmp`). A killed run once left a revert applied and the next pass ran on a broken tree; a restore once wrote into the wrong directory ([§70](../../../docs/history/round-070.md), [§93](../../../docs/history/round-093.md)).
5. **Repeat for each fix separately.** Two fixes reverted together hide each other.
6. **Report each revert as RED (guard fired on its named assertion), GREEN (the guard did not guard — fix the check, then re-run), or NO VERDICT** (the revert did not apply, the boot died, the port was invalid, the anchor matched twice). NO VERDICT is never a pass ([§76](../../../docs/history/round-076.md), [§86](../../../docs/history/round-086.md), [§90](../../../docs/history/round-090.md), [§98](../../../docs/history/round-098.md)).

## What the harness must do mechanically

- Key on exit codes, never on glyphs — the recorded harness grepped for ⛔ while the tool printed ✗ ([§44](../../../docs/history/round-044.md)).
- Refuse a revert that matches zero or two anchors ([§98](../../../docs/history/round-098.md)).
- Report a boot that never prints `BOOT VERDICT` as NO VERDICT, not RED ([§59](../../../docs/history/round-059.md), [§93](../../../docs/history/round-093.md)).
- Prefer a CHECK line's failure over the expected `MODEL DECLINED` notice when naming the cause ([§93](../../../docs/history/round-093.md)).
- Run from the repo root with absolute paths; a stray `cd` sent an edit at a stale copy and reported "applied 3" ([§93](../../../docs/history/round-093.md)).

## What a green revert usually means

The check tested the function and not the wire (`check-writing-traps` §2); the fixture could pass either way (§5); the needle found itself (§1); or the mechanism is unreachable and should be deleted rather than guarded (`bug-classes`, "a mechanism no fixture can reach rots", [§66](../../../docs/history/round-066.md)). Fix the CHECK, re-run the revert, and only then call the fix done.
