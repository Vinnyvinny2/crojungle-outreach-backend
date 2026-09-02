# §109 — The second run's own misfires, and a rule Vin ruled on — 2026-09-02
Written 2026-09-02 for docs/history (one file per round; CLAUDE.md carries no history). Not a moved section: verify-split.sh skips it.

## 109. The second run's own misfires, and a rule Vin ruled on — 2026-09-02

Vin ran a 50-lead batch on the Round 107 + 108 build the same evening they
merged, and sent the log and the sheet: *"analyze very well, make sure all
pushes worked and we are in a good spot."* They had: free settle 17 of 50
(was about 1 in 5), roughly 4.6 Firecrawl credits a lead (was about 6), 38
of 49 read leads with a named owner, no fake or blocked address shipped as
A. Scored 7 / 7 / 8 against the previous day's 5 / 6 / 5. Then: *"decisions
from last run are low level, def just implement right?"* — this round is
those. The established band and who to target at a layered company is the
next round, planned and ruled on in the same sitting.

### What was found

1. **Four real leads dropped as "owned by somebody else."** Wilson Harris,
   AirMakers, Klassic Custom Decks and Perla Law each say "a member of" a
   trade body (the Ohio Chamber, the American Institute of CPAs, the Air
   Conditioning Contractors of America, the Estate Planning Council). My
   Round 108 `OWNED_TELL_RE` counted "member of" as a parent company. Class:
   guard too tight, a rule written from one imagined shape.
2. **A remodeler dropped as a nonprofit.** 1st Rate Remodeling says
   "tax-deductible" about energy upgrades. The nonprofit read took the bare
   phrase. Same class.
3. **"Who We Are" shipped as the decision-maker** at GMG Construction, title
   "Our Founder": a page heading paired with a title, and the Round 107
   name door let it through because none of those three words is a role
   word. Class: a shape-only name test.
4. **`attorneys@` labelled a person's mailbox** in the log (the sheet
   graded it B by the owner-name rule, so the row was right; the label was
   not).
5. **The state registry found nobody on 11 of 11 leads** at 2 credits each,
   as its own comment predicts ("mostly filing agents"). About 20 credits
   per 50 leads for nothing.
6. **Carlton at Rockin Remodeling signs his review replies four times** and
   was held back below the buying floor because his site calls him
   "registered contractor" (authority 30); the paid wave was then bought
   and found nobody better. The fold rule says corroboration never promotes
   a title — right for one signature, wrong for four.
7. Not defects, for the record: the email verifier ran dry mid-run (14
   leads carry "D (checker down)" honestly); eight `⛔ REVIEW CORPUS` lines
   are the `REVIEW_CORPUS_CHARS` setting; one model call failed on the
   network and one hit its length cap, once each.

### What changed

- `OWNED_TELL_RE` keeps division / subsidiary / portfolio company / backed
  by X Capital / "part of the X family of companies" and drops "member" and
  bare "part of". The four live sentences are fixtures that must live;
  "a division of Summit Home Services Group" still dies.
- `NONPROFIT_TEXT_RE`: "tax-deductible" counts only beside donation words
  ("your gift is tax-deductible", "tax-deductible donations"). The
  remodeler's sentence is a fixture that must live.
- `ownerNameDoor` refuses any token in `NAV_WORD_RE` (who, we, are, what,
  why, how, meet, about, our, your, the, team, story, us, contact, home,
  welcome, services, careers). "Who We Are" and "Meet The Team" are
  fixtures; "Ann Lead" and "Bob Webb" still pass.
- `MAILBOX_ROLE_RE` gains attorneys, lawyers, doctors, dentists, staff,
  clinic. **Deliberately NOT done:** treating a local part that equals one
  company word (gervais@) as the company mailbox — SHEET TRUTH CHECK refused
  it on the spot, because tony@tonyconforticpa.com and lee@leeplumbing.com
  are the owners' own mailboxes. The owner-name grade rule from Round 107
  already handles gervais@ (graded B); the log label stays.
- **The state registry lookup is a knob, off by default** (`DM_REGISTRY=1`
  on Render turns it back on). The lead logs once that it was not bought.
- **A repeated review signature promotes a weak site title.** In
  `foldFirstNameClusters`, a bare first name from the review replies that
  signed `DM_SIGNATURE_PROMOTE_AT` (3) or more times, folding into a host
  whose title sits below the buying floor, gives the host "Owner (signs
  their own review replies)". One or two signatures stay corroboration, as
  before. The signer source now reports `timesSeen`. Vin's ruling.
- Hands, not code: the verifier top-up and `REVIEW_CORPUS_CHARS` on Render.

### What the falsification runs found in the checks themselves

Seven reverts, each alone against the green baseline, each RED on the check
named for it, restored byte for byte (CR count 79900 = line count):

| revert | red on |
|---|---|
| "member of" back in the owned tell | FIND ICP GATE CHECK (the four live sentences) |
| bare "tax-deductible" back | FIND ICP GATE CHECK (the remodeler's sentence) |
| nav words pass the name door | OWNER CORROBORATION CHECK ("Who We Are") |
| attorneys@ a person again | FIND CONTACT CHECK |
| registry bought without the knob | OWNER CORROBORATION CHECK (source-order needle) |
| signatures never promote | OWNER CORROBORATION CHECK (four signatures, authority stays 30) |
| one signature promotes | OWNER CORROBORATION CHECK (the floor of three) |

One thing the checks caught in the round's own work before it shipped: the
"whole local part is one company word" mailbox rule turned SHEET TRUTH
CHECK red on tony@tonyconforticpa.com and lee@leeplumbing.com, both real
owners' mailboxes. The rule was dropped rather than the fixture.

**274 boot checks green.** `bash ci-gates.sh` all stages. The contract is 20260926 on
both sides — `index.html` did not change.

**`index.html` did not change, so this needs no Netlify deploy.** Render env:
nothing required; `DM_REGISTRY=1` only if Vin wants the registry back;
`REVIEW_CORPUS_CHARS` raised if the `⛔ REVIEW CORPUS` lines bother him.
