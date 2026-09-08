# §122 — A place is not a person, a menu is not a charity, and a dropped lead buys nothing — 2026-09-08
Written 2026-09-08 for docs/history (one file per round; CLAUDE.md carries no history). Not a moved section: verify-split.sh skips it.

## 122. A place is not a person, a menu is not a charity, and a dropped lead buys nothing — 2026-09-08

Vin ran twenty leads on the Round 121 server and sent the sheet and a partial
log:

> *"analzye veyr hard and be emticlous"* — and then *"ok fix at highest level."*

**The first finding was not a defect in the code.** The sheet had the Round 106
columns — no website, no site grade, no size, no "Who to go to", no lane — so
the Netlify page was the 2026-09-02 build (contract 20260926) against a server
at 20261005. The export was "everything read", not the call list, which is why
a 70-clinic methadone chain's CEO and a 400-person HVAC firm sat on it. The
page must be re-dragged before any sheet is judged against the rules it is
supposed to follow.

### What was found (each reproduced by executing the real function)

**A. "Greater Louisville" was Black Rock Contracting's decision-maker, title
Owner, grade B.** Their page reads *"About Black Rock Contracting in Greater
Louisville Owner-Operated Contractor With 15 Years of Construction
Experience"*. The owner-sentence backstop's shape B takes any two capitalised
words before an ownership word, and "Owner-Operated" passed because the hyphen
ends the word. Executed on the sentence it returned Greater Louisville; it also
returns Downtown Dallas, North Texas, Greater Boston and "Family Owned" for the
same shape. `looksLikeRealName` and `looksLikeAPerson` both accept "Greater
Louisville"; the name door (§107) sits on every other owner source and not on
this one. The class recorded in §100, §104, §106 and §117: a name accepted on
shape alone.

**B. Image360 Jacksonville — a sign franchise — was dropped as a nonprofit,
after buying a size search on a mangled brand.** The drop fired on the phrase
"Non-profit Organization", which a signage site prints in its industries-served
menu, with no context test (reproduced on that page shape; the real page text
was not in hand). Then two costs stacked on a lead already out: the size wave
ran because its gate never read `out.notIcp`, and it searched for the brand
`"Image360 Jacksonville-St."` because the outlet tell matched on "Johns Bluff"
and kept the rest of the name as the brand. Six credits after the system had
decided against the lead.

**C. Miss K Kitchen and Bath Remodels reads as somebody else's branch.** Its
listing points at `misskremodels.com/cottonwood-heights` — one remodeler, one
location, a page named after the town it serves. The outlet tell's city arm
reads any town in the path as a branch unless the domain is named after the
town. A branch ranks last with "ask for the marketing head".

**D. Two sitemaps bought for navigation already in hand.** Oasis of the Valley:
`12 same-host link(s) came off their own navigation, so no sitemap call was
bought`, and two lines later `FC PAID [map]` — `mapped 12 URLs`. The owner
model receives only interior pages, so on a site with no about page it maps.

**E. Small ones.** The retired BBB rung still printed on every lead after §121
said once per process; `read 86 of 85 reviews`; and `"Owner | Licensed General
Contractor"` was refused as a title for its pipe.

**Not defects:** the email verifier ran dry mid-run for the fourth run running
(Hanson confirmed, North Coast "checker down"); "John" at Zebra Stone is §109's
ruling; Carolina Asphalt's B-grade address is a real published mailbox that is
not the owner's; Precision Windows' invented "Founder" was dropped by §116's
page check and re-found by the paid wave. The §121 transport retry fired twice
and saved both leads.

### What changed, at the root

- **The owner sentence is `OWNER_SENTENCE_RE` at module scope**, so a boot
  check executes the shipping object on the live Black Rock text instead of
  recompiling the function's source. The role word may not be followed by a
  hyphen. And the backstop now asks `ownerNameDoor`, which every other source
  already passes through; the door gained `PLACE_HEAD_RE` (greater, metro,
  downtown, north/south/east/west and their -ern forms, upper, lower, coastal,
  family, locally, serving) and a state-name test, returning `'place'`.
  Disclosed cost: "West" or "North" as a FIRST name is refused.
- **The bare phrase left the strong nonprofit list.** `NONPROFIT_SELF_RE` counts
  "non-profit organization" only when the business says it about itself —
  *we are a*, *is a*, *our non-profit*, *a 501(c)(3) nonprofit organization*.
- **A dropped lead buys no size search** (`!out.notIcp` on the gate; the SIZE
  LOOKUP line names the reason).
- **The brand is the words the matched segment does not carry.** Trailing brand
  tokens whose slug sits in the segment are peeled: `Image360`, not
  `Image360 Jacksonville-St.`; Sono Bello and Champion unchanged.
- **The town alone, on their own domain, is a note, never a branch.** The city
  arm returns `isOutlet: false` with a `note` the TARGET line prints. Champion,
  Pella, Sono Bello, Freeway and UrgentVet each carry another tell and still
  read as branches.
- **The owner model ranks the navigation the free read harvested** (`navLinks`,
  five or more same-host links) instead of buying a map. Disclosed cost: an
  about page linked from nowhere in the navigation is missed on those sites.
- The retired BBB line is silent per lead; a pipe in a title keeps the title;
  the coverage line reads `86 reviews (their listing shows 85)`.

### What the falsification runs found in the checks themselves

**Fourteen reverts, each fix alone against a baseline the harness proves green
first, each RED on its own named assertion, each restored byte for byte.** Four
older checks went red on the first boot and were right to: two pinned the text
this round moved (the backstop's acceptance line, the owner model's signature),
one recompiled the owner sentence out of the function's source and could no
longer find it there (it executes the module-scope object now, which is what it
was written to do), and one asserted that "Hope Recovery is a 501(c)(3)
nonprofit organization" still drops — the first draft of the self-claim did
not allow "501(c)(3)" between "is a" and "nonprofit", and the fixture caught
it. My own fixture expected "Family Owned" to read as a place; the door already
refuses it one rule earlier (Round 113's family token), so the assertion is
"refused", not "refused for this reason". The navigation threshold had no
fixture that could reach it until its own needle was added.

**281 boot checks green.** `bash ci-gates.sh`, all stages. Contract unchanged at
**20261005** on both sides.

**`index.html` did not change, so this round needs no Netlify deploy — but the
page live today is 20260926 and must be dragged to 20261005 regardless.**
Render redeploys on merge. Hands: the email-verifier top-up (fourth run dry).
Grep the next run for `reads as a place, not a person`, `already out`,
`no sitemap bought`, `a town in the path alone is not a branch`, and any
`DROPPED as a nonprofit` on a business that sells to charities.
