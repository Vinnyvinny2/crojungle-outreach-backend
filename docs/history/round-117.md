# §117 — Short rows for the rep, and the three national brands that were eating the run — 2026-09-04
Written 2026-09-04 for docs/history (one file per round; CLAUDE.md carries no history). Not a moved section: verify-split.sh skips it.

## 117. Short rows for the rep, and the three national brands that were eating the run — 2026-09-04

Vin ran the first proof batch on the Round 116 build (25 reads) and sent the
panel, the Google Sheet, the Excel export and the whole log:

> *"we need to have short stuff in the rows so we can fit everyhting in as u
> see for some of them. make sure evyrrhting is flawless heres the logs: …"*

and, separately, the four meetings the rep has booked, *"so we can see which
teir they are and start trying to see patterns."*

### The run against Round 116's own targets

Read off the 25 `📇 FIND CONTACT` lines and the panel:

| measure | target | this run | |
|---|---|---|---|
| sizes measured (likely or sure) | ≥ 50% | 13 of 25 = **52%** (0 sure, 13 likely) | **met** |
| a name on the row | ≥ 80% | 18 of 25 = **72%** | **missed** |
| a retired / franchise / chain person printed as Owner | 0 | **0** | **met** |
| median read time | ≤ 150s | **102s** (mean 141, max 347) | **met** |
| hedge rows last, website column present | yes | yes | met |

195 Firecrawl credits over 25 leads (7.8 a lead) and $0.23 of model.

### What was found

**A. The rep's cell was a paragraph again.** `targetCell` composed
`Owner: ` + the name + ` (cannot sign - ask who owns the marketing)` +
` (layered business, no marketing head found - expect the owner not to
answer)` + ` - ranked last, ask for the marketing head` + a 90-character
provenance bracket. Five of the 18 call-sheet rows carried one of those
tails. This is the **second** time: Vin, 2026-09-02, *"lean out the export
column only essentila info and long sentences dont work use ratings
instead."* Rounds 110, 113 and 115 each appended one more clause to the one
cell that had room, and no check measured a cell's length.

**B. Three national brands were read at full price and named nobody.**
Champion Replacement Windows of Raleigh (championwindow.com, its Google
listing pointing at `/Raleigh`), Pella Windows and Doors Showroom of
Raleigh, NC (pella.com, `/locations/nc/durham`) and Sono Bello Kansas City
(sonobello.com, `/locations/kansas-city`) — 10 credits and 3½ minutes each,
30 credits and 10 minutes between them, and all three landed in No-name-yet.
**They are the whole reason the named score missed:** 18 of 25 is 72%;
without them it is 18 of 22 = **82%**, over the target. Each defeated a
different tell, and each of those tells demands one exact idiom — Round
113's suffix wants `" - City"`, Round 115's territory wants `" of City"`
with no comma in its character class, `chainLocationPath` wants a **state**
segment. Pella was marked a branch network, and the mark still did not stop
the spend: the owner-wave gate reads only `!out.notIcp`, and a `network`
verdict never sets it.

**C. A 23-name team page lost to the words "employs 5".** Champion:
`size low (likely: "employs 5" on their own pages; at least 23 people on
their own team page (reads medium))` → tier entry. Round 112 declared
`teamCount` a FLOOR and Round 116 fed it from `countTeamNames`, whose own
comment says *"Counted as a FLOOR … never a total"*. Neither consumer kept
that promise: in `sizeBand` the word `floor` was read in exactly one place,
a gate that DROPS a floor under the core cut, and in `estimateScaleBand` the
floor sat two rungs **below** the rung it was supposed to override — a
return-ladder cannot express a floor. The line even printed `(reads medium)`
beside the number it was ignoring.

**D. The log printed the marketing lead as the owner.** Carpet Giant:
`target owner Meredith Wosenitz, Marketing Director — the owner is within
reach`, while the owner the ladder resolved is Jim Wosenitz (held back at
authority 30). The `🎯 TARGET` line appended `out.marketingLead.name` on the
lead being non-null, not on `out.target === 'marketing'`. The rep's sheet
was right — `targetCell` gates on the target word — so this was the line
Vin reads, lying.

**E. A construction company was dropped as a nonprofit.** Howell
Construction, 300 employees on its own pages, six pages read:
`DROPPED as a nonprofit — their own page says "501(c)3"`. The token had
every paren and space optional and no context test of any kind, over a
corpus that is every page joined into one string, and one hit anywhere was
a hard drop. Round 107 narrowed "tax-deductible" to donation words for
exactly this reason and the bare token was left alone. Atrium Health, dropped
the same evening, is correct — but its donation link pointed at
`atriumhealthfoundation.org`, a **different host**, and nothing checked;
`readChainEvidence` has stripped the host since it was written.

