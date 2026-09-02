# §100 — Four nav labels became the decision-maker, and the price was measured at last — 2026-09-01
Source: CLAUDE.md lines 9245-9439, moved verbatim 2026-09-02 from commit b01d952e4f95d7b69686bc2c4063ca2aa0cb7546 (branch backup/claude-md-monolith). Nothing below this line was edited.

## 100. Four nav labels became the decision-maker, and the price was measured at last — 2026-09-01

Vin ran two Find presses and nine contact reads on the merged Round 99 build and
sent the whole Render log, the exported CSV and Deirdre Taylor's audit. The round
worked in part — Diehl-Whittaker's nine-person roster parsed perfectly, Founder
through Funeral Assistant, and settled the owner for **zero credits**. The
calling window landed and is populated in the file.

The log carried five reproducible defects. One was mine from Round 99, and one
was **in the exported CSV that morning**.

### The price, measured rather than estimated

Three sessions had proposed cuts to a bill nobody had measured. From that run's
own meter lines:

| | measured |
|---|---|
| Find press | **60 Places queries = $2.10** (the log's own cumulative counter, $2.10 then $4.20) |
| Contact read | **6.33 Firecrawl credits, $0.0076 of model** across nine leads |
| Genuine free-settle | **2 of 9** — and a third "settled" on a nav label, so the real rate is worse than the log said |

At 50 a day × 22 days = 1,100 leads a month: **~6,970 Firecrawl credits**
(Standard $99; Hobby's ~3,000 does not reach), **$8.34 of Anthropic**, and
**$0 of Places** — four presses of 60 queries sits inside Google's free
1,000/month. **Roughly $115–135 a month, and Firecrawl is ~75% of it.**

**Vin's hypothesis was measured false.** Find is $2.10 a press and effectively
free per month; the contact reads are the whole bill. And the single number
driving them is the free-settle rate: at 22% it is ~6,970 credits, at 60% it is
~3,520 — the difference between the $99 plan and the $16 one. So the owner
fixes below are the quality fix *and* the cost fix, which is why they led.

### A nav label became the decision-maker — and one of them SETTLED

```
👤 ROSTER [Jim Reynolds Asphalt]:  Contact Us Feedback is "Become a Partner"
👤 ROSTER [THE ALLEN CPA FIRM]:    Corporate Responsibility is "Meet the President"
DM [THE ALLEN CPA FIRM]: settled at stage 1 — skipped web search (~10 credits saved)
```

Executed rather than read: `ownershipIsHead("Meet the President")` returned
**true at authority 90**, `ownershipIsHead("Become a Partner")` **true at 85**.
Both parse as owner-level, and Allen CPA **stood down every paid source on
one** — so the CSV shipped `Corporate Responsibility / Meet the President` as
the person to ask for.

This is the "Partner Track" class one grammatical step sideways. `titleHeadIs`
asks what FOLLOWS the ownership word and never what PRECEDES it, so a call to
action whose object happens to be an ownership noun read as a title.

**The same head rule, looking left.** A phrase whose head is an **imperative
verb** — meet, become, join, contact, see, find, ask, learn, request, schedule,
donate — is a nav label, not a job somebody holds, and it is disqualified before
the pattern runs at all. No real title opens with one; "Managing" and "Acting"
are participles and were already resolving. Both directions fixtured, because a
verb list widened until it eats "Owner/Operator" is the more expensive failure.

### My own Round 99 regression: the practitioner words matched anywhere

```
👤 ROSTER [Bradley Hull IV]: Video Center (An Ohio Attorney For),
   Services Across Ohio (Compassionate Attorney), Firearms Trusts (Power Of Attorney)
```

Before Round 99 `attorney` returned NULL and these paired with nobody. I added
`PRACTITIONER_TITLE_RE` as a **bare `.test()`** with no head rule — so "Power Of
Attorney", a legal instrument, became a job title, and three junk names were
paired behind it. Round 99's own entry says the head rule is *"parameterised
rather than copied"*, and I then wrote the one new caller that skipped it.

Two fixes, both through the one function: the practitioner words go through
`titleHeadIs` exactly as the ownership words do, and `titleHeadIs` learned that
**an ownership word preceded by a preposition is that preposition's object**.
The bar is deliberately narrow — "Of Counsel" is a REAL law-firm title and a
bare preposition test would delete it. What separates them is whether anything
sits in FRONT of the preposition: "Of Counsel" opens on it, "Power Of Attorney"
has a noun before it.

### "Surek Plastic Surgery" and "Firearms Trusts" parsed as people

Both clear `ROSTER_NAME_RE` — three and two capitalised words. `personFromRun`
has refused a name made only of the LEAD's own company words since it was
written, which does nothing when the name belongs to a *different* company.

`BUSINESS_TAIL` refuses a run whose **last** token is a noun that ends a firm's
name and ends nobody's — surgery, dentistry, construction, trusts, associates,
clinic. Only the last token, because that is the surname slot, and the list is
narrow on purpose: **"Law", "Bell" and "Steele" are real surnames and are absent
by decision**. Jude Law and Mary Steele are fixtures that must survive.

### The contact path had no wrong-company guard

```
FC PAID [map] quinnplasticsurgery.com
👤 ROSTER [Quinn Plastic Surgery]: — Surek Plastic Surgery (Board-Certified Plastic Surgeon)
DM/brain [Quinn Plastic Surgery]: ✓ Chris Surek [high]
```

**quinnplasticsurgery.com serves Surek Plastic Surgery's content.** We read
Chris Surek as the owner of Quinn's practice. The paid wave rescued it — Yelp
and the licence record both said John Michael Quinn — but only by luck, and it
cost 8 credits. `confirmDomainMatch` exists and the contact route never calls
it.

The guard here is **free rather than a model call**: not one distinctive word of
the lead's own name appears anywhere in the pages we read. "Quinn" is in the
domain and absent from every page. **A note, never a drop** — a business that
rebranded is still the business, and §14 records what a guard too tight costs.

**And the flag needed a home, which is where it nearly died.** The server also
pushes a note, and the notes line on the card renders **only when there is no
owner and no email** — which is precisely the case this flag does not describe,
because here both exist and both may belong to somebody else. A guard in the
wrong place, found by reading which branch the note lands in rather than by
watching it fail. It is its own line on the card now, in the one colour this
screen reserves for a stop, and it rides the merge as its own field.

### A lead the server RULED OUT was in the exported CSV

```
🔗 FIND CONTACT [Daniel Bortnick, MD]: DROPPED as a branch of a larger operation
```

and his row was in the file, ICP 45, with a phone number off his Google listing.
Mine, from the round that added the tabs: I filtered the rendered LIST by tab and
left the export reading the whole pool, and `hasContactData` only asks whether
there is something to dial.

The membership rule lives in `findContactRows` now, so the CSV and the Google
Sheet both inherit it rather than each carrying a copy — the destination added
next is correct without knowing this happened. The two panel counts were reading
two populations for the same reason and now read one.

### The paid wave is measured rather than argued about

Miller's Integrity Construction cost 10 credits and produced nothing: the free
read found zero names and zero ownership words, all three paid stages ran, and
nothing came back. Jerry Spears was the same shape and produced a name the
authority gate then HELD BACK — 11 credits for an unusable row.

Two of two in one run is not evidence, and a stand-down decided on one afternoon
is exactly how a real source gets switched off. So `💸 OWNER WAVE` records, per
lead, whether the paid wave was bought, what it produced (a buyer we can name, a
name below the buying floor, or nobody), which sources settled it, and what it
cost. **Grepped across a batch that line IS the free-settle rate**, and that rate
is what decides the Firecrawl plan. The stand-down waits for it.

### What was deliberately NOT done

- **No stand-down on the paid owner wave**, until the line above has real numbers
  from a real batch.
- **No widening of the enterprise name filter.** §91 recorded that it catches
  none of the six national brands that cost money, and §14 records what widening
  it costs. Scope, not names, is the mechanism.
- **Deirdre Taylor's audit contradiction is diagnosed as unknown, not guessed.**
  Her story says *"She ranks #3 of 20"* and *"7 of 10 measured signals are
  clean"* while the funnel says **Getting found: NOT MEASURED**. One of those is
  false and which one cannot be told without her audit's own Render log — the log
  sent was the Find and contact run. Asked for rather than answered.
- **The verifier ran out of credits mid-run.** §94's latch re-tested and
  recovered on its own. That is a top-up, not code.

### What the falsification runs found

**Thirteen reverts, each applied alone against a baseline the harness proves
green first, each red on its own named assertion.** Two things were wrong in the
checks rather than the code:

- **One needle covered two call sites.** The wrong-company flag and the owner
  wave line were asserted with a single `||`, so both went red when either was
  reverted and the message could not say which. A guard that fires with the wrong
  cause on it costs what a missing one costs, and this file records the same
  shape at the `leakWhereFor` and mailto scanners. Two assertions now, each
  naming its own consequence.
- **The render had no guard until the falsification pass asked for one.** The
  merge wire and the card line are asserted separately, and reverting either goes
  red on its own sentence.

**273 boot checks green**, every gate: tdz, dupkeys and scopecheck on both files,
fetchtest, pngscale, clientcheck, batchcheck, auditfuzz over 5,000 vectors,
fuzzcore over 20,000 cases, servercheck's **81** assertions over a fake network,
and 2,050 emails composed over HTTP.

**HONEST SHAPE: none of this has run against a live press.** Every fix is
executed at boot or in `clientcheck` against the exact strings the 2026-09-01 run
produced. What a real fifty-lead press yields is settled by the next run's
`💸 OWNER WAVE` and `📇 FIND RUN TALLY` lines.

**`index.html` changed, so this needs a Netlify deploy**, and the contract is
**20260922** on both sides — a stale page renders the ruled-out leads into the
CSV and shows no wrong-company stop, and it will say so by number.

---

