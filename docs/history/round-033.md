# §33 — The half of deliverability that needs no replies
Source: CLAUDE.md lines 2104-2151, moved verbatim 2026-09-02 from commit b01d952e4f95d7b69686bc2c4063ca2aa0cb7546 (branch backup/claude-md-monolith). Nothing below this line was edited.

## 33. The half of deliverability that needs no replies

PART 4 §3 has carried "deliverability is unproven" for weeks and treated it as
something only sending can answer. Most of it is. Whether the sending domain is
CONFIGURED to be trusted is a DNS lookup — free, definitive, and never once
checked.

A domain with no SPF record, or one ending `+all`, is the ordinary reason cold
mail lands in spam, and it is invisible from inside Hunter, which reports the send
as successful either way.

- **SPF and DMARC** are definitive and parsed here, including the split-string
  form DNS returns for anything over 255 characters. A long SPF is the normal case
  for a domain using more than one sender, and reading only the first chunk would
  misreport a strict record.
- **MX matters too**: a sending domain with no MX cannot RECEIVE the reply this
  whole system exists to earn.
- **DKIM is not checkable** without the selector, which is chosen by whoever set
  the mailbox up. Guessing selectors and reporting "no DKIM" on a miss would be a
  false absence about the most important of the three, so it says it did not look.
- **A resolver failure is never a missing record.** Reporting "no SPF" because a
  lookup timed out would be the false-absence failure aimed at the one setting
  that decides whether anything arrives at all.

**Was unproven against a live domain. RUN FOR REAL 2026-08-21 and it came back
clean.** `crojungleteam.com`: SPF present (`v=spf1 include:_spf.google.com ~all`,
soft fail, normal and fine), DMARC present at `p=quarantine`, MX present so the
domain can RECEIVE the reply this whole system exists to earn. No blockers, no
warnings. DKIM correctly reported as not checked rather than guessed.

That matters beyond one lookup: PART 4 §3 has carried "deliverability is unproven"
for weeks as though the whole of it needed real sends to answer. Half of it never
did, and that half is now measured and healthy. What remains unproven is the part
only sending can settle — inbox placement, reputation at volume, and whether one
mailbox at 25 a day holds. The two hard bounces in twelve sends are still the only
send evidence this project has.

DNS is blocked from the BUILD environment, so the boot check still says the lookup
has never run there and only the parsing is exercised. That wording stays accurate
and should not be loosened on the strength of one live call from Render.

**And a fifth self-matching needle.** The assertion guarding the resolver-failure
branch was written as a literal, sat in the check's own body, and passed on a
build with the guard removed. Assembled at runtime now. This trap has now been
recorded five times in one session.

---

