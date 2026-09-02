# §96 — Phase 1 — the fundamentals of a lead — 2026-08-31
Source: CLAUDE.md lines 8390-8622, moved verbatim 2026-09-02 from commit b01d952e4f95d7b69686bc2c4063ca2aa0cb7546 (branch backup/claude-md-monolith). Nothing below this line was edited.

## 96. Phase 1 — the fundamentals of a lead — 2026-08-31

Vin: *"i really want to focus on quality of leads coming in and quality of info
an accuracy for leads i want to work on just phase 1 which is the fundamentals
of the leads yano"*, and *"make sure to build at the highest level and bugs fix
at the root."* Three recon passes read the whole Find path — who gets into the
queue, how we decide who the owner is, and what the row finally asserts.

Four decisions he took before anything was built: **no paid revenue source**
(sharpen the free proxies; revenue stays unmeasured and the row keeps saying
so); **the non-Places lanes off by default**, one tick to re-enable; **a generic
mailbox stays on the sheet, marked clearly**; and **measure first, set the bar
after** — ship, run one 50-lead press, read the tally, then pick a target.

### The measured owner sentence had never matched anything

`_ownerFromCorpus`'s backstop reads the corpus directly for the sentence an
owner writes about himself, so a name already in memory is not re-bought with
~8 Firecrawl credits of paid search. Every escape in its regex was written FOUR
backslashes deep inside a template literal, so what reached `RegExp` was a
literal backslash followed by a letter rather than a word boundary. Executed
against the exact live sentence it was written for — *"As the founder and owner
of David Price Construction, LLC, David is a lifelong builder"* — it returns
null. So the search it exists to save has been bought on every lead since it
shipped, and the false *"no owner-level person named on their site"* it exists
to prevent has been printed on every one of them. Its company-first shape also
captured a single token while `looksLikeRealName` requires two, so even with
working escapes it could never have returned anybody. **A regex that matches
nothing is silent rather than wrong** — the §15 stem trap and the §57 corrupted
byte, a third time.

Un-breaking it makes a dead path live, so its three holes closed in the same
change rather than shipping as new behaviour: the company between the role and
the person was unconstrained, so an owner quoted in a supplier's testimonial was
reported as this lead's buyer; it claimed **high** confidence, which is exactly
what `ownSiteConfident` reads to settle stage 1, so one regex hit would switch
off every source that could disagree with it; and the title was hard-coded
"Owner" even where the sentence said president.

The check compiles the regex out of the live function's own source, so it runs
the production text rather than a second copy. Its first run correctly reported
that it could not find what it was aiming at.

### Two tokens found separately are not a name

`nameCorroborated` is the one gate between the model's JSON and a person's name
on a call sheet. It flattened the company name and all four scraped pages into
ONE string and asked only that the first name and the surname each appear
SOMEWHERE in it, independently. On a four-page corpus that is close to
unfalsifiable: "David" in the header and "Price" in a street address hundreds of
characters away passed "David Price". It requires **adjacency** now, not a
contiguous span — "David A. Price", "Price, David", a line break between them
and `davidprice@x.com` all still corroborate, because demanding the exact string
back would refuse the real shapes a page writes a name in. A ceiling assertion
sits on the window, since the cheap way to "fix" a refusal is to widen it until
it is the whole document again.

**And the model's title was never checked at all.** The name got a gate and the
title did not, so a real person found on the page could have "Owner" attached to
him out of nothing — and the title is not decoration, it is what
`authorityScore` reads to decide whether he may be shown as the buyer. An
invented "Owner" scores 100 and walks through the buying floor; the same person
with no title scores the 30 default and is held back. The NAME is kept either
way: losing a real person because the model guessed at his job is the
guard-too-tight failure.

### A held-back name was building email addresses

The authority gate's `canBuy` verdict stopped at the sheet. The same held-back
name was passed into the email engine as `ceoName`, where it built a personal
address, taught a **process-lifetime** house pattern for the whole domain, and
came back marked sendable. That is the path from an invented person to a hard
bounce, and a bounce is charged to the sending DOMAIN — the one asset here that
cannot be rebuilt in an afternoon. Both of this project's bounces came from
addresses it had itself labelled "pattern-built, not confirmed".

