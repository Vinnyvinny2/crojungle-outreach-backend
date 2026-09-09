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
  bytes stripped and a six-line header on top, so every built line is the
  source line plus six. Render, CI and every tool run unchanged.
- **The bytes are proven, twice.** `node build.js --check` compares the
  built file to the sources in memory and exits red at the first differing
  byte, naming `server.js:LINE (src/file:L)`; it is the first line of the
  static stage. `BUILD CHECK`, the first boot check, runs the same walk at
  boot and says "server.js is generated: edit src/" when it fails. A hand
  edit of `server.js` is therefore red at the first gate and red at boot.
- **Every source file is shaped like a skill note.** One job, at most about
  800 lines, LF only, and a header the build refuses without: a department
  and job line, a `Goal:` the way every skill opens, what it owns, what it
  defines for others, and which checks guard it. The header may not carry
  the strings the counting checks scan for. `src/README.md` is the org
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
the static stage; the header lint inside the build (Goal line, size cap,
forbidden strings, CR bytes, final newline, unlisted or duplicate files);
`lint-skills.js --check-refs` keeps the regenerated maps honest; the
`.gitattributes` rules keep `src/` LF and mark `server.js` generated so a
PR review collapses it.

### What the falsification runs found

FALSIFICATION_PLACEHOLDER

### Deploy

Render redeploys on merge; the built `server.js` is what it runs, and its
boot log must show `✓ BUILD CHECK` with the same check count as before.
`index.html` did not change, so nothing needs the Netlify drag-in for this
round; the Round 127 page is still waiting to be dragged. No SQL, no new
Render variable.

### Needs your eyes

- **The merge**: say the word; never while a batch runs.
- **The Round 127 handover** still open: the Netlify drag of that page,
  `APP_TOKEN` and the keys on Render, the §127 SQL.
- **The names**: do the thirteen department names in `src/README.md` read
  right to you? They become the folders in Round 129.
- Nothing a rep or a prospect sees changed; nothing was spent.
