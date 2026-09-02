# §90 — The Find tab got its own artefact: fifty leads, ranked, with a name, an address and a number — 2026-08-28
Source: CLAUDE.md lines 7801-7999, moved verbatim 2026-09-02 from commit b01d952e4f95d7b69686bc2c4063ca2aa0cb7546 (branch backup/claude-md-monolith). Nothing below this line was edited.

## 90. The Find tab got its own artefact: fifty leads, ranked, with a name, an address and a number — 2026-08-28

Vin, after a week of cost questions and one clear decision: *"i literally need to
just be able to export find leads... i hit a button within the find tab section
and it grabs the decision maker the phone number the email and that is it then
it gives it a ranking out of 100 of their icp... They're already paying for ads
y/n. Team page headcount. They're hiring for marketing y/n. thats literally all i
need and i want it separate from the research tab so nothing gets confused code
wise."* And the constraint: **50 a day, 5 days a week, under $100 a month.**

This is a different artefact from the audit, bought by a different button, in a
different tab. The Research tab audits. The Find tab lists.

### The reframe that produced it, and the correction I owed him

Three sessions of my own advice pointed at cutting the owner and email work to
save money. He rejected it, and he was right: *"i like that we are certain about
who the owner is and certain about the email and phone number becuase our guy is
going to be email and calling."* The certainty is what the rep needs. What was
actually wrong was not the work, it was that **the cheapest way of doing it had
never been tried.**

### The three rules every line rests on

- **THE FREE READ IS THE DOOR; FIRECRAWL IS THE FALLBACK.** A plain HTTP GET
  returns the full markup of most small trade sites, and this file has had one
  since `checkBuiltWith` was written — it was simply never used to save a
  credit. `findPlainFetch` reads the homepage for nothing; the site's own
  navigation names its contact, team and careers pages, so `sameHostLinks` plus
  `rankUrlsByIntent` replaces the paid sitemap call outright. Firecrawl is asked
  ONLY when a site refuses a plain fetch, and then with `shot:false`, because a
  contact list never looks at a picture and a render is the most expensive thing
  on that menu.
- **NOTHING HERE IS A SECOND IMPLEMENTATION.** The owner comes from the same
  `findOwnerViaBrain` the audit uses — handed pages instead of buying them, so
  the roster parse, the prompt and the anti-hallucination gate are byte for byte
  the ones that ship. The address comes from the same `findEmailFireproof`, which
  gained a `freePages` pass that runs the SAME extractor with the SAME
  same-domain strictness before a credit can move. Ad markers come from
  `AD_TAG_SIGNATURES`, the roster from `parseTeamRoster`, hiring dates from
  `jobPostingsFromHtml`, and whether a role is a marketing role from
  `signalsFromTitles` — the one function that owns that question.
- **AN UNMEASURED SIGNAL LEAVES THE DENOMINATOR.** It never scores zero. A
  business whose site we could not read is not a business with no team, no ads
  and no hiring, and a score that says so is the recorded unmeasured-as-zero
  failure pointed at a number a rep repeats out loud. The row says how many of
  the five signals stood behind the number.

### The score, and the thing it deliberately does NOT measure

Five declared terms: how many people they publish (35), whether they already pay
for advertising (25), whether they are hiring for marketing (20), what their
review volume shows (12), and where their rating sits (8) — the last using the
4.2-4.85 band, still the one filter in this system with real evidence behind it.

**HONEST SHAPE, and it is the most important sentence here: the ICP is defined
as $800k-$15M of revenue and NOTHING in this measures revenue.** Revenue for a
private local business is not free. The two closest free proxies are how many
people they publish on their own team page and how much business their review
record shows, and both are used as proxies and labelled as proxies everywhere
they render. The team count in particular is a FLOOR, never a headcount — a firm
with forty staff may publish four — and the CSV column says so on its face.

What the audit path had before this was worse and nobody had looked: `sizeGated`
and `looksLikeEnterpriseByName` run only inside `/api/discover`, the paid sizing
step there explicitly excludes Places leads (`!isPlacesLead(c)`), and Places is
92.5% of discovery. `verifiedRevenue` only ever arrives from Companies API
enrichment whose lookup is gated on `verifiedEmployees >= 8`. So for
substantially every lead in the pipeline the ICP gate was a name pattern plus a
rating band, and the revenue range was never verified at all.

### The file

The first CSV this repo has written for a person to work from. Twenty columns,
ranked highest first, and an UNSCORED lead sorts LAST rather than as a zero. The
email's TIER is its own column and its confidence is read from that tier, never
from prose that happens to contain the word "verified": a published address, an
SMTP confirmation, a learned pattern and an outright guess are four different
risks and the rep about to press send has to be able to tell them apart. Every
cell is neutralised against formula injection, because a business name scraped
off an arbitrary web page and opened in Excel by a junior rep is the exact shape
that executes.

### The screen

One panel above the results, in the tab where the money is spent: what is on
screen, what has been read, how many have an email; one button; and while a run
is live, a progress bar, the leads in flight by name, a one-second clock, the
run's own Firecrawl and model spend, and Stop. Every lead is written through to
the queue as it finishes, so a Stop or a closed tab keeps everything already paid
for. Each card gains a three-line strip — who, how to reach them, and the three
signals — and colour marks a stop and nothing else, so the only red on it is an
address the send gate refused.

