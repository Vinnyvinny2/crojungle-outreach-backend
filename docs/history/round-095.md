# §95 — A form field label was the decision-maker, and half the list had none — 2026-08-28
Source: CLAUDE.md lines 8265-8389, moved verbatim 2026-09-02 from commit b01d952e4f95d7b69686bc2c4063ca2aa0cb7546 (branch backup/claude-md-monolith). Nothing below this line was edited.

## 95. A form field label was the decision-maker, and half the list had none — 2026-08-28

Vin ran the Find contact list for real, sent the sheet and the whole Render log:
*"some of these leads arent coming with decion makers phone numebrs and emails
those are impoirtnbant stuff yano"*, and *"we are getting coloumns that are not
needed when pasting to cvs we dont need all of that for now just the most
improtnnat info i have to dekete a bunch of coloumns everytime i paste stuff
in."*

Sixty-three rows. About half had no decision-maker. One of the ones that did had
a person who does not exist.

### "Last Name" was on the sheet as the person to ask for

America's Home Place shipped as **decision-maker "Last Name", title
"Principal's Contact Info"** — a form field label under a form section heading,
handed to a junior rep as the name to say out loud. Reproduced by executing the
real parser, not read: `parseTeamRoster` returns exactly that pair.

**Two independent causes, and either one alone still ships a false person.**

- **A possessive is about the owner, not a title anyone holds.**
  `ownershipIsHead` asks what FOLLOWS the ownership word — the fix §91 made for
  "Partner Track" — and an apostrophe is not a letter, so the phrase fell
  through the punctuation branch and read as a title whose head is *Principal*.
  Executed: it returned true for *"Principal's Contact Info"*, *"Owner's
  Manual"* and *"Founder's Story"*. The one near-miss proves the rule —
  "Owner's Representative" is a hired agent in construction and emphatically
  NOT the owner, so refusing it is correct twice over.
- **A form field label sits exactly where a name sits.** "Last Name" satisfies
  the two-capitalised-words pattern by construction. Same family as "About Us"
  and "Google Reviews", both already blocked, and the same INPUT cause: the Find
  tab's free read hands the roster parser a WHOLE PAGE where the audit path
  hands it a leadership page, so navigation and form furniture arrive in a
  person's slot.

Both directions are fixtured: the false pair is refused, and twelve real
ownership titles plus four real rosters from that same run survive untouched.

### Half the list had no owner, and the reason was a default

The free stage of the owner ladder settles roughly half of leads. The paid stage
— a web search and a licence-record search — is what finds the rest, and it was
hard-coded OFF on this route. That was the right cost decision for a batch that
would only ever be dialled and the wrong one for a list that is emailed as well:
Triton, Rhino and about thirty others came back with a company mailbox and no
name.

Measured from that run's own log, it is **about eight Firecrawl credits and two
cheap model calls per lead the free read cannot settle** — roughly 200 credits
across fifty. Vin: *"if its that cheap then yes always have it on make it so i
can swtich it off within the settings though yano."*

So it is ON by default with a Settings switch, and the direction of the default
is the point: **an absent flag BUYS**. A client that has not been redeployed
sends nothing, and the honest reading of nothing is "the old client, which
expected the owner to be found", never "the operator asked us to save money".
The Firecrawl key is handed over only when the paid stage may actually run — a
key passed beside a stood-down stage is spend one forgotten branch away, which
is how a switched-off feature bills anyway.

**And `want` was declared on every page intent and read by nobody.** One regex
covers /about AND /our-team AND /leadership, the loop broke after the first hit
whatever the table said, and the owner is commonly named on the page we did not
read. The table decides now. A page on the plain path is free, so the second one
costs nothing on the leads this is for.

### The columns

Twenty-one, most of them deleted by hand after every paste. The default is now
the eight Vin specified when this list was first asked for — company,
decision-maker, title, email, phone, ICP score, already paying for ads, hiring
for marketing — with all twenty-one one tick away and the Google Sheet reading
the same choice, because two destinations reading two column lists is how an
operator gets a file he cannot reconcile.

**The Apps Script deduped on column 3**, because 'company' was the third
declared column and the only thing holding the two in step was a comment. In the
lean set company is SECOND (the columns come out in declaration order, so the
ICP score leads and Company follows it), so a hard-coded 3 would have
silently deduped a whole sheet
against the decision-maker's name — two-hand-kept-copies, with one copy living
in a script pasted into a spreadsheet where nobody would look for it. It reads
the header row now, so the column order can change as often as the operator
likes.

### Not a code defect, and it cost four owner emails

`🔴 EMAIL VERIFIER OUT OF CREDITS` on that run. Jason Hicks, Daniel Meadows,
William Barr and Michael Schweitzer were all resolved as owners and all came back
with no address, because tier 2 is unreachable without a live verifier. The §94
latch worked exactly as built — it re-tested and printed `🟢 EMAIL VERIFIER:
back` — but the allowance is genuinely empty. That is a top-up at
myemailverifier.com, not a build.

### What the falsification runs found in the checks themselves

Thirteen reverts, each applied alone against a baseline the harness proves green
first. **The form-label revert came back GREEN**, and the reason is the recorded
two-fixes-hide-each-other class: "Last Name" is refused by the last-word rule
AND by the whole-phrase rule, so removing either half alone left every fixture
passing while the other half did the work. There are now two cases only one half
can refuse — a label whose exact phrase is not on the list, and a label whose
last word is ordinary — and the revert is split to match.

**And the page-picker check went RED on a correct build, which was right.** It
asserted one page per intent, and what it was really protecting is that a
careers page cannot be crowded out by two about pages. That proxy is replaced by
the property itself: the declared wants must SUM to no more than the page
budget, so every intent is guaranteed its share whatever order they run in.
Widen one want without widening the budget and it goes red.

**HONEST SHAPE: none of this has run against a live press.** The parser fixes
are executed at boot on the exact strings that shipped; the paid-lookup default,
the page widening and the column choice are executed at boot and in
`clientcheck`. What a real fifty-lead press yields is settled by the next run's
`FIND RUN TALLY` line, which is the thing this project has never had.

**`index.html` changed, so this needs a Netlify deploy**, and the contract is
**20260917** on both sides — the Settings switch would silently do nothing
against a server that predates it.


---

