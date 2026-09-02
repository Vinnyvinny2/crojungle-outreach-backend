# §52 — The audit had no goal, and the rank was never the rank — 2026-08-23
Source: CLAUDE.md lines 4233-4388, moved verbatim 2026-09-02 from commit b01d952e4f95d7b69686bc2c4063ca2aa0cb7546 (branch backup/claude-md-monolith). Nothing below this line was edited.

## 52. The audit had no goal, and the rank was never the rank — 2026-08-23

Two things changed. The second one invalidates every rank sentence this system
has ever sent.

### The rank we reported was not the rank anybody sees

Vin checked four live audits against Google by hand:

| | we said | Google shows |
|---|---|---|
| Thrive Dental and **Orthodontics** | #2 of 20 | 12th |
| Tailor Made **Pest** and Wildlife | #1 of 20 | 4th |
| Rothchild **Law** Office | #5 | 14th |
| CTR Cleanup & Total Restoration | #4 | 2nd-3rd |

Three of the four carry the trade word inside the business NAME, and that is
the whole mechanism. **The Places `searchText` endpoint is a LOOKUP**: it ranks
by text relevance to the query, so a business whose name matches the words is
boosted up the list. We read that list's order as the local pack for the life
of this project. It never was, and no amount of location biasing or double
sampling fixes it, because it is not a noisy measurement of the right thing —
it is a clean measurement of a different thing.

Worse: §30's `narrowTradePhrase` deliberately builds the query out of words
taken from the owner's own business name. **The sharpening added to help
specialists was feeding the exact bias that broke them** — `orthodontic` is in
`TRADE_MODIFIERS` by name. And the file already contained the correct caution,
in a comment about DISCOVERY: *"Places returns results in ITS OWN prominence
order"*. The rank path never inherited it. Fifth recorded instance of a lesson
written down and not generalised.

**The real pack is also 15-50x cheaper.** DataForSEO's Google Local Finder
endpoint returns the actual "more places" list with rank, review counts, and
**paid rows separated from organic** — at roughly $0.60-2.40 per thousand
against Places Text Search Enterprise at $35 per thousand. So the fix for the
accuracy problem is also the largest available cut to our biggest variable
cost, and the paid flag settles a second complaint: Criswell sits first as a
SPONSORED result, which our audit could not see and reported as "not in the
top 3". `adsLiveInPack` is now the only direct proof we can buy that a
business is advertising TODAY — a tag on their own page only ever proved an
account existed.

**What survives an untrusted source, and why the two halves split.**
Presence-at-a-position does not. **Absence does, and is arguably stronger than
before**: a lookup that BOOSTS name matches and still fails to return them for
their own trade in their own city is better evidence of obscurity than a
neutral ranking would be. So a Places-sourced answer may still say "you are not
in this list at all"; it may never say where in it they sit, nor who sits above
them. `outranked_by_weaker` — one of only two rungs with a real human reply —
goes silent without a real pack. That hurts, and a named competitor read off a
relevance lookup is a sentence the owner disproves in one search, which costs
more.

Two walls, both falsified: `checkLocalRank` refuses to return a position from
an untrusted source, and `resolveMeasurements` nulls `rank`, `weakerAbove` and
`weakerNames` again at the one place every rung reads from. Gated there rather
than at each of the six consuming rungs, because a gate applied per consumer is
a gate somebody forgets to apply. `LOCAL PACK TRUST CHECK`.

**HONEST SHAPE: the DataForSEO path has never run against the live endpoint.**
The parser is fixtured at boot and the shape is validated at runtime; without
credentials the system falls back to Places and states no position at all. Set
`DATAFORSEO_LOGIN` and `DATAFORSEO_PASSWORD` and the flagship finding comes
back. Until then it is off, deliberately.

### The audit had no goal, so the ladder ranked by a feeling

`harm` is a hand-assigned guess at how bad a fault FEELS, and nothing in the
file said what the audit was FOR. So the model received forty unranked
observations and had to invent a point for itself, and every email fix for a
month was polishing a decision already made wrong upstream.

