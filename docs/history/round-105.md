# §105 — Ten leads read in twelve seconds, and the score that called them a 53 — 2026-09-02
Source: CLAUDE.md lines 10182-10358, moved verbatim 2026-09-02 from commit b01d952e4f95d7b69686bc2c4063ca2aa0cb7546 (branch backup/claude-md-monolith). Nothing below this line was edited.

## 105. Ten leads read in twelve seconds, and the score that called them a 53 — 2026-09-02

Vin set the three Render cost vars, dragged the client, unticked the
Google-listing box as instructed, and read ten. **Under twelve seconds, and all
ten came back "their website returned nothing"** — Epicrispr Biotechnologies,
Teal Health, Ember LifeSciences, SPORTY & RICH, a title-loan company, a
networking club. Then a refresh lost the run and the export dropped to 62 with
no way to tell what had already been handed out: *"now i refreshed the app i
have no way of getting taht runs leads back... i have no clue which ones ive
already exported and which i dont."*

Three code traces read the picker, the route and the client; every line below
was quoted from source, not inferred from the log.

### The run measured nothing, and it was guaranteed to

**Two lanes build a lead with a name and nothing else.** `sec_edgar` returns
`{ name, source, signals, raiseAmount, signalDate, jobTitle }`; `news_*`
returns `{ name, source, jobTitle, signals }`. No website, no location, no
place id, no phone. TheirStack — the lane Vin is funding — carries all of it
and was never the problem.

**The picker had no can-this-be-read precondition** (`batchCandidates` on the
Research tab does; `_cUnread` never got it), **and they sorted FIRST**: the
pool is ordered by `predictReach`, which scores the *name shape alone*, so a
personal-sounding name with no website to drag it down led the draw. **The
route read and then stopped rather than refusing** — preflight checked that a
website *parses only if one was supplied*, and the place id was first read
after admission, after the slot was taken.

### The 53/100 was fabricated, and printed a false sentence

`findIcpScore` is a ratio over a shrinking denominator, and exactly one of
seven terms scored. `reachMeasured` was `!out.notIcp` — "not dropped as a
chain", never "the lookups ran". Inside the term, `Number(s.emailTier)` on a
null tier is **0, and 0 is finite**, so "solid" was true and the row printed
**"a published or mailbox-confirmed address"** about a lead with no address
and no website. 8 of 15 → 53. The honest value on that branch is 1 → 7. The
same trap was written down sixty lines away about a different field.

