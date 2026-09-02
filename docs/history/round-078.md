# §78 — Three hand-checked leads, and the search stood in the wrong place twice — 2026-08-26
Source: CLAUDE.md lines 7112-7295, moved verbatim 2026-09-02 from commit b01d952e4f95d7b69686bc2c4063ca2aa0cb7546 (branch backup/claude-md-monolith). Nothing below this line was edited.

## 78. Three hand-checked leads, and the search stood in the wrong place twice — 2026-08-26

Vin ran TriStar Concrete, Windows Plus and Burbank Electric, hand-checked every
ranking claim against live Google, and sent the sheets, four site PDFs and the
whole Render log: *"i mean this is just completley wrong wtf is this... fix
every single thing im outting u on ultracode... i dont want you to comeback
until everyhtign is addressed and fixed at a high levekl hoineslty."* Eight
recon agents mapped the code behind each symptom before a line changed; the
industry sources were read before the localization decision was reversed.

### Burbank read #1 of 100 while a person in Jacksonville finds them ~#15

§76 stood every DataForSEO search at the business's own coordinates, on the
argument that the customer stands where the business is. Burbank proved the
argument wrong at its edge: their registered address is Fernandina Beach, 30+
miles from the Jacksonville they sell into, so "electrician in Jacksonville,
FL" measured from THEIR OFFICE made them the closest electrician to
themselves — #1 — and both stability samples shared the standpoint, so the
second look CONFIRMED the bias (the §74 window class again: a systematic error
agreeing with itself). The industry's own rank-tracking guidance says it
plainly: checking rankings from the business's own address is a documented
inflated read; the city-level location name is the neutral "searcher in this
market" standpoint.

