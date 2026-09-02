---
name: history-lookup
description: "DO: Find the round note that recorded a bug, a decision, a check or a log line - from a §N / 'PART 4 section N' / 'round N' citation in a code comment, or by searching the 105 notes in docs/history by keyword - and quote it rather than re-deriving it. Use when a comment cites a section number, a symptom looks familiar, or the user asks when or why something was changed."
argument-hint: [§N or keyword]
---
# History lookup — find the round that recorded it

**Goal:** After reading this, Claude can find the round note that recorded a given bug, decision, check or log line, from a section number or a keyword, and quote it instead of re-deriving it.

New text (2026-09-02). The 105 numbered round entries that used to be PART 4 of CLAUDE.md live in `docs/history/round-NNN.md`, moved byte for byte; `docs/history/INDEX.md` lists them with date, a keyword stage and the original order; `docs/history/verify-split.sh` proves the move lost nothing. Nothing in that folder is loaded into a session unless asked for — that is the point.

## By citation

- A code comment saying `CLAUDE.md §79`, `PART 4 §8`, `section 25` or `round 25` means `docs/history/round-079.md` etc. — zero-pad to three digits. Open it and quote the paragraph.
- `PART 1/2/3/5/6/7/8` citations resolve through the "where everything moved" table in CLAUDE.md (PART 3 and "Working with Vin" are still IN CLAUDE.md).
- **Two counters warning:** some round TITLES carry an older counter — "Round 100" is §77, "Round 102" is §79, "Round 106" is §84, "Round 107" is §85. The § number in the heading is the only key; the commit messages' "Round N" does not always match it.

## By keyword

```
grep -ril 'self-matching needle' docs/history          # which rounds mention it
grep -rn 'Number(null)' docs/history | cut -c1-120        # the lines themselves
grep -l 'OWNER WAVE' docs/history/round-*.md              # where a log line was introduced
```

Search the log line's own words, a function name, a lead's name (Irwin, Breck, TriStar, Donna Krummen), or a check name in capitals. Then read the whole round, not the matching line: the fix is usually two paragraphs below the symptom.

## What to do with what you find

- Quote it, cite the file, and say whether the mechanism it describes is still the shipped one (later rounds revise earlier ones; `INDEX.md` is in date order).
- A symptom that appears in three or more rounds is a CLASS — take it to `bug-classes` or `check-writing-traps`, whose round-refs reference files are the promoted list.
- A new round is written by `ship-round`; never edit an existing round file — the archive is the record, and `verify-split.sh` will go red if a moved line changes.