**The rule is not "refuse the lead".** A name is usually held back because no
TITLE was found, not because the name is wrong — Michael's Flooring returned
"Daniel Meadows, no title found" and Daniel Meadows is almost certainly real.
So an unvouched name may be **TESTED** and never **ASSUMED**: a published
address is a measurement of their site, an SMTP-confirmed one is a measurement
of that mailbox and is the strongest possible proof the name was right, and
neither is touched. What is refused is the half that assumes — no house pattern
is learned from an unproven name, and a constructed T3/T4 guess stays on the row
with its reason and is not sendable. The downgrade happens at the ONE door every
result leaves through, because gating the core's many exits is a list somebody
forgets.

### Three more ways the row could assert something nobody measured

- **A neighbour's job.** The roster lookahead stopped at the next person only
  when that person carried NO title, so on a card layout "Jane Doe, CFO"
  satisfied the title test and became the title of the person above her. Two
  people wrong at once, and the output still reads as a plausible roster. The
  reason the old test could not simply ask "is this a person" is that a bare job
  title satisfies every name pattern — "Managing Partner" is two capitalised
  words — so the question is which reading a run has, and only a run whose title
  reading is the ONLY reading belongs to the person above it.
- **The phone was asserted, never checked.** It was copied off the Google
  listing and stamped "their Google listing" unconditionally — true about where
  we got it, silent about whether it is the number they answer. We hold their
  pages by then and `sitePrintsOurPhone` already existed, so this costs nothing.
  The number is never deleted: a disagreement is a note about a possible
  tracking number or a listing nobody has updated.
- **One lead reading another lead's page length.** `_leadershipTextLen` was
  keyed by company name alone; the reasoning that made that safe was the
  duplicate-run guard, which keys on the PLACE ID first — so two genuinely
  different businesses sharing a name get two job ids, run concurrently by
  design, and collide here. A blank name was worse: every nameless lead shared
  one slot. The website is what was actually read, so it belongs in the key, and
  a TTL is the other half, because the reset only runs when the leadership read
  runs.

### The lanes that produce unjudged leads

Every ICP rule in this system is written against a Google listing: the rating
band, the trade review floor, the capacity class and the affordability band all
read fields only Places supplies. The job-board, funding, news and for-sale
lanes carry none of them, so a lead from one arrives unjudged by every filter
that matters and is then scored as though it had been judged. That is where
Coca-Cola Bottling, Penn Medicine, Lennar Homes, Securitas, Goodyear and
SkillPath came from, and no widening of the name filter was ever going to catch
them.

Off by default, one tick to re-enable, in the scope bar beside the button that
spends the money. Nothing is deleted — those lanes are still the only thing in
this pipeline that puts a CLOCK on a finding. **The gate takes a thunk rather
than a promise**, because written the natural way the call happens before the
gate is entered and a switched-off lane spends its network anyway. And Reset now
MERGES rather than replacing `pullFilters`: a button labelled Reset silently
clearing a spend switch is how an operator buys a different run than the screen
describes.

### A long name is not a size measurement

`if (name.length > 55) return false` sat under a SIZE heading and DELETED the
lead. Character count has never measured how big a business is, and this file
already records that reasoning being rejected once: *"Character count is NOT a
measure of distinctiveness and never was."* "Southern Comfort Heating and Air
Conditioning" is 47 before a suffix or a city. Removed rather than raised,
because a bigger number is the same guess.

### The two biggest deleters finally have fixtures

`GP_FRANCHISE` is the only **unconditional** name-delete in the Places loop — no
demotion, no bench, gone — and it had no must-catch list and no must-survive
list, which is exactly the protection `brandNameHit` gets. Two of its entries
were ordinary English: **"rainbow" deleted Rainbow Roofing** and **"one hour"
deleted anything called One Hour Signs**, both squarely in the ICP. Each is now
qualified by the words that actually name the franchise, and both directions are
asserted, because a filter loosened until it catches nothing is the more
expensive failure.