**F. The free BBB profile is refused.** Both attempts:
`BBB profile refused a plain fetch (HTTP 403) - not bought`. The header set
was a two-part Chrome version (`Chrome/124.0`) with `Accept: text/html` and
nothing else — a fingerprint no browser has ever sent.

**G. Two small ones.** Rad Law Firm's roster read the headline
`Busting Myths (Motor Vehicle Accident Attorney)` as a name/title pair (the
eponymous rule happened to win that row, and nothing in the name door would
have stopped it); and Southern Oak Dental's layers read said *"the owner is
named on their own pages"* off an **Office Manager** the ladder held back at
authority 30 in the same breath — an absence dressed as a measurement.

**Not defects:** the two nonprofit drops stopping before the owner wave;
UrgentVet, IDI and Dohn on the call sheet ranked last (the Round 114 hedge
working); Apify still 403 and the verifier timing out twice (both hands).

### What changed, at the root

**The sheet (index.html, contract 20261002).** `targetCell` is a name and one
three-word flag — `Owner: Matt Bauer`, `Owner: Joe Novogratz - ask marketing
head`, `Held back: Jeffrey D. Weaver - cannot sign`, `Marketing: Julie
Pappas`, `Nobody named`. `nameWithFlag` drops the FLAG when a long name would
overflow, so a person's name is never truncated. The sentence it replaced is
a new full-set column `targetWhy`; the provenance bracket moved to the
`website` cell as ` (found by us)`; `(do not send - unconfirmed)` became
`(do not send)`. 41 columns, still 17 lean. **`SHORT_CELL_MAX` (44) and
`shortCell` cap every lean cell and clientcheck measures the longest shapes
the builders can produce** — a comment saying "keep it short" is not a guard,
and this is the third round in which it was not one. The panel's owner score
gains a denominator that can have an owner: `Of the N owner-run leads, M
named (P%)`.

**A branch points at one page inside somebody else's site.** New pure
`readOutletTell({ name, homeUrl, city })`: an independent's Google listing
points at its HOME PAGE; a branch's points at one page inside a bigger site.
Twenty-one of the run's 25 listings pointed at `/`, and all four that did not
were branches. It needs no brand list and no punctuation idiom. It MARKS and
never drops (§114 stands: a big company is an email lead), and the
city-in-the-path arm stands down when the business is named after the town —
`arlingtonconcreteco.com/arlington` is Arlington Concrete's own site.
Two widenings of Round 115's territory tell were written and then **removed**,
both for the same reason: each would have turned Champion or Pella into a
**franchise DROP**, and Vin ruled on 2026-09-04 that this shape is kept as an
email lead. Matching the brand's first word (`champion` inside
`championwindow`) does that to Champion; stripping a trailing `", NC"` does it
to Pella. The second one's fixture also stayed green under falsification —
Pella is already a chain through `chainLocationPath`, so the fixture was
proving something else entirely.

**The paid owner wave is not bought on a branch** (Vin's ruling, 2026-09-04:
*keep as email leads, stop buying the owner search*). `paidOwner` now reads
`&& !_headOffice`, so the FREE stage still reads their own pages and only the
paid searches stand down; the marketing head at head office was the target
anyway. One log line names the saving, and the FIND CONTACT line says which
of the two reasons stood the wave down.

**A floor raises the band or it is not a floor.** In `sizeBand`, a
`floor: true` fact whose band is higher than the leading fact's now takes the
lead and the sentence names both. In `estimateScaleBand` the ladder is
unchanged and renamed `_scaleLadder`; the floor is applied to its **answer**,
by running the ladder a second time with nothing but the team count — no
second copy of `mk`, no rung to reorder. A **verified** headcount is the one
term the floor never overrides: the floor was written to lift a band off what
a business PUBLISHES, not to argue with a filing.

**The TARGET line** gates the marketing-lead suffix on `out.target ===
'marketing'` and otherwise prints a separate clause,
`(marketing head also named: …)`.

