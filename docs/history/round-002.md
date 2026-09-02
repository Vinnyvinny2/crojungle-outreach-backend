# §2 — The findings sit three levels below what is sold
Source: CLAUDE.md lines 244-373, moved verbatim 2026-09-02 from commit b01d952e4f95d7b69686bc2c4063ca2aa0cb7546 (branch backup/claude-md-monolith). Nothing below this line was edited.

## 2. The findings sit three levels below what is sold

41 rungs now, classified: 8 reviews (SEVEN OF THEM INTERNAL-ONLY — see the
second correction below), 14 website mechanics and intake, 5 Google listing
fields, 5 search visibility, 4 positioning/offer, 3 operations, 4 money already
committed. Mike sells
revenue and operations. The distance between "your pricing page is missing" and a
$10k/mo retainer is what the owner experiences as *so what*.

**Every reply came from a review rung or from `outranked_by_weaker`. Zero from a
storefront finding.**

**Correction, 2026-08-18 — why the emails kept reading as being about reviews.**
This was diagnosed for weeks as a supply problem (too few business rungs) and it
was mostly two mechanical faults on top of it, both now fixed:

- `outranked_by_weaker` is a RANKING finding and two of its three subject lines
  said "your reviews are broken". A construction company and a plastic surgeon
  received the identical pair on one afternoon. The headline also contradicted its
  own body, whose point is that the business above them has FEWER reviews.
  `SUBJECT REGISTER CHECK` now fails the boot on review vocabulary attached to a
  non-review finding.
- The one-review-touch quota counted rung IDs and DEFERRED extras to the end of
  the array, where they shipped anyway — a no-op whenever the non-review pool was
  empty. It now runs on the four rendered touches. A touch counts as a review
  touch when the finding is about reviews or the subject says so, and deliberately
  NOT when a non-review finding merely cites a review count: "a business with
  fewer reviews than yours is ranking above you" is the sentence Chuck Jenkins
  said would have made him open the email, and an earlier version of this quota
  spent the budget on it and deleted the real review finding behind it.
- And the follow-up pool was sorted by raw harm. `NOT_SELLABLE_OPENER` bars seven
  review rungs from LEADING while `SELLABLE` scores those same rungs 5, so they
  take none of the 44-point penalty, sit at the top of `byHarm`, and take slots
  two, three and four. Barred from the opener, first in line for everything after
  it. Follow-ups now prefer findings we can sell against.

Measured across the three leads of the 2026-08-18 run: 3 review touches of 12,
down from 8 of 12; review-worded subjects 1, down from 7.

**Second correction, same day — reviews are INTELLIGENCE, not copy.** The three
fixes above reduced how often reviews appeared. They did not answer the real
question, which Vin put like this: *"reviews are more of an internal sign for us
into their business. I don't think we should be mentioning them directly
externally — that's like giving our cards away in poker. We should definitely
reference the findings externally, not actually mention where they came from."*

He is describing two jobs the system had collapsed into one:

| | |
|---|---|
| **INTELLIGENCE** | 150 mined reviews, the reply rate, the arrival rate against years traded, the newest date. The cheapest read we get on how a business actually runs, and what Mike should have in front of him on the call. |
| **COPY** | a sentence a stranger reads. Here the same material is actively harmful: there is nothing to sell, it hands over our method, and it asserts a theory of his business that is false. |

So there are now three mechanisms, each closing a route the other two cannot:

- **`INTERNAL_ONLY_RUNGS`** — the seven review-metric rungs (`review_deficit`,
  `not_compounding`, `review_velocity_drop`, `no_owner_replies`,
  `partial_owner_replies`, `stale_reviews`, `low_rating`) are measured, scored,
  ranked, written into the audit and put on the call sheet, and can never reach
  an email. Stronger than `NOT_SELLABLE_OPENER`, which barred only the first
  line and let all seven take follow-up slots two, three and four.
- **The two review-derived findings we DO send were rewritten to state the thing
  itself.** `review_pain_pattern` now leads with the fault — *"quotes that never
  come back — 6 different people have described the same thing publicly"* —
  never with where it was read. Its blind line, reframe and subject fallbacks
  were all naming reviews too and all three were rewritten.
- **`verifyBrainEmail` refuses a review word the MODEL introduced.** The audit is
  full of reviews and should be; this is the only gate between that and the
  inbox. A review word is permitted in the body only if the same word appears in
  something CODE assembled — the spine, the recognition line, or the ASSERT
  list. That keeps the one sentence built on review counts on purpose (see the
  ranking finding below) and refuses everything else.

`REVIEWS ARE INTERNAL CHECK` fails the boot if any of the three drift apart.

**And the system believed reviews drive Google rank.** Vin: *"it seems like the
system believes reviews are what make your rank higher. Google factors many
things — answer rate etc."* He was right and the cause was one clause in the
research brief, sent to the brain on every lead: *"Google reviews are also what
local rank is computed from."* That is false — the local pack weighs relevance,
distance and prominence together, and reviews are one input among many. One wrong
sentence in the brief made every audit downstream read reviews as the lever that
moves rank, which is why four consecutive runs produced review-shaped emails. The
clause now says the opposite and says why: if a business with fewer reviews ranks
above them, the correct conclusion is that reviews are demonstrably NOT deciding
that search — something else is, and naming the gap is the sellable conversation.
`outranked_by_weaker`'s reframe carries the same correction into the email.

Still true, and still the real ceiling: the site-derived rungs all share "did we
look?" absence guards, so a thin Firecrawl scrape silences them together while the
review and rank rungs — fed by Places and Apify, which never fail together — keep
firing. Fix the input supply and the balance improves on its own.

**Two new SPENDING rungs, 2026-08-18**, both from data we already pay for:

- **`paying_for_a_search_they_lose`** (harm 94) — a Google Ads conversion tag in
  their own page source AND a measured map position outside the top three. Vin's
  own framing: *"we see you're running ads and still not in the top 3 — this is
  like flushing money down the toilet."* Bounded three ways: the tag proves an
  ads ACCOUNT, never a live campaign; the position is stated as a BAND, never a
  digit, because the digit moves between runs; and no cause is named for the
  position. Two facts he can check in a minute, and the contradiction does the
  work.
- **`social_spend_no_search`** (harm 70) — Meta pixel present, no Google Ads
  tracking on the pages we read. An absence claim, so it carries two gates: we
  must have actually read the markup, and a Google Tag Manager container must be
  ABSENT — a GTM container can hold an ads tag we cannot see, and telling an
  owner he is not doing something he is plainly doing is the fastest way to lose
  him. `hasTagManager` was added to the site fingerprint for this.

Measurable and not being measured, each closer to the product:
- **Duplicate Google listings** — splits reviews and ranking, invisible to the
  owner, risky to fix alone, and explains the outranked finding.
- **Mobile page speed** — free via PageSpeed API, never called.
- **Careers page** — built, rarely fires, closest available signal to what Mike
  sells.

**What Vin asked for that is NOT built, and why.** Reported honestly rather than
approximated:
- **"Are their ads going to landing pages?"** We cannot see an ad's destination
  URL from anything we buy. `paid_traffic_leaks` covers the adjacent measurable
  fact — they run ads and the only published route in is a phone line or a form.
- **Traffic → conversion math** (*"x traffic × average conversion × price point
  = x per month"*). We have no traffic source; SimilarWeb and Semrush are paid.
  Any number here would be invented, which is the one thing this system does not
  do. The permitted money move is already in the brief: state the value of ONE
  job in their trade and let him multiply.
- **Google LSA / organic placement** — we measure the map pack only. Adding
  either is a new paid data source, not a code change.