Three fixes: `strictNum` on the tier; `reachMeasured` means an owner or
address lookup actually **completed**; and **`FIND_ICP_MIN_TERMS = 3`** —
below it there is no score, it says "not scored — only N of 7", and it sorts
under every scored lead. Vin's decision: a ratio over one term is not a fit
score. The stagesRun early return (§104's OWNER WAVE line printing "the
resolver did not run" when stage 1 ran) got its missing property too.

### A name-only lead gets a website, or it stays unread

Vin's decision, over dropping them. The payoff chain: a resolved domain
unlocks the page read, which unlocks `resolvePlaceId`, which recovers the
listing and with it the rating, hours, category and the free
owner-from-review-replies source.

It is also the most dangerous thing on the route, in `resolvePlaceId`'s own
words: *"Resolving the WRONG business would be the most damaging thing this
system could do."* A wrong domain re-parents the whole read — owner, email,
phone, rating, score — and a rep dials it. So:

- **A SLATE of free sources, in parallel, never a ladder.** The Companies API
  by-name (free, and the only source with a real match standard — it needs
  `COMPANIES_API_KEY`, and the run says so once an hour if it is absent),
  Clearbit autocomplete, and a HEAD probe at `{name}.com`. Two sources naming
  the same host is corroboration, and it is free.
- **No source's own verdict is read.** Clearbit's `confident` flag is
  discarded. Every candidate is judged by ONE module-scope predicate,
  `websiteProofFor`: a bare registrable host, a blocklist that finally carries
  **every news host** (the news lane's name came out of a headline, so a
  search finds the article first), the TLD and scam-shape lists hoisted out of
  the Companies API callback where nothing else could reach them, the
  tightness rule that stops `unitedairway` matching `united`, and one of two
  name proofs — `domainSpellsLeadName` or the hoisted word-level match that
  refuses Digitas Liquorice. The boot table carries **accept** cases beside
  the refusals, because a refuse-only table is green on a predicate that
  refuses everything.
- **Two accepted hosts with equal corroboration resolve NOTHING.** Two
  plausible domains is evidence that two companies share this name — exactly
  when resolving is most dangerous. Refusing is free.
- **A self-derived guess is PROVISIONAL, never accepted.** The domain-spells-
  name proof is circular for it; only the page can confirm it.
- **A name with no distinctive word is not resolved at all**, and the route
  refuses it *before the slot is taken* — `unreadable: true`, never `notIcp`,
  which retires a lead permanently. It only needs a human to paste a URL.
- **The paid rung (a Firecrawl search) is opt-in and default OFF.** The real
  marginal cost is two credits PLUS a full lead read, on the lane least likely
  to be in the ICP, and a wrong NAME is one word a rep corrects on the phone
  while a wrong DOMAIN re-parents everything.
- **A Places text search by name is deliberately NOT a source**, and the
  reason is recorded so nobody re-adds it: `resolvePlaceId`'s entire safety
  argument is that the website is the *input and the proof*. Taking its output
  as the website inverts that into "Google's name relevance decided which
  business this is" — on a lane with no location. Its role is corroborator,
  never source.

**The page confirms it or it is un-stamped.** The Round-104 corpus guard
already computed the right thing; it is three-state now (`unmeasured` counts
as NOT confirmed), shares one tokeniser with the acceptance predicate, and —
**the single most important correctness point in the round** — is
word-boundary anchored with the domain string stripped first. A parking page
prints `acmeroofing.com` in its footer, and a substring test reads that as the
words "acme" and "roofing": it reported CONFIRMED on precisely the case it
exists to catch. When the free test cannot confirm, one Haiku call
(`confirmDomainMatch`) decides; `wrongCompanyOverruled` is kept out of this
path on purpose, because its first half is true by construction for a guessed
domain.

**One test, two verdicts, keyed on provenance.** A published domain the guard
FLAGS — somebody other than us believed it, and a rebrand explains a miss. A
domain WE resolved on a name match has no such belief behind it, so a miss
**un-stamps** it, and **everything site-derived goes with it** through a named
function over a declared field list — §82 recorded blanking the URL alone and
auditing the wrong company anyway. The lead returns to the unread pool minus
the cost; `notIcp` is never touched.

**And the mark travels.** `websiteConfidence: 'weak'` — the same word
`sizeConfidence` already uses. The listing recovery cannot run on an
unconfirmed domain (it would quote a stranger's rating and phone onto the row
at full confidence). `contactFieldsFrom` never read `d.website` at all, so a
resolved site would have reached the row as an owner and an address with no
website beside them; it carries the domain, the proof and the confirmation
now, and **the provenance rides the lean CSV's how-sure cells**, because
`website` is not in the lean set and a rep must never download an owner
without knowing the domain was ours. Nothing on this path writes
`company_size_cache` (`getCachedSize` returns `trusted` unconditionally), and
there is no name-keyed memo (§19 with a new payload).

### The Find tab remembers

- **Seven view states reset on every reload** and none read storage.
  `verifiedOnly` defaults to *Strong first*: Vin had clicked Show all, and the
  refresh silently took the population from 420 to 92 — which is the whole
  153→76 mystery and the export dropping to 62. One localStorage key now.
- **A run survives a refresh.** `contactRun` was state-only, so the run/queue
  toggle did not even render after a reload. Every lead a run touches carries
  `contactRunId`, and the newest id in the data IS the last run.
- **Every exported row is stamped** — when, and whether to CSV or the sheet —
  through the `extra` jsonb round trip that already carries everything (no
  schema change). Shown on the card and as a lean CSV column. Vin's decision:
  stamp and show, keep exporting the full set. Honest limit on the sheet: the
  script returns only counts, so a row is stamped as SENT and the sheet's own
  dedupe may have skipped it.
- **The export band says why it is empty.** The button had not vanished; it
  had nothing to export and said nothing.
- **Nothing to read is its own tab** — not Ruled out (a verdict), not Not read
  (which re-draws it forever) — with a way back.

### What the falsification runs found in the checks themselves

Three of the resolver fixtures failed a CORRECT build on their first boot,
and each is a recorded trap: **"Bob Ray Co"** was asserted resolvable, and
three-letter words are deliberately not tokens — the fixture was wrong, not
the floor; a needle for the resolution block's end was written with an
**empty second half** (the self-matching literal, caught inside the round that
fixed it elsewhere) and, once split, found `contactRankFor`'s identical line
earlier in the file — it searches from the block's start now; and a
pre-existing needle pinned the `_opts` line I reformatted.

**Thirty-two reverts, each applied ALONE against a baseline the harness proves
green first, each red on its own named assertion.** The first pass was 31 of
32: the news-blocklist revert dropped `prnewswire` alone, and `prnewswire`
CONTAINS `newswire`, which was still on the list — a revert that reproduced
nothing. The original defect is no news host at all, and that goes red on the
reason: the article is refused for having extra words, not for being news.

**HONEST SHAPE: none of this has run against a live press.** The slate, the
predicate, the confirmation and the un-stamp are executed at boot on the
recorded wrong-company shapes, and `servercheck` drives all four outcomes
over the fake network — refused with zero calls, resolved and confirmed with
the listing recovered, contradicted and un-stamped with no listing call, and
ambiguous with nothing read. The first real press is the measurement, and the
line to grep is `🌐 WEBSITE RESOLVE`.

**`index.html` changed, so this needs a Netlify deploy**, and the contract is
**20260925** on both sides.

---

