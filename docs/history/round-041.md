# §41 — What one live run and eight parallel investigations found — 2026-08-21
Source: CLAUDE.md lines 2698-2833, moved verbatim 2026-09-02 from commit b01d952e4f95d7b69686bc2c4063ca2aa0cb7546 (branch backup/claude-md-monolith). Nothing below this line was edited.

## 41. What one live run and eight parallel investigations found — 2026-08-21

Vin: *"analyze evyrhting very detailedly - eveyr single word in the log every
single word in the audit."* Eight agents read the code behind each symptom and an
adversarial pass tried to refute every finding: 29 confirmed in code, 1 refuted.

### Nothing false may reach a prospect — four ways it could

- **"Michelle Musacchio, Owner" was a `||` default.** The resolver printed
  `"no title found" (authority 30) is below the buying floor. HELD BACK`, and the
  merge read `decisionMaker.title || verifiedCEOTitle || 'Owner'`. Nobody read
  that word anywhere. The resolver computes `canBuy` and `blockReason` and the
  caller consulted neither — the whole authority gate survived as a
  `console.log`. A held-back candidate is now kept separately as
  `heldBackContact`, labelled as unverified on the sheet, and an absent title
  prints as "(no title found)".
- **And the brain was quoting us back to ourselves.** The audit prompt was handed
  `Michelle Musacchio (Owner) — found in public search results` on a run whose own
  log said `DM/websearch: no owner found in web results`. The model echoed it and
  the echo was logged as `Brain extracted decision-maker ... [high]`, which reads
  like a second source agreeing. One source, three lines of agreement, no
  evidence. The brain may now ADD a name we did not have; it can never overrule
  the resolver and it can never supply a title.
- **A vague claim was made precise about a page nobody opened.**
  `narrowAbsenceToPagesRead` rewrites "nothing anywhere on their website" to
  "your homepage" when only the homepage was read — and `pagesRead` counts
  INTERIOR pages, so zero and one were the same case, and zero is the blind case.
  Stanley Schultze's homepage was refused twice with HTTP 402 and the narrowing
  fired anyway. It now takes `homepageRead` and DELETES the sentence when we read
  nothing, because a sentence with the scope word swapped still asserts the
  absence.
- **The audit could quote anything.** `SOURCE VERIFY` covers two fields;
  `verifyOriginalFinding` covers one list. Every other prose field could put
  quotation marks around a sentence nobody wrote — and those are what Mike reads
  down a phone to the person who owns the page. `stripUnverifiedQuotes` removes
  the whole sentence, on the same corpus as the money gate, with an empty corpus
  removing nothing (that is the read-limit case, not the fabrication case).
  `QUOTE PROVENANCE CHECK`, both directions falsified.

### The audit contradicted itself in its two headline blocks

On two of four leads: *"The one thing — THROUGHPUT: demand is not the problem,
delivery is. More leads here makes it worse"* directly above *"Fix this first —
DEMAND: the constraint is demand generation."*

