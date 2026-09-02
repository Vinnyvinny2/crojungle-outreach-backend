# §25 — Four findings that were false, and a diagnosis that was never published — 2026-08-20
Source: CLAUDE.md lines 1416-1600, moved verbatim 2026-09-02 from commit b01d952e4f95d7b69686bc2c4063ca2aa0cb7546 (branch backup/claude-md-monolith). Nothing below this line was edited.

## 25. Four findings that were false, and a diagnosis that was never published — 2026-08-20

Vin, on one audit: *"it gives a bunch of issues which is good but doesn't seem to
nail the What is actually worth selling them."* And, verifying one finding:
*"sells only by phone, shows no price, offers no guarantee — I see this a lot,
just want to verify that this is accurate."*

It was not accurate. Two of those four fire on businesses where the claim is
false, and the reason the audit reads as a checklist is that the system computes
three separate one-change diagnoses and renders none of them.

**"The only way to reach you is a phone call" — to businesses with online
booking.** `measureBookingPath` is the input to `no_after_hours`, which is
SELLABLE **5**, the maximum in the ladder. Three defects, all sending:

- **Order.** The `tel:` and form checks ran ABOVE the scheduler check, so a trade
  site that embeds Calendly or ServiceTitan AND prints its number in the header —
  which is most of them — returned `phone_only`. Falsified against the real
  function: seven of sixteen realistic booking shapes came back `phone_only`, and
  removing the `tel:` link alone flipped the same page to `online_booking`.
- **Input.** It was handed the INTERIOR pages only. The homepage is excluded from
  that corpus deliberately and correctly — for the PRICE read it was built for —
  and it is also the one page carrying the BOOK NOW button. PART 4 §8 records this
  exact shape in the function next door; nobody checked what else read the same
  corpus.
- **Format.** It was handed markdown. Its `<form>`, `<textarea>` and `href="tel:"`
  branches have been dead for its whole life, and **a scheduler embed is an
  `<iframe>`, which markdown deletes entirely** — so the most common shape of real
  online booking was invisible whatever the order. Reordering alone would not have
  fixed it.

