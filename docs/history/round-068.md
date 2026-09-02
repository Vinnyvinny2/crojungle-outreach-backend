# §68 — One lead held three booking answers, and the third one withdrew the email — 2026-08-25
Source: CLAUDE.md lines 5852-6002, moved verbatim 2026-09-02 from commit b01d952e4f95d7b69686bc2c4063ca2aa0cb7546 (branch backup/claude-md-monolith). Nothing below this line was edited.

## 68. One lead held three booking answers, and the third one withdrew the email — 2026-08-25

Vin ran Irwin's Septic on the merged build — the strongest lead yet (#2 in the
map, #1 in the blue links, 262 reviews at 4.7) — and the run ended with the
email WITHDRAWN and "Who to talk to —" printed beside shane.irwin@cox.net on a
business called Irwin's. Ten recon agents mapped the mechanisms before a line
changed. Also this round: the Supabase leads read died with a statement
timeout, which is what "the leads disappeared from the research tab" was.

### The booking split-brain — the worst one

The system held THREE independent booking answers on one lead: (1) the cascade
over homepage source + interior MARKDOWN — markdown deletes `<form>`, so the
contact page's real form was invisible and the fallthrough said `phone_only`;
(2) the site-pages model, which read the same interior markdown, correctly said
`form` and `hasCapture: true` — and was overridden by (1); (3)
`checkBuiltWith.hasBooking`, a SECOND hand-kept scheduler list over a plain
homepage fetch, whose bare `acuity` and unanchored `cal.com` (it matches
"medical.com") fed the critique "Booking tool: YES". The ladder wrote "the only
way in their site offers is a phone call" off (1); the critique withdrew it off
(3). A wrong measurement wrote the claim and a differently-wrong measurement
retracted it.

