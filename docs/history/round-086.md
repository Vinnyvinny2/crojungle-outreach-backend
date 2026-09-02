# §86 — The sheet got a top — 2026-08-27
Source: CLAUDE.md lines 11358-11513, moved verbatim 2026-09-02 from commit b01d952e4f95d7b69686bc2c4063ca2aa0cb7546 (branch backup/claude-md-monolith). Nothing below this line was edited.

## 86. The sheet got a top — 2026-08-27

Vin, relaying his junior rep: *"he has no clu ehwta these audits mean and
truthfuklly as im reqding them they are like spekaing in code."* Then, with
Mike Taft's own hand-made call sheet for Irwin's Septic in front of him:
*"im thinking use exaclty mikes example... i need everythign said in the audit
to bascially be like so what? so we know the takeaway for eahc point... these
audits are built for me and i have to read through them deeply to understand
everythgin and trnalte to my sales guy that cant happen."*

Mike's version was read line by line before anything was built. What it does
that ours did not is three things, and only one of them is layout:

- **every leak carries a cost line in its own colour** — the "so what?", made
  structural rather than left to the reader;
- **a two-column scoreboard** — six things won, six things leaking, before any
  diagnosis, so a rep knows in ten seconds what NOT to sell against;
- **a section flagging contradictions in OUR audit**, which Mike had to
  resolve by hand.

And one thing it does that cuts against a decision made two days earlier:
Mike **kept** "Open with this" and "Do not say", which had been argued away on
the grounds that a plain-enough sheet needs no script. He is right and that
argument was wrong: one opener and one do-not-say line is exactly what makes a
sheet usable in sixty seconds.

**The diagnosis was never "too much information."** Vin, deciding it himself
after seeing a version that condensed: *"i feel like we do need all of this
detial for now just to conintue improving the app but the top fold is perffect
for our sales guy to brush ove rand knwo whats goign on."* So nothing was
deleted. The sheet got a TOP.

### Two tiers, one document, both surfaces

**For the call** — the story, the scoreboard, the numbered leaks each with
their so-what, the conversation, and Do-not-say. **The full record** — the
funnel with every measured signal at its stage, their own words, the internal
intelligence, what we could not check. The screen carries the identical order,
because a rep and the person who built the audit have to be reading one
document in two places.

**Do-not-say moved INTO the call tier**, reversing §62's "warnings last". The
reason is not taste: a rep who never scrolls past the top is exactly the reader
those guardrails exist for, and at the foot of the record they were invisible
to him.

### The takeaway is written in the branch that produced the value

A "so what?" keyed on the row LABEL, or matched against the rendered text,
would be a second copy of the condition that produced the value — the disease
this file records more than any other, and the copy that rots is always the one
that only runs where nobody looks. So a signal row may hand back a PAIR,
`[what we measured, what it means for the call]`, written inside the same
branch. Seventeen rows carry one. `R()` is backwards compatible by
construction, so a row whose value speaks for itself is unchanged.

Falsified: two opposite booking measurements must not produce the same
takeaway. Reverting `R()` to ignore the pair goes red on exactly that.

### The scoreboard, and the suppression that had to be narrow

`scoreboardFor` is one builder both surfaces call. The won column restates
measurements we actually read; the leaking column is the ladder's own sayable
findings as a one-clause index, so a revenue signal can never be buried below
the fold — the owner's own rule. **A numbered leak in the index carries no cost
line**, because it is spelled out in full a few centimetres below.

Every won item is suppressed by the findings that would contradict it, and the
suppression names **exact rung ids rather than a signal group**. The first
version suppressed on the whole `search` group, and the falsification proved
what that costs: a business can be **#1 for its own trade AND invisible for one
service page** — two true facts about two different searches — and the group
form deleted the strength that decides how the call opens. Both directions are
now fixtured: the booking win must vanish beside a booking finding, and the
head-term win must survive a service-page finding.

### A numbered leak is written out once

At its funnel stage it is now a POSITION MARKER — the badge, a clipped clause,
and "written out in full above." Printing its sentence, its cost line and its
product a second time at the stage is the "info everywhere" complaint. Same on
both surfaces. The three per-leak openers left the Worth-asking list for the
same reason and live on their own cards; that list keeps the one question the
READ produced, which belongs to no single leak.

### The words

`PILLAR_PRODUCT` said "conversion work", "search ownership" and "automated
response layer" — our category names, which a junior rep reading aloud is
repeating rather than describing. Same six products, said as what they do:
*rebuild the site so the page turns visitors into jobs*, *own the searches he
is missing*. And `The door` — our shorthand for a whole funnel stage — is now
**The page they land on**, which is what the server's own fix-first sentence
had been saying all along.

### The live bug the rebuild surfaced

`auditRecordFor` never set `reviewsRead`, and the export's own signal context
had been passing `r.reviewsRead` from the day the denominator was added. So on
**every exported sheet** the top review complaint read *"and how many reviews
that came from was not recorded"*, while the screen — reading the lead directly
— showed it correctly. Computed, wired, and dropped one line before use, in the
one artefact a salesperson actually holds. Instance twenty-six.

### Paper

Measured, not estimated: seven audits went **7 pages to 14**. A forced page
break between the tiers was tried and made it **21** — a clean page one that
the record spilled off anyway — so it was reverted rather than kept for the
look of it. On paper the takeaway now flows on the same line as the value it
explains (`display:inline` in the print sheet only), which is where the saving
is on a real lead: this fixture has three signal rows and a live lead has
eighteen. Two pages a lead, and the second one is the record Vin asked to keep.

### What was deliberately NOT built

**"Flags for Vinny."** Mike's section listing contradictions in our own audit
is the most interesting thing on his sheet, and the three flags in it are
mostly ALREADY closed in code: §106 caps the site score when a numbered leak
sits at the door and makes the server write the reason, the found-stage
"mixed" status exists for the works-with-leaks case, and the ads hedge has one
predicate. A detector for what remains would fire on almost nothing, and a
mechanism no fixture can reach is the kind that rots (§66). The honest version
is a real contradiction detector over the assembled sheet, which is its own
round.

**No ranking, no rung, no copy change.** PART 6 holds: nothing is tuned until
real replies exist to tune against. One mismatch is worth recording as a
finding rather than fixing blind — `no_financing` is pillar ROTTING, and
ROTTING maps to follow-up automation, so a financing gap currently recommends
an automatic follow-up product. That is a declared pillar mapping and changing
it is a ranking decision, not a layout one.

**Eleven falsifications, each reverted alone against a green baseline and each
red on its own named assertion**, plus every gate: 264 boot checks green,
clientcheck, batchcheck, servercheck's 41 assertions over a fake network,
auditfuzz over 5,000 vectors, fuzzcore over 20,000 cases, 1,637 emails composed
over HTTP.

**What the falsification runs found in the checks themselves.** The harness's
own parse gate used a process substitution, produced EPIPE, and reported **NO
VERDICT for all eleven reverts** — the harness-that-lies class, in my own
machinery, and it would have read as eleven clean passes to anyone who did not
look. Rewritten to a temp file. Two guards then failed to guard: the
duplicate-content assertion counted a marker that renders twice either way (the
fixture-that-measures-nothing trap) and now asserts the mechanism itself; and
the `leakWhereFor` needle covered TWO call sites with ONE search, so reverting
the export alone left it green — it counts both now. Both were invisible until
the reverts ran.

**`index.html` changed throughout, so this needs a Netlify deploy**, and the
contract is **20260908** on both sides — a stale page renders the old
single-tier sheet and will say so by contract number.

---

