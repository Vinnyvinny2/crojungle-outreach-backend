# §132 — the sheet stops naming things that are not people — 2026-09-10
Written 2026-09-10 for docs/history (one file per round; CLAUDE.md carries no history). Not a moved section: verify-split.sh skips it.

## 132. the sheet stops naming things that are not people — 2026-09-10

Round 131 merged at 15:03 UTC and Render redeployed immediately, so the ten-lead
read at 11:05 local was already on it: **boot 297 checks**, the 32-column toggle and
the new chip row on screen, **36 Firecrawl credits against 39**. Round 131's own items
are visible and working in that log — the eponymous sentence now names which artifact
it actually saw.

The run then exposed three defects that have nothing to do with Round 131. All three
were reproduced by **executing the real code**, not by reading it, and all three put a
false sentence in front of the rep.

### A — the top-ranked lead named a strapline as its owner

`The Basement Sanctuary` scored **93 — first on the list** — with the owner shown as
**"Functional Finished Basements"**. That is their tagline. Executed:

```
looksLikeRealName('Functional Finished Basements')  ->  true
looksLikeRealName('Historic Restoration Lead')      ->  true
looksLikeRealName('Marketing Content Intern')       ->  true
looksLikeRealName('Surek Plastic Surgery')          ->  false
```

**Two independent failures had to line up, and both are fixed.**

**The surname slot did not know the trade.** `BUSINESS_TAIL` knew `surgery`, `roofing`
and twenty more, and did not know `basements` — a trade this app searches for by name
(`basement finishing company` is in `GP_CATEGORIES`). The candidate cleared
`looksLikeRealName`, `allRoleWords` and `FIND_ROLE_NOUN`, so `rankRosterOwners` admitted
it and the roster returned it at confidence `high`, which no later source may outrank.

**The list stays hand-declared rather than derived from `GP_CATEGORIES`, deliberately.**
Deriving it imports the collisions: `law`, `well`, `pool`, `home`, `care`, `estate`,
`water` and `tree` are all trade words in that table and all real surnames, and the
code already records that "Law", "Bell" and "Steele" are absent on purpose. What was
measured rather than argued:

```
1,824 real first/last name pairs executed before and after   ->  0 verdicts changed
(including Law, Wells, Pool, Waters, Stone, Fields, Bell, Steele, Brooks,
 Rivers, Read, Mason, Page, Carpenter, Baker, Fisher, Farmer)
8 business tails that used to read as people                 ->  now refused
```

**The parser only ever looked at the line ABOVE a title.** Their page reads:

```
Functional Finished Basements
owner
Colby Lindsey
```

The main pass reads a NAME and takes the next run as its title, so it paired the
strapline sitting above the word "owner". **The right answer was on the very next
line and free** — the same run printed `DM/bizname: ✓ Colby Lindsey (owner)` moments
later, and it lost, because a roster settle is the one thing no later source may
outrank. This is the class Vin's own 484-call analysis named: *"Wrong name, there is
no Robert."*

There is now a title-first pass, bounded exactly like the mononym pass beside it —
only when the main pass found no owner at all, only on an unambiguous ownership title,
and the name below validated through `personFromRun`, the one validator every other
roster path already uses. **No second copy of "is this a person" was made.**

`ROSTER TITLE ORDER CHECK` executes the real parser on that page shape: it settles on
Colby Lindsey, the strapline is not among their people, and the ordinary
name-then-title roster still settles on Josh Dembicki.

**A latent one found on the way, worth recording:** Globe Iron's roster produced a
phantom row, `Historic Restoration Lead`, carrying **the same title as the real owner**
("Founder & President"). Ranked equal on authority and equal on the title-length
tiebreak, so which one reached the sheet was decided by sort order. Henry Mitchell won
by luck. The title-first fix removes the phantom at its source.

### B — a question that prints

`settled()` is a **predicate**. It is asked six times — `if (!settled())`,
`if (settled())` — and it also `console.log`ged the settle sentence, so the sentence
printed once per **ask** rather than once per lead. Live: `Craig, Kelley and Faultless`
got two identical `EPONYMOUS` lines out of the single print statement in the file. The
`ROSTER SETTLES IT` line above it has the same shape and the same fault.

That matters beyond tidiness: **the free-settle rate is measured by grepping those
lines**, and it is the number that decides which Firecrawl plan we buy.

