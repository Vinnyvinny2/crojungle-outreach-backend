---
name: bug-classes
description: "RULE: The classes of bug this app actually produces, each with the check that catches it and the rounds where it recurred: computed-but-not-passed, line order is not scope, unmeasured treated as zero, null laundering (Number(null) is 0 and 0 is finite), a guard in the wrong function, a shared helper is 60 bugs, two hand-kept copies of one rule, a stem with a word boundary after it, CRLF in server.js, a mechanism no fixture can reach, duplicate object keys (baseline 0). Use before proposing any code change, when reviewing a diff, or when a symptom looks familiar."
user-invocable: false
---
# Bug classes — the ways this app actually breaks

**Goal:** After reading this, Claude can name the class of a bug before touching code, and open the round where that class was last seen.

The first two sections are copied verbatim from CLAUDE.md (commit b01d952) lines 10434-10450 and lines 10453-10487 (the two section headings are rewritten as this note's own). The third section promotes five more classes that were recorded only inside round notes; each cites its rounds, and `round-refs.md` beside this file holds the fuller list. The rule for using this note: **a bug that has come back is a class, not an instance** — fix the class, then add the guard that would have caught it, then falsify the guard (see the `falsify` skill).

## The duplicate-key baseline is 0 (verbatim)


It used to read "baseline 3" and "baseline 9". Those numbers were treated as a
score to match rather than a list of bugs, and four live collisions were sitting
inside the accepted baseline of 9 — in `rowToLead`, blanking `flaws`, `richData`,
`homepageContent` and `screenshotUrl` on every single app load, after each had
been read back from Supabase correctly a few lines earlier.

The cost: `hasResearch` reads `flaws`, so a researched lead could render as
un-researched; and the full-evidence email prompt fell back to
`"General marketing underperformance"`, `"No research data available"` and
`"Not available"` on leads whose real measurements had just been loaded. The
screenshot stopped rendering after a reload.

An earlier pass had removed four other keys from that same line and described it
as "the last of five such collisions". It was not the last. **Never set a baseline
above zero on this check.** A number you are allowed to match is a number you stop
reading.

## The bug classes that actually happen (verbatim)


**Computed but not passed.** Five fixes shipped dead because a value was calculated
and never reached the thing that consumes it. `rankHarms` reads `m.<field>`;
`_harmInputs` is assembled by hand; the gap is invisible in every log.
`MEASUREMENT DELIVERY CHECK` guards this — extend it, don't work around it. The
`rowToLead` collisions above are the same disease on the client: measured, saved,
reloaded, then dropped one line before use.

**Line order is not scope.** Twice an out-of-scope reference was "fixed" by
checking the declaration appeared earlier in the file. Both times it was declared
inside a block that had already closed. Walk braces, or run the code.

**Unmeasured treated as zero.** `(m.photoCount || 0) < 5` fired on every lead where
photos were never counted, then stated "0 photos" as fact. Require
`Number.isFinite()` before comparing against any measurement.

**A guard in the wrong function.** "Never describe our own work" lived in the audit
checker for weeks while the email path had no such rule, so it reached live emails.
Check which function actually runs on the text you mean.

**A test harness that lies.** Both fuzzers have produced false failures by calling
functions with hand-built objects that do not match production. When a test fails,
check the harness before changing the code.

**A shared helper is 60 bugs at once.** `fetchT` wraps every outbound call —
Anthropic, Places, Firecrawl, Apify, Hunter, the verifier. It raced `fetch()`
against a `setTimeout` and never cancelled the request it abandoned, so every
timeout leaked a socket, and never cleared the timer on success, so a call
answering in 200ms pinned a 30s timer. A defect there presents as "these APIs are
flaky", never as a bug in our code. `fetchtest.js` covers it now.

While fixing it, the obvious ordering was wrong: `ac.abort()` rejects the fetch
**synchronously**, so aborting before rejecting let an `AbortError` win the race
and silently changed the error message that call sites all over `server.js` branch
on. Reject first, then abort. The test caught it; review would not have.

## Five more classes, promoted from the round notes

**Null laundering.** `Number(null)` is `0`, `Number([])` is `0`, and `0` is finite — so an UNMEASURED value walks through `Number.isFinite` and is then compared, ranked, or printed as a real zero. Live shapes: a null rank read as position zero ([§6](../../../docs/history/round-006.md)), "#0 of 20 … both returned #null, so this position is real" ([§59](../../../docs/history/round-059.md)), a coordinate-less lead localised to latitude 0 / longitude 0 ([§76](../../../docs/history/round-076.md)), a saturated photo count minted back to zero ([§85](../../../docs/history/round-085.md)), `Number(s.emailTier)` on a null tier printing "a mailbox-confirmed address" ([§105](../../../docs/history/round-105.md)), an absent rank sorting as a measured zero ([§89](../../../docs/history/round-089.md)), and three fixes that laundered a null INSIDE the round that fixed the class elsewhere ([§80](../../../docs/history/round-080.md), [§98](../../../docs/history/round-098.md), [§104](../../../docs/history/round-104.md)). Rule: `typeof x === 'number' && Number.isFinite(x)` (the file's `strictNum`) before any comparison; an unmeasured value leaves the denominator, it never scores.

**A stem with a word boundary after it matches nothing.** `\bplumb\b` cannot match "plumbing", so a trade list silently matched 22 of its 34 words on nothing ([§15](../../../docs/history/round-015.md)); `door\w*` bare filed an interior designer under crew trades ([§37](../../../docs/history/round-037.md)); a `\b` corrupted to a 0x08 byte killed a whole rung on arrival ([§57](../../../docs/history/round-057.md)); 'garage door' inside a boundary could not match the label every Places lead carries ([§71](../../../docs/history/round-071.md)); `testimonial\b` and `review\b` matched neither "Testimonials" nor "Reviews" ([§79](../../../docs/history/round-079.md)); `\bhardscape` missed "hardscaping" and "window replace" missed "window and door replacement" ([§94](../../../docs/history/round-094.md)). Rule: a stem is declared in `STEM_COMPLETE_WORDS` or it is not a stem; `STEM MATCH CHECK` fixtures the real words; a silent regex is worse than a wrong one.

**CRLF.** `server.js` is CRLF on every one of its 78,972 lines; `index.html` and every check script are LF. A tool that normalises newlines rewrites the whole file: Python's default `open()` flattened all 64,887 endings once and turned two CRLF-sensitive checks red on every run ([§74](../../../docs/history/round-074.md)); a replacement authored in a Python triple-quoted string put 83 LF lines into the file and still passed `node --check` ([§89](../../../docs/history/round-089.md)); a needle spanning two lines with `\r\n` can never match the LF-normalised source copy ([§103](../../../docs/history/round-103.md)). Rule: after any edit, `grep -c $'\r' server.js` must still equal its line count; see the `editing-server-js` skill.

**A mechanism no fixture can reach rots.** An `else` branch, a fallback pool or an exclusion clause that no input can reach is code that will be wrong the day something changes and nothing will say so. A "filler pool" proven unreachable and deleted ([§66](../../../docs/history/round-066.md)); a last-resort fallback the numbering loop already covered ([§67](../../../docs/history/round-067.md)); a dead limb in the anchor ranker ([§69](../../../docs/history/round-069.md)); a deferral clause whose guard was always true ([§84](../../../docs/history/round-084.md)); an `independent` score term that could only score on the absence of evidence ([§97](../../../docs/history/round-097.md)). Rule: if a falsification run cannot make a branch fire, delete the branch rather than keep it "for safety".

**A shape test is not a meaning test.** A parser that accepts "three capitalised words" as a person accepts "Client Connection Lead" ([§106](../../../docs/history/round-106.md)), "Meet the President" and a CTA button label ([§104](../../../docs/history/round-104.md)); a floor of 500 bytes of raw HTML accepts a `<head>` as a readable page and lets six absence claims through ([§106](../../../docs/history/round-106.md)). Rule: a slot is judged by what its words MEAN (role words, article lists, a readable-text floor), never by their count or case; and the consumer of the slot (the owner pick, the signals reader) asks the same rule again rather than trusting the parser.

**Computed but not passed, counted.** PART 6 names the class; the round notes count its instances, because the count is the argument for the executable contract check: instance nineteen ([§22](../../../docs/history/round-022.md)), twenty ([§24](../../../docs/history/round-024.md)), twenty-one ([§49](../../../docs/history/round-049.md)), twenty-two ([§54](../../../docs/history/round-054.md)), twenty-four ([§39](../../../docs/history/round-039.md)), twenty-five ([§76](../../../docs/history/round-076.md)), twenty-six ([§85](../../../docs/history/round-085.md)), twenty-seven ([§94](../../../docs/history/round-094.md)), twenty-eight ([§98](../../../docs/history/round-098.md)), twenty-nine ([§99](../../../docs/history/round-099.md)), plus the wire that never carried a measurement at all (`hasAdsConversion`, [§64](../../../docs/history/round-064.md)) and the two tokens passed as empty strings for a whole route's life ([§101](../../../docs/history/round-101.md)). Rule: `clientcheck.js` EXECUTES the merge and `MEASUREMENT DELIVERY CHECK` guards the ladder inputs — extend them, never work around them.