`reviewFloorFor` deletes more leads per run than anything else in the file and
nothing asserted a trade sat in the right set. The two directions cost opposite
things: a high-ticket trade wrongly held to the base floor deletes the richest
leads in the ICP (a $6m custom home builder may have nine reviews), and a
high-volume trade wrongly given the low floor fills the queue with businesses
that farm reviews. An unclassified trade must keep the base floor, or adding a
trade silently changes how many leads every run deletes.

### Everything measured reaches the row

- **The do-not-send flag was dropped on promotion.** `leadFromCompany` carried
  thirteen contact fields and `contactEmailSendable` was not one of them, so a
  lead promoted out of Find arrived WITH the address and WITHOUT the flag the
  card refuses to send on and the CSV prints "NO - do not send" for.
- **Three fields computed on every read and rendered nowhere:**
  `contactOwnerSources` (so a name read verbatim off a team page and one a model
  proposed looked identical to the rep saying it out loud), `contactAdsWhy` (all
  four phrasings, including the one that says a tag container could be hiding a
  tag we cannot see), and the phone check above. The recorded
  computed-but-not-passed class, three instances in one artefact.
- **A front-desk mailbox says so on the row.** The tier already distinguished it
  internally; the row never said it in words, so a caller opened with the
  owner's first name into a mailbox the office manager reads first. Kept, marked,
  and the test is deliberately narrow — a name that merely CONTAINS one of those
  words ("infosystems@", "billsales@") is a real mailbox.
- **A stale local queue permanently shadowed the cloud.** The Find queue restore
  returned the moment localStorage held anything, so once a browser had ONE
  queued company the Supabase queue could never load in it again. It MERGES now,
  the cloud winning a name collision, because replacing would delete a company
  queued in this tab and not yet pushed.

### The affordability sentence says which half is about this business

The tier and the capacity class are inherited from the GOOGLE CATEGORY the lead
was found under, so every plumber in a run shares them; only the job count, the
published team and the published hours are this business's own record. An
operator reading one sentence has to be able to tell those apart, or a shared
judgement about a trade reads as a measurement of the company in front of him.
And the two /100 numbers on one card now say which is which: the triage score is
what we thought before reading them, FIT is what we found afterwards.

### What was NOT done, and why

- **`placesTriageScore`'s `|| 0` on the review count and rating**, which the
  plan flagged as null laundering. Checked by execution rather than asserted:
  discovery sets `reviewCount` from `p.userRatingCount || 0` before this ever
  runs, every term reading either value is a BONUS rather than a penalty, and
  the `_affIn` object is built only inside the Places branch. So the laundering
  is real and its effect is nil today. Recorded rather than "fixed", because a
  mechanism no fixture can reach is the kind that rots.
- **No paid size or revenue source** (Vin's decision). The proxies are named as
  proxies and there is no dollar band anywhere.
- **`findOwnerViaReviewReplies` stays unwired** on the Find path. It is the best
  owner source at an owner-run shop and it costs an Apify review pull per lead;
  the tally is what should decide it.
- **No audit, ladder or email-copy changes.** PART 6 holds.

### What the falsification runs found in the checks themselves

**The C-group fixtures were inserted inside the `Promise.all` callback, AFTER
the block that reports `fails` and exits** — so every push landed in an array
nobody read, and the first smoke test of the promotion revert came back GREEN on
a build with the field deleted. My own version of the recorded "a check that
reported a green line ahead of a failure it did not know about yet". Moved above
the report; the same revert then went red on its named assertion.

And the harness itself refused to start twice rather than reporting a colour:
once on a port left in use by a killed run, and once on a baseline it could not
prove green. A harness whose baseline is already red proves reds too cheaply.

**HONEST SHAPE: none of this has run against a live press.** Everything is
executed at boot and in `clientcheck`; what a real fifty-lead contact run yields
is settled by the next run's `FIND RUN TALLY` and `FIND YIELD` lines, and Vin's
own decision was to read those before anybody sets a target.

**`index.html` changed, so this needs a Netlify deploy**, and the contract is
**20260918** on both sides.

---