Two engines over disjoint vocabularies. OPERATIONS is unreachable from review
evidence — its branches need a verified headcount and revenue-per-employee, and
this ICP almost never has either — so THROUGHPUT-versus-DEMAND was structural,
not incidental. The DEMAND tail also asserted two things nothing measured ("the
site is functional", "nothing is driving qualified traffic") and printed verbatim
on three of four leads.

They were never rivals: the binding layer is WHAT holds the business back, the
bottleneck is the FIRST BROKEN LINK on the way to fixing it. The cascade defers
to the layer, a funnel we could not read reports as unread instead of being
diagnosed, and `diagnosisConflict` refuses the one pairing a reader cannot act
on. Deliberately narrow — THROUGHPUT + CAPTURE is not a conflict, both say "do
not buy traffic yet". The prescription branches were the worse half: the `else`
sold ads management to a business whose customers say it cannot keep up.

### The money, at fifty leads

- **A process-wide flag reset by every incoming request.** `FIRECRAWL_OUT_OF_CREDITS
  = false` ran at the top of each research request while three run concurrently,
  so a lead that ran blind could report that credits were fine. The latch stays
  process-wide (an empty balance is an account fact); it is cleared by a paid
  call SUCCEEDING, and a timestamp answers per-request.
- **The queue admitted leads after the money was gone.** Stanley Schultze queued
  at 14:38:49, was admitted at 14:40:28, and paid for Places, a review pull and
  four model calls to produce an audit built on zero pages. On five leads that is
  one wasted lead; on fifty it is dozens. The queue now refuses before spending
  and says what to do.
- **`fcAsk` was the one Firecrawl door with no fail-fast.** The other four have
  it. Two doomed paid requests per lead, each holding a browser slot.
- **The bulk run re-submitted leads already running.** `status` is written by the
  MERGE, so an in-flight lead still reads 'new' and was still picked. The
  `duplicate request ignored` line is the server catching one of them; it dedupes
  on the display name and cannot catch them all.

### Research started without anybody pressing anything

Vin: *"i added 5 to pipeline most certiantly didnt hit run research and some of
the leads started running research."* Three call sites can submit, and a
`useEffect` keyed on the selected lead re-entered the whole research cycle on
mount, on every sidebar click, and on the automatic navigation after each add.

The fix is not to find the one path. **`researchViaQueue` now refuses to SUBMIT
unless the caller names the human gesture behind it**, from a closed set — a
caller that names nothing does not spend, and says so with a stack. Collecting a
job already paid for needs no gesture and cannot submit. In-flight records are
stamped with a per-tab id, so one tab never re-enters another's run.
`batchcheck.js` executes the refusal.

### The last gate before a prospect did not run on half the audits

`FACT CHECK DID NOT RUN — the critique call failed (timeout)` on two of four.
There was no retry in twenty-three Anthropic call sites. Ceiling 25s → 45s,
inferred from the call's own shape, and a single retry on the word "timeout"
only — a refusal, a 4xx and a bad key fail identically the second time.

### The sheet Mike dials from

- **"Do not say" was silently empty on every lead that had been through
  Supabase.** Three readers each hand-wrote the two-place read of the fact-check
  and the newest one — the EXPORT — read only the lead top level. `_criticalFactCheck`
  is written ONLY onto `brainAudit`, so the export has **never once printed a
  claim the prospect could disprove**, and `sec()` renders nothing for an empty
  body, so a dropped fact-check printed no heading at all. One accessor now, and
  an audited lead with nothing flagged says so out loud.
- **It quoted the regex match, not the sentence.** Stanley Schultze's entire
  entry read `states the visitor disappears — unobserved — "disappears"`. A
  one-word pattern produces a one-word quote by construction; `phraseAround`
  already existed for this.
- **Every entry was an engineering rationale.** Three sentences of "this
  overstates our evidence" for a man holding the page while a phone rings. The
  section stays — it is what stops a false sentence being said out loud — but the
  sheet gets the instruction and the screen keeps the reasoning.
- **A blind audit printed as a normal one.** `corpusRead` now travels on every
  response and one sentence says how much of the business was actually read.
  A warning on every sheet is one nobody reads, so it appears only when the read
  was genuinely short — falsified in both directions.
- **`_readLimits` was computed, named, shipped and rendered nowhere.** It has its
  own section now: what we could not check, which is a different thing from a
  claim we cannot stand behind.
- **An absence read off a measurement that never ran.** `NO PHONE ON THAT PAGE`
  fired when `htmlSignals.checked` was false — from two measurements that never
  happened — and printed "we measured NONE there" beside "booking read: unknown".
  It refuses to speak when it did not look, and the note moves to read limits.

**Five new boot checks, 191 green.** Every fix falsified individually; every one
red on its own.

**`index.html` changed, so this needs a Netlify deploy.**

---

