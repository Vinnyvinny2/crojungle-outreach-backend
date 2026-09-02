# §49 — What the refuters found — 2026-08-22, the round after the tier build
Source: CLAUDE.md lines 3846-3946, moved verbatim 2026-09-02 from commit b01d952e4f95d7b69686bc2c4063ca2aa0cb7546 (branch backup/claude-md-monolith). Nothing below this line was edited.

## 49. What the refuters found — 2026-08-22, the round after the tier build

Seven adversarial agents were pointed at the tier build's own mechanisms with
instructions to break them, and a completeness critic at everything they were
not pointed at. Twenty-nine findings survived into code changes; every fix was
falsified individually (twenty reverts this round, each red alone), and the
whole sweep held to one discipline: verify the refuter's claim against the live
source before touching anything.

**The truth gate had four ways to verify a fabrication, all executed.** The
quote canonicaliser's catch-all DELETED any `&Word;` entity, so
"Insured&Bonded; crews" normalised to "insured crews" — two never-adjacent
words made consecutive, and a quote of a page that does not exist verified. The
corpus was one soup, so a word run could START on a page and FINISH inside a
review theme ("Call us today, no one ever calls back" assembled itself across
the join). The short-quote floor accepted any generic 4-gram, so an invented
"Claim your free estimate today" rode "your free estimate today" — trade-site
filler — into a verified quote. And matching was bare substring, so
"rate the craftsmanship" verified inside "celebRATE THE CRAFTSMANSHIP". Fixed
at the root: unknown entities pass through (deletion can join, a space cannot),
the corpus is SEGMENTS and a match must live inside one, the short path may
shed filler words but never content words, and every match is word-aligned.
Two tightenings against real quotes were paired with two loosenings the same
sweep found: a letter entity now DECODES (`Jos&eacute;` was still becoming
"jos" — the José bug through a second door), and the mining model's PARAPHRASE
left the verify corpus (only the verbatim review snippet remains — "the words
are theirs" must not verify against another model's words).

**The business-model filter licensed evidence that merely existed.** A
hallucinated B2B claim carrying the real quote "for Dallas homeowners. Family
owned since 1998" verified — evidence stating the OPPOSITE of the model it
licensed — and silenced twelve rungs including reply-proven
`outranked_by_weaker`. The quote must now contain a term from a small declared
vocabulary for the claimed model; a real institutional quote behind a model
preamble also now verifies (the window slides instead of anchoring at the
front).

**The boot gate had three doors around it.** Express routes are
case-insensitive and the gate was not, so `POST /Api/research` walked past it
(verified against the installed Express); the gate and /healthz answer before
the CORS middleware, so the browser saw an opaque "Failed to fetch" instead of
the retry JSON; and an async check's late red — BATCH MEMORY's leaked-slot
branch fires at 60s, ~40s AFTER the verdict settles — was invisible: GREEN,
/healthz 200, CI green, failure on screen. The path is lowercased, the gate
carries its own CORS headers, and every async check holds the verdict open
(bootHold/bootRelease) until it has reported, with the 180s cap still the loud
backstop. The client retries a 503 {booting:true} submit for up to a minute —
a restarting server is a delay, not a failure — and the cron route no longer
reports a boot-window refusal as a successful empty discovery.

**Three spending doors had no gate.** `/api/scrape` spent Firecrawl through no
meter and no ceiling (a live client path); `/api/claude` and
`/api/linkedin-drafts` were metered but never gated, so a spent model budget
kept spending a nickel a press; and Find's for-sale lane spends Firecrawl and
a Haiku call that its Places-only admission gate never checked. All four now
refuse (or skip, with the reason logged) at the same ceilings, the sync
research route also fails fast on the credit latch via the READ-ONLY predicate
(refusing must not consume the recovery probe), and two boot checks that
charged phantom probe spend to the real day ledger now restore what they
touched.

**The harness lied in three small ways.** servercheck's review-count fixture
used the same number in the search row and Place Details, so the authority
assertion could not detect the regression its message names (the search row
now says 999 against the authority's 4); scenario C's "a dead token reports
null" was vacuously true because reviewsRead was never in the response at all
— instance twenty-one of computed-but-not-passed, found by asserting the
OPPOSITE on the golden lead, and `ownerReplyCount` was dark the same way; and
the fake ignored every request header, so the one header whose absence
silently deletes measurements (X-Goog-FieldMask) is now asserted present.
FAKE_UPSTREAM — which redirects every API call, keys included — now refuses to
boot when Render's own environment is visible, mechanically, because
"never set it in production" is an instruction and instructional guards do not
hold.

**And the send path keeps a durable record.** A 25-lead send is one
synchronous HTTP request whose response is the only copy of "what went" the
client gets, and the in-memory dedupe maps die with the process. One
fire-and-forget row per ACCEPTED recipient now lands in `send_log`, so a lost
response or a restart no longer erases who was sent what. Needs a table:

```sql
create table send_log (
  id bigserial primary key, lead_id text, company text, email text,
  sequence_id text, at timestamptz default now());
```

A schema probe runs once after the verdict settles and names every expected
table or column that does not answer, with sbRest's own per-table diagnosis
above it — so a missing table is discovered at boot, not at its moment of
first use.

**Known and deliberately NOT rebuilt tonight** (the launch-sweep rule: no new
features the night before calling starts): the send route still wants the job
queue research got — the cap holds it to 25 and the send_log makes a lost
response recoverable, and that is the mitigation, not the fix. The batch
client's 30-minute job TTL and the operations-vs-pacing tension on the kill
clock are documented open items, not silent ones.

---

