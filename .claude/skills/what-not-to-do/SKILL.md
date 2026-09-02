---
name: what-not-to-do
description: "RULE: The standing prohibitions in this repo and why each exists: no refactor for its own sake, no new or reordered ladder rungs, no email-prompt tuning until real replies exist, no precision bought with words the owner cannot read, and no splitting server.js while its boot checks grep their own source. Use whenever a change is a cleanup, a restructure, a rewrite, a rung change, a prompt tweak or a file split."
user-invocable: false
---
# What NOT to do — the standing prohibitions

**Goal:** After reading this, Claude can recognise a change that would re-earn an old bug and refuse it, naming the rule and the round that earned it.

The first section is copied from CLAUDE.md (commit b01d952) lines 10491 to 10510 (PART 6, "What NOT to do"), with one stale count corrected in place on 2026-09-02 (listed at the end). The second section adds the one prohibition that was established during the split itself.

## The four standing rules (verbatim)

**Do not refactor for its own sake.** 30,000 lines in one file is hard to work in
and caused none of this week's failures. The ~160 named boot checks and the comments above
them are the asset — each records a specific live failure and why the fix is shaped
as it is. A rewrite loses that and re-earns the bugs.

**Do not add or reorder ladder rungs.** Done repeatedly; each fix revealed the next
gap in the same layer. The ladder is not the constraint.

**Do not tune the email prompt further** until real replies exist to tune against.
It has been rebuilt four times in two days on the evidence of a simulator that
contradicts itself.

**Do not buy precision with words he cannot read.** Every unreadable phrase in
this system was written to satisfy a truth gate, and each one was a correct local
decision. Three of them in one sentence produced an email its own author could
not explain. When the exact wording is unsayable in plain English, the honest
move is a plain sentence with the uncertainty stated out loud — "you're paying
for clicks the three names above you get for nothing, **if those ads are live**"
— not a vaguer sentence that hides it. The conditional is also a reply: it asks
him something only he knows.

**What "the ladder" means, so the rule above is read as intended (added 2026-09-02):** the ladder is `HARM_LADDER` in `server.js` — the ranked list of measured findings an audit or an email may lead with, one rung per finding, each rung declared in several tables. The rule forbids adding rungs or changing their order without real replies to justify it. It says nothing about fixing how a lead is READ (owner picking, the roster parser, email grades, the export); those are not rungs, and Round 106's owner-pick fix was correct to proceed.

## And one more, recorded 2026-09-02

**Do not split `server.js` into modules.** About 80 of its 161 boot checks read the file's own source through `selfSource()`, which reads `__filename` — one file, whole. `BOOT HEAP CHECK` asserts exactly one such read exists and that `selfSource` is declared with that exact text; the verdict goes RED under 150 printed checks, so checks cannot be moved out of the boot path either; and every sibling tool (`tdz.js`, `dupkeys.js`, `scopecheck.js`, `clientcheck.js`, `fetchtest.js`, `fuzzcore.js`, `auditfuzz.js`, `servercheck.js`) hard-codes the single filename. Moving one asserted function to a second file produces a false RED and a 503 on `/healthz`. A split is a separate project whose FIRST step is redefining `selfSource()` to concatenate a declared list of files and re-aiming those assertions — before a single line of logic moves. Until that step exists, the answer to "should we break up server.js" is no.

## Corrections made 2026-09-02, measured from the code

The text above was copied from CLAUDE.md and these lines were stale; each was corrected in place and the original is kept here so the split proof still finds it.

> and caused none of this week's failures. The 227 boot checks and the comments above

now: and caused none of this week's failures. The ~160 named boot checks and the comments above — measured: 162 distinct `✓ NAME CHECK` strings in server.js

