# §58 — The first audit after the pivot, read word by word — 2026-08-24
Source: CLAUDE.md lines 4946-5027, moved verbatim 2026-09-02 from commit b01d952e4f95d7b69686bc2c4063ca2aa0cb7546 (branch backup/claude-md-monolith). Nothing below this line was edited.

## 58. The first audit after the pivot, read word by word — 2026-08-24

Vin ran America's Home Place on the merged build and asked three questions:
is a higher website score good or bad, are we 100% sure about "no conversion
tracking anywhere on their site", and why is a review metric leak #2. All
three found real defects, and the goal was restated: **three leaks, led by
the biggest, each translated into money the owner feels. The finding does not
have to be spectacular; the translation does.**

### "Are we 100% sure?" No — and now the claim is bounded

`ads_untracked` had no Tag Manager guard. Google's own recommended setup runs
conversion tracking INSIDE a GTM container, where our reader cannot see it —
the exact rule `social_spend_no_search` and `no_retargeting` have carried
since they were written, missed on the sibling built the same day. And the
sentence said "anywhere on their site" about the pages we read. The rung now
requires `tagManager === false`, the sentence is scoped ("no page we read
carries conversion tracking or call tracking"), and the facts-strip chip
reports "could not see inside their tag container" as null rather than as a
red "no conversion tracking". What Google can count WITHOUT site code — call
assets, GA4 imports — was never claimable and still is not.

### A review metric was leak #2 on the call sheet

"Their Google reviews have slowed" sat as leak #2 with "fix we sell: search
ownership (marketing retainer)" under it — a retainer pitch built on one of
the seven numbers we are barred from ever saying to the owner. Rows now carry
`internalOnly` from the ONE declaration, and the top-3 filter (screen and
export both) refuses them. They keep their row in the full findings list,
marked "internal — never say reviews to him".

### The one-thing said "absent" while the ladder held its tongue

The ONE THING block read absence off a raw single draw (`rankScanned > 0 &&
!haveRank`) while `absent_from_search` demands two misses — one measurement,
two readers, two verdicts on one sheet. `measureGrowthConstraint` now takes
`rankAbsentConfirmed` from both call sites and an unconfirmed miss binds
nothing on visibility. `paying_for_a_search_they_lose` had the same hole from
the other side: its absence branch fired harm 94 off ONE draw. Both now clear
the same two-miss bar. §6 recorded a business returning #3 and #12 minutes
apart; harm 94 was riding that coin flip.

### The translation layer — the finding, said as the money it loses

Every problem row now carries `moneyLine`, assembled by code per pillar. The
ONLY figure it can hold is the trade table's own job-value sentence (already
licensed by AUDIT MONEY CHECK); a trade the table does not know gets the
figure-free version, never an invented number. Rendered under each of the
top-3 leaks on the card and in the export. The score card also answers Vin's
question on its own face: "their website build — higher is better. Grades the
site itself; ads, tracking and search are judged separately" — AHP's 10/10
beside a BURNING ads leak is consistent, and now says so.

### The stale cache that re-entered the pipeline

The new index.html was dragged into an OLD Netlify site. That origin's
localStorage still held a weeks-old pipeline; the cloud answered fine; and the
boot merge put every relic on screen AND seeded it into Supabase as new work.
Once the cloud has answered it is the truth: a local-only lead now merges only
if it was created here within 7 days (fresh unsynced work); anything else is
dropped by name, not seeded, and self-cleans out of the cache. An empty cloud
still takes the full first-seed, so a genuine migration is untouched. The
relics already seeded must still be deleted by hand — the guard stops the
class, it cannot un-write history.

### And the screen dedupe

"Costing them most" printed leak #1's sentence a second time and is gone from
the screen (the export keeps it as a fallback for leads with no leaks rows).
Duplicate warnings collapsed earlier; the card now numbers the leaks.

**Also in that log, and not a code defect:** LOCAL PACK TRUST printed "No
DataForSEO credentials on this instance" — the env vars never reached the
service (an unlinked Render environment group). Until they land, no lead gets
a search position. And the run rode a mid-session deploy restart, which is
what the second full check-suite in the log was.

**Eight falsifications, each red alone.** 225 boot checks green.
`index.html` changed, so this needs a Netlify deploy.

---

