# §19 — One lead was served another lead's audit — FIXED 2026-08-20, the worst bug this system has had
Source: CLAUDE.md lines 1043-1081, moved verbatim 2026-09-02 from commit b01d952e4f95d7b69686bc2c4063ca2aa0cb7546 (branch backup/claude-md-monolith). Nothing below this line was edited.

## 19. One lead was served another lead's audit — FIXED 2026-08-20, the worst bug this system has had

Donna Krummen, a Cincinnati plastic surgeon, received an audit asserting **"176
reviews at 4.8 and #3 of 20 in Indianapolis"**, a homepage that **"promises
upfront pricing and no hidden fees"**, a Google Ads conversion tag **"confirmed
on your site"**, and John Peters Roofing's pattern sentence spliced verbatim
into her outgoing email. Every one of those is John Peters Roofing — the lead
that ran three minutes earlier. Her own fact-checker caught it ("it was written
about a different prospect or a different market"), but the Approve button sat
under that verdict, enabled.

**The cause was the audit cache's key.** It hashed "the evidence text", and the
variable feeding it took the FIRST text block of the request — which is the
constant image caption, *"IMAGE 1 — THE HOMEPAGE, rendered full page, top to
bottom."* The real evidence rides in a later block. So **every lead with a
homepage render hashed to the same key**, and the cache became a machine for
handing each lead the audit of whoever wrote first. The BRAIN INPUT meter read
the same variable, which is why it priced a 28,000-token call as "evidence text
15 tok" — the same wrong variable, caught by nobody because the meter and the
key agreed with each other.

Three walls now, each falsified by reverting it:

- **The key covers everything the model sees** — every text block plus a
  fingerprint of every image.
- **The cache entry remembers which company it was written for**, and a read by
  any other company is refused by name. Even a future key bug cannot cross two
  businesses again.
- **Under 2,000 characters of keyed text disqualifies the cache entirely** —
  the real evidence block alone is tens of thousands, so a small key means the
  assembly upstream is broken.

`AUDIT CACHE ISOLATION CHECK` runs two synthetic leads through the real key and
the real cache at boot. Two smaller cross-lead leaks found in the same sweep:
the leadership-page text length was a single module-level number (now keyed by
company), and a CRITICAL fact-check verdict now **blocks the Approve button**
in the client instead of decorating it — the fabricated audit above was one
click from Send.

