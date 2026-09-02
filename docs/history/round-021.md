# §21 — Four more from the same five-lead run — FIXED 2026-08-20
Source: CLAUDE.md lines 1103-1147, moved verbatim 2026-09-02 from commit b01d952e4f95d7b69686bc2c4063ca2aa0cb7546 (branch backup/claude-md-monolith). Nothing below this line was edited.

## 21. Four more from the same five-lead run — FIXED 2026-08-20

- **A successful write reported as a failure.** Every Supabase write sends
  `return=minimal`, so success is a 201 with an EMPTY body — which parsed to
  the same null as a failure. The query memory wrote 91 rows successfully and
  the log printed "BUT THE WRITE FAILED... Supabase gave no reason". No reason
  because there was no failure: the night's one fixed problem reported as the
  night's one remaining problem. An empty 2xx body now returns a distinct
  success value.
- **The quote in the email was three spliced fragments of her FAQ.** The
  extractor's sentence boundaries required a space directly after the
  punctuation — «?”&nbsp;» is not that — and its tail trim used `search()`,
  which returns the FIRST punctuation in the span, before the phrase, so the
  after-the-phrase guard refused it and nothing trimmed. Donna's email opened
  mid-question and closed on a comma. `phraseAround` is module-scope now,
  boundary-aware of closing quotes, and `QUOTE INTEGRITY CHECK` runs her exact
  FAQ shape. My first fix broke two other shapes (the window-edge word trim ate
  the last word of a correctly trimmed sentence; the orphan-quote stripper ate
  apostrophes) — only running the fixtures found either.
- **The ladder tiebreak was a narrator.** Jose Barrera: two findings tied at
  23, the measured constraint LEADS, the winner in CONVERSION — and the ⛔ that
  said search_absence "should have taken the tie" changed nothing. The
  binding-layer preference is now a term in `rankCandidateFindings` (ties
  within the 2-point noise band go to the measured binding layer; a 4-point
  deficit is still never promoted) and the override block completes the
  rewrite. The first fixture for this passed with the fix reverted — the
  winner it chose was already preferred by the leverage tiebreaker — which is
  the fixture-that-measures-nothing trap, caught by falsification.
- **A wrong-company site's measurements survived the discard.** Ram Jack
  Durham resolved to the national franchisor, the discard branch fired, and
  the audit still opened on "their contact form asks for 10 pieces of
  information" — measured on ramjackusa.com, a page the same audit said it had
  discarded. `htmlSignals` is extracted BEFORE the domain check runs, and
  blanking the page alone left it alive. It is blanked with everything else
  now, and Places website URLs are stripped of `?utm_campaign=gmb`-style
  params, which is what dragged that lead to the franchisor domain looking
  authoritative.

**And research concurrency is 3, up from 2.** "Three at once is what made two
runs stop mid-way" was true, and the cause was never the queue — it was two
page-render decodes landing in the same instant. The decode door and the RSS
admission gate carry that risk now. Five leads took ~15 minutes at 2 slots;
fifty at that rate is over four hours, and at 3 it is under two. The cap is
`RESEARCH_CONCURRENCY`, and it matches the batch client's own pool of 3.

