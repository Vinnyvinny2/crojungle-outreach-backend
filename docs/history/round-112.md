# §112 — The first Round 111 run: measure the size, name the owner, show the lanes — 2026-09-03
Written 2026-09-03 for docs/history (one file per round; CLAUDE.md carries no history). Not a moved section: verify-split.sh skips it.

## 112. The first Round 111 run: measure the size, name the owner, show the lanes — 2026-09-03

Vin ran 25 contact reads on the Round 111 build the same evening (contract
20260928 both sides). 21 rows came back in the CSV: *"is that because 4 were
email leads? Also there's no section as to where the email leads go, the
contact box is just a cluster ... analyze hard, make sure everything is
running perfect and flawless and exactly how we drew it up."* Then, through
the widget: *"shouldn't we always be able to get the decision-maker name?"*;
the email lane as **a plain list this round**; and on the size confidence:
*"they should always be sure and likely; if that's not the case we need to
improve signals."*

### What the run showed (each reproduced against the live code)

1. The four rows off the file were the lane rule working — Whitco (email
   lane), Overhead Door of Jacksonville and Carter Septic (benched) — but
   the panel blamed "no owner, no address and no number", and nothing on
   screen showed where they went.
2. **Old businesses never had their size bought.** "41 years at 58 reviews"
   returned a band, so the lookup guard saw a size and skipped: Allied,
   Zaring, NATiVE, PSI and Overhead Door all printed "low (guess)". A guess
   blocked the measurement.
3. **The sheet and the lane disagreed on unmeasured leads.** Hayward Tree
   Service: sheet "low (guess, 130 reviews)", lane "core, call + email" off
   the Find-time affordability band. One lead, two rulers.
4. **A directory's figure was trusted alone**, and "<$5M" read as $5M:
   Almeida Roofing (gmail address, nobody named) was "high (likely)" on one
   RocketReach estimate; Landon Plastic Surgery was "medium (likely)" on a
   ZoomInfo "<$5M" bucket.
5. The team page (Whitco 8 names, AGR 2) was measured and never read by the
   size.
6. The lookup found nothing on 5 of 9 — one query over five revenue
   directories.
7. **Nobody named on 7 of 25.** Three of the misses were ours: Almeida and
   Carter lost their city ("no city could be parsed") so the licence search
   was skipped — `cityState` could not read "Phoenix AZ" without a comma or
   "Phoenix, Arizona"; Overhead Door Company of Jacksonville is a franchise
   and cost 9 credits; the registry stage is off because it named filing
   agents.
8. **An eponymous owner held below the buying floor**: Dr. Bruce Landon of
   Landon Plastic Surgery, confirmed on his own site, "Medical Director"
   (authority 35) — HELD BACK, address blocked. The lift fired only when the
   title was absent.
9. Whitco's leadership page listed clients beside their titles and the
   roster read "Atlanta Journal-Constitution (Facilities Manager)" as a
   person.
10. Not defects: the verifier ran dry mid-run again; a size lookup costs 2
    credits (a search is 2 per 10 results); Whitco at $28.6M in the email
    lane with a support@ address is the rule working.

### What changed

- **Size is measured, not guessed.** `sizeMeasured(signals)` — a headcount,
  a fleet, a location count, a stated revenue or a team page at the core cut
  — is the lookup guard; tenure and reviews never count (the tenure band is
  flagged `guess: true` and never decides the tier the lanes read).
  `estimateScaleBand` reads their own team page as a FLOOR (raises only, at
  the core cut or above); `SIZE_TERMS` gains `teamCount` as a floor term.
  `parseStatedRevenueBound`: "<$5M" is a bucket (midpoint, flagged
  `below`), "$500K-$1M" a range (midpoint), "$14m" exact. **A directory's
  figure alone is a guess**, likely when one other fact agrees (a team
  count, employees in the same snippet, the review band), sure when two do
  — so a wrong "high" cannot come from one snippet. On a miss the lookup buys
  ONE more snippet-only query over LinkedIn company pages and BBB profiles
  ("11–50 employees" reads as the midpoint, marked a range).
- **One ruler.** `lanesFor` reads the sheet's own guess when nothing measured
  the tier (low → entry, medium → core, high → upper); the Find-time
  affordability band only when there is no review count. `🎯 TARGET` says
  "taken as entry — not measured" so a fallback reads as a fallback.
- **The call lane means a named owner.** A read lead with a phone and nobody
  named is `lanes.noname` — the **No name yet** bucket, off the rep's sheet,
  never deleted.
- **The owner ladder names more people.** `cityState` reads "Phoenix AZ" and
  "Phoenix, Arizona" (the licence and size searches fall back on the market
  the Find press found the lead in, sent as `market`); the web search buys a
  LinkedIn owner query as its LAST query, only when the two before it named
  nobody, under the same name-must-appear-in-the-results rule;
  `findOwnerViaOpenCorporates` reads the OFFICERS a company filed, refusing
  agents and incorporators by position and organisations by the name door,
  behind `OPENCORPORATES_KEY` (a paid key - OpenCorporates no longer has a free tier, Vin 2026-09-03; without the key the stage says so
  once per lead and costs nothing); `DM_SOURCE_WEIGHT.opencorporates` 36.
