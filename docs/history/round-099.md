# §99 — The roster knew trades and nothing else, and the Find tab had no done state — 2026-09-01
Source: CLAUDE.md lines 9041-9244, moved verbatim 2026-09-02 from commit b01d952e4f95d7b69686bc2c4063ca2aa0cb7546 (branch backup/claude-md-monolith). Nothing below this line was edited.

## 99. The roster knew trades and nothing else, and the Find tab had no done state — 2026-09-01

Vin ran three leads on the merged build and hit two things at once: the panel
said *"Get contacts for 3 leads"* when 5 was selected, and with 80 of 80 read he
was **stuck** — the only two buttons on offer were "Re-read 77" and "Clear 80
read", both of which spend credits to go backwards. In his words: *"if a lead
gets read it wont get read again and it can only be added to pipeline for
audit... i think we need a whole format change becasue im getting confused."*
He could not run the one-lead cost test either, because there was nothing left
to read.

Every finding below was reproduced by **executing** the real functions out of
`server.js`, not by reading them.

### The roster parser knew trades and nothing else

Run the real `parseTeamRoster` over 41 realistic roster titles and **29 come
back NULL** — and a null kind means the run is not a title, so **the name above
it is never paired.** Every one of the 29 is a professional practice:

```
law        Attorney NULL · Attorney at Law NULL · Of Counsel NULL ·
           Shareholder NULL · Managing Attorney NULL · Esq. NULL
dental     Dentist NULL · DDS NULL · DMD NULL · Orthodontist NULL · Oral Surgeon NULL
medical    Physician NULL · MD NULL · Plastic Surgeon NULL · Dermatologist NULL ·
           Veterinarian NULL · DVM NULL · Optometrist NULL · Chiropractor NULL
accounting CPA NULL · Certified Public Accountant NULL · Accountant NULL
trades     Owner owner · President owner · Founder owner · Estimator staff   ← all fine
```

**Fifteen of the 114 rows in `GP_CATEGORIES` are professional practices**, and
the ICP is *"trades and owner-operated professional practices"*. So the free
owner read was dark on the whole second half of what this pipeline hunts.

It is also the cost lever, and that is why it led the round. A lead whose free
read settles the owner costs **0 Firecrawl credits**; one that does not buys the
paid search wave at about **10**. From Vin's own log: McCormick Law 0, Statewide
Remodeling 10, Greater Cincinnati Chiro 10. The Firecrawl free tier is **1,000
credits, ever** — corrected against his account; this file said 500 for weeks —
so it is the difference between roughly a thousand leads and roughly a hundred
and fifty.

Three vocabularies, declared the way `STEM_COMPLETE_WORDS` and
`NICHE_BRIEF_EXPECT` are, so a vertical added later cannot inherit one by
accident:

- **owner-level** — `shareholder` and `managing attorney` are the two ownership
  titles a practice uses that `OWNER_TITLE_RE` did not carry. A shareholder of a
  professional corporation is an equity owner; a managing attorney runs the
  firm. Both settle the owner and skip the paid wave. They join
  `TITLE_AUTHORITY`'s 85 row too, because scored 30 they sat below the buying
  floor and the settle could not fire whatever the parser said.
- **practitioner** — Attorney, Of Counsel, Dentist, DDS, MD, CPA and the rest.
  Its own answer rather than folded into 'staff', because the three mean
  different things: it pairs the name, it reaches the model as corroboration,
  and it **never sets isOwner**. An associate attorney is not the buyer.
  `TITLE_AUTHORITY` already scored these 80 with the reasoning written at it —
  *"at a small practice the credentialed person almost always owns it, but a
  group employs many, so corroboration decides the rest"* — which is exactly this
  rule. The gap was only ever that the parser refused to see the title at all.
- **practice staff** — paralegal, hygienist, treatment coordinator. Checked
  first, because a coordinator at an oral surgery practice can carry a
  practitioner word.

**Deliberately NOT added: a bare `Member`.** It is the ownership word at an LLC
and it is also "Team Member" and "Board Member", and there is no grammar between
them. `Managing Member` is the form a firm prints and it already resolved.

**One head rule, parameterised rather than copied.** `titleHeadIs(title,
pattern)` carries every guard the ownership pattern earned — the possessive that
shipped "Principal's Contact Info" as a person, the partner-program modifiers,
the followers list — and `ownershipIsHead` and `professionalOwnerIsHead` are two
lines over it. A second copy of that function is the two-hand-kept-copies
disease, and the copy that rots is always the newer one.

**And the shape filter was deleting the dotted forms.** `Esq.`, `D.O.` and
`D.C.` were refused as *"a sentence, not a title"* on a bare `/[.!?;]/` test —
so the filter was deleting exactly the titles the vocabulary had just been
taught. An abbreviation's periods follow a single letter or end the string;
strip those two and any period left is real punctuation. **Bounded to three
words, and the boot caught why on the first run**: *"Gain a partner, keep your
practice."* is a marketing line off Alliance Animal Health that ends in a period
and carries the word partner, so an unbounded strip handed it to
`ownershipIsHead` and a nav label became the decision-maker again — the exact
live failure section one of that check exists for.

29 NULL down to 9, and the 9 are the correct refusals: Member, Team Member,
Partner Track, CEO Roundtable, Shareholder Services, Do It Right.

### The log turned our missing vocabulary into a claim about their business

