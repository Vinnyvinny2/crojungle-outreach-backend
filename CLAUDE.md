# CROJungle Outreach — start here

This file is deliberately short (Claude Code reads it at the start of every session). It holds the identity of the system, the seven rules that are not negotiable, how to run the checks, and how to work with Vin. **Everything else is a skill** in `.claude/skills/` — one job each, a testable goal as its first line, loaded only when that job comes up, organised top-down from the decisions Vin makes (Level 1) to the jobs Claude runs (Level 4) — and **the 106 numbered round notes are in `docs/history/`**, moved word for word and indexed. The split happened on 2026-09-02; `docs/history/verify-split.sh` proves nothing was lost, and the full pre-split file is on branch `backup/claude-md-monolith`.

## What this is

CROJungle is a marketing and technology agency (Vin builds and owns this system; Mike Taft, the CEO, takes every sales call). This system finds founder-led local businesses, audits them, writes one cold email and sends it, so that the owner replies and Mike takes the call. Today the stage in daily use is the Find tab and its contact list for the sales rep; research, audit and email are built and not yet run by him. What is sold, to whom and at what price: skill `business-and-icp`.

The premium line is a five-figure engagement, and **this matters more than
anything else in this file** — a finding that leads to a $200 fix cannot become a
conversation about a $30k retainer, no matter how true it is.

```
Find a business  →  Audit it  →  Write one cold email  →  Send it
                                                            ↓
                                                       HE REPLIES
                                                            ↓
                                                    Mike takes the call
```

**The email's only job is to earn a reply.** Not to sell, not to book, not to
diagnose. Mike does the diagnosis on the call — he asks about goals, growth,
financial constraints. The email exists to make one busy owner think *"how do they
know that?"* and write back.

# PART 3 — THE RULES THAT ARE NOT NEGOTIABLE

**A sentence he cannot read is not a true sentence.** Eleven gates ask whether a
claim is TRUE and, until 2026-08-18, none asked whether the owner could read it.
The result was a live email whose every phrase had been chosen to survive a
fabrication gate — "set up to track Google Ads clicks", "the first page of the
map results", "a paid position stops the day the budget does" — and which Vin
read as *"jargon, I don't even understand it fully."* Precision nobody can
collect on is not precision: he cannot check a fact he cannot parse.
`READABLE FINDING CHECK` measures reading grade, abstract subjects, dangling
pronouns and agency phrasing on every sentence the ladder can send, scoring OUR
words only — his trade name and the search in quotes are his own vocabulary.
Ceiling is grade 12; the honest build now tops out at 10.2.

**Nothing false may reach a prospect.** Every number in an email traces to a
measurement in `permittedFigures`. Vin's governing principle, in his words:

> "Legit info is everything — NEVER fabricate. I'd rather send nothing than tell
> them something's wrong when it isn't."

**Code assembles facts; the model writes prose around them.** Never the reverse.

**Instructional guards do not hold.** The prompt banned post-submission claims 19
times and every audit produced one anyway. Guards must be mechanical.

**Absence claims require that we actually looked.** `EXISTS BUT UNREAD` exists
because a live email told an attorney with a Reviews page that he had no reviews on
his site.

**The owner is the buyer.** Owner / CEO / President / Managing Partner can buy. VP
and below is blocked. A perfect email to the wrong person is worse than no email.

**A check that cannot fail is not a check.** See PART 6.

## Running the checks

The list of checks is `bash ci-gates.sh` and nothing else (`GATES=static` for the fast stage). Reading a red line: skill `gates`. Editing `server.js` or `index.html` at all: skill `editing-server-js` loads by itself — the file is CRLF, the boot checks grep their own source, and the client contract number must be bumped whenever `index.html` changes.

Every one of these now **exits non-zero on failure**, so they can be chained and
they can fail a script. That was not true before: `tdz.js` and `dupkeys.js` printed
a red ✗ and exited 0 for their whole lives.

`node --check` passing means almost nothing. Three live outages in one week were
valid syntax.

## index.html IS in this repo now (2026-08-18), and still deploys by hand

It was locally ignored for the life of the project — half the system with no
version history. It is tracked here from 2026-08-18, so `dupkeys.js index.html`
always has something to read and every change is reviewable.

It still deploys to Netlify BY HAND. Nothing about tracking it changes that, so a
client-side fix is dark until the file is dragged into Netlify — and the server
half of the same fix will already be live, which is the shape that makes a bug
look intermittent. When a change touches both, say so plainly in the handover.

## Working with Vin

He catches real bugs by reading live output, not by auditing source. When he pastes
a log, the answer is usually in it.

He wants root-cause diagnosis, not patches — and says so bluntly when he gets a
patch. He is right about that more often than not.

Distinguish clearly between "unit-tested and proven" and "shipped but needs live
validation." Reporting the second as the first is the fastest way to lose his
trust, and he will catch it.

His product instinct has been right on every call this week — the rating band, the
CTA problem, the audits reading alike, the review sample being too small. When he
says an email is flat, it is flat, and the cause has been upstream every time.