Both sentences now sit behind one latch. **The latch is set at the print, not at the
first ask** — set on entry, a lead that settles on a LATER ask than the first prints
nothing at all, which is a silent loss and strictly worse than a visible duplicate.

`SETTLE SAID ONCE CHECK` says plainly that it is a **source** assertion, because
`settled()` is a closure no fixture can reach — which is exactly why the duplicate
lived here unnoticed, and is recorded at `src/all.js` as such.

### C — "could not ask" said as "none found"

The mailbox verifier ran out of credits mid-run (`🔴 EMAIL VERIFIER OUT OF CREDITS`).
Bellwether's own log line was honest — *"This is NOT proof that no mailbox exists"* —
and **the row it produced said "— none found"**, counted under the **No email** chip.
An absence claimed about something we never managed to ask is the §106 rule and Vin's
first principle.

The signals were already on the row and read by nothing — `contactEmailVerifierDown`
for the mailbox checker, and now `contactEmailLookupBlocked` for the address supplier.
**Computed and not passed, the class this repo records most**, this time on the client.

There is now a fourth state, `unreadable`: its own chip (**Could not check**), its own
cell (`— could not check`), and persistence on a promoted lead so a row that was honest
in Find does not go back to lying in the pipeline.

**It reads the supplier TOKENS and never the block-reason sentence, on purpose.** A
lead whose name the buying floor held back also has no address, and it belongs in
**none**: we could have asked and chose not to. That is a decision, not an outage, and
a client that regexed the English sentence would file it wrong — and would be the
fourth hand-kept copy of a rule that already had three.

### Three falsification runs, and what the first two caught

Worth recording in full, because the code was green and gated after run one and
**six of the fifteen guards did not guard.**

```
run 1:   9 of 15 matched
run 2:  11 of 15 matched
run 3:  15 of 15 matched, tree restored byte for byte
```

**Run 1 — two fixtures could not reach their own defect, and Part C had no test at
all.** The roster fixture put the real person on the line below the title, so deleting
the validation changed nothing about it. And the client behaviour had been changed with
nothing asserting it: the `unreadable` state, its chip, its cell and its persistence
were all shipped untested.

**Run 2 — three sharper reasons, each general enough to keep:**

- The parse-time roster guard is **invisible through `pickRosterOwner`**, because
  `rankRosterOwners` re-applies the same three filters. It is visible only in the ROWS,
  which is what the "Also listed" log line prints and what every other consumer of
  `parseTeamRoster` reads. Assertion moved onto the rows.
- Whether a phantom co-owner **wins** depends on two authority scores, so a page where
  it loses proves nothing about the bound. Whether it **exists** does. Counted, not
  ranked.
- **Every client fixture built its own row by hand**, so all of them would have passed
  while the new field never left the server — the exact computed-but-not-passed shape
  this state exists to fix. Now asserted through `contactFieldsFrom`, the server's own
  row builder.

The general lesson, which is not new here but earned a third instance: **a guard proved
through a caller that re-applies the same rule is not proved at all.**

### Verification

`node build.js --check` byte-exact → `GATES=static` → boot → 15 falsifications →
`bash ci-gates.sh` all stages.

**15 of 15 reverts red on their own named line, tree restored byte for byte.**
`BOOT VERDICT: GREEN — 299 checks passed` (297 at the end of Round 131), two new named
checks, `clientcheck` green, servercheck's 205 assertions, a 500-lead fuzz.
`CONTRACT_VERSION` and `CLIENT_CONTRACT` both **20261012**.

### What this round did NOT touch

The send boundary, the lift bands, the Fit 70+ threshold, and `verifyToSend` — still
with no producer anywhere, still a decision for the sending round.

### Needs your eyes

- **No SQL this round.**
- **`index.html` changed**, so it must be dragged into Netlify by hand — contract
  `20261012`. The server half goes live on merge, which is the shape that makes a bug
  look intermittent.
- **The mailbox verifier is out of credits.** Nothing in this round buys more. Until it
  is topped up, addresses that need a mailbox check come back as **Could not check**,
  which is now the truth rather than "none found".
- **Run a ten-lead read.** The live proof: no row names a business as its owner, and
  The Basement Sanctuary either names Colby Lindsey or names nobody.
- Still open from Round 131: the CSV headings are snake_case, and the website grade no
  longer sits beside the website column (which overrides §119).
