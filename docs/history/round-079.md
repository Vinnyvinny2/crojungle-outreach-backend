# §79 — Round 102 — the website read, rebuilt across all four axes — 2026-08-26
Source: CLAUDE.md lines 7296-7427, moved verbatim 2026-09-02 from commit b01d952e4f95d7b69686bc2c4063ca2aa0cb7546 (branch backup/claude-md-monolith). Nothing below this line was edited.

## 79. Round 102 — the website read, rebuilt across all four axes — 2026-08-26

Vin: *"we need the rating and the findings on the websites to always be
accurate so we can always curtly identify if a website is bad or good design
wise booking clients wise backend code wise the code set up for seo wise every
aspect of the website... fix at the root and build from the ground up."* Seven
recon agents mapped the four axes before a line changed, the industry's own
evidence was read before the SEO axis was designed, and 44 falsifications ran
— each red alone.

### Booking clients: the label decided, and now the link decides

`measureBookingPath`'s first branch turned any book/schedule LABEL into
`online_booking` before a shred of evidence ran — so "Request an Appointment"
over a plain 9-field contact form graded 3/3 on the score's heaviest
component, lifted the 7.5 cap, and silenced both door rungs: the false GOOD,
on exactly the leads those rungs exist for. A label is INTENT now and only the
LINK URL decides — a known scheduler URL, the site's own /book-now page, or an
offsite address that itself says booking. Everything else falls through to the
form and phone evidence, and the label travels as `bookingLabelSeen` for the
call sheet. Bare `\bbook\b` is gone ("Guest Book" read as a booking route).

- **A LINKED scheduler is probed**: a URL answering 404/410 TWICE is removed
  from the read (the campaign_page_dead discipline) — a dead Calendly whose
  trial ended is not a booking route however its address reads.
- **A password form is a login portal**, never a contact route; a careers
  page's application fields are not a customer route in; an `sms:` link is a
  capture route (suppression only, never a booking claim); and `visiblePhone`
  — asked of the vision model since it was written and consumed by NOTHING
  (instance twenty-three) — now corrects `none_found` to `phone_only`, so
  "no route in at all" is withdrawn about a number the render plainly shows.
  `unreadBooking` finally gates the walk's "only way in" sentence too.
- **The rendered DOM joins every scrape.** Firecrawl's own docs: `rawHtml` is
  the server's HTML BEFORE JavaScript ran; `html` is the rendered DOM. Every
  DOM-shaped read (forms, iframes, booking widgets) was running on markup a
  site-builder page had not built yet. Same page, same credit — Firecrawl
  bills per page. Script signatures stay on rawHtml, where the tags are.
  HONEST SHAPE: the `html` format has never been watched succeed live, so the
  request carries a runtime fallback — a 400 drops it and re-asks on the
  proven pair — and `HOMEPAGE REQUEST CHECK` admits the new shape ONLY
  because that fallback exists.

### The /10: no flattering number survives a thin read

- **`siteAgeScore` was delivered ungated** while `readSiteAge`'s unchecked
  return is `score: 0` — `Number.isFinite(0)` passed, so an UNREAD page
  graded 1.5/1.5 "modern build". The recorded null-laundering class, live.
  Delivered null unless checked, and the wrong-company discard now blanks the
  age read's input, so a franchisor's markup cannot grade the lead's build.
- **THE FLOOR: under five graded components there is no /10 at all** —
  `checked: false, thin: true`, the count named. Two components used to
  multiply out to a confident 10/10 on precisely the lead where the least was
  known (a blocked site, a ladder crash). The screen and the sheet both say
  "site build not graded — N of M components measured".
- **The vision grader ran at temperature 1.0 its whole life** — the API
  default, the exact class §6 fixed on the writer, on a call that GRADES.
  Pinned at 0.2, its booleans coerced ("true"-as-string silently dropped the
  component), and `pageFullyLoaded === true` required — an omitted field used
  to walk a mid-load shot past the gate. A null viewport leaves the
  denominator instead of passing; a 10-field form split into steps scores as
  the checklist's own PASS case.
