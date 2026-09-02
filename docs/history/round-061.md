# §61 — Does the measurement still say the same thing by the time it reaches the sheet — 2026-08-24
Source: CLAUDE.md lines 5195-5306, moved verbatim 2026-09-02 from commit b01d952e4f95d7b69686bc2c4063ca2aa0cb7546 (branch backup/claude-md-monolith). Nothing below this line was edited.

## 61. Does the measurement still say the same thing by the time it reaches the sheet — 2026-08-24

Vin, with three live sheets and the whole log: *"lets make sure that all the
info always correctly travels to the audit... nothing is misconstrued...
it will be going to our junior sales guy for cold calling."* Read word by
word, the three sheets carried nine faults, and the worst was a split-brain
on one page.

### One measurement, four readers, three answers

Breck's Paving's sheet said **"Ads none found"** in its header, **"Their site
has Google Ads tracking on it"** in leak #3 and the narrative, **"Facebook and
Instagram ad tracking, and nothing for Google"** in another evidence row — and
its own fact-checker wrote *"Google Ads tag NOT FOUND on page source; Meta
pixel IS present."* Conner's carried the same header-versus-leak contradiction.

The cause was recorded in the file's own comments and then committed anyway:
`adsTagConfirmed` is deliberately true for a Google tag OR a Meta pixel — the
click arriving at a dead route is the same loss whichever platform sold it —
and `paid_traffic_leaks`' sentence hardcoded "Google Ads tracking". The
comment eight lines below it warns, for the two sibling rungs, that collapsing
the platforms *"would put 'you are running Google Ads' in front of an owner
whose only tag is a Facebook pixel."* The rung's say() now names the platform
from the same fields the facts strip reads, and one client-side label
(`adsFactsLabel`) serves the screen chip, the export header and the facts
strip — a Meta-only advertiser reads "Ads: Facebook only" everywhere.

### A paving company, measured against parking garages

Their sitemap slug `/services/parking-lot` became the query **"parking lot in
Columbus, OH"** — which returns parking GARAGES — and Breck's absence from a
list of parking garages shipped as *"invisible for the exact search"* with
*"we ran that search and went through the whole list."* The §30 failure
through a new door: a clean measurement of the wrong thing.

The DFS rows already carry each business's own category and the parser now
keeps it. `packTradeOverlap` refuses a rank claim when the returned categories
share nothing with the TRADE — the trade's words always count; the phrase's
own words count only against a provider-shaped category, because "Parking
garage" contains the phrase's words by construction while "Gutter cleaning
service" answering a gutter query is the right marketplace. Too little to
compare (a three-letter trade, rows without categories) produces no verdict,
and no verdict never refuses.

### The synthesis was the one block of prose no gate ever touched

`buildSituationRead` runs AFTER the seven-stripper battery, so its output —
the headline, the read, the character rows Mike reads in THE BUSINESS — went
to the sheet ungated. J Chester's rows carried *"A prospect comparing firms
reads that as a business that has stopped growing"* (the recency-conclusion
family, mechanically stripped from the audit since TriStar) and *"a form with
no automated acknowledgment"* (the post-contact family) — both flagged into
Do-not-say and both still printed in the narrative, which is §24's "the
fact-checker only watched" one block over. The synthesis now passes through
the same seven strippers, second call site, same walkers.

**And the post-contact family got its stripper.** The twelve backend rows
(`waits for a callback`, `nothing responds`, `goes to voicemail`…) were inline
`_flag` calls inside the route, so a stripper could not exist without copying
them. They are `AUDIT_BACKEND_CLAIM_ROWS` at module scope now — one table, two
consumers: the fact-check still flags, and `stripPostContactClaimsDeep`
(which also runs the ownership detector) REMOVES the sentence from audit
prose. Flagging and removing are different things.

**Our own code was writing the same claim.** The FOLLOW-UP diagnosis printed
*"nothing responds automatically — no CRM, no automated reply"* word for word
on all three leads — a backend assertion in a code-assembled template — and
the friction item said *"a form that submits and waits for a human to call
back"*, asserting a callback mechanism nobody measured. Both now say what was
measured, scoped to the pages we read.

### The smaller five, each live on a sheet

- **A 2-of-90 anecdote took leak #1 from a measured BURNING finding** on
  Conner's. The evidence-beats-inference promotion now takes the email's own
  anecdote floor: three mentions, not two — the same division the email side
  already refuses ("he will do that division before he finishes the
  sentence").
- **"Mid-morning is the worst window: he is on a roof or under a house"** — on
  a PAVING contractor and a kitchen remodeler. Roofer imagery was hardcoded
  for thirty trades; it says "out on a job" now.
- **"Someone ready to hire a cpa"** — `fixAcronymCase` uppercases the two
  initialisms in the ICP (CPA, HVAC) on audit rows and money lines,
  display-only, because every matcher lowercases before comparing.
- **The same finding printed twice in THE EVIDENCE** on two of three sheets:
  copy-quote findings merged into problemList (§43's AUDIT UNIQUENESS) were
  still also in the standalone own-words list. `dedupeOwnWords` drops an
  original whose text is already a problem row, on the record and the screen.
- **Three leaks that all opened "A kitchen or bathroom remodel runs
  $15k-$80k."** read as one template — later leaks now render only their
  specific half (`trimRepeatedJobValue`), the first keeps the money sentence.

For the junior caller the export also gained the pillar + **"fix we sell"**
line under each leak (the maps went to ONE module-scope copy — they were
duplicated inside two screen blocks and absent from the export entirely) and
the **email-confidence note** beside the address ("pattern-built, not
confirmed" is a thing a caller deserves to see, and education@ on a different
domain was printed bare).

`INFO TRAVEL CHECK` executes every one of these — the rung's say() on three
platform fixtures, the marketplace guard both ways, the stripper on the live
Conner's sentence and a general-truth control, the acronym fix and its
boundary, plus runtime-assembled call-site needles for the synthesis gates,
the floor and the rewordings. Eleven falsifications — eight server, three
client — each red alone; RANK ANCHOR CHECK's needle was widened for the new
`guardTrade` argument after it went correctly red on the wire change.

**227 boot checks green.** `index.html` changed, so this needs a Netlify
deploy.

---