**A 501(c)(3) mention is not a nonprofit.** The token is out of
`NONPROFIT_TEXT_RE` altogether. The first draft of this fix kept it as a
"weak" tell behind a sentence window and a serving-phrase stand-down; the
falsification found both unreachable — the rule was written
`strong || (weak && strong)`, which is just `strong`, so neither the counter
nor the window could change an outcome. They were removed rather than kept as
decoration ([§116](round-116.md) removed a redundant `!r.retired` filter for
the same reason). What stands is the plain rule and the same-host check on the
donation page. The accepted cost is stated: a charity whose only tell is the
bare token now lives, and a wasted read is cheaper than a deleted business.
Atrium Health still drops on its own words; Howell Construction lives.

**The BBB fetch asks like a browser** — a four-part Chrome version, the real
`Accept`, `Accept-Language`, `Sec-Fetch-*`, `Sec-CH-UA` and
`Upgrade-Insecure-Requests`. Stated plainly: **this is unproven.** It is a
fingerprint fight, not a bug, and if the next batch is still 403 on every
attempt the rung is retired in Round 118 rather than kept as log noise.

**Two small ones.** `HEADLINE_WORD_RE` refuses a blog headline at the name
door (`Busting Myths` dies, `Irving Berlin` lives), and
`signals.ownerNamedOnSite` is set only for a name the ladder stands behind
(`canBuy === true`), so a held-back Office Manager no longer makes a business
read as owner-run. The other reach tells — a founder phrase, a personal
mailbox, signing the reviews — are untouched.

### The four booked meetings

Recorded because it is the first evidence this system has had about which
tier actually books, and because two of the four sit where today's rules
would not have looked:

| meeting | what we know | tier / lane on today's build |
|---|---|---|
| **Rose Paving**, Sept 5 | traced with the real functions in [§114](round-114.md): a Tenex Capital portfolio company, ~$255M, 34 offices | `over_ceiling` + PE-owned → **email only, never on the rep's call sheet** |
| **Leo Lantz Construction**, Sept 10 | Richmond VA remodeler since 2006; the meeting is with Victoria Noble, **Operations Manager** | not yet read; an ops manager taking the call is the *layered* shape, and under the rules she cannot sign |
| **Oduwa Medical**, Sept 4 | a medical practice; Felix wants a demonstration | not yet read |
| **Deirdre L Taylor, CPA PLLC**, Sept 11 | a single-name CPA practice in Dallas | not yet read; a solo PLLC is `entry` or below the floor |

The one meeting that can be tiered with certainty came from a lead this build
would not put on the sheet, and the second was booked with a person the rules
say cannot sign. That is Vin's own hedge (*"it's better to never find out if
we cut it"*, §114) paying out. **The other three are guesses until they are
read** — the next batch runs them and the numbers go in Round 118's note.

### What the falsification runs found in the checks themselves

**Two of the first draft's fixes stayed GREEN when reverted, and both were
deleted rather than patched.** The `", NC"` widening of the territory tell:
its fixture asserted Pella is a chain, which is already true through
`chainLocationPath`, so the fixture measured nothing and the widening's only
real effect was a franchise drop Vin had just ruled against. And the
nonprofit "weak tell" counter with its sentence window: `strong || (weak &&
strong)` is `strong`, so no revert of either could ever turn a fixture red.
Both are recorded here because a mechanism no fixture can reach rots, and
this is the second round running in which the falsification pass, not the
gate, is what found it.

Thirteen reverts then stood, each alone against the green baseline, each RED
on its own named check, each restored byte for byte (CR count = line count
throughout): the outlet tell's path arm and its city arm; the paid-wave skip;
the floor in `sizeBand`; the floor in `estimateScaleBand`; the TARGET line's
gate; the held-back guard on `ownerNamedOnSite`; the 501(c)(3) token out of
the strong list; the same-host donation link; the BBB header set; the name
door's headline words; and, on the client, `shortCell`'s cap and the short
target cell.

**276 boot checks green.** `bash ci-gates.sh`, all stages. **Contract
20261002 on both sides — `index.html` changed, so Netlify needs the
drag-in.** Render env: nothing new. Hands: the Apify token (403 on every lead
of this run), the email verifier (two timeouts), DataForSEO. **The proof
run**: 25 reads; the sheet's "Who to go to" every cell inside 44 characters;
the Result line's new clause at ≥ 80% of the owner-run leads; sizes still
≥ 50%; `grep 'the signer is at head office'` for the credits saved on
branches; `grep 'their own words say fewer'` for the floor; no general
contractor under `grep 'DROPPED as a nonprofit'`; and `grep 'BBB profile'`
for whether that rung lives or is retired.
