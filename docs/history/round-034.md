# §34 — The clock, at last — and the honest limit on it — 2026-08-21
Source: CLAUDE.md lines 2152-2285, moved verbatim 2026-09-02 from commit b01d952e4f95d7b69686bc2c4063ca2aa0cb7546 (branch backup/claude-md-monolith). Nothing below this line was edited.

## 34. The clock, at last — and the honest limit on it — 2026-08-21

PART 4 §1 has carried *"nothing has a clock on it"* as the largest gap in this
pipeline for weeks. Every finding is an ongoing condition. The reason is not the
ladder and it was never going to be fixed by writing better rungs:

**One look at a business cannot see a change.** A rank, a review count, an
advertising tag — each is a photograph. You cannot get *"he started running ads
six weeks ago"* out of a photograph however good the photograph is. Exactly one
rung in the file reads a date, `hiring_marketing_now`, and its inputs arrived
only from TheirStack — so on the 92.5% of leads that come from Google Places, no
rung in this file could say when anything happened.

Two things were built, both costing nothing.

### The hiring clock now works on a Places lead

A business that wants its openings in Google Jobs must publish `JobPosting`
structured data with a `datePosted`, and that markup is sitting in the page
source we ALREADY buy and already read for advertising tags. Same page, same
credit, no model, no prose parsing: **a machine-readable date the owner published
himself.** Harvested in `harvestInteriorMarkup`, which every scraped page already
passes through, so a posting on the homepage, the careers page or a services page
all count.

It refuses far more than it keeps, because a WRONG clock is worse than none —
telling an owner he posted a role eight months after he filled it is the sort of
checkable error that destroys every true sentence beside it. No `datePosted`, a
date in the future, a passed `validThrough`, or no title, and there is no clock.
An undated opening still reports "they are hiring right now" — present tense,
true, and on the call sheet only.

**And the date is paired to the MARKETING role specifically.** A dispatcher
posted yesterday must never date a marketing manager posted eight months ago:
true role, true date, false sentence. Which titles are marketing is decided by
`signalsFromTitles`, the one function that owns that question, because a second
copy of that rule here is the disease this file keeps recording.
`HIRING CLOCK CHECK`.

### The observation ledger — the only true event this system can ever measure

Two looks CAN see a change. And this system has been taking a second look at the
same businesses for weeks and throwing the comparison away every time: the bench
re-serves 393 overflow businesses a run, the query memory rests exhausted ground
so old ground comes back, and Vin re-audits leads by hand (*"ive ran an audit on
ram jack like 6 times"*). Every one of those was a free observation against an
earlier one, discarded.

So: one small row written per research, one row read back. **No API costs a penny
more.** Needs a table:

```sql
create table business_observations (
  id bigserial primary key,
  biz text not null, company text not null,
  at timestamptz default now(), snap jsonb not null);
create index business_observations_biz_at on business_observations (biz, at desc);
```

**HONEST SHAPE, STATED FIRST: on a business we have never seen before this
produces nothing, and says so.** It is a recorder before it is a finder. The first
audit of a lead is the price of the second one being able to speak. There is no
way to buy this outcome without either paying for a data source (Vin: *"if
anything it needs to get cheaper"*) or waiting — and waiting is free.

What it may say, and what it may not:

| | |
|---|---|
| `rank_slipped` | **sayable.** Their position on the same search dropped. |
| `ads_started` | **sayable.** A Google Ads tag appeared that was not there before. |
| review pace, `weaker_above_grew`, a tag that went away, two searches that cannot be compared | **internal.** On the call sheet, never in an email. |

`rank_slipped` carries four gates, and every one of them exists because of a bug
already in this file:

- **the same search phrase both times.** §30 made the phrase depend on what their
  own name says they sell, so two runs can legitimately measure DIFFERENT searches
  on one business. Comparing "plastic surgeon" against "facial plastic surgeon"
  would manufacture a collapse out of two correct readings. When the phrases
  differ the log says the positions are not comparable rather than going quiet.
- **two agreeing samples on BOTH dates.** §6: one business returned #3 and #12
  minutes apart. A drop measured against a draw we already refused to state is
  noise with a date on it. Passed through RAW so an unmeasured stability is null,
  not "they agreed" — writing `!== false` here would have licensed the strongest
  new claim in the file off a single service-page draw.
- **a move bigger than that noise**, and at least a fortnight and at most a year
  between looks.
- **only a DROP.** Climbing is a compliment, not a finding.

**It sits BELOW `outranked_by_weaker` on purpose.** It is the more surprising
sentence and almost certainly the stronger one. It also has zero evidence behind
it, and `outranked_by_weaker` is one of only two rungs with a real human reply.
PART 6: do not trade a proven sentence for a better-looking one. Harm 88 against
92, which with novel 96 against 72 lands the opener scores at 94.7 and 97.0 — the
proven sentence keeps the lead on any business where both fire. That was reasoned
out on paper first, and §29 says paper arithmetic is exactly what to distrust, so
the check EXECUTES the real ranker and asserts the order. Raise it when a call
outcome says to, and not before.

**The isolation rule is the whole risk here.** §19 is the worst bug this system
has had: a colliding cache key handed Donna Krummen John Peters Roofing's audit.
This table is the same danger pointed at TIME — a snapshot read under the wrong
key would state another business's search position as this one's, *with a date on
it*, which is the most confident possible way to be wrong. So the row remembers
which company it was written for and a read by a different company is refused by
name. A legal suffix is not a different company: Google's `displayName` and our
stored name disagree about "LLC" constantly, and refusing a business its own
history over a suffix is the guard-too-tight failure §14 records. A practitioner
credential (MD, DDS) is deliberately NOT stripped — §24 already turns on telling
those apart.

`OBSERVATION LEDGER CHECK`, thirteen guards, every one falsified individually.

### What was deliberately NOT done

- **`ads_started` is not a rung.** A tag appearing is an observation, not a
  fault; the FAULT version is `paying_for_a_search_they_lose`, which already
  exists at harm 94. Adding a second unproven rung to compound the first is how
  two levers become one unreadable result. It reaches the audit and the call
  sheet and stops there.
- **No existing rung's sentence was changed** to carry a date. Every one of them
  would read better with `ads_started` attached; each is also a working sentence,
  and one of them has a reply behind it.
- **Google Ads Transparency stays off.** It is dated and it is built, and it costs
  a credit per lead and has never been run against a live advertiser from this
  codebase. Shipping it on would report an unproven read as a measurement.

**`index.html` changed, so this needs a Netlify deploy.** The ledger's server half
is live on merge; the "What changed since we last looked" block on the call sheet
and in the export is dark until the file is dragged in.

---

