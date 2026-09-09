# §128 — server.js becomes a generated file: one source folder, a build that proves the bytes, and the verification order every round follows — 2026-09-09
Written 2026-09-09 for docs/history (one file per round; CLAUDE.md carries no history). Not a moved section: verify-split.sh skips it.

## 128. server.js becomes a generated file: one source folder, a build that proves the bytes, and the verification order every round follows — 2026-09-09

Vin, on the file the agent works in: it is slow and unreliable on it, edits
land in the wrong place, half-edits ship; his friend's picture of the code
was *"a road with a car, a car, then a Boeing 747."* And the rule for the
work: nothing built on an unproven baseline, and nothing reported done that
a machine or a person has not checked — *verify before you build.*

This round changes how the code is FILED and nothing about what it does.
Nothing the rep or a prospect sees changes: the built program is the
monolith plus six header lines and one new check (`BUILD CHECK`), byte for
byte otherwise, and a compare proves it every round.

### What was found

- **The agent cannot hold the file.** `server.js` is about 84,000 lines in
  one scope. Every change meant reading a file no context holds whole, so
  an edit was aimed by search and landed where the search matched — the
  wrong-place edit and the half-applied edit this archive records more than
  once ([§77](round-077.md), [§93](round-093.md)).
- **The file cannot simply be split.** About 183 of its boot checks read the
  program's own bytes, 48 count occurrences across the whole file, several
  assert the order of declarations, and `BOOT HEAP CHECK` refuses a second
  read of the file's own name; eleven tools open `server.js` by name. A
  runtime loader would have had to re-aim every one of them — the reason
  `what-not-to-do` said no to a split since 2026-09-02.
- **A build step re-aims nothing.** Join small source files, in a declared
  order, into exactly today's file. Every check and tool keeps reading the
  one built file; the agent edits the small ones.

### What changed

- **`src/` is the source; `server.js` is generated and stays in the repo.**
  `build.js` joins the files `src/manifest.js` lists into `server.js`,
  turning each source newline into the CRLF the checks expect. Today the
  manifest lists one file, `src/all.js`: the whole program with its CR
  bytes stripped and a six-line header on top of the SAME file — so a built
  line and its source line carry the same number (`src/all.js:L` is
  `server.js:L`; `node build.js --where LINE` confirms it). Against the
  pre-split `server.js` on `backup/server-monolith` every line moved down
  by six up to the `BUILD CHECK` block and by six plus that block's length
  after it (eighty-seven at this writing), so a line number quoted in an
  earlier round note or an old map is that file's. The
  rule is `node build.js --where N`, never arithmetic — and it stops being
  one number at all once Round 129 cuts the file. Render, CI and every tool
  run unchanged.
- **The bytes are proven, twice.** `node build.js --check` compares the
  built file to the sources in memory and exits red at the first differing
  byte, naming `server.js:LINE (src/file:L)`; it is the first line of the
  static stage. `BUILD CHECK`, the first boot check, runs the same walk at
  boot and says "server.js is generated: edit src/" when it fails. A hand
  edit of `server.js` is therefore red at the first gate and red at boot.
- **Every source file is shaped like a skill note.** One job, at most about
  800 lines (the cap is applied once the manifest lists more than one file,
  so from Round 129), LF only, and a header in the house shape: a department
  and job line, a `Goal:` the way every skill opens, what it owns, what it
  defines for others, and which checks guard it. What the build REFUSES of a
  header is narrower and exact: no header comment at all, no `Goal:` line
  (one starting `// Goal: after reading this file, Claude can`), a forbidden
  string (one the counting checks scan for), or a first source file whose
  first line is not the exact GENERATED banner. The
  department, Owns, Defines-for-others and Guarded-by lines are read by a
  person and by Round 129's header-verification agents, not by the build —
  a header is a claim, and the build does not check it. `src/README.md` is the org
  chart: thirteen plain-English departments (front desk, finding
  businesses, reading people, reading the site, where they rank, the audit,
  the email, the research desk, records, the contact list, inspection,
  shared tools, side desks). Round 129 fills them.
