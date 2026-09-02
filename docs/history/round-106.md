# §106 — Twenty leads read live, four things on the sheet that were not true, and the export became grades — 2026-09-02
Source: CLAUDE.md lines 10359-10523, moved verbatim 2026-09-02 from commit fd76271 (main after Round 106, PR #95). Nothing below this line was edited.

## 106. Twenty leads read live, four things on the sheet that were not true, and the export became grades — 2026-09-02

Vin ran the merged Round 105 build for real — ten Places leads, ten from the
other lanes — and sent both logs and both files. Then two things: *"lean out
the export column only essentila info and long sentences dont work use ratings
instead"*, and *"i want to kind of stop building here and workshop the code is
this a good spot to stop leads are being shot out at decent quality."*

**The honest answer was yes, after one close-out.** The run's own numbers, and
they are the first live measurement of the R102–R104 roster work:

| | Places (10) | other lanes (10) |
|---|---|---|
| owner settled on the free read, no paid wave | 5 | 4 |
| paid wave bought | 5 (35 credits) | 6 (46 credits) |
| credits per lead | 3.5 | 4.6 |
| roster read at least one real name/title pair | 5 | 4 |
| an owner named at all | 10 | 9 |

The roster read something on 9 of 20 sites, against 4 of 25 the last time it
was measured; the paid wave fell from 6.3 credits a lead to about 4. What kept
it from being a clean stopping point was the sheet a rep would dial from: read
line by line it carried four things that are not true, and three code traces
located the mechanism behind each. Vin's decisions: **letter grades A–D**, and
**one round = the export plus those four**, then stop.

### "Client Connection Lead" was the decision-maker, with three real owners on the page

Ten Key's team page reads *Chris Reed — Owner, Client Connection Lead · Mike
Kahn — Owner · Rebecca Muller — Owner, CEO*. The sheet said the decision-maker
was **Client Connection Lead**. `parseTeamRoster` invented the person three
separate ways, each executed against that exact string:

- The run "Owner, Client Connection Lead" has no name in it, so the title-led
  reader took the words after the last comma as the person — and "Client
  Connection Lead" clears every shape test in the file: three capitalised
  words, no role noun anybody had written down (`lead` was not in
  `FIND_ROLE_NOUN`), no title pattern. **A name slot made entirely of role
  words is a title now** (`ROLE_WORDS`, `allRoleWords`), asked in the one door
  both readers share. "Ann Lead" survives, because one role word is a surname.
- The two-people pass then read "Connection Lead" as a SECOND person inside
  Chris Reed's correct row and **stripped his ownership claim** for it. Same
  door, same fix.
- Among the real owners, `authorityScore("Owner")` and
  `authorityScore("Owner, CEO")` are both 100 — the ladder returns the first
  rung — and the tie went to the SHORTER title, which is the bare word.
  `ownershipDepth` counts the senior rungs a title carries, so "Owner, CEO"
  beats "Owner" and Rebecca Muller wins. The pick is a named function
  (`rankRosterOwners`) that also refuses any row whose name slot fails the
  shared name rule — a title that slipped past the parser can never be
  promoted by the pick.

Same family, same run: "Director of Client Onboarding" was cut into the name
"Client Onboarding" and the title "Director of" — **a head that ends on a
preposition is a title cut in half** (`titleHeadComplete`); the location
heading "Winter Park" was paired with "Tax Associate Christina Sears" because a
four-token run fails the name pattern and the next-person test could not fire —
**a title run carrying the next person ends the entry above it**; and the chat
widget "Let's Chat / WowFix assistant" parsed as a person — `CTA_VERB_RE`
learned `let's` and `chat`.

### "The WowFix Team" was the owner, and `the@wowfix.us` was the email

`findOwnerViaReviewReplies` accepted any signer whose first token appeared in
the replies — "the" always does — and synthesised an "Owner" title for it, so a
team signature came in at authority 100. It never called `looksLikeRealName`,
which would have refused it. Then two hand-kept copies of the eponymous mailbox
rule tested whether ANY token of the name sat inside the domain root and mailed
the FIRST token: `the@wowfix.us`, tier 3, sendable. `reviewSignerOk` asks the
one question of every signer, and `eponymousMailboxFor` is ONE rule that both
branches call: a real person's name, the surname (or a four-letter first name)
in the business name or the domain, and a first name that is a given name
rather than an article. **Disclosed:** `bill@zoellerpumps.com` still passes,
because Bill Zoeller genuinely runs a company named Zoeller. That row is wrong
on SCOPE — a manufacturer is outside the ICP — which is a discovery question
and not a mailbox rule.

### The company's own mailbox was labelled as a person's

`cpa@jtccpas.com`, `aardconcrete@aol.com` (Aard Cement),
`parklanedentalortho@d4c.com`, `aanddcontracting@aol.com` — all `[person]`.
Two causes. `mailboxKind` is three anchored word lists and nothing ever compared
the local part to the COMPANY's own name or its trade; it takes the company and
the host now and answers `company` when the local part IS the company. And
`emailConfidenceGrade` read `e.kind` at tier 1 while the tier-1 return writes
`mailboxKind` — `kind` is set later, in the route — so that half of the grade
was dead and a role mailbox graded as "a person, not a department". It reads
the field that is written.

### 65/100 on a site that returned 258 characters

Floor Gurus refused a plain fetch, Firecrawl returned 258 characters from
/about, the owner resolver called it unreadable — and `readFindIcpSignals`, in
the same run, asserted "no ad code", "measures its traffic" and "no open roles"
off that page: six of seven signals. `anyMarkup` was a 500-byte floor on RAW
HTML, which a `<head>` clears alone, and "not hiring" needed only that ANY page
had been read. **An absence needs readable text now** (800 characters, the
same floor class `readRecurringOffer` carries) and "not hiring" needs somewhere
the roles would have been — a careers page we read, or a homepage whose
navigation we read. Positives are untouched. And the reach term needs a
readable site, or a lead with no site to read: a lead with NO website measures
its reach on its listing and its reviews, which is honest; a lookup that ran
over 258 characters measured nothing.

### The export: grades, not sentences

Five of the thirteen lean columns were sentences, and the short tokens every
one of them was rendering already sat on the lead unread — `contactOwnerGrade`,
`contactEmailGrade`, `contactEmailKind`. The lean file is twelve columns now:
Fit /100, Company, Decision-maker, Their title, **Owner grade (A–D)**, Email,
**Email grade (A–D)**, Phone, **Best time** ("7-8am", written on the server
beside the sentence), Already paying for ads, Hiring for marketing (with the
posting's age riding the yes: "yes (11d ago)"), Exported (the date). Owner: A
two sources agree, B their own site says so, C likely, D held back. Email: A
confirmed or published as a person's, B a real shared mailbox, C a catch-all
domain, D a guess — with "(checker down)" on a run our verifier was out. The
resolved-domain provenance rides the owner grade, because that cell is lean
and `website` is not. Every sentence column is still one tick away in the full
export, and the card chip carries the same letter, from the same function.

### Deferred, recorded for the workshop

- `settled()` prints its EPONYMOUS / ROSTER SETTLES IT line twice on a live lead.
- `LEADERSHIP_URL_HINTS`' bare `owner` stem matched `/owners-manual` as a
  leadership page; `CONTENT_URL_EXCLUDE` misses `/resource-category/`.
- The Find ICP `size` carve-out does not know Region President, Controller or
  Branch Manager — Lifescape (multi-region, a CFO) scored 35/35 and topped the
  run.
- Zoeller Pump Company, a manufacturer with a 500-URL sitemap, is in the ICP
  by every filter we have. Scope, not names, is the mechanism.
- The email verifier ran out of credits mid-run again and five rows carry a
  guess. A top-up at myemailverifier.com, not code.

### What the falsification runs found

**Thirty-two reverts, each applied ALONE against a baseline the harness proves
green first, each red on its own named assertion** — twenty-two server, ten
client. Two guards were built with a case only they can refuse, because the
first fixture covered both at once: removing the person-name gate on the
eponymous rule left "The WowFix Team" refused by the article list, and removing
the article list left it refused by the name gate — so "Wowfix Support Team"
(a name the article list cannot see) and "The Fixer" (an article the name rule
accepts) each exist now. Two fixtures went RED on the first boot and were right
to: the JR & Co two-people fixture, whose h3/p shape no longer produces the
motto row at all now that the lookahead ends the entry (re-aimed at the inline
shape, which is the only one that still reaches the two-people pass); and the
new owner pick, which a title-shaped name walked straight through because
`looksLikeRealName` accepts three capitalised words — the pick asks the
role-word rules as well. And servercheck went red on the reach term for a lead
with NO website, which was right: a lead with no site to read measures its
reach on its listing and its reviews. The rule is "readable, or nothing to
read", not "readable".

**HONEST SHAPE: none of this has run against a live press.** Every fixture is
the exact live string driven through the real function; servercheck drives the
contact route over the fake network. The next fifty-lead press is the
measurement, and the lines to read are `👤 ROSTER` (a name that is not a
person), `DM/reviews` (a signer discarded as not a person), `EMAIL … EPONYMOUS`,
and any `📇 FIND CONTACT` line scoring a lead whose pages returned nothing.

**`index.html` changed, so this needs a Netlify deploy**, and the contract is
**20260926** on both sides.

---

