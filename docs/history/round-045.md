# §45 — Five leads, read line by line — 2026-08-21
Source: CLAUDE.md lines 3220-3357, moved verbatim 2026-09-02 from commit b01d952e4f95d7b69686bc2c4063ca2aa0cb7546 (branch backup/claude-md-monolith). Nothing below this line was edited.

## 45. Five leads, read line by line — 2026-08-21

Vin ran five and sent the screen, the export and the whole log. *"we need
eveyrhting fixed at the highets level i dont want a single bug."* Every audit
completed this time — the gates from §44 held — and the log carried six defects,
three of which put something false or unusable in front of Mike.

### The last gate died on our own sentence

Two of the five: `⛔ FACT CHECK: FACT CHECK DID NOT RUN - the critique response
could not be parsed`. The payload:

```
{ "confidenceScore": 9, "flaggedClaims": [ "The pitch angle claims 'Slater &
Zurz LLP shows up above them on Google for "personal injury lawyer in
Cincinnati, OH", with 83 reviews against thei…
```

The model put a quoted phrase inside a JSON string. We have a repair pass for
exactly that, and its rule is *"a quote followed by structure is a real closing
quote"* — with a comma counted as structure. Here the inner quote after `OH` is
followed by a comma, so the string was ended there and everything after it parsed
as garbage.

**The trigger is our own sentence.** The factual spine is always shaped
`for "<the search we ran>", with N reviews`, so any critique reproducing an
`outranked_by_weaker` spine hits it — and both leads that lost their fact-check
led on that finding, which is one of only two with a real human reply behind it.

A comma cannot decide it; what comes AFTER the comma can. In real JSON the next
thing is a new key or value — a quote, a brace, a bracket, a digit, `true`,
`false`, `null`. A bare word means the comma was inside the sentence and so was
the quote. `CRITIQUE JSON CHECK` runs the live payload.

### "Delivery is the problem" on four of five, word for word

The one-thing block came back **THROUGHPUT** on four leads with an identical
paragraph — the generic-audit complaint that created that section in the first
place. It is also the most commercially consequential sentence we write: it tells
Mike **not** to sell this business more leads, and it is tested FIRST, above every
other layer.

The test was `if (opsPainCount >= 2)`, and `opsPainCount` was
`publicPainSignals.length` — the number of mined review themes **of any kind**.

Twenty lines away, a correctly filtered version of the same idea already existed
and was being used for a log line nobody acts on. Two hand-kept notions of one
thing, and the consequential one read the wrong one. On Thrive Dental the two
themes were *aggressive upselling* and *missed pre-appointment confirmations*: the
first is a sales-practice problem, not a business drowning in work, and it was
counted as evidence of one.

It is a SHARE question too. Jones Kahan's evidence was **4 mentions in 150
reviews** — 2.7% — under a sentence claiming their customers describe them
struggling to keep up. One shared reading now, `readOperationalPain`, and the bar
is both: at least two DELIVERY themes, and enough people saying it to be a pattern
in the record rather than a pair of bad days. **The measurement travels in the
sentence**, so four leads can no longer read identically and Mike can see what the
claim rests on. All three leads that wrongly got it are refused; a genuine case —
15 complaints across 40 reviews — still binds.

### An address that cannot exist, on a call sheet

Jones Kahan's sheet printed the contact as:

```
%20mailclerk@jklawoffices.com
```

Their page carries `<a href="mailto:%20mailclerk@…">`. `%20` is a URL-encoded
space and none of the three mailto scanners decoded it — and the strict address
pattern does not save you either, because `%` and digits are both legal in a local
part, so `%20mailclerk` IS syntactically an address.

A hard bounce is charged to the sending **domain**, and this project has two
bounces in twelve sends on one mailbox. One decoder now, used by all three
scanners. `MAILTO ADDRESS CHECK`, and it caught its own first version doing
`+` → space: that rule belongs to form-encoded query strings, and in a mailto a
plus is literal, so `bob.smith+jobs@example.com` was being rewritten into
`jobs@example.com` — a real address turned into somebody else's, which is worse
than dropping it. Found by running the function, not by reading it.

### "Do not say", full of true sentences

Two of five sheets told Mike not to say something the checker had just confirmed
was TRUE:

> Pitch angle states '…with 337 reviews against their 379' — **this is correct per
> measured evidence, but** the phrasing 'shows up above them' could imply recency
> or activity comparison, which is not measured.

That is a note about connotation, not a claim a prospect can disprove, and
"Do not say" is the section that stops a false sentence being read down a phone.
Filling it with true ones is how an operator learns to skip it — the same cost
this file records at the CTA precaution that fired on nearly every lead. Cleared
only when the entry AFFIRMS the claim and objects to wording alone, and never when
the critical pattern matches: *"the claim is correct but the number is wrong"* is
not a wording note.

### Two names for the owner on one sheet

Thrive Dental's header said **Nathan Coughlin (no title found)** — a name the
brain read off their pages because the resolver found nobody. The narrative said
**"The owner, Dr. Shen, personally replies to nearly every review"** — a name the
brain read off the review replies. Two model-derived names, two sources, one
sheet, and Mike has to ask for one of them.

Neither is provably wrong, so picking one would be inventing certainty. The sheet
says so instead. A first name against a full name shares a word and is not a
conflict, or every sheet would carry the caution.

### And a heading that claimed pages we never read

Three of the five audits open with *"We never read a single page of their website
on this run"* and then carry a section headed **"What we found by reading their
pages"**. The findings were real — §8 deliberately put the mined review text into
the corpus those are verified against, because a review-derived finding checked
against web pages it can never appear on is a category error. The heading never
caught up. It says **"in their own words"** now, which is true of both.

### What the falsification runs found in the checks themselves

- **A falsification that did not reproduce the defect.** Reverting the JSON rule
  by putting the comma back in the first test changed nothing, because the new
  look-past-the-comma block still ran and recomputed the answer. Proving a check
  works requires reproducing the ORIGINAL defect, not editing a line near it.
- **An empty part is not a split.** The throughput assertion searched for the old
  condition using `_needle(x, '')` — joining to the whole literal, so the check's
  own line contained the string it was hunting and it failed a correct build. The
  eighth recorded instance of a needle finding itself.
- **Counting call sites was wrong twice over.** The mailto assertion counted
  parenthesised calls; the definition does not contain one, and one scanner passes
  the function by REFERENCE inside a `.map`. It reported two of three and failed a
  correct build. Each scanner is asserted by name now.

**`index.html` changed, so this needs a Netlify deploy.**
---