- **The maps name the source file.** `docs/gen-refs.js` now prints every
  server-side line as `src/file:L (server.js:LINE)`, and `node build.js
  --where LINE` does the same for a line any tool reports.
- **Verify before you build, in three layers.** (1) `CLAUDE.md` carries
  four lines for Vin: the file is generated, the verification order, the
  source-file rule, and "Needs your eyes". (2) The tools run without being
  remembered: `bash verify.sh` is the one-command pre-flight (the byte
  proof, the static stage, one boot; one line per stage); `falsify.js` moves
  into the repo, and each round's reverts are committed beside its note
  (`round-NNN-reverts.js`) so the proof can be rerun; a Claude Code hook runs
  the byte proof after every edit under `src/`, so a source edit that forgot
  the rebuild is caught in the same minute. (3) The human validation zones
  are named, and every report ends with them.
- **What this deliberately does NOT do.** No logic moves, no function is
  cut, no check leaves the boot path. The 9,775-line research function and
  the 24,000-line check block are later projects with their own proofs.

### The checks

`BUILD CHECK` (boot, first in the block, synchronous; each source file is
read once as one off-heap Buffer and only one line of it is decoded at a
time, so nothing beyond one line lands on the V8 heap `BOOT HEAP CHECK`
measures, and heapUsed moves by under 2MB); `node build.js --check` first in
the static stage; the refusals inside the build, each naming `src/file:line`
(a CR byte, a BOM, an empty file, a missing or doubled final newline, a line
that is not valid UTF-8 or carries a literal U+FFFD, a manifest that does not
load or lists a path that is not plain and src-relative, an entry not on
disk, a duplicate, an unlisted file, a symbolic link under `src/`, an entry
that is not a regular file, a file that ends on a blank line, a file
over the cap once the manifest lists more than one, no header, no `Goal:`
line, a first file not opening with the GENERATED banner, a forbidden string
in a header — the list in `build.js`'s own header is the authority);
`lint-skills.js --check-refs` keeps the regenerated maps honest; the
`.gitattributes` rules keep `src/` LF and mark `server.js` generated so a
PR review collapses it.

Proof that no logic moved — the command, so a reader reruns it instead of
trusting the sentence: `git diff --stat backup/server-monolith..HEAD --
server.js` is insertions only, 0 deletions (the six header lines plus the
`BUILD CHECK` block), and the built file with those lines cut out is the
monolith byte for byte. The block runs from the blank line above its
`// ══ THE FILE EVERY CHECK READS …` banner to the `}` that closes its
`catch`; `grep -n 'THE FILE EVERY CHECK READS' server.js` lands inside it. The recipe, so
the numbers are never typed by hand:

    s=$(grep -n 'THE FILE EVERY CHECK READS' server.js | cut -d: -f1)        # the banner; the block starts on the blank line above it
    e=$(awk -v s="$s" 'NR>s && /BUILD CHECK COULD NOT RUN/ {print NR+1; exit}' server.js)   # the } that closes its catch
    cmp <(tail -n +7 server.js | sed "$((s-7)),$((e-6))d") <(git show backup/server-monolith:server.js)

prints nothing. `tail -n +7` drops the six header lines, `sed` drops the
block (its built line numbers less six). At this writing the block is
server.js:53639-53719, 81 lines, so the `sed` is `'53633,53713d'`, the
file is 84,148 lines against the monolith's 84,061, and the diff is
87 insertions — numbers that move whenever the block is edited; the
recipe does not. The plan's own copy of this compare says `tail -n +6`, which
leaves header line 6 in and reports a difference at line 1 — use `+7`.

### What Round 129 inherits

- `src/all.js` lines 1 to 3 are the GENERATED banner and become lines 1 to 3
  of the first file the manifest lists (line 1 is pinned: the build refuses
  a first file that does not open with the exact banner line; lines 2 and 3
  are not); lines 4 to 6 (the "whole program" department header) are deleted
  at the cut, so `server.js` will differ from today's from line 4 on —
  expected, and the modulo-headers diff proof carries it.
- Cut by LINE numbers only: `src/all.js:L` is `server.js:L` today, but an
  acorn offset taken on the CRLF `server.js` counts one CR per preceding
  line and is not an offset into the LF `src/all.js`; a slice taken with
  such an offset lands early, mid-statement.
- The compare above uses `tail -n +7`, and its `sed` range is derived, never
  typed; the plan's `+6` is off by one.
- The Owns / Defines for others / Guarded by lines are not mechanical yet;
  the header-verification agents read them.
- The shape of every source file: the header, ONE blank line, then the
  body. The blank line after the header is the monolith's own when the cut
  boundary had one and is inserted otherwise; a file never ends on a blank
  line (the build refuses it and says to move that line to the top of the
  next file, never delete it, because it is a line of `server.js`); and the
  header ends at the first blank line or first non-comment line.
- `docs/gen-refs.js` maps every server-side line through the `whereLine`
  `build.js` exports (no second copy of the arithmetic), and a `layout()`
  refusal stops it loudly (exit 1) instead of writing maps without source
  columns.

### What the falsification runs found in the checks themselves

Twenty-nine reverts in `docs/history/round-128-reverts.js`, run by `node
falsify.js docs/history/round-128-reverts.js` on this tree after the review
fixes below: the baseline proven green first (boot, clientcheck, `--check`,
the build), then each revert alone, each file restored and the restore
verified by a sha1 of `server.js` and `src/**` and by `git status`.
**29 of 29 matched expectation, tree restored and verified byte for byte,
exit 0** (the run's own summary line, from the real tree on 2026-09-09). The
last column is the guard's own line, demanded by `mustPrint`; a red that did
not print it would not have counted.

| Revert | Proof | Went red on |
|---|---|---|
| 1a, 1b: one `server.js` line edited by hand | `--check`; boot | `server.js:7 (src/all.js:7)`; `⛔ BUILD CHECK … server.js:7 (src/all.js:7)` |
| 2a, 2b: `src/all.js` edited, never rebuilt | `--check`; boot | the same two lines |
| 3: a CR byte in a source line | build | `src/all.js:7: CR byte (0x0D)` |
| 4: the final newline stripped | build | `src/all.js:N: last byte … newline` |
| 5: `src/stray.js` not in the manifest | build | `src/stray.js:1: … manifest.js` |
| 6: no `Goal:` line | build | `header has no Goal line` (the `mustPrint`, tightened from a text the no-header refusal also printed) |
| 7a: `src/` moved away | boot | GREEN, printing `⚠ BUILD CHECK SKIPPED` (the honest answer, expected) |
| 7b: `src/` moved away | `--check` | `src/manifest.js is missing` |
| 8a, 8c–8h: each of the seven forbidden header strings | build | `src/all.js:6: header line contains "…"`, naming the string |
| 9: a second `readFileSync(__filename` inside BUILD CHECK | boot | `⛔ BOOT HEAP CHECK: 2 separate reads` |
| 9b: a read of the file through an `fs` alias inside BUILD CHECK | boot | `⛔ BUILD CHECK …` (the pin inside the block itself, which `BOOT HEAP CHECK`'s exact-text count cannot see) |
| 10a: the `--check` line in `ci-gates.sh` commented out | boot | `⛔ BUILD CHECK: the first uncommented gate in ci-gates.sh is "run node --check server.js", not "run node build.js --check"` |
| 10b: `ci-gates.sh` moved away | boot | GREEN, printing `⚠ BUILD CHECK PIN SKIPPED` (expected) |
| 11a: a symbolic link under `src/` | build | `src/link.js:1: is a symbolic link` |
| 11b: a byte that is not UTF-8 (planted as bytes; an anchor in the list is UTF-8 and cannot carry one) | build | `src/all.js:7: not valid UTF-8` |
| 11c: a literal U+FFFD | build | `src/all.js:7: literal U+FFFD` |
| 11d: the banner's `GENERATED` written `Generated` | build | `src/all.js:1: the first source file must open with the GENERATED banner line` |
| 11e: a manifest entry `../all.js` | build | `src/manifest.js: entry "../all.js" is not a plain src-relative path` |
| 11f: the manifest lists `manifest.js` | build | `src/manifest.js: entry "manifest.js" — the manifest may not list itself` |
| 12a: a source file ends on a blank line | build | `src/all.js:N: ends on a blank line` (and where that line goes: the top of the next file, never deleted) |
| 12b: a manifest entry that is a directory | build | `src/d.js:1: is not a regular file` |

Two more by hand, not expressible as a revert, restored with `git checkout`
and `git status` empty afterwards. **8b**: with the header lint bypassed
(`'✓'` removed from `HEADER_FORBIDDEN` in `build.js`) and `✓ FAKE CHECK`
planted at the end of `src/all.js:6`, the build accepted the file, the
rebuilt `server.js` carried the glyph once, and `node docs/lint-skills.js
--check-refs` went red on `pipeline-how-it-works/map.md: differs from a fresh
regeneration` (exit 1): gen-refs counts the fake as a check name and the
committed map disagrees, so the second net holds when the first is cut.
**The hook** (`.claude/hooks/build-check.sh`, fed the JSON Claude Code sends
it): a stale edit on `src/all.js:7` with an Edit payload naming that file
exits 2 with the headline `server.js is STALE` and `first difference at
server.js:7 (src/all.js:7)`; a CR byte planted on the same line exits 2 with
`the build REFUSED a source file`; a clean tree, and an edit outside `src/`
other than `server.js`, exit 0. After the second review, three more by hand:
a stale edit on a line of `src/all.js` containing "refus" prints the STALE
headline, not REFUSED (exit 2, `first difference at server.js:3
(src/all.js:3)`); an Edit payload naming `./src/all.js` is
red the same way (exit 2, the STALE headline); and a hand edit of `server.js:7` exits 2 with
a headline saying `server.js` is GENERATED (`first difference at server.js:7
(src/all.js:7)`). It sees Edit and
Write calls only; an edit made through the Bash tool
is caught by `node build.js --check` at the first gate and by `BUILD CHECK`
at boot, not by the hook.

What the falsification pass found in the checks themselves. Every item came
from the adversarial review that preceded the run (146 agents over the
loader, the harness and the notes: 36 confirmed defects and 5 gaps, all
fixed before the run above); no revert stayed green on the fixed tree.

- **The call-site pin could be satisfied by a comment, or by nothing.**
  `BUILD CHECK`'s second half searched the raw text of `ci-gates.sh` for the
  words, so `# run node build.js --check` kept it green, and an absent file
  skipped it in silence: the comment disguise and the half-check of
  `check-writing-traps` §1 and §2, in a check written the same week those
  were cited. Now the FIRST uncommented `run` line must equal the two-half
  needle, and an absent file prints `⚠ BUILD CHECK PIN SKIPPED` and the ✓
  line says the pin went unchecked. Reverts 10a and 10b are the proof; before
  the fix neither existed.
- **Any red counted as the guard's red.** The harness keyed on exit codes
  and kept no text from a build refusal, so a mis-edited anchor that tripped
  a sibling refusal (or a boot red on any of the other 283 checks) proved
  nothing about the guard the revert named. Every proof now returns its
  output and every revert carries `mustPrint`, the guard's own line; a red
  without it is reported as "RED but NOT on the guard's own line" and does
  not match.
- **Six of the seven forbidden header strings had no revert**, so a list
  that lost an entry, or a loop that stopped after its first, would have
  stayed green. Reverts 8c to 8h.
- **`BUILD CHECK` aliased `fs`** (`const _fx = require('fs')`), so the most
  natural wrong edit inside the block, `_fx.readFileSync(__filename)`, was a
  second read `BOOT HEAP CHECK`'s exact-text count could not see, and
  falsification 9 proved one spelling only. The block calls `require('fs')`
  inline, never through an alias, and revert 9 anchors on the live `verify`
  call.
- **An empty selection was a green run**: a mistyped revert name gave
  `0 of 0 matched`, exit 0, which reads as a passed falsification. Exit 2
  before the baseline now, naming the valid names.
- **The restore was trusted, not verified.** An undo that failed, or a tree
  left dirty after a revert, did not fail the run. A sha1 of `server.js` and
  every file under `src/`, plus `git status --porcelain`, is taken once the
  baseline is green and compared after every revert and at the end;
  `RESTORE FAILED` forces exit 1 whatever the verdicts.
- **Six refusals did not exist**, so nothing could revert them: the decoded
  compare `BUILD CHECK` runs is a byte compare only if every source line is
  valid UTF-8 and carries no literal U+FFFD; a symbolic link under `src/`
  was neither built nor refused; nothing pinned the GENERATED banner to
  line 1; a manifest entry could climb out of `src/` or name the manifest
  itself. `build.js` refuses each by `src/file:line` and reverts 11a to 11f
  prove it.
- **The `src/` moved-away case had one proof, not two.** 7a proves the boot
  says SKIPPED and stays green; 7b proves `--check` is red on the missing
  manifest, so a deploy that shipped `server.js` alone is honest at boot and
  still red in CI.
- **The second review found five more, in the checks and the harness.** The
  aliased-read rule was a comment, not a guard: a read of the file through
  an `fs` alias inside `BUILD CHECK` booted GREEN. The block now mechanically
  refuses its own text containing `__filename` or `readFileSync(`, and revert
  9b proves it. Revert 6's line also matched the no-header refusal, so it is
  tightened to `header has no Goal line`. The harness's baseline build could
  overwrite a hand-edited `server.js` before the run stopped; it now stops at
  the first red baseline kind. The hook's REFUSED/STALE split keyed on a
  substring 922 lines of the program contain, and an edit of `server.js`
  itself was invisible to it; it now keys on the first line's `✗ build
  refused:` prefix and calls a hand edit of `server.js` GENERATED. And the
  doubled-newline refusal would have told the Round 129 cutter to delete a
  line of `server.js`; it now says to move that blank line to the top of the
  next file (reverts 12a and 12b).

### Deploy

Render redeploys on merge; the built `server.js` is what it runs, and its
boot log must show `✓ BUILD CHECK` and a check count one higher than the
last deploy's — `BUILD CHECK` is new and nothing was removed (284 on this
branch, where the Round 127 build printed 283). A `⚠ BUILD CHECK SKIPPED`
line with the old count means `src/` did not ship beside `server.js` and the
deploy is not proven.
`index.html` did not change, so nothing needs the Netlify drag-in for this
round; the Round 127 page has been dragged in. No SQL, no new Render
variable.

### Needs your eyes

Only what a machine cannot prove; everything above is proven by the command
named beside it.

- **Branch protection, first.** Repo Settings → Branches → rule for `main`
  → "Require status checks to pass before merging" → `gates`
  (`deploy-and-accounts` step 1b; still OFF today). Until it is on, the byte
  proof is a red line in CI, not a locked merge — and since this round the
  `server.js` diff is collapsed in PR review (`linguist-generated`), so that
  red line is the only signal before Render. Good looks like: the `gates`
  check shows as REQUIRED on this PR and the merge button greys out while it
  is red.
- **The merge**: say the word; never while a batch runs. Good looks like:
  Render's boot log prints `✓ BUILD CHECK` and `BOOT VERDICT: GREEN` with a
  count one above the last deploy's.
- **The Round 127 hands, what is left**: `SUPABASE_KEY` (the `sb_secret_`
  key) and `APP_TOKEN` are on Render and the deploy that carries them is
  live (`SUPABASE KEY ROLE: service_role` on the boot log); the §127 block
  of `schema.sql` was run; the §127 page was dragged into Netlify. Still
  open: the paid API keys and `ALLOWED_ORIGINS` on Render; the Supabase
  secret key regenerated, because it passed through chat; and, on the live
  page, whether Save & test succeeds and the contact list loads data (your
  last report of "nothing happened / no data" predates the deploy that
  carried the keys). Good looks like: no `AUTH GATE OFF` on the boot log, a
  green Save & test, and rows in the contact list.
- **The names**: do the thirteen department names in `src/README.md` read
  right to you? They become the folders in Round 129.
- Nothing a rep or a prospect sees changed; nothing was spent.