- **A promo dollar is not a price.** "$0 down", "Save $500" and "$2M insured"
  no longer read as published pricing; "$89 tune-up special" still does.
- **Proof position is measured over VISIBLE text** — a JSON-LD review block
  in the head used to read as "proof before the footer". And the new check's
  FIRST RUN caught a live bug nobody had reported: `_proofRe` held
  `testimonial\b` and `review\b` — the §15 stem trap — so "Testimonials" and
  "Reviews", the two most common proof headings on real pages, matched
  NOTHING, and the proof-position read was dark on most sites that actually
  have proof. Plural-aware now, with the fixture that found it.

### Design markers: the adversarial pass on our own checklist

Every §28 signal had a way to fire on a page that got it RIGHT: a hidden CRM
prefill named "email" counted as a wrong-keyboard field AND as a Submit-only
button, "Step 1 of 3" in how-it-works prose read as a stepped form, three nav
links counted as competing first-fold asks, a plain-text named address was
invisible to the shared-inbox read (mailto-only), a PDF embed fired "it still
has Flash on it", `data-width=` fired "cannot fit a phone" on a responsive
build, ONE pasted rate table read as a table-layout build (tables and pre-CSS
markers need two hits now — content is not the build), and a maintenance
pitch arguing AGAINST emergencies read as selling emergency work. All fixed
in both directions. And Wix/Squarespace measure traffic natively with no tag
in the markup, so the analytics-absence claim is barred on builder platforms
(`builderNativeAnalytics`, read from the platform's own asset hosts).

### The SEO axis, measured for the first time — and bounded

"The code set up for SEO wise" was four booleans in a prompt line.
`readSeoSignals` now reads the homepage source: a robots noindex in either
attribute order; JSON-LD schema CLASSIFIED — a typed block carrying an
address or phone is the business schema, builder-injected
WebSite/Organization is the boilerplate it is (Wix and Squarespace auto-inject
it, so bare presence proves nothing); the title checked for the default and
for the trade STEM and city (the §15 discipline — 'roofer' finds "Roofing");
the canonical; image alt coverage; and the sitemap's own lastmod dates —
STALENESS-only, because plugins regenerate lastmod on every deploy so a fresh
date proves nothing, and under three dated entries nothing is claimed at all.

**The bound, from the industry's own studies: on-page is ~15% of local-pack
weight, so nothing here is EVER sold as the reason for a map position** — the
sheet's own row says so. The one sendable finding is **`site_noindexed`**
(harm 92, INVISIBLE): a robots noindex is a kill switch, not a ranking factor
— Google is TOLD to skip the page and obeys — checkable by whoever runs the
site in one look, and it fires only with the page actually read. Everything
else lands as internal context on the found stage and in the audit prompt.

HONEST SHAPE: the sitemap fetch, the `html` format and `site_noindexed` have
not yet fired on a live lead — the first live run after this merge is their
proof.

### What the falsification runs found in the checks themselves

44 reverts — 38 server, 6 client — each red alone. sf16's first run came back
STILL GREEN: the vision-temperature needle was written as one literal and
found ITSELF in the check's own source — the thirteenth recorded instance of
the self-matching needle, caught by the falsification run doing exactly its
job, and split into two real halves. The unread-rung revert went red on
LADDER SURVIVAL rather than its named fixture — the guard family caught it,
the accepted §65 outcome. And the first fixture pads were stubs
`extractHtmlSignals` rightly refused (under 15 tags reads as an error page by
design), which is the function's own honesty gate refusing a dishonest test.

**247 boot checks green.** The contract is 20260903 on both sides.

**`index.html` changed, so this needs a Netlify deploy** — the Search setup
rows, the installed-not-answered chat wording, the not-graded caption and the
seoSignals persistence are dark until the file lands, and a stale page says
so by contract number.

---