It reads the rendered homepage SOURCE now, which is already fetched and already
paid for. The same cascade decides `form_only_no_booking` ("someone ready to hire
cannot book a time"), so both false claims came from one function; a boot check in
the file records them as the two most frequent fixed-string rungs after the offer
trio, at 4 of 20 and 6 of 20.

And `no_after_hours` asserted *"finds nothing to start with until the office
opens"* **with nothing checking that they close**. `regularOpeningHours` was in
the Places field mask all along and only its existence was kept. Emergency trades
are the ICP, 24/7 is normal in them, and `URGENCY_ADJUST` adds 26 points to this
rung on exactly those trades — so it was most confident where it was most likely
to be false.

**A street address where a city belongs.** `readMarketClarity` was handed the
lead's `location`, which is Google's `formattedAddress`. The needle became
`"w th st overland park ks usa"` and matched nothing on every lead ever run, so
every lead collected the gap *"their own city barely appears in their copy"*.
Falsified: identical copy naming Overland Park five times reads `partial` with a
clean town and `undifferentiated` with the production address.

The blast radius is why this is not one false sentence. That gap decrements the
score, which sets the band, which sets `isConstraint`, which is the MARKET branch
of `measureGrowthConstraint` — and `BINDING_LAYER_BONUS` then adds 10 to every rung
in the binding layer. A street address in a city slot could move **which layer the
whole email is built on**. The gap text also reaches the situation read verbatim
and the email's MY READ block. A correct parser was 27 lines away.

**`namedOffer` was inverted at both ends.** It was `!genericOnly`, and the truth
table is backwards: *"Get a quote. $500 off our fall special"* scored FALSE, so
`no_offer` fired on a business plainly making an offer; a page with **no call to
action at all** scored TRUE, so it went silent on the only case it exists for.
Both falsified against the real function. A named offer is read from positive
evidence now — a dated promotion, something free or financed, or a specific ask —
all three of which `readOfferStrength` was already measuring and discarding.

Its sentence also claimed more than its test: *"nothing tells a stranger why to
pick them instead of the next name on the list"* is a claim about
DIFFERENTIATION, and the test measures two absences. A business can be plainly
differentiated and trip both, and that owner argues with it. It says the two
things measured now.

**We fetch the homepage twice and read the ads off the worse copy.**
`checkBuiltWith` does a plain no-JavaScript fetch inside the SAME
`Promise.allSettled` as the rendered Firecrawl scrape of the identical URL. The
three advertising markers — the only live ad signals in the system, gating both
SPENDING rungs — were read from the plain copy, which returns all-nulls the moment
a site challenges bots. PART 4 §13's "we bought the same reviews twice", with the
twist that the duplicate we kept is the lower-quality one. Positives now merge up
from either copy; an unreadable page still reports null rather than false.

One limit, stated because the absence direction rests on it: the scrape sets
`blockAds`, so a tag injected purely at RUNTIME may be missing from the rendered
copy. Every marker matched is inline in the source, so this is strictly better
than a fetch that executes no JavaScript at all — but it is not proof of absence,
which is why `adsReadable` still gates every absence claim.

---

**The one-change diagnosis was never missing. It was unpublished.** Three of them,
all code-assembled from measurements, all rendered nowhere:

| | |
|---|---|
| `measureGrowthConstraint` | which layer is binding, **why** it is binding and not a cheaper one below it, and what that layer is worth selling. Reached the screen as four words in 11px grey — and its `why` was **stripped by the server** before it left, while the only client render for it sat behind a condition that could never fire. Two bugs compounding, so neither could be seen. |
| `measureValueEquation` | the interested-to-book-to-close friction Vin describes as wrong with ninety per cent of these sites, as sentences the owner can check, plus `earnedButBlocked`. Returned, persisted, rendered **nowhere at all**. |
| the bottleneck cascade | the FIRST broken link in the revenue chain, each branch naming what must be fixed before anything downstream is worth buying. **Never left the server** — it existed only as a string inside a prompt. It is the only dependency model in the system; every ladder rung is otherwise independent. |

They are assembled into one `theOneThing` block and rendered above the findings,
because the findings are its evidence and not a menu. No model writes any of it,
so it carries no new fabrication surface.

**And the findings were ordered by the wrong question.** `buildProblemList` sorted
by `opener` — the EMAIL's cold-open score, which carries a 44-point penalty for
anything an owner could fix himself. `rankHarms` already computes `byHarm` and its
own comment calls it *"what is actually costing them most"*; nothing rendered it.
So the heading "worst first" was not true, it was "most likely to earn a reply,
first". This file's own TWO LADDERS block says these are different questions with
different answers, and the audit was reading the email's answer.

**The conclusion was a menu, and its own prompt taught it.** `whatHeNeeds` is the
paragraph under "What is actually worth selling them". Its entire specification
was eleven words, it was the only field with no validation of any kind, and one of
the two worked examples in its prompt reads *"The two honest openings are..."* —
the prompt demonstrated the failure it needed to prevent. Live on John Peters it
named three things. The example is rewritten and the output is measured, because
instructional guards do not hold.

**The strategic read was destroyed on every page reload.** Two different values
are called `situationRead`: the audit brain's ONE SENTENCE, and the separate
synthesis OBJECT carrying the headline, the 3-5 sentence read, the character rows,
the closing recommendation and **the only diagnostic question the system generates
for a salesperson**. `rowToLead` read the sentence first, and `??` only falls
through on null, so the summary replaced the real thing on the first reload of
every lead ever audited. The screen still rendered, which is why it survived.

This one matters beyond itself: the line Vin singled out as the good one —
*"almost obsessively engaged with his reputation"* — lives in `situationRead.rows`.
Adding more owner-behaviour facts before fixing this produces a line he sees once.

**And the only finding with a date on it was filed as timeless.** AMBIENT means
"true of nearly every business like theirs, so it explains nothing about why THIS
one is behind". `hiring_marketing_now` is harm 90 and novel 15, and the rule keys
on novel alone — so the system's single catalytic signal was demoted below every
storefront observation. PART 4 §1 names the absence of a clock as the largest gap
in the pipeline.

---

**Exporting fifty audits without making a second copy of the audit.** Vin: *"when
we audit bulk 50 we need to be able to export just the audits easily so nothing
gets ruined."* The obvious build is a formatter that walks a lead and writes out
the sections, and that is a SECOND implementation of what an audit is — the copy
that rots, because it only runs in the case nobody tests. So: `auditRecordFor`
turns a lead into plain data and is the one place that says what an audit
contains; `auditExportHtml` turns that data into a page and knows nothing about
leads. `clientcheck.js` lifts both out and RUNS them against a lead whose every
field is a unique marker, then looks for all 28 markers in the rendered page.

One self-contained HTML file: no assets, no network, opens anywhere, prints to PDF
from the browser, one page per audit and a clickable index. Deliberately not a
spreadsheet — an audit is prose with structure and a CSV destroys it. The company
name is escaped, because a business called "Smith & Sons <Roofing>" silently
corrupts everything after it, and the check falsifies on that too.

---

**What the falsification runs found in the new checks themselves.** Every fix was
reverted individually; three checks passed on the broken build first time and only
falsification found it:

- **Two checks tested the callee and the caller separately, and missed the wire
  between them.** BOOKING PATH CHECK exercised the assembly function and the rung;
  blanking the homepage argument at the CALL SITE left every fixture green. CITY
  PARSE CHECK ran the positioning read directly; reverting the one caller that
  hands it an argument left every fixture green. OFFER MEASUREMENT CHECK did the
  same on the delivery line, which is where the inversion actually lived. All
  three now carry a call-site assertion, needles assembled at runtime with comment
  lines stripped — because a literal needle finds itself, and because these
  comments quote the broken calls verbatim.
- **One falsification was not a revert at all.** Swapping the preference order
  inside `pickSituationRead` changed nothing, because in production one side is
  always a string and the shape test decides. The real revert is the original
  `??` precedence, and only that turns it red. A falsification that does not
  reproduce the original defect proves nothing.
- **The export's self-containment assertion was too wide** and flagged a plain
  text link as a network dependency. It matches actual resource loads now —
  script, link, img, iframe, `@import`, CSS `url()`.

**`index.html` changed this round, so it needs a Netlify deploy.** The server half
is live on merge; the one-thing block, the export button and the reload fix are
dark until the file is dragged in.

---

