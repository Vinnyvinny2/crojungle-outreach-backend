# §60 — The sheet and the screen became one seven-category document — 2026-08-24
Source: CLAUDE.md lines 5134-5194, moved verbatim 2026-09-02 from commit b01d952e4f95d7b69686bc2c4063ca2aa0cb7546 (branch backup/claude-md-monolith). Nothing below this line was edited.

## 60. The sheet and the screen became one seven-category document — 2026-08-24

Vin, on the export and the audit screen: *"very orgnaixzed and not clean...
way way too long... still to busy"* — then, through three mock rounds:
*"i like the depthj we orginally have its just reprtitive and not neatly
organized into ctaegrieis"*, and approving the organized sheet: *"reduce it
like a tiny bit more and make sure the audit screen layout and detial is the
same as the organized export sheet."* And one correction mid-build that
changed the design: *"i dont like how it5s insturctuion us what to say...
id rather have us have all the info we need in order for us to make the
decision on what to say. becuase i still dont trust the brain or the audits
to alwyas pick the perfect thing."*

**The rule that came out of that: the sheet INFORMS, it never instructs.**
The system's ranking is labeled as the system's ranking, every finding stays
visible below it, and nothing on the page tells the caller what to say.

Both artefacts now carry the same seven categories, in the same order, each
original section exactly once — the old export said the same finding in up to
three places (the problems table, the own-words list, the one-thing friction
bullets), which is what "info everywhere" was:

| | |
|---|---|
| **1 THE CALL** | who, title, email, phone big, calling window, the held-back name, the staleness warning |
| **2 THE MONEY** | the ranked leaks with their money lines — captioned *"the system's ranking — every finding is in The evidence; the pick is yours"* |
| **3 THE CONVERSATION** | what the email LED WITH (a fact — it was sent, and the note says the call does not have to open the same way), what he will LIKELY say (the prospect model, labeled "one reading, not a rule"), the question worth asking, and Do-not-say in red |
| **4 THE BUSINESS** | background + headline + read + the one-thing diagnosis merged into one read — three overlapping sections became one |
| **5 THE EVIDENCE** | every finding once, money-ordered, their own words as the sub-line, internal rows marked, dated changes flagged as the only dated facts |
| **6 THE ANGLES** | what is worth selling beside the trade questions |
| **7 THE EDGES** | what we could not check beside the internal review intelligence |

The footer carries the page renders as links (an `<img>` would break the
export's self-containment rule) and the per-lead pointer at the one-per-trade
brief appendix. Styling is the approved Apple-light look — white, hairlines,
one gray, and **red only on Do-not-say and the stop banners**, the same
"colour marks a stop" rule §38 established.

**The screen was reordered, not rewritten.** The audit screen's existing
blocks were moved into the sheet's order (stops first — they were at the
BOTTOM of the screen while the sheet carried them at the top), the two
colored panels (indigo one-thing, green verdict) flattened to neutral cards,
and a new The-conversation section built from fields already on the lead.
`askOnTheCall` moved INTO it and out of the selling block — one home each.

**And the screen got its first executable check.** `LeadBriefing` is half the
audit surface and nothing in this repo had ever run it — a throw anywhere in
its tree blanks the whole audit view. `clientcheck` now executes it with a
recording React stub: all seven category labels must render, askOnTheCall
must appear exactly once, and a null lead must return null. Falsified both
ways — re-adding the second askOnTheCall home went red, and an out-of-scope
name in the new section (the §40 class) went red naming the throw.

The export markers check (all 30 fields) and the brief-dedupe check both held
through the restructure unchanged — which is exactly what they exist for.

**`index.html` changed, so this needs a Netlify deploy.** server.js is
untouched this round.

---

