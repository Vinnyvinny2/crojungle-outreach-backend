# §36 — The niche library, and the wall between it and an inbox — 2026-08-21
Source: CLAUDE.md lines 2332-2434, moved verbatim 2026-09-02 from commit b01d952e4f95d7b69686bc2c4063ca2aa0cb7546 (branch backup/claude-md-monolith). Nothing below this line was edited.

## 36. The niche library, and the wall between it and an inbox — 2026-08-21

Vin, after hand-researching a brief on independent hotels for Mike: *"why dont we
have info like this for every single niche we are taregting so we can come in pre
audit knowing all the big issues of these niches."*

He is right, and the warning he was given elsewhere is right too: **a static niche
library is a fabrication engine if it is not bounded.** "Restaurants lose 30% to
DoorDash" sent to a restaurant that does not deliver is a confident false claim,
and PART 3 has exactly one rule that cannot bend.

**This is not a new mechanism.** `TRADE_JOB_VALUE` has been a niche library for
weeks — public knowledge about an industry, declared in code, deliberately
conservative — and its own comment already states the rule: *"The claim is 'a job
in this trade runs about this', never 'your job'."* `AUDIT MONEY CHECK` already
enforces it and was already falsified. So this extends a working gate rather than
inventing a second one.

### The boundary is structural, not instructional

PART 3 again: *"the prompt banned post-submission claims 19 times and every audit
produced one anyway."* So "use this as framing, never as a claim" written into a
prompt is worth nothing. Every brief is split into two halves the boot check
enforces by SHAPE:

| | |
|---|---|
| **DECLARED** | the unit of business, who buys, the vocabulary, which software to ASK about, where margin leaks in the segment, the questions worth asking. **No digit is permitted anywhere in it**, so none of it can be a wrong number about a business. |
| **SOURCED** | figures. Each row carries the figure, its source and its date or it does not exist — and **no row may contain "you", "your", "they" or "their"**, so a cited segment fact is structurally incapable of becoming a claim about the company in front of us. |

Where each half may go: DECLARED and SOURCED both reach the call sheet, the export
and the audit prompt. **Neither reaches an email**, and that needs no new gate —
nothing here is added to `permittedFigures`, so a stray figure is already refused
by the trace that has run for weeks, and the wordless version is caught by the
generalisation gate below.

### The gate that already existed, widened

`INDUSTRY_SUBJECT` catches a plural trade noun in front of a NEGATIVE verb —
Emily Taylor's *"Estate planning attorneys in Phoenix aren't showing up"*. A niche
brief introduces the positive half of the family and it is just as false:
*"roofers typically give up a quarter of every job"*, *"most contractors your size
are running the same setup"*, *"businesses like yours usually see this"*.

Keyed on a trade or business noun **next to** the generality marker, never on the
marker alone: `PATTERN_GENERALITY` REQUIRES "usually" in the review-pattern
sentence, and "six people usually wait a week for a quote" is a fact about his
customers. The check asserts both directions — five intruders refused, two
legitimate sentences untouched, and a CONTROL email that must pass, because a
fixture refused for its word count would tick green on a build with the gate
deleted.

**Its first run found the gate missing the singular.** "The average practice loses
money here" passed, because the noun list held only plurals.

### The money extractor had a defect the library exposed

`TRADE_MONEY_UNITS` flattened the sentence and THEN matched, and `flatMoney` strips
every space, so the `[a-z]*` that exists to catch the "k" in `$40k` ran on into the
next word — `$519directagainst`. It never showed on the trade table because every
row there ends on its figure. The first sentence with a figure in the MIDDLE
exposed it. One extractor now, used by both.

### Nine briefs, and eight of them have an empty SOURCED half

That is deliberate and it is the honest shape. Vin's own framework budgets 2-4
hours a brief and its rule four is *"never estimate a number that could be
sourced."* Filling them from memory would be the exact failure. The DECLARED half
needed no research because none of it is a quantity, and on a phone call it is most
of the value: knowing a roofer quotes in squares, that his real number is
estimate-to-job close rate, and that the question is *"when you're up on a roof,
who picks up?"* beats a benchmark he will argue with.

**Independent hotels is the worked example** — nine sourced rows, every one cited,
because Vin did the work. Stated plainly: hotels are NOT in `GP_CATEGORIES`, so
that brief cannot attach to anything the pipeline currently finds. It fires the day
hotels are added as a target category.

### What was deliberately NOT built

- **No ranking hook.** The obvious next move is letting a brief re-order the
  findings for its segment, the way `URGENCY_ADJUST` and `REFERRAL_ADJUST` already
  do. Two unproven ranking levers shipped in the same week is how two levers become
  one unreadable result, and the call-outcome capture is the thing that will say
  which order is right. PART 6: do not tune without evidence.
- **No brief content reaches the writer.** The check reads the source of
  `buildWriterBrief`, `buildRewriteBrief` and `buildEmailEvidence` and fails if any
  of them so much as mentions the library.

`NICHE BRIEF CHECK`, ten guards. Nine falsified individually; the tenth
falsification found a hole in the check itself — pointing the forbidden-function
list at three names that do not exist made the assertion evaporate and the whole
check pass. It says so out loud now instead of skipping.

**And the Measured signals table is gone from the export.** The provenance column
left last round; what remained was a grid of "Not checked" rows beside a handful of
numbers the prose sections say better. The signals are still computed and still on
the audit screen, where reading a grid is what you are there to do.

**`index.html` changed, so this needs a Netlify deploy.**

---

