# §23 — Five renders that all looked like the homepage — FIXED 2026-08-20
Source: CLAUDE.md lines 1184-1244, moved verbatim 2026-09-02 from commit b01d952e4f95d7b69686bc2c4063ca2aa0cb7546 (branch backup/claude-md-monolith). Nothing below this line was edited.

## 23. Five renders that all looked like the homepage — FIXED 2026-08-20

Vin, reading the audit screen: *"the screenshots are 4-5 screenshots of the
homepage, it's clearly not taking pics of the other important pages — that may
be why most audits are dry."* Two separate defects behind one symptom, and only
one of them was the capture.

**The display was showing the header band of every page.** The renders WERE the
other pages — about, booking, services — captured correctly and keyed correctly
per URL. Each is a full-page image at 1920 x 6,000-9,500px, and the audit view
put it at `width:100%` inside a 380px box: **the visible strip is the top 7-12%
of the page**, which on every website ever built is the masthead. Five correct,
different, paid-for renders rendered as five copies of one nav bar. Two columns
at half width now show 15-23% each, side by side where the difference is visible
without scrolling, with the page name as a chip instead of grey micro-text.

**And the backfill really was reading the wrong pages.** `NOISE` catches content
by its FOLDER — /blog, /posts, /news — and plenty of sites publish articles
straight off the root, where the shallowest-path sort finds them first. Jose
Barrera: eight URLs mapped, one intent match (/contact), and the other **six
reads went to procedure explainers** — `/how-is-rhinoplasty-for-wide-noses-different`,
`/latera-nasal-valve-implant`, and three more. Six credits of what the business
KNOWS, and nothing about how it SELLS, on the lead whose findings came back thin.

`ARTICLE_SLUG` reads the shape of the slug rather than the folder: four or more
hyphenated words, a question or listicle opener, a date folder, or a joining
word (`-in-`, `-for-`, `-vs-`, `-to-`) that only survives slugifying a title.
Articles are used **last and capped at two**, and a page the site links in its
own navigation is never filed as one whatever its slug looks like — the owner
put it in his header, which outranks any guess from a URL.

**And nothing could tell whether two renders were the same page.** Pushed back
on the display explanation, Vin was specific: *"the screenshots on the front end
were 4 screenshots of the same page — the homepage."* The honest answer was that
this system could not answer him either way. We ask Firecrawl for six URLs, it
returns six responses, and we had never once checked whether those were six
DIFFERENT pages. Three ordinary things return the homepage for a URL that is not
the homepage — a redirect from a retired page, a single-page app whose router had
not run when the render was taken, and a soft 404 — and in all three the markdown
comes back byte-identical, as does the picture.

The corpus is the expensive half. Four copies of the homepage in the evidence
makes an audit that read two pages look like it read six, which is the shape of a
dry audit that appears to have had plenty to work with. Interior pages are now
fingerprinted against each other AND against the homepage, duplicates are dropped
from both the corpus and the renders, and the run says so by name. `DUPLICATE
PAGE CHECK` uses exact equality on normalised text on purpose: a similarity score
would collide on the nav and footer every page shares, and a false positive here
DELETES a page we read correctly. Its first fixture had the two pages differing
in their opening words, so hashing a 40-character prefix still told them apart
and the falsification run passed on a broken build — real Firecrawl markdown
begins with the same header on every page, and the fixture now does too.

`PAGE SELECTION CHECK` runs Jose Barrera's real sitemap plus twenty-two real
navigational URLs from our own trades. The second list is the more important
one: a filter tuned until it catches everything stops reading the pricing and
services pages the whole audit rests on, and falsifying it by widening the
regex one step went red on `/cosmetic/african-american-rhinoplasty`.

---

