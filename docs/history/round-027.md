# §27 — A question, or a page — and whether the answer would be readable
Source: CLAUDE.md lines 1718-1788, moved verbatim 2026-09-02 from commit b01d952e4f95d7b69686bc2c4063ca2aa0cb7546 (branch backup/claude-md-monolith). Nothing below this line was edited.

## 27. A question, or a page — and whether the answer would be readable

Vin: *"i want to make sure ctas that are questions are better than sending
recipients to a landing page."* Every CTA this system has ever sent is a question,
on one prospect comment and no measurement, and **nothing has ever recorded which
ask produced a reply.**

Two things had to be said before building it:

- **Deliverability.** A link in a first cold email is a spam signal and this
  domain has two hard bounces in twelve sends. Mitigated as far as a link can be:
  exactly ONE link, no shortener, no tracking pixel, no redirect chain, and it
  must sit on a domain CROJungle owns. **Without `PAGE_BASE_URL` the arm cannot
  run at all** — a raw `onrender.com` link in a cold email costs more than the
  test is worth.
- **This is not one of CROJungle's landing pages.** It is a page generated from
  the lead's own audit, built from the same ranked findings the email is built
  from so it can never claim more than the email could. That is a fair test of
  link-versus-question and it is NOT a test of what a hand-built page would do.
  Reporting it as the latter would be the "unproven reported as proven" failure.

The arm is a stable hash of the lead id, never a counter: a re-composed lead that
changed arms makes the result unreadable. It is returned by the compose route,
stored on the lead, cleared on a re-research (otherwise the next send links a
stranger to the PREVIOUS audit — caught by `clientcheck`), and frozen into the
send snapshot, because a reply arrives days later and by then the lead may have
been recomposed.

**The token is letters only.** A hex token puts digits inside the one sentence
that has to survive `verifyBrainEmail`'s figure gate, which refuses any number not
tracing to a measurement.

**The page arm is also the only arm that is readable at 25 sends a day.** Replies
are rare enough that a reply-only comparison needs hundreds of sends per arm; page
visits are far more common, so this arm produces a signal in a week where the
other needs months. `pageVisits` was already a field the UI displayed and nothing
ever wrote to.

Needs a table:

```sql
create table lead_pages (
  token text primary key, company text, payload jsonb,
  visits int default 0, last_visit timestamptz,
  created_at timestamptz default now());
```

---

**The rule this session earned.** Four separate checks passed on a build with
their own fix reverted, every one for the same reason: they exercised the
function and never the CALL SITE. Booking (the homepage argument), the city
parser (the one caller), the offer measurement (the delivery line), and the
unlinked-page read (the navigation argument). A fixture supplies its own
arguments and therefore cannot see a caller.

**A check that does not assert its call site is half a check.** Needles assembled
at runtime, comment lines stripped — a literal needle finds itself, and these
comments quote the broken calls verbatim.

Two more found only by falsification: one "falsification" did not reproduce the
original defect at all (swapping a preference order that could never matter,
because one side is always a string) and proved nothing until rewritten; and the
ask-arm safety assertions could not fire in any configuration, because the two
settings were read as globals rather than taken as parameters — so the check only
ever exercised the configuration where both are off and nothing can go wrong.

**`index.html` changed, so this needs a Netlify deploy.**

---