- **The eponym can sign.** `eponymousAuthority(best, companyName, authority)`
  lifts to 80 when the surname is in the business name AND the person is on
  the business's own sources, whatever the title says, unless the title is
  plainly junior (`EPONYM_JUNIOR_RE`: office manager, coordinator,
  assistant, receptionist, technician…). Landon is the fixture that must
  lift; "Mat Parke, Office Manager, Parke Roofing" must not.
- `ownerNameDoor` refuses organisation tokens (`ORG_TOKEN_RE`: journal,
  constitution, international, corporation, group, holdings, partners,
  associates, llc, inc, bank, university, hospital, magazine, times, news,
  tribune, gazette, herald, chronicle, post, county, city, state,
  department, district, authority, commission, council, chamber);
  `GP_FRANCHISE` gains `overhead door company of`.
- The `scale` term of the fit score ignores a band that came from the
  team-page floor — that fact already scores in the `size` term, and one
  fact must not sit in two terms of one denominator.
- **index.html** (contract **20260929**): the Read tab gains a lane switch
  as a plain list — **Call list · Email lane · No name yet · Too small**,
  with counts — over the existing cards; the Export band shows only on the
  Call list (the CSV and the Sheet are the call lane and nothing else); the
  Email lane has "Move the N in the email lane to Research" (the existing
  `addManyToPipeline`); the Result sentence says where each row went ("Not
  in the file: 1 in the email lane, 5 with no name yet, 1 under the floor…");
  `sizeConfidence` joins the lean sheet beside Size; the request sends
  `market`; `laneOf` / `laneChip` / `laneHas` / `laneKey` / `LANE_TABS` are
  pure and executed by clientcheck.
- Checks: `SIZE AND LAYERS CHECK` gains the Round 112 block (sizeMeasured
  both ways, the tenure guess flag, the three revenue strings from the run,
  the team-page floor, Almeida's "high (guess)" and Carter's "low (sure)",
  Hayward's lane, the no-name lane both ways, the city parser on the run's
  shapes) and four call-site needles; `DM EVIDENCE CHECK` executes
  `eponymousAuthority` both ways and `pickOpenCorporatesOfficer` against a
  filing agent, a service company and an incorporator; the name door and
  franchise fixtures carry the Whitco strings and Overhead Door.

Deliberately NOT done: the two-lane tables with the bulk action bar (PR 2,
after the mockup); an outcome column (Vin's earlier ruling); the
marketing-director email; raising the per-press cap.

### What the falsification runs found in the checks themselves

Six reverts, each alone against the green baseline, each RED on the check
named for it, restored byte for byte (CR count = line count throughout):

| revert | red on |
|---|---|
| tenure counts as a measured size again | SIZE AND LAYERS CHECK (the five old shops never bought) |
| the lane falls back on the affordability band before the sheet's guess | SIZE AND LAYERS CHECK (Hayward: sheet "low", lane core) |
| "<$5M" read as $5M again | SIZE AND LAYERS CHECK (the bucket) |
| the eponymous lift refuses any present title | DM EVIDENCE CHECK (Landon held back) |
| "overhead door company of" out of the franchise list | ICP FILTER CHECK |
| the no-name bucket folded back into the call lane | clientcheck.js (a read lead with nobody named on the rep sheet) |

What the checks caught in the round's own work: `FIND ICP GATE CHECK`'s
and `SIZE AND LAYERS CHECK`'s call-site needles were written against the
Round 111 lines and went red the moment those lines changed (re-aimed);
`INFO TRAVEL CHECK` refused the eponymous lift until the resolver and the
new rule visibly shared the one surname function; `FIND CONTACT CHECK`
caught the team-page floor scoring twice (once in the size term, once in
the scale term of the same denominator - the scale term now ignores a
floor); clientcheck refused a Render-only key declared as a client key
(`OPENCORPORATES_KEY` is an env var, not a Settings field) and a Round 111
row without an owner that the chip called CALL; and servercheck's scenario H
- "a site that answers a plain fetch costs nothing" - went red on the two
size searches the round deliberately buys. The invariant was refined, not
loosened: the free read still buys no page, no map and no owner search on
such a site; the size lookup is counted apart, must be the only Firecrawl
spend on that lead, and its credits must match the ledger.

**275 boot checks green.** `bash ci-gates.sh` all stages. **The
contract is 20260929 on both sides.**

**`index.html` changed, so this NEEDS the Netlify drag-in.** Render env:
`OPENCORPORATES_KEY` turns the officer stage on (a paid plan at
opencorporates.com - there is no free tier any more, so it waits on the
No-name-yet numbers; without it the stage is skipped and says so). The
verifier top-up is still owed. The next batch's `📏 SIZE LOOKUP` lines
should show a lookup on every unmeasured lead and most `🎯 TARGET` lines a
sure or likely; the No name yet bucket should hold well under 10% of reads.
