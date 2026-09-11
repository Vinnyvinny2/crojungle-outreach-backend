# Round 141 — the system looks at a website and says what a visitor sees

**Shipped 2026-09-11. Server AND client. Contract bumped 20261016 → 20261017 — `index.html` needs the
Netlify drag.**

## Why: the grade could not serve the toggle Vin asked for

Vin, 2026-09-11, having paused the email work to look at lead quality:

> *"the only adjustment I want to make is a toggle switch that just picks up businesses with fair and
> bad websites — like if I toggle that on we only target businesses with bad websites. So we have to
> make sure the website grading signal is accurate."*

**It was not accurate for that purpose.** `SITE_GAP_TERMS` is 10 faults worth 34 points, capped at 25:

```
INVISIBLE TO A HUMAN            VISIBLE TO A HUMAN
noindex      5                  datedBuild      5
noSchema     5                  noForm          4
jsOnly       4                  diyBuilder      3
blocksAi     2                  noClickToCall   3
weakTitle    2
thinAlt      1
19 points  (56%)                15 points
```

On the live ten-lead run of 2026-09-11:

- **Three leads graded "fair" on invisible faults alone** — Arch Design (gap 5) and Ideal Siding
  (gap 5) on nothing but `noSchema`; Wasatch (gap 7) on `noSchema` + `weakTitle`.
- `SITE_GAP_WORD` is `>=16 poor, >=10 weak, >=4 fair, else strong`, and **`noSchema` alone is 5**, so
  one missing tag crosses strong→fair. **Seven of ten landed in "fair" and none in "weak."**
- `datedBuild`, the largest "looks old" signal, needs two age markers with one visible — Flash,
  `<marquee>`, `<font>`, table layouts, fixed-width pages, no viewport, plain http, a stale copyright.
  It fired on **0 of 10**, including the Squarespace site the system itself called "poor."

And the root of it: **nothing had ever looked at these websites.** The read is markup-only and says so
in its own words — *"nothing wrong with their site that we can see from its code."*

**Correction on the record:** the first write-up called `datedBuild` a pure 1998 detector (Flash,
marquee, font tags, table layouts). `readSiteAge` also marks a missing viewport, plain http and a
copyright three or more years stale as visible. The conclusion holds — 0 of 10 — but the mechanism is
less narrow than stated.

## The design constraint that shaped everything

**The existing technical grade is untouched.** `site.word`, `site.gap`, `site.grade` and the fault
families feed the AUDIT's findings (`search_absence`, `dated_site`, `conversion_leak`) and the Find
score. Rewriting it would silently change what live audits claim about real businesses — the one
thing this round may not do. So a **second, independent verdict** was added beside it:

```
site.word    strong / fair / weak / poor      UNCHANGED, technical, feeds the audit
site.looks   modern / dated / bad / unknown   NEW, visual, feeds the toggle
```

One boot assertion exists purely to guard that blast radius: the site grader is executed on fixtures
and `word` / `gap` / `faults` must be what they were. A revert of it reddens
*"the technical grade is quietly rewritten under the audit."*

## What was built

**Server.** One Firecrawl **viewport** render of the first screen (`fcHomeShot`, through `fcCall`,
priced through `fcCreditCost(..., shot=true)`, filed under `byKind.screenshot`), read by one Haiku 4.5
call (`visionSiteLooks`, meter label `site-looks`, thinking stated). The verdict is the pure
`readSiteLooks()` over weighted visible faults — old design 3, aging 1, untouched template 2,
desktop-only layout 2, cheap photos 1, not credible 2 → **≥5 bad, ≥2 dated, else modern**.

Viewport rather than full page: the question is what a stranger sees on arrival. **A true mobile
render is a second credit and is deliberately not bought** — the phone question is asked as
`desktopOnlyLayout`, about the layout the image actually shows.

`visionAuditPage` was **not** reused. It *grades* the audit (a first-screen component and two absence
gates read its answers), so widening its prompt changes what live audits claim; it asks nothing about
a phone, a template, photography or credibility; and its one adjacent answer feeds `dated_site`.

`siteLooksBuy` decides who pays, **`notIcp` tested first** — a franchise or branch is refused before
the spend, matching the existing drop discipline. New knob `FIND_SITE_LOOKS`, default on.

**Client.** A tick box in the chip row, off by default and deliberately not remembered between
sessions — *a switch that hides businesses must be pressed on purpose.* On, it keeps everything whose
verdict is **not** `modern`, so dated, bad and not-checked all survive. A line above the list says how
many it hid and how to get them back. The verdict reads on each row beside the location, with the
reason on hover.

