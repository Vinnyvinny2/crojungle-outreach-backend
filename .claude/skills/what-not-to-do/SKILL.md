---
name: what-not-to-do
description: "L3 RULES: The standing prohibitions in this repo and why each exists: no refactor for its own sake, no new or reordered ladder rungs, no email-prompt tuning until real replies exist, no precision bought with words the owner cannot read, never a hand edit of the generated server.js, and never a reorder of src/manifest.js as a tidy-up. Use whenever a change is a cleanup, a restructure, a rewrite, a rung change, a prompt tweak, a file split or move, or anything that touches server.js directly."
user-invocable: false
---
# What NOT to do — the standing prohibitions

**Goal:** After reading this, Claude can recognise a change that would re-earn an old bug and refuse it, naming the rule and the round that earned it.

The first section is copied from CLAUDE.md (commit b01d952) lines 10491 to 10510 (PART 6, "What NOT to do"), with one stale count corrected in place on 2026-09-02 (listed at the end). The second section adds the prohibitions established since: the one from the split itself (rewritten 2026-09-09, when `server.js` became a generated file) and the one from the security round.

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

**Never edit `server.js` by hand; never reorder `src/manifest.js` as a tidy-up** (recorded 2026-09-02 as "do not split server.js", rewritten 2026-09-09, [§128](../../../docs/history/round-128.md)). Since Round 128 `server.js` is GENERATED: `build.js` joins the source files under `src/` in the order `src/manifest.js` lists them, and the result is proven byte for byte — `node build.js --check` exits 1 at the first differing byte, naming `server.js:LINE (src/file:L)`, and `BUILD CHECK` runs the same comparison at boot. So a hand edit of `server.js` is not a change to the program: it is a mismatch that the first line of the static stage and the first boot check both refuse, and the next rebuild silently throws it away. Edit the file under `src/` and run `node build.js`. The manifest order is the program's statement order, and three boot checks assert byte order across it (which declaration precedes which); the 48 counting checks count occurrences across the whole built file, comments included, and `BOOT HEAP CHECK` pins exactly one `readFileSync(__filename` — so a file moved earlier or later "to tidy the list" is a code change that can turn `ACCESS CHECK`'s order line, `node --check` or `tdz.js` red, and it needs the same proof as any other change (a falsification, a green boot). The old reason still stands underneath: about 183 of the boot checks read the program's own bytes through `selfSource()`, whole, and every sibling tool hard-codes the single filename `server.js` — which is why the built file stays in the repo and a check reads the whole built program, never one source file. Moving one asserted function out of the build (a `require`, a second entry point) produces a false RED and a 503 on `/healthz`.

**Do not add a Supabase policy for `anon`, and do not turn row-level security off.** Since [§127](../../../docs/history/round-127.md) the browser never talks to Supabase; the server holds the service_role (`sb_secret_`) key, which bypasses RLS, and every table has RLS on with no anon policy. Rounds [§16](../../../docs/history/round-016.md) and [§93](../../../docs/history/round-093.md) turned RLS off because the server then used the anon key and policies refused its own writes; that cause is gone. A write refused with 42501 means `SUPABASE_KEY` is the wrong key (`SUPABASE KEY ROLE` on the boot log), never that a policy is missing. Likewise no API key goes back into `index.html` or the Settings row: `ACCESS CHECK` and `clientcheck.js` refuse both.

## Corrections made 2026-09-02, measured from the code

The text above was copied from CLAUDE.md and these lines were stale; each was corrected in place and the original is kept here so the split proof still finds it.

> and caused none of this week's failures. The 227 boot checks and the comments above

now: and caused none of this week's failures. The ~160 named boot checks and the comments above — measured: 162 distinct `✓ NAME CHECK` strings in server.js

