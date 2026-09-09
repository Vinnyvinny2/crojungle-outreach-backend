# src/ — the org chart of the server

`server.js` at the repo root is **generated** from this folder: `build.js` joins the files `manifest.js` lists, in that order, into one CRLF file, and proves the result byte for byte (`node build.js --check`; the boot's `BUILD CHECK` runs the same proof). Edit here, never `server.js`. `node build.js` rebuilds; `node build.js --where LINE` maps a built line back to the source file.

Three rules that do not bend:

- **The manifest is the order.** `manifest.js` is the program's statement order (today's, interleaved across departments). Three boot checks assert byte order across it and 48 count occurrences across the whole built file, so reordering it is a code change with its own proof, never a tidy-up.
- **The folder is the department.** Plain-English names, from the business: a reader who does not read code can find the job by its folder.
- **A check reads the whole built program, never one file.** Every boot check, `tdz.js`, `dupkeys.js`, `scopecheck.js` and every sibling tool read `server.js`; a source file is never run or checked alone. Parts of a cut function (`PART n OF N`) do not parse on their own by design.

## The header every file must have (the build refuses a file without a Goal line; the rest is the house shape)

```
// ═══ DEPARTMENT / JOB ═══
// Goal: after reading this file, Claude can <one testable sentence>.
// Owns: <what this file is responsible for>.
// Defines for others: <top-level names other files use>.
// Guarded by: <CHECK NAMES>, or "no check yet".
```

A part of a cut function adds `// PART n OF N of <function>: does not parse alone; joined in manifest order.` Every file: LF, no BOM, non-empty, ends with exactly one newline, at most about 800 lines, one job. A header may not contain `✓`, `⛔`, `process.env.`, `req.query.`, `readFileSync(`, `__filename` or `Hold();` (the counting checks and `gen-refs` scan comments too). No "last changed" line; `git log` is the record.

What `build.js` actually refuses, naming file:line (its own header is the authority): a CR byte, a BOM, an empty file, a missing or doubled final newline, a line that is not valid UTF-8 or carries a literal U+FFFD, a manifest that does not load or lists a path that is not plain and src-relative, an entry not on disk, a duplicate entry, a `src/**/*.js` the manifest does not list, a symbolic link under `src/`, a file over the cap (once the manifest lists more than one file), a file with no header comment, a header with no `Goal:` line (one starting `// Goal: after reading this file, Claude can`), a first manifest file whose first line is not the exact GENERATED banner, and a forbidden string in a header. The department line and the Owns / Defines for others / Guarded by lines are the house shape, read by a person and by the header-verification agents at the cut — not by the build. A header is a claim; write it from what the code does.

## The departments (Round 129 fills them; Round 128 has one file)

| Folder | Owns |
|---|---|
| `front-desk` | how the server starts, who may call it, what today costs, the doors every paid call goes through |
| `finding-businesses` | the Find press: where leads come from, which fit, what they can afford |
| `reading-people` | who the owner is and how to reach them |
| `reading-the-site` | every measurement taken from their site |
| `where-they-rank` | the search position nobody sees |
| `the-audit` | the ladder and everything assembled from measurements |
| `the-email` | one cold email, written and verified |
| `research-desk` | one lead, start to finish |
| `records` | Supabase and the ledgers |
| `contact-list` | the Find tab's contact read and the read runs |
| `inspection` | the file reads itself; every boot check, in today's order |
| `shared-tools` | helpers everything uses |
| `side-desks` | the small stand-alone jobs |

## Today's files (one line each: folder, file, Goal)

| Folder | File | Goal |
|---|---|---|
| (root) | `all.js` | the whole program as one file — today's `server.js` with its CR bytes stripped and the header above prepended; Round 129 cuts it into the departments |

At the cut (Round 129): `all.js` lines 1 to 3 are the GENERATED banner and become lines 1 to 3 of the first file the manifest lists (line 1 is pinned by the build, which refuses a first file that does not open with the exact banner line; lines 2 and 3 are not); lines 4 to 6 (the "whole program" department header) are deleted, so `server.js` will differ from today's from line 4 on — expected, and the modulo-headers diff proof carries it. Cut by LINE numbers only: `src/all.js:L` is `server.js:L` today (`node build.js --where L` says so), but an acorn offset taken on the CRLF `server.js` counts one CR per preceding line and is NOT an offset into the LF `src/all.js`; a slice taken with such an offset lands early, mid-statement.