The ROSTER line printed, whenever `OWNER_TITLE_RE` found nothing in the corpus:

> *No ownership word appears anywhere in the text, so their pages **genuinely do
> not state who owns the business**.*

Executed, that pattern **misses** *"Cagney McCormick, Attorney at Law"* and
*"Dr. Michael Hekler, DC — Chiropractor"*. It fired on two pages that plainly do
say who runs the firm. A fact about our word list, dressed as a fact about them
— the message-names-the-wrong-cause class, and the fourth recorded instance. The
hint now searches every vocabulary the parser has, and the sentence says the
honest thing: either their pages do not state it, or they use words this parser
does not know.

### The calling window was measured, free, and thrown away

`callWindowFor` has fed Mike's audit sheet since the call sheet was built, and
`publishedHours` has been captured free on the discovery call since the capacity
read was added. **The two had never met**: `contactRequestBody` did not send the
hours, so they arrived `undefined` on every contact read — which also silently
killed the affordability band's staffed term. Instance twenty-nine of
computed-but-not-passed.

`readPublishedHours` also threw the weekday TEXT away the moment it had counted
it, so there was nothing for the window to read even once the wire existed. It
keeps the lines now, the window is computed on the contact read, it renders on
the card beside the number it is about, and it is the **ninth lean CSV column**
— for a calling motion it is the most useful free field there is. A listing that
publishes no hours produces an EMPTY cell, never a guess.

### "Get contacts for 3 leads" — the number was right and the sentence was a lie

120 in queue, 40 hidden by the Google-listing filter, 80 on screen, 77 read,
**3 unread**, so `min(5, 3)` was correct. The caption said *"3 unread in the
whole queue"* and the whole queue had 43. The panel named the wrong population.

### Three tabs, and a read lead leaves the pool

**Not read / Read / Ruled out**, with the counts in the tab row — 13 / 67 / 6
already says where every lead is, so the three stat tiles that used to show a
slice of the same thing are gone rather than sitting beside it. `contactTabOf`
is module-scope and pure, because the section filters it replaces lived inline
in the render where nothing could execute them, and **the list is the tab too**:
counting alone would have left "a read lead leaves the pool" true of the numbers
and false of the screen, which is the whole complaint.

**Every control that spends now lives on one tab.** That is what fixes the state
Vin was stuck in: the screen you land on when there is nothing left to read
cannot offer Re-read and Clear as its only two buttons, because both belong to
the Read tab. With no unread leads the Not-read tab says so and offers **Find
more leads** and, when the filter is hiding some, **Include the other lanes**.

**A failed read stays in Not read.** The plan for this round filed it under
Ruled out; that is wrong, and it is the exact failure that retired a hundred
leads against a paused server on 2026-08-28. A dead server is something that
might work next time, so it has to come back. A server VERDICT is not — asking
again cannot change it — so that keeps its own tab and its own way back.

The run-scope toggle survives, moved into the Read tab beside the tally
sentence it re-points, which is the only place it means anything. Two toggles
above three tabs was the confusion, not the fix.

### The eponymous settle keeps no confidence bar, and now says so

The roster settle grew `rosterConfidence !== 'low'` on 2026-08-31, because one
uncorroborated roster row scored 45 and stood down every paid source. McCormick
Law then settled through the EPONYMOUS path at score 25, and the asymmetry was
an accident of which rule had been tightened.

It stays open **on purpose**, and it is written down as a decision instead of
left as one. A low score there is almost always NO TITLE FOUND rather than a
doubtful person, and an eponymous business whose own site names a person with no
title is precisely the shape the rule exists for — adding the bar would refuse
those leads and buy the paid wave back on every one of them. What guards it is
the evidence rather than a score: the name must be read off their OWN site at
high confidence AND the business must be named after them, which is two
artifacts of the owner's own making. Asserted in both directions, because the
cheap way to "tidy" this is to add the bar.

### What the falsification runs found

Every fix reverted ALONE against a baseline the harness proves green first.

- **A ruler that overshoots costs what a false green costs.** My first eponymous
  assertion sliced a fixed 260 characters from the declaration, ran straight
  past it into the roster settle below — which legitimately mentions the bar —
  and the boot went RED on a correct build. It slices to the statement's own
  terminator now.
- **And the boot caught the marketing-line regression** described above, on the
  first run after the abbreviation fix, which is section one of OWNER TRUTH
  CHECK doing exactly the job it was written for.

**A guard I wrote this round caught a defect nobody had reported.** Asserting
that every owner-level title clears the buying floor went RED on **`Managing
Member`**, which scored 30 — `TITLE_AUTHORITY`'s 85 row had every managing form
except the one an LLC actually uses. So a roster naming the firm's owner in the
firm's own words was read correctly as an owner and still bought the paid wave.
Pre-existing, and only the new assertion found it.

**273 boot checks green.** Seventeen falsifications, each reverted alone against
a baseline the harness proves green first, each red on its own named assertion.
Two came back GREEN on the first pass, and both were mechanisms with no guard at
all: nothing asserted that an owner-level title clears the buying floor (the
roster fixtures test `isOwner`, and `isOwner` alone settles nothing), and nothing
asserted that the ROSTER hint reads every vocabulary. Both have executed guards
now, and the hint became one shared derivation rather than a rule the check would
have had to copy.

**`index.html` changed, so this needs a Netlify deploy**, and the contract is
**20260921** on both sides — without the new server the calling window arrives
empty on every row.

---