One truth now, four mechanisms: ONE scheduler list (`SCHEDULER_SIGNATURES`,
anchored) shared by all three readers; ONE real-form rule (`htmlHasRealForm` —
an email/tel input, a textarea, or two contact-named fields, so a site-search
box is not "a route in"); the interior harvest — which already buys rawHtml —
now RECORDS forms and schedulers per host, and `applyInteriorPathEvidence`
upgrades a FALLTHROUGH verdict on that positive source evidence (never
downgrades a measured one); and the critique's evidence block lost its second
booking read — the measured Booking path in THE MEASURED FACTS is the one
truth. `captureSeen` (any capture evidence, even the model's) now SUPPRESSES
every "the only way in is a phone call"-class sentence — the rung, the walk,
`no_after_hours` — without ever asserting a form it cannot prove: suppression
on model evidence is the safe direction, a claim on model evidence never is.

### The rest of what one run carried

- **The story was TRUNCATED on its first live Sonnet run** — out:6000 exactly,
  JSON repaired on strategy 4, the tail fields lost. `budget_tokens` 400s on
  this family, so the ceiling is the only bound and it now rises with the model
  (`THINKING_FOR(SITUATION_MODEL) ? 12000 : 4200`), the same pattern the audit
  already had. The situation-read is also the most expensive call on the lead
  ($0.148 of $0.27) — that is the price of §65's thinking-high decision, and
  the dial is effort, not the ceiling.
- **The count stripper ate a measured competitor count.** "#1 competitor's 101
  reviews" died because 101 is neither the 90 we read nor their 262 total — it
  is Caliber's own count from the pack row. The stripper now takes the counts
  we HOLD for the businesses in the ranked search (`competitorCountsFrom`,
  trust-gated at source), passed as an argument and never through the corpus,
  which stays strings-only for the recorded reason.
- **"Getting found: BROKEN" printed above "That part works."** The chip only
  counted rows; the walk's trusted top-three strength now travels as DATA
  (`strong.found`), and a working stage with leaks reads WORKS — WITH LEAKS,
  drips still drawn, red reserved for broken.
- **"The money goes out blind" printed on a lead whose conversion tracking was
  MEASURED TRUE**, three lines under a walk saying the tracking exists. One ROI
  predicate now (`roiStatusOf`) feeds the walk, the facts strip AND the BURNING
  money line: blind/counted/hidden/unmeasured each get the sentence their
  evidence supports. `hiring_marketing_now` also stopped printing "They pay for
  every click" under a job posting.
- **fixFirst said "Nothing needs rebuilding" beside a Website Rebuild
  recommendation and two measured old-build markers** — a third dated-site
  reader that consulted neither. The SCALE branch now reads the same
  eleven-marker site-age read; measurably-dated-with-ads goes FOUNDATION with
  the markers named.
- **"Who to talk to —" was a PHANTOM FIELD**: the screen read `lead.ownerName`,
  which exists nowhere in either file, while `verifiedCEO` held the brain-read
  name all along. Fixed to the chain every other surface uses, and the
  brain-read name now earns a CODE-CHECKED evidence line (`surnameInCompanyName`
  — ONE rule, shared with the resolver's eponymous block — plus the published
  email's own local part): "Read off their own pages... the business name
  carries \"Irwin\", and their published address shane.irwin@… is this name."
  Information for the sheet; never a title, never a change to the buying floor.
- **"Shane is the named owner" shipped in the story** on a lead where the
  resolver found nobody — no gate caught owner-IDENTITY claims. An eighth
  stripper now cuts an ownership sentence whose name no code-checked evidence
  supports (resolver name, eponymous, or email local part); Shane's survives on
  the email evidence, "Marcus Webb is the named owner" beside info@ dies. Its
  own first boot caught the sentence splitter breaking at "Dr." and capturing
  the bare honorific as a name — a correct eponymous sentence died in two
  pieces until the splitter learned honorifics.

### The leads that "disappeared", and the read that cannot time out

The console line Vin sent settled it: `57014 — canceling statement due to
statement timeout` on `/leads?limit=500`. Each row now carries the whole audit,
and 500 of them in one statement is past the database's time budget — the wall
a 50-a-day pipeline hits harder every week. The guard held (nothing seeded,
saving off, cloud untouched); the READ is now keyset-paginated — `order=id.asc`
+ `id=gt.<last>`, 40 rows a page, halving to one row on a failed page — and a
page that ultimately fails returns null for the WHOLE load, because a partial
list served as the truth would mark every unread cloud lead a stale local relic
and drop it. Deliberately keyset, not offset: offset re-sorts under concurrent
writes and rows shift between pages. clientcheck executes the walk (43 rows
across two keyset pages; a mid-walk failure must return null), and both
CONTRACT constants bumped to 20260825 so a stale Netlify page says so.

### Boot: 93 seconds was mostly our own test pace, and the heap was 4MB from red

- **FIRECRAWL GATE CHECK ran its ten probes at the production 350ms gap** —
  3.5s nominal, 57 measured seconds under drain-phase starvation, and it is the
  settle sentinel, so those seconds were the boot. The mechanics prove
  identically at a 40ms test gap; the message now says which pace it ran at and
  that the live store was untouched. The pacing check's 7s/4s/4s fixture holds
  shrank to ~1s — the assertions test WHICH number wins, not how long a boot
  can hold a gate.
- **Eighteen checks each built a fresh comment-stripped copy of this 2.9MB
  file** — the churn that held the heap at 196MB of the 200MB assertion and
  fed the GC thrash behind the 57s. One memoised LF copy
  (`selfSourceNoCommentsLF`, released with the others; deliberately separate
  from the CRLF-preserving memo a needle pins). Settled heap: 196MB → 115MB.
  Local boot: 19s.

### Log accuracy, same rule as ever

A signed sigma printed against magnitude prose ("-2.45 sigma; under 2.00 ...
NO trend is claimed" beside the word "growing") now prints magnitude plus
direction; the [LANE] line dropped a historical parenthetical it printed on
92.5% of leads; PageSpeed's time-bucket row matched a host form the code never
calls (`pagespeedonline.googleapis.com` vs the real
`www.googleapis.com/pagespeedonline/...`) so every PageSpeed second billed to
"google (other)" — the §67 fix shipped with an unreachable regex; quoted spans
shed markdown decoration at `phraseAround` (one door), so "### Turn to the
Pros" stops reaching sheets; and LADDER OVERRIDE names the MEASURED rung beside
the model's label, so "search_absence" on a lead ranked #2 reads as the
mislabel it is.

### And the sidebar that said "0 LEADS" over a 202-lead pipeline — FIXED same day

First reload on the merged build: the paginated read loaded all 202 leads and
the sidebar showed none of them. It synced from memory only on MOUNT and on
the browser 'storage' event — which fires in OTHER tabs only, and never at
all once the pipeline outgrows localStorage and the cache switches off (which
this pipeline now does). The cloud load lands after the sidebar first draws,
so memory updated and no view heard. The masking had been the cache: mount
used to read yesterday's copy and look alive. `setLeadsMem` — already the one
writer — now announces `cj-leads-changed` in its own tab and the sidebar
listens; falsified both ways (dispatch removed, listener removed), each red
alone in `clientcheck`.

**229 boot checks green, settled in 19s locally.** Twenty-three falsifications
— eighteen server, five client — each red alone on its named assertion; the
ownership stripper's own first boot caught its honorific-splitter defect, and
CF5 went red through the executable merge contract on its own, which is that
check doing its §18 job. **`index.html` changed, so this needs a Netlify
deploy** — and the paginated read plus the contract bump are the fix for the
disappeared leads, so the drag-in is not optional this time.

---

