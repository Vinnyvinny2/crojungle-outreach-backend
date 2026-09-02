# §56 — The audit learned to answer the operator's first three questions — 2026-08-24
Source: CLAUDE.md lines 4776-4854, moved verbatim 2026-09-02 from commit b01d952e4f95d7b69686bc2c4063ca2aa0cb7546 (branch backup/claude-md-monolith). Nothing below this line was edited.

## 56. The audit learned to answer the operator's first three questions — 2026-08-24

Vin, on the TriStar audit: *"theres info everywhere... i dont cealry know what
1 2 and 3 of the biggest revenue leaks are... not sure why our audit is leading
with 'Nothing here is broken enough'... nit picking copy of the wbeiste is kind
of a dead end... id like to see just a ranking out of 10 of their website...
we need to know if they have landing pages simply stated... we need to be sure
about if theyre running ads yes or no."* Every one of those was real.

### "No crisis" on a lead with five measured obstacles

TriStar has 90 reviews, customers publicly writing *"been calling for three
weeks, still no call back"*, an 8-field form as the only route in, no booking
and no published price — and the one-thing block said *"Nothing here is broken
enough to lead an email with... manufacturing a crisis."* Two faults compound:

- **The diagnosis read its review base off the rank row.** `localRank.ours`
  only exists when a trusted rank search matched us, and the DataForSEO
  credentials were not on that deploy — so on every rank-dark lead the
  constraint had NO review count, while Place Details held the authoritative
  90. Both call sites now read authority-first, the same order
  `resolveMeasurements` uses.
- **CONVERSION accepted only a rank or a strong rating as proof customers
  arrive.** A review complaint about CONTACT is the arrival event itself,
  written by the person it happened to. Two independent contact-pain mentions,
  or a thirty-review base, now prove arrival — and the branch names which
  proof it holds.

And the fallback no longer dismisses measured friction: three or more
obstacles get named plainly ("no single layer dominates, but N measured
obstacles sit between an interested customer and a booked job"), while a
genuinely clean lead KEEPS the no-crisis verdict, because manufacturing a
crisis is the failure that sentence was right about. `GROWTH ARRIVAL CHECK` —
the TriStar shape must diagnose CONVERSION, and the check caught my own
incomplete edit on its first run (one call site wired, one not).

### "Worst first" now means the money

The findings list opened with two message-match copy quotes while the callback
complaints sat third and the 8-field form fifth — the copy rows were prepended
with `opener: 999` and everything else sorted by harm, a hand-assigned guess at
how bad a fault FEELS. The list now orders by money pillar (BURNING > UNCAUGHT
> INVISIBLE > LEAKING > ROTTING > TAXED), harm breaking ties inside a pillar,
and the copy quotes rank with TAXED: unique evidence, still not a money leak,
and an owner cannot be convinced that a sentence on a page costs him dollars.
`FINDINGS MONEY ORDER CHECK` runs a fixture where harm order and money order
deliberately disagree, because one where they agree would pass on the old sort.

### The /10, the facts strip, and the top three leaks

- **`scoreWebsite`** — six measured components (phone layout, build age,
  booking route, form size, real-visitor speed, https), every point traceable,
  and a component we never measured LEAVES THE DENOMINATOR instead of scoring
  zero — a half-read site is scored on the half we read and the card says how
  much that was. TriStar's shape lands in the bottom half; a modern site with
  a real scheduler can reach the top.
- **`buildAuditFacts`** — ads running / none found / could not read (three
  states, and only two are about the business — absence still rides
  `adsReadable`), the booking route, the form size, the campaign pages the
  site does not link to (positive only, absence proves nothing), real-visitor
  speed, https.
- **The audit screen opens on one card**: the score, the facts strip, and the
  1-2-3 biggest money leaks — pillar-labelled, each carrying *"fix we sell:"*
  from a pillar→product map, so the leak and the catalogue item arrive as one
  thought. "What is actually worth selling them" gets the same product line,
  derived from the leaks rather than asked of the model, because asking a
  model to name a product is how feature-pitches ship. The export carries the
  score and facts line for the call sheet.

Both new fields ride the response, the merge, and `leadToRow`/`rowToLead` —
clientcheck's executable contract demanded the merge the moment the server
returned them, which is that check doing its job. `WEBSITE SCORE CHECK`, six
falsifications across the round, each red alone.

**223 boot checks green.** `index.html` changed throughout, so this needs a
Netlify deploy.

---