Two smaller truths on the same screen: the existing discovery number is labelled
**Find score** so it cannot be confused with the new fit score beside it, and the
header no longer claims a weekly auto-scan. There is none — the code that would
have run it says so in its own comment — and a false line on a screen costs what
a false line on a sheet costs.

### The cost, stated as an estimate because that is what it is

At 1,100 leads a month: Firecrawl on the smallest paid tier, Anthropic on Haiku
only (the two expensive Sonnet calls in the audit path never run), DataForSEO
untouched by this route, and one Places call per lead inside the free allowance.
The arithmetic lands near **$60 a month**, and the whole of it rests on the free
read actually being free.

**That is why the headline assertion is an end-to-end one.** `servercheck.js`
drives the real route over a fake network and asserts that a site answering a
plain fetch costs **ZERO** Firecrawl calls, that all three signals are measured,
that the owner and the address come off pages nobody paid for, and that a site
which refuses a plain fetch — and only then — falls back and spends. A boot
fixture could never have proved any of that: it passes its own arguments and
cannot see what the route buys.

**HONEST SHAPE: no contact read has run against a live business.** The bound is
the guards, not a measurement. The first real run answers it outright — the
`FIND CONTACT` line reports the credits and the dollars that lead actually cost.

### The first live press: a paused server retired a hundred leads in two seconds

Vin, minutes after the deploy: *"it loaded really fast like impossibly fast for
it to get all the info we needed for 50 leads"*, then *"i ran it when the derve
was paused now i cnat get it to do anything."*

He read it exactly right. Render was paused, every request failed the instant it
was made, and **the failure paths stamped `contactAt` anyway** — the same field
the panel used to mean "this lead has been read". So a hundred leads were retired
as done, with nothing on them, and the button could never pick them up again.
The Render log showed nothing because no request ever reached the server.

Three defects, one root: **a stamp that says "done" was being written by
something that had not done it.**

- `contactReadOk` is now the only thing that means a business was read, it is
  written in ONE place — the function that parses a real server answer — and
  every consumer keys on it. The hundred poisoned leads become unread again on
  their own; nothing had to be repaired by hand.
- A failure records itself as a failure (`contactFailedAt` plus the reason) and
  the panel says so in the one colour this screen reserves for a stop, naming
  the cause, because "it did nothing" with no reason attached is what sent an
  operator to the Render logs looking for requests that were never made.
- **Three transport failures in a row stop the run.** A dead server is one fact
  about the server, said once, not a hundred instant per-lead failures dressed
  as a finished run. And a **Clear N read** button exists for the case where a
  successful read needs redoing.

**The falsification that mattered came back GREEN first.** The revert that
reproduces the exact live defect — putting the `contactAt` stamp back on both
failure branches — passed, because every assertion written that hour keys on the
new read flag, so the reverted branches merely wrote a field nothing consulted
any more. Green for the wrong reason is not a pass. The failure branches are now
asserted *directly*: both must record the failure, and neither may write the read
timestamp. That revert then went red, and so did the other four.


### What was deliberately NOT done

- **No second route.** The mode inherits the boot-window gate, the day ceilings,
  the credit latch, the preflight and a concurrency ceiling of its own.
  `/api/test-contact-engine` is the standing proof of what a second route costs.
- **No revenue estimate.** Deriving a dollar band from review count and printing
  it as a measurement is the fabrication class this file exists to prevent. The
  proxies are named as proxies and the revenue column does not exist.
- **No change to the audit path.** The one shared function that moved —
  `firecrawlScrape` — keeps its render by default, and the boot check asserts
  that a caller who asks for nothing is still charged for the picture it is still
  receiving.

### What the falsification runs found

Twenty-four reverts, each applied ALONE against a green baseline: fourteen boot,
eight client, and two driven end to end through servercheck. **Twenty-two went
red on their own named assertion on the first pass. Two came back STILL GREEN,
and both were fixtures that measured nothing:**

- The marketing-hire fixture used the title "Marketing Manager", which any regex
  containing the word "market" also catches — so replacing the shared
  `signalsFromTitles` with a hand-rolled classifier left the check green. It is
  "SEO Specialist" now: a marketing role with no "market" in it, which is exactly
  the gap a second copy of that rule opens.
- The careers-page fixture used a LONG sentence, which the six-word title cap
  already refuses — so removing the sentence-punctuation rule changed nothing.
  It is a four-word sentence now, which only that rule can refuse.

And the harness lied once before it proved anything: the revert helper took a
third positional argument that most reverts did not pass, so twenty-three of
twenty-four reported **NO VERDICT (the revert did not apply)** on the first run.
NO VERDICT is not a pass, the harness said so rather than reporting a colour, and
the whole pass was re-run once it could actually apply.

**`index.html` changed, so this needs a Netlify deploy**, and the contract is
**20260913** on both sides — without the new server the button answers 404, and a
stale page says so by number.


---