He does not read code. Explain findings in terms of what the system does to a
lead, not in terms of which line changed.

## The skills

Organised like the business, top down: Vin decides at Level 1, everything below implements it. Each note opens with a testable goal.

**Level 1 — STRATEGY: the decisions Vin makes (start at `owner-decisions`)**

- `owner-decisions` — after reading it, Claude can state the current value of any strategic lever, who ruled it and when, and name the note and the place in the code that must change together when Vin changes his mind.
- `business-and-icp` — after reading it, Claude can decide whether a lead or a finding fits what CROJungle sells, and at which price tier.
- `evidence-and-priorities` — after reading it, Claude can tell a proven fact from an inference before anything is tuned, and pick the next move in the proven order.
- `cost-model` — after reading it, Claude can give a per-lead cost from a meter line, and refuse any cut on the DO-NOT-CUT list.
- `new-niche-playbook` — after reading it, Claude can add a new trade or market to the app in the right order, naming every declared table that must gain a row, the business facts the owner must supply for each, and the boot check that confirms it is done — and say what a full company swap would add.

**Level 2 — OPERATIONS: how the machine carries them out**

- `deploy-and-accounts` — after reading it, Claude can name the one-time Render, GitHub, Netlify, staging and Supabase actions that make a merge a deploy, tell whether each is done, and hand over the exact SQL the server expects.
- `find-and-contact-list` — after reading it, Claude can explain what a Find press and a contact read do to a lead, read the log lines they print, and tell a confirmed owner, email or phone from a guess.
- `knobs-and-env` — after reading it, Claude can trace any budget refusal or "not measured" line in a log to the setting that caused it.
- `pipeline-how-it-works` — after reading it, Claude can name the stage, the function and the file for any behaviour someone describes.

**Level 3 — RULES: what Claude obeys when it touches the code (Vin never needs to read these)**

- `bug-classes` — after reading it, Claude can name the class of a bug before touching code, and open the round where that class was last seen.
- `check-writing-traps` — after reading it, Claude can write a boot check or test that fails on the live defect it names, and spot one that cannot.
- `editing-server-js` — after reading it, Claude can change server.js or index.html without turning a boot check red, breaking line endings, or shipping half an edit.
- `what-not-to-do` — after reading it, Claude can recognise a change that would re-earn an old bug and refuse it, naming the rule and the round that earned it.

**Level 4 — JOBS: what Claude runs, as /name**

- `diagnose-log` — after reading it, Claude can turn a pasted Render log, CSV or call sheet into a verified list of defects, each reproduced by running the real code, with nothing fixed until asked.
- `falsify` — after reading it, Claude can prove a fix's guard actually guards by reverting that fix alone against a green baseline and getting a red on its own named assertion, and recognise a falsification that proves nothing.
- `gates` — after reading it, Claude can run the checks (or one stage), read the verdict, and say in plain English what each red line means, which class of bug it is, and which file to open.
- `history-lookup` — after reading it, Claude can find the round note that recorded a given bug, decision, check or log line, from a section number or a keyword, and quote it instead of re-deriving it.
- `ship-round` — after reading it, Claude can close a round without shipping half of it: the round note in docs/history, its INDEX line, the contract bump when index.html changed, the commit and PR shape, and a handover that names what needs hands.

## Where everything moved (for the code comments that cite the old file)

| A comment says | It now lives in |
|---|---|
| CLAUDE.md PART 1 | `.claude/skills/business-and-icp` |
| PART 2 | `.claude/skills/pipeline-how-it-works` (+ `map.md` line map) |
| PART 3 | this file, unchanged |
| PART 4, §N, "section N", "round N" | `docs/history/round-NNN.md` (three digits); index in `docs/history/INDEX.md`; lookup: skill `history-lookup` |
| PART 5 (what is proven), PART 7 (what would move it) | `.claude/skills/evidence-and-priorities` |
| PART 6 gate list / "run these before proposing any change" | `ci-gates.sh` (the list) + skill `gates` (the why) |
| PART 6 duplicate-key baseline, bug classes | `.claude/skills/bug-classes` (app bugs) and `check-writing-traps` (bugs in checks) |
| PART 6 "What NOT to do" | `.claude/skills/what-not-to-do` |
| PART 6 index.html deploys by hand; PART 7 "Working with Vin" | this file |
| PART 8 steps 1, 1b, 2, 3 (Render, GitHub, Netlify, staging) | `.claude/skills/deploy-and-accounts` (+ `schema.sql`, every CREATE/ALTER the SCHEMA PROBE log line points at) |
| PART 8 knobs table | `.claude/skills/knobs-and-env` |
| PART 8 client handshake (CONTRACT_VERSION / CLIENT_CONTRACT) | `.claude/skills/ship-round` |
| the cost figures, DO-NOT-CUT list | `.claude/skills/cost-model` |
| adding a trade, metro or niche brief | `.claude/skills/new-niche-playbook` |

## Rules for this file

Do not paste round history back into this file: a round note goes in `docs/history` (skill `ship-round`) and one line in `INDEX.md`. Keep this file under 200 lines. A fact that only matters for one job belongs in that job's skill.
