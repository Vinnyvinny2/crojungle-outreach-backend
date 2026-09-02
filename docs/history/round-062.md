# §62 — The audit learned to speak plainly — 2026-08-24
Source: CLAUDE.md lines 5307-5378, moved verbatim 2026-09-02 from commit b01d952e4f95d7b69686bc2c4063ca2aa0cb7546 (branch backup/claude-md-monolith). Nothing below this line was edited.

## 62. The audit learned to speak plainly — 2026-08-24

Vin, reading the re-run sheets: *"the grammer on these audits is brutal...
imn not sure what the hell this even means... alot of these audits have
jargon in it like i built this and i dont even understand what is being said
sometimes... we need to organize these audits so anyone can understand whats
going on no matter their experince level marketing wise."* The findings were
right; the words and the order were not. This round changed no measurement
and no ranking — only what the sentences say and where they sit.

### The words

- **The ads finding said "has Facebook ad tracking on it" and its money line
  said "the ad budget is buying clicks"** — the owner of this system could
  not tell what either meant. It reads *"Their site is set up for Facebook
  ads, and the only way in their site offers is a phone call during office
  hours"* now, with the money line *"They pay for every click, and nothing
  tells them which clicks ever turned into a job — the money goes out
  blind."* Same bounds: the wiring is asserted, never a live campaign.
- **The review money line** — *"Every person who hit the same wall those
  reviews describe and never wrote one was one of those jobs"* — was a
  sentence nobody could parse on the first read. Now: *"For every person who
  said this in public, more hit the same wall, said nothing, and went
  elsewhere — each one was one of those jobs."* UNCAUGHT, LEAKING and
  BURNING got the same treatment; ROTTING and TAXED already read plainly.
- **Findings opened lowercase mid-fragment** ("slow or no follow-up after
  estimate appointments, and...") because the mined complaint leads the
  sentence by design for the email. `sentenceCaseStart` capitalises the
  first letter on the sheet — display-only, the email opener rules
  untouched.
- **The Hormozi layer codes are translated everywhere a person reads them**:
  "The one thing — MARKET" is now "The one thing — how they position
  themselves (MARKET)"; "Binding layer: CONVERSION" is "Biggest blocker:
  turning interest into booked jobs (CONVERSION)". The codes stay — they are
  the stored data's vocabulary — the sheet says what they mean. And the
  constraint templates dropped their own jargon: "No layer measured as
  clearly binding" reads "Nothing we measured stands out as the single
  biggest blocker."
- **"Do not say" entries were paragraphs of detector rationale** ("Legal as a
  general truth about people, and legal marked as your own read; illegal
  stated as a report...") — three near-identical copies on J Chester's
  sheet. `plainRisk` renders each as the QUOTE plus one plain line of why
  ("we never watched what happens after someone contacts them"). The
  engineering reasoning stays on the stored lead.
- **whatHeNeeds** — the model-written "worth selling them" paragraph — now
  carries a register spec: concrete nouns (the form, the phone, the price,
  the clicks), follow the money out loud, and NEVER the words capture,
  intake, conversion, friction, funnel, optimize. The Breck's paragraph Vin
  called awesome is the shape it names. An instructional guard, and recorded
  as one: model prose still varies, and this is the available lever.

### The order

**"What this business is" opens the audit** — the caller pictures the
business before any diagnosis of it — and **"Do not say" closes it**, on
both the screen and the export. The score caption stopped explaining itself
in grading vocabulary ("how well their website is built — 10 is best"), and
"Campaign pages: none found (absence proves nothing)" became "Ad landing
pages: none found (they may still exist)".

`INFO TRAVEL CHECK` grew executed guards for every rewording (the BURNING
and review money lines, the sentence-case fix and its call site), and
`clientcheck` executes `plainRisk` on J Chester's live entry — the quote
must survive, the rationale must not — and `layerPlain` both ways. Four new
falsifications, each red alone. FIRST DFS RUN CHECK's money-line needle
tracked the new wording after going correctly red on it.

**227 boot checks green.** `index.html` changed, so this needs a Netlify
deploy.

---

