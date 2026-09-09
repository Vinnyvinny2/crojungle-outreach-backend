# §128 — server.js becomes a generated file: one source folder, a build that proves the bytes, and the verification order every round follows — 2026-09-09
Written 2026-09-09 for docs/history (one file per round; CLAUDE.md carries no history). Not a moved section: verify-split.sh skips it.

## 128. server.js becomes a generated file: one source folder, a build that proves the bytes, and the verification order every round follows — 2026-09-09

Vin, on the file the agent works in: it is slow and unreliable on it, edits
land in the wrong place, half-edits ship; his friend's picture of the code
was *"a road with a car, a car, then a Boeing 747."* And the rule for the
work: nothing built on an unproven baseline, and nothing reported done that
a machine or a person has not checked — *verify before you build.*

This round changes how the code is FILED and nothing about what it does.
Nothing the rep or a prospect sees changes: the built program is the same
file, byte for byte, and a compare proves it every round.

### What was found

- **The agent cannot hold the file.** `server.js` is about 84,000 lines in
  one scope. Every change meant reading a file no context holds whole, so
  an edit was aimed by search and landed where the search matched — the
  wrong-place edit and the half-applied edit this archive records more than
  once ([§77](round-077.md), [§93](round-093.md)).
- **The file cannot simply be split.** About 183 of its boot checks read the
  program's own bytes, 48 count occurrences across the whole file, three
  assert the order of declarations, and `BOOT HEAP CHECK` pins exactly one
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
  after it (sixty-two at this writing), so a line number quoted in an
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

`BUILD CHECK` (boot, first in the block, synchronous, no second copy of the
file so `BOOT HEAP CHECK` is untouched); `node build.js --check` first in
the static stage; the refusals inside the build, each naming `src/file:line`
(a CR byte, a BOM, an empty file, a missing or doubled final newline, a line
that is not valid UTF-8 or carries a literal U+FFFD, a manifest that does not
load or lists a path that is not plain and src-relative, an entry not on
disk, a duplicate, an unlisted file, a symbolic link under `src/`, a file
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
`catch`; `grep -n 'BUILD CHECK' server.js` lands inside it. The recipe, so
the numbers are never typed by hand:

    s=$(grep -n 'THE FILE EVERY CHECK READS' server.js | cut -d: -f1)        # the banner; the block starts on the blank line above it
    e=$(awk -v s="$s" 'NR>s && /BUILD CHECK COULD NOT RUN/ {print NR+1; exit}' server.js)   # the } that closes its catch
    cmp <(tail -n +7 server.js | sed "$((s-7)),$((e-6))d") <(git show backup/server-monolith:server.js)

prints nothing. `tail -n +7` drops the six header lines, `sed` drops the
block (its built line numbers less six). At this writing the block is
server.js:53639-53694, 56 lines, so the `sed` is `'53633,53688d'`, the
file is 84,123 lines against the monolith's 84,061, and the diff is 62
insertions — numbers that move whenever the block is edited; the recipe
does not. The plan's own copy of this compare says `tail -n +6`, which
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
- `docs/gen-refs.js` maps every server-side line through the `whereLine`
  `build.js` exports (no second copy of the arithmetic), and a `layout()`
  refusal stops it loudly (exit 1) instead of writing maps without source
  columns.

### What the falsification runs found in the checks themselves

FALSIFICATION_PLACEHOLDER

### Deploy

Render redeploys on merge; the built `server.js` is what it runs, and its
boot log must show `✓ BUILD CHECK` and a check count one higher than the
last deploy's — `BUILD CHECK` is new and nothing was removed (284 on this
branch, where the Round 127 build printed 283). A `⚠ BUILD CHECK SKIPPED`
line with the old count means `src/` did not ship beside `server.js` and the
deploy is not proven.
`index.html` did not change, so nothing needs the Netlify drag-in for this
round; the Round 127 page is still waiting to be dragged. No SQL, no new
Render variable.

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
- **The Round 127 hands, still open**: on Render, `SUPABASE_KEY` (the
  `sb_secret_` key), `APP_TOKEN`, the paid keys and `ALLOWED_ORIGINS`; in
  Supabase, the §127 block of `schema.sql`; in Netlify, the §127 page dragged
  in; then the Supabase secret key regenerated, because it passed through
  chat. Good looks like: `SUPABASE KEY ROLE: service_role` and no `AUTH GATE
  OFF` on the boot log.
- **The names**: do the thirteen department names in `src/README.md` read
  right to you? They become the folders in Round 129.
- Nothing a rep or a prospect sees changed; nothing was spent.
