# §26 — Where the ad clicks land, what the owner cares about, and the model — 2026-08-20
Source: CLAUDE.md lines 1601-1717, moved verbatim 2026-09-02 from commit b01d952e4f95d7b69686bc2c4063ca2aa0cb7546 (branch backup/claude-md-monolith). Nothing below this line was edited.

## 26. Where the ad clicks land, what the owner cares about, and the model — 2026-08-20

Tier 2 and 3 of the plan. Built before running leads, deliberately: *"i want
everything perfectly in place before we start doing 50 audits a day."*

**The two lists of pages could never see each other.** The page backfill ranks
sitemap URLs by whether the site links them in its own navigation, and it keyed
BOTH sides on the full URL string. The sitemap publishes `https://www.`; the nav
is resolved against the stored website, which this file's own comment says is
recorded as `http://`. One scheme mismatch and **every** sitemap page reads as
unlinked — which breaks the backfill and the article filter silently and in the
same direction, and would have given a landing-page detector a 100% false-positive
rate. `pageKey` is host plus path now, and the log prints the match count either
way so this cannot go quiet again.

**Where do their ad clicks land.** Vin: *"really wish we could find their landing
pages and if they're running ads, that would be HUGE, like the most important
thing in the whole system."* Most of the answer was already bought.

A landing page's defining property is not its words, it is that **the site does
not link to it** — it exists to be arrived at from an ad. We buy a full sitemap
(1 credit) and harvest the site's own navigation from markup we already hold. The
set difference is the answer, and it costs nothing.

What it may conclude, and what it may not:

- **POSITIVE, safe** — "these pages exist and nothing on the site links them."
  Checkable by the owner in one click, true whatever they turn out to be for.
- **NEGATIVE, forbidden** — "you run ads with no landing pages." A purpose-built
  campaign page is routinely noindex, off the sitemap, on a subdomain or on
  another domain, and `firecrawlMap` does not request subdomains. A false zero
  here is the EXISTS BUT UNREAD failure in a new costume.

So it is INTERNAL, and the honest outward form is a question, never an assertion.
The floor is three navigation links: a site whose menu we failed to read makes
every page look unlinked, which is the same false zero pointed the other way.

**Seven pages bought, one page's markup read.** The interior scrapes asked for
markdown and a screenshot and never `rawHtml` — so the ad markers, the navigation
harvest and the booking read all ran on the homepage alone. Firecrawl bills per
PAGE, not per format; this file says so two lines above the format list. Six more
pages of markup cost nothing and were simply not taken. The markup is consumed
and dropped at the point of receipt: retaining it would be megabytes against a
256MB ceiling, and the derived facts are a few booleans and a link list.

**Google Ads Transparency Center.** The recorded refusal of `checkGoogleAds()` is
right and refutes a RAW FETCH of a JavaScript app — not the source. The identical
problem is solved for Meta thirty pages below with *"the Ad Library is a JS app so
plain fetch fails; Firecrawl renders it."* So it renders instead of fetching, and
carries the discipline the old one had none of: positive-only (only VERIFIED
advertisers appear, so "not found" can never become "no ads"), no parsing of
numbers that are not on the page, and **off by default**. It costs a credit per
lead and has never been run against a live advertiser from this codebase.
Shipping it ON would report an unproven read as a measurement.

**And the Facebook read was reporting a certainty the endpoint cannot give.**
`confirmed: true` on an empty answer put *"No Facebook ads attributable to them"*
on the call sheet. `/ads_archive` is scoped to political and issue ads, so a zero
is true of every business we will ever audit. A find is still a find; a miss is
now "not checked".

---

**What this owner demonstrably cares about.** The line Vin singled out —
*"almost obsessively engaged with his reputation"* — came from ONE behavioural
fact plus one worked example of interpreting it. Nothing anywhere asked for it,
so it happened once.

The raw material was far richer than what reached the audit, and it died at
schema boundaries rather than data ones. **The full text of every owner reply is
scraped and then collapsed to `.length`** — the one place in this system where the
owner speaks in his own words about his own business, reduced to a count. Two
prompts hold that text and both ask a narrow question of it: one extracts a
signature, the other looks for complaints. Neither may notice what the man cares
about.

A short sample now travels, with his own words from his About page, what he is
hiring for, and the unlinked-page count. `whatHeCaresAbout` is asked for
explicitly, read from BEHAVIOUR ONLY — things he did, that we measured — never a
guess at his personality. It goes on the call sheet ABOVE the recommendation,
because knowing what a man cares about changes how you open and the
recommendation is what you arrive at afterwards.

---

**The file said Sonnet and the code said Haiku.** Six lines above the assignment,
the comment block reads *"Default stays Sonnet. Changing it is a quality
decision."* The code said Haiku, and had for months. Two comments in one file
disagreeing about the default means nobody could tell which decision had been
taken.

From the live meter, not an estimate: Haiku audit $0.0467, lead $0.1019, fifty
leads $5.10. Sonnet: audit ~$0.14, lead ~$0.195, fifty leads $9.75. **Four
dollars sixty-six a day**, against engagements that start at thirty-five
thousand. Both the audit and the synthesis run on `claude-sonnet-5` now.

**And the smartest call in the system was the least informed thing in it.**
`buildSituationRead` ran BEFORE the audit on ~35 summary bullets: no page copy,
no screenshots, no findings, no knowledge of what the audit concluded. Meanwhile
the audit received 33,000 tokens of evidence and was asked to fill a 26-field
schema. Read-everything and think-about-it were split across two calls and
neither half got both — which is the structural reason a chat with a large model
outperforms this. The facts are still assembled where they are; only the CALL
moved, to after the audit, with their own homepage copy and the audit's findings
appended.

**What was deliberately NOT done.** `pitchAngle`'s field spec is 32,086
characters — half the system prompt — for one email line that a separate 400-token
call rewrites from scratch. Moving it would buy attention and no money (that
block is cached and bills at 10%). It was left alone: it is copywriting guidance,
and this file's own rule is *"do not tune the email prompt further until real
replies exist to tune against."* Splitting the ~14,000 uncached tokens out of the
audit's user block was also left: it is a 56,000-character template with 92
interpolation slots, the win is about $2 a day, and the risk is a degraded audit.

---