Vin: *"we need to pivot the goal of the audits to finding the biggest money
leaks, not finding the most problems."* And on the frame: people are moved more
by losing money than by earning it, so everything that leaves the building is
written as a LOSS.

**Seven buckets, ordered by loss aversion, every one of the 43 rungs placed.**
BURNING (money leaving now) · UNCAUGHT (they tried to reach him and could not) ·
INVISIBLE (they never found him) · LEAKING (arrived and lost) · ROTTING (in
hand, then lost) · TAXED (reputation) · MISPRICED (wrong buyer — Mike's call
sheet, never an email). The bucket is not a label: it decides which arithmetic
prices the finding and whether it may leave at all.

**UNCAUGHT sits above INVISIBLE deliberately.** A person who rang and got
nothing is a named event rather than an abstraction, and both human replies
this project has earned came from that bucket.

`RUNG_PILLAR` is declared in one table, the same discipline as
`STEM_COMPLETE_WORDS` and `NICHE_BRIEF_EXPECT`: a rung added tomorrow cannot
inherit a bucket by accident, because the build refuses until a human places
it. `MONEY PILLAR CHECK`.

**And `worst` was `byHarm[0]` over an UNFILTERED list**, so an internal-only
review metric could win it — and one did. *"Stop the recency bleed first"*
became THE ONE THING on a live call sheet, built on a finding we are barred
from ever mentioning to the owner. It reads `byMoney[0]` now, drawn from the
sayable set, because "what he should be buying" has to be something we are
willing to say out loud. `byHarm` is untouched — the audit and the call sheet
still carry every internal rung, which is the point of them.

### The benchmark table, and the wall around it

Cited figures are the one new class of number in this system and the one new
way something false could get out, so they carry the niche library's structural
wall: a row is a fact about a SEGMENT, it carries its figure, its source and
its date or it does not exist, and **no row may contain a second-person word**.
That last rule is what makes a statistic structurally incapable of becoming a
claim about the owner. Ten rows, from Harvard Business School on review ratings
to Deloitte and Google on mobile speed, and two are marked **self-serving**
because they come from companies selling the fix.

### Three false sentences, traced to their actual sources

- **"Ten photos"** on a listing with about thirty. The Places API returns **at
  most 10** photos, so we were reporting our own API ceiling as a measurement,
  to an owner who can open his listing and count. `photoCount` is null when the
  array saturates, `photosSeen` carries what we received, and every consumer
  was corrected — including the one that would have printed the literal word
  "null" into the fact-checker's own "do not flag claims that match these"
  block, which the recon caught in my half-finished fix.
- **"The newest review is 668 days old, which signals to a prospect is this
  place still active."** Vin: nobody checks the date on a review and concludes
  a business has closed. The model did not invent that framing — **it copied
  ours**: the audit prompt's own REVIEW RECENCY block said exactly that and
  ended *"Safe to state as fact."* Corrected at all three server sources. The
  measurement stays and is worth having: it says they have stopped ASKING for
  reviews, which is real intelligence for the call and not a leak we can price.
- **The guard that stops the model calling ten photos "thin"** read the field I
  had just nulled, so silencing the count would have silenced the guard on the
  only case it exists for. It reads `photosSeen` now.

### What this round did NOT build

Stated plainly rather than implied. The spec is agreed and this is the
foundation, not the whole of it. Still to come: the five free measurements
(outdated-site detection, secondary GBP categories, mobile speed as a ranked
rung, ads-with-no-landing-pages, missing conversion/call/retargeting tracking,
the unlinked page that 404s, the price anchor, intent mismatch, review-text
classification into operational buckets, unanswered negative reviews); the
three-slot email shape; the "at least $X you can count" floor; the loss-frame
gate over every rung sentence; and a claim-family gate over the AUDIT narrative,
which today has three strippers where the email has thirteen families and can
therefore not see a false CLAIM that contains no quote, no figure and no
spelled quantity.

**214 boot checks green.** Seven falsifications, each red alone — and the first
version of one of them passed on a broken build because the needle matched its
own source line. Ninth recorded instance of that trap in this file, and the
first I wrote myself; it is an executed predicate now, not a source search.

**`index.html` did not change this round, so no Netlify deploy is needed.**

---