So `dfsLocalization` stands in the CITY first ("Jacksonville,Florida,United
States" — their database wants the full state name, §59), the business's
coordinates are the DECLARED fallback taken on a 40501 in BOTH fetch loops (a
fallback nobody swaps to is a comment), and country-level 2840 stays the loud
last resort. The sponsored block and the AI answer are location-sensitive too,
which is why Vin saw sponsored electricians on every hand search while our
Fernandina standpoint saw none. HONEST SHAPE: the city-name-first read has
never run against the live endpoint — the account balance blocked a live test
— and the first credentialed run is its proof.

### The lead's rank was a bathroom query, and the sheet went to war with itself

Windows Plus is #2 for "window replacement contractor in Louisville, KY" — the
trade it is NAMED after — and the sheet said *"Search, map: not among the 100
listings returned (checked twice)"*, because §47's pickRankRow PROMOTES an
absent service-page row for the email spine, and the promoted row ALSO became
the lead's `m.rank`. Two queries, one variable. The map-pack row beside it,
measured on the head query, said #2 — Vin: *"the entire getting found section
is just not accurate... constantly goes against itself."*

Split at the root: `headRankRowFrom` makes the primary-trade row the lead's
rank identity everywhere, always; pickRankRow keeps ONLY its email job (the
sharpest OUTRANKED evidence among FOUND rows — the John P. Goodman case), and
its absent-service promotion is DELETED. The outranked evidence travels as its
own row (`outrankRow`) with `outrankedQuery` naming the search its numbers
came from, and a confirmed single service absence travels by name through
`service_invisibility`'s new single-confirmed branch — the finding is real and
keeps its query, it just can never again be "their rank". And every search row
on the sheet now NAMES ITS QUERY, with per-query rows for their own service
pages, because two rows about two searches with neither named is a
contradiction to any reader. `PRIMARY TRADE RANK CHECK` executes the Windows
shape end to end.

### TriStar's whole search surface died on a city parse

`LOCAL RANK: skipped — no city could be parsed from the location` — while the
same run held Nashville THREE ways, including the `gbpCity` §77 had just added.
Computed-but-not-passed again: the location chain took the first truthy string
and validated nothing. `rankLocationFrom` now walks lead location → their own
Google record (gbpCity + the new gbpState) → formattedAddress, keeping the
first candidate that actually parses to a city and is not a bare state name.
Vin's ruling on the class: *"this is the most importnant out of eveyrhting...
we NEED to measure this."*

### A 403 block page shipped as "their homepage"

Burbank's homepage render was literally *"403: Access Forbidden — Your
location (NO) has been disallowed"* — a geo-block served to a non-US egress —
and it shipped as their homepage: the vision model read it, the score graded
it, the sheet displayed it. Three layers now, each falsified: the scrape
quarantines on the HTTP status Firecrawl already returns
(`metadata.statusCode`, consumed by nothing until today) plus a widened
block-page vocabulary; every render request carries `location: country US` so
the page we photograph is the page a US customer sees; and the vision model is
asked `looksBlockedOrError` — when the eyes say the image is not a business
homepage, the render leaves the sheet, the brain's evidence and every visual
conclusion at once, and the sheet says WHY there is no picture
(`renderRefused`) instead of pretending none was taken. A quarantined render
grades NO first-screen component — the denominator shrinks, the reason is
named. `RENDER QUARANTINE CHECK`.

### The leak order, ruled on by the owner three times in one message

TriStar's callback complaints sat at leak 3 under two form findings ("leak 3
is the biggets leak ever"); Burbank's quote-delay complaint sat at leak 2
under the ads finding ("def the number 1 leak... money literally going out
the door... withotu a question"); Windows' no-shows he was ambivalent about.
The §67 anchor floor (three mentions) was holding them down. The distinction
his three calls draw, now encoded: a written complaint about RESPONSE TO
MONEY IN HAND (the no-response and quote-delay buckets) anchors at TWO
distinct mentions; scheduling keeps three; workmanship still never numbers.
And "nobody responds" — the live TriStar phrasing — matched NO bucket at all
(the vocabulary had no respond-verb stems), so the complaint he called the
biggest leak ever was classified as nothing. Both fixed through the one
shared derivation, fixtured on the live phrasings.

### "Generic market positioning stuff that couldn't be farther from the truth"

When no layer measured as binding, the constraint stamped MARKET and appended
a positioning essay — printed on two of his three sheets. A layer named while
the diagnosis disclaims one is a contradiction wearing a heading. NONE is a
real state now: no layer label renders, and the one-thing defers to the
numbered leaks by name ("the numbered leaks ARE the diagnosis, and leak 1
is..."). No positioning prose without positioning evidence.

### "How tf did we give this a 9/10"

scoreWebsite graded build mechanics, so a form-and-wait conversion disaster
scored 9/10 under the caption "the build is fine". V2: the booking route is
the heaviest component (3 of 10 gradeable points — the depth ordering's own
rule that the door is where the money dies), the first screen is graded by
the eyes that actually looked (and never off a blocked or mid-load render),
price and proof placement join measured-only, and NO build scores above 7.5
while its door cannot book a time — the cap names itself, and the caption
reads "built cleanly, but nothing on it books a time — the door caps the
grade". Unmeasured still leaves the denominator.

### "We need to know 100% they are running ads"

The code-assembled money lines asserted spend as fact off a tag — "They pay
for every click" is literally the class stripUnprovenAdSpend cuts from MODEL
prose, and these sentences were assembled past it. One rule now, at the one
place the lines are built: a sponsored row or their LSA ad seen on OUR OWN
pull licenses the flat form; a tag alone gets "If those ads are live..." —
which is also the honest call opener, because it asks him something only he
knows. The whole rung family (reframe, costs, bottleneck paragraphs) carries
the same tense discipline, ONE adsLive predicate (pack row OR LSA sighting)
feeds the facts strip, the leak evidence and the walk, and the sheet ships a
ten-second hand-check: adstransparency.google.com, search the business name —
the one public place a human can confirm live ads.

### The door rows, simplified to Vin's list

The chat row renders only when a chat product was FOUND; the price row reads
the server's four honest states (shown / none measured / a pricing page
exists that we did not open / never measured) — and the picker can no longer
LEAVE a pricing page unread: money words match anywhere in the slug
(/concrete-pricing, /driveway-cost — the money word trails the trade word by
convention), the vocabulary knows financing, cost and fees, and the
leadership position rule is untouched. "What a click becomes" says it in
plain words. And Burbank's emergency contradiction — pages selling 24/7
emergency work over a "schedule a walkthrough" door — is measured
(`emergencyMismatch`, from their own copy plus the measured booking route,
phone-only deliberately NOT a mismatch) and rendered as an INTERNAL row:
a question for the call, never a claim to him.

### The service-area query noise

"Bagdad, KY" (pop ~200) was harvested from a slug list that included
"Scottsburg In Bathroom" — the "-in-" = Indiana trap — burned two DFS calls
on 40501 and printed a Places absence row. The state hiding mid-slug is
parsed after the trade strip now, the service-area read is DFS-only
(`noPlacesFallback` — a Places answer about a village is relevance noise
sold as a market), and a 40501 skips rather than falling through.

### What the falsification runs found in the checks themselves

Forty-five falsifications — thirty-seven server, eight client — each reverted
alone. Three found defects in the checks, not the code: the pricing-vocabulary
fixture supplied its own regex copy (the recorded half-a-check, caught at
design time — a needle now pins the real PAGE_INTENTS row); the red-mark
assertion on the confirmed service absence was wrong about the §69 rule (red
requires the rung to have FIRED — the fixture now carries it); and the first
TriStar city fixture used an invented input the parser legitimately accepts —
rewritten to the recorded live shape (an EMPTY lead location), with the
parser's comma-less-prose looseness documented rather than papered over. The
7.5 cap also masked any booking-weight revert in every whole-score fixture,
so the weight is asserted on the graded component itself. And the round-99
RANK LOCALIZATION ✓ message still described the coords-first order a full
round after the order reversed — a stale claim in the check's own mouth,
reworded.

**243 boot checks green.** The contract is 20260902 on both sides.

**`index.html` changed, so this needs a Netlify deploy** — the query-named
rows, the four-state price row, the ads hand-check, the renderRefused note
and the capped-score caption are dark until the file lands.

---