**`unknown` is the honest half.** It means we could not look — the page would not load, or it paints
itself with JavaScript — and Vin ruled such a lead is **kept and marked**, never hidden. It reads
"site not checked", the house wording for a signal we do not hold. Never-looked is not looks-fine.

## The integration gap neither agent could see

Built in parallel worktrees, the server returned **four** row fields and the screen wired **one**:

```
contactSiteLooks           server ✓   client ✓
contactSiteLooksMeasured   server ✓   client ✗
contactSiteLooksWhy        server ✓   client ✗
contactSpendRender         server ✓   client ✗
```

`clientcheck` did **not** catch it, which is worth recording: it proves a field the client declares
survives the round trip, and cannot see a field the client never declared at all.

`contactSiteLooksWhy` was wired at integration, because **Vin's ask was "make sure the grading is
accurate" and nobody can audit a one-word verdict**. It is now a full-set CSV column beside `siteWhy`,
carried on promotion, persisted, and shown on the row as the hover reason.

`contactSiteLooksMeasured` is left unwired on purpose — the client derives "we could not look" from
the `unknown` token itself, and a second copy of one fact is the disease this file records most.
`contactSpendRender` is left unwired because the server already prints it on the `FIND CONTACT`
footer, which is where the credit question gets settled.

## Measured cost per read lead

- **Firecrawl +1 credit**, measured through the real route (`spend.render === 1`, one picture per
  *lead* not per page). Today's read is 3.75 credits, so **3.75 → 4.75**.
- If the dial settles at 5, the per-lead cap (10) starts refusing it on heavy leads and the row says
  so by name. **That settlement is now possible**: the footer reads
  `N Firecrawl credit(s) (M of them the homepage render)`.
- **Anthropic ~$0.002–0.005** — arithmetic, not measurement: one Haiku call, ~1.5–2k in / ≤500 out,
  against the measured $0.0076 model spend of a contact read.

## Proven

```
node docs/gen-refs.js                 ✓
node build.js --check                 ✓ 88,580 lines, CRLF, byte for byte
GATES=static bash ci-gates.sh         ✓
node clientcheck.js                   ✓ exit 0 — 33 columns default, 57 full; 129 stored fields
node dupkeys.js / scopecheck.js       ✓ index.html clean, still LF
boot                                  ✓ GREEN — 304 checks (was 303), 1 expected decline, 0 failures
node falsify.js round-141-reverts.js  ✓ 14 of 14 RED on their own named line, tree restored byte for byte
bash ci-gates.sh (all stages)         ✓ ALL GREEN — fuzz: 2,117 emails, every invariant held
```

Executed end to end through `servercheck`'s fake network on the real `/api/find-contact` route, not
fixtures: a rendered lead returns `looks: 'bad'` while its technical grade still reads
`word: 'weak', gap: 14` — **the two verdicts disagree, which is the point**; an unreadable one returns
`unknown`, survives, and spends nothing; a dropped lead issues **zero render requests**.

**Two traps recorded.** A check's ordering scan found *the other half of its own call-site literal* and
reported the render sitting 20,000 lines from where it is — fixed with one needle split so neither
half contains the whole. And `servercheck`'s free-read invariant ("zero Firecrawl calls on a site that
answers a plain fetch") went red on the render and was **widened by exactly one render, counted
apart**, so it still means pages.

One existing needle was **re-aimed, not retired**: the chip-filter call site now asserts the bucket
filter *wrapped in the toggle*, both intents at once.

## Needs your eyes

- **Drag `index.html` into Netlify.** Both contract numbers moved to `20261017`. The server half goes
  live on merge and the toggle stays dark until the drag — that is exactly the half-live shape that
  reads as an intermittent bug, so do them together.
- **Settle the render's real price on the first run.** The footer now separates it. If the Firecrawl
  dashboard moves by 5 per lead rather than 1, set `FC_SCREENSHOT_CREDITS=5` and the per-lead cap will
  start refusing it on heavy leads, by name.
- **Check the verdicts against the sites.** The reason sentence is on the row (hover) and in the full
  CSV as *"Why their website looks that way to a visitor"*. Open three and see whether you agree —
  that is the accuracy question and it cannot be answered here.
- **Watch how many come back `unknown`.** A site we could not photograph is kept and marked, so the
  toggle will let some good websites through. If that count is high, the fix is spending more to
  render them properly, not hiding them.
- The word on the switch is **"bad websites only"** and the rule is *everything that does not look
  modern* — dated, bad and not-checked. Vin asked for "fair and bad", which is what that catches; the
  label is just shorter than the rule.
- Carried: `hunterFindPersonEmail failed: timeout` is still logged as "their index has no address";
  `findSizeViaSearch` still crashes twice a run, swallowed; Round 139's press-side rules still have
  never run, because they need a **Find press** rather than a contact read.
