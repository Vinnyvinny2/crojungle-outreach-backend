# §92 — The queue was mostly not our leads, and the list goes to a sheet — 2026-08-28
Source: CLAUDE.md lines 12000-12121, moved verbatim 2026-09-02 from commit b01d952e4f95d7b69686bc2c4063ca2aa0cb7546 (branch backup/claude-md-monolith). Nothing below this line was edited.

## 92. The queue was mostly not our leads, and the list goes to a sheet — 2026-08-28

Vin, with the screen and the whole log: *"still some bugs and can we hook it up
so it just exports to a google sheet?"*

He pressed for ten. What came back was Coca-Cola Bottling, Penn Medicine, Lennar
Homes, Securitas, Goodyear, SkillPath, Penske Truck Rental and a commercial
property listing called **"Vacant Former Dentist | Value-Add Investment"**. Two
of the ten were businesses we sell to.

### The name filter was never going to fix this

§91 added `looksLikeEnterpriseByName` to this route and recorded honestly that it
caught none of the six brands that cost money the night before. This run proved
the same thing again: it caught Penske and nothing else, because "SkillPath" and
"Penske Truck Rental" read exactly like local businesses by name.

**What separates them is not their name, it is where they came from.** A Places
lead has a Google listing by construction: a local address, a star rating, a
review count, somebody who claimed it. The job-board, funding and for-sale lanes
have none of that, and every wasted read in that run came from them. So the
contact panel scopes on the MEASUREMENT — `placeId` — rather than on a guess
about the words, and it says how many it is hiding and why. It defaults on, and
it is one tick box to turn off.

### A verdict is permanent; a failure is not

These were one branch, and the panel said the consequence out loud: *"1 lead
could not be read: Penske Truck Rental reads as an institution... They are still
counted as unread, so the button above picks them up again."*

Retrying everything is right for a server that is down and wrong for a business
that is not a lead. Penske was refused correctly, at zero cost, and would have
been re-asked on every press for the life of that queue while the unread count
never moved. The server has returned `notIcp: true` for exactly this since the
day the filter landed, and the client ignored it. Now `notIcp` retires the lead
with its own line, its own neutral colour and its own **Put them back** button;
anything else — a dead server, a bad URL, a busy moment — stays unread and comes
back, which is what stops a paused server retiring a hundred leads.

**And a decision is not a failure.** A deliberate zero-cost refusal was being
rendered in the same red box as an unreachable server, under the words "could not
be read". Red marks a stop on this screen and nothing else.

### The same sentence, twice on one panel

The Penske refusal rendered in the failed box AND as a toast, because the toast
fired on every non-ok answer. A toast is for a fact about the RUN — no key, the
day ceiling, a dead server. A per-lead verdict already has a home.

### "1 of 3 lookup stages purchased" on a lead that spent nothing

Printed on Penn Medicine, Coca-Cola, Lennar and Securitas, whose own spend lines
read `0 Firecrawl credit(s), $0.0000 of model`. Stage 1 is the FREE stage — it
reads pages somebody else already fetched — so the word "purchased" was false on
every lead that stopped there, which is most of them. A message that overstates
what was spent costs exactly what one that understates it costs; this file
records the same class at the SMTP timeout and at the Supabase table that
existed.

### The contact list, straight into a Google Sheet

A **webhook**, not a Google integration, for the reason §35 already gave when it
chose the same shape for the CRM: a native integration means OAuth or a
service-account key, a credential to manage and a new dependency, for a feature
whose whole job is "put these rows in that tab". An Apps Script bound to his own
sheet needs none of it — eight lines pasted into his own spreadsheet, deployed
once, and the URL is a Settings field he can repoint without a deploy.

- **The sheet and the CSV are ONE list in two destinations.** `findSheetPayload`
  reads the same `findContactRows` and the same `FIND_CSV_COLUMNS`, so the header
  text, the column order and the ranking cannot drift. A second row-shaper for
  the sheet is the two-hand-kept-copies disease, and the copy that rots is always
  the one nobody opens. `clientcheck` executes both and asserts they agree.
- **The server forwards it, not the browser.** An Apps Script web app answers
  from `script.googleusercontent.com` after a redirect, and a browser POST there
  ends in `no-cors` — which cannot read the response, so "did the rows land"
  becomes unanswerable. A silent success is the failure class this file records
  most.
- **A 200 is not a success.** A deployment set to "Only myself" makes Google
  serve its sign-in page, which is a 200 with HTML in it. An answer that is not
  the JSON the script returns is reported as the misconfiguration it is, by name,
  with the fix.
- **The destination is bounded.** This is the one endpoint whose target comes
  from the request body, which on a public server is an open relay for whatever
  is in those rows. https only, and only the two hosts Apps Script answers on.
  `SHEET EXPORT URL CHECK` executes it: a lookalike host with the real one as a
  prefix, the cloud metadata address, a local address on this very server, plain
  http and the spreadsheet's own edit URL are all refused, and two real web-app
  URLs are accepted — because a bound tightened until the feature cannot work is
  the more expensive failure.
- **A business already in the sheet is not added twice.** The script dedupes on
  the company column, and `clientcheck` fails if the company ever stops being
  column 3 — the script would then silently dedupe on the wrong field.

### What was deliberately NOT done

- **No revenue estimate, still.** §90's rule holds: the team count is a floor and
  says so, and there is no dollar band anywhere.
- **No widening of the enterprise name filter.** "Medicine" would catch every
  family-medicine practice in the ICP, which is §14's dermatology failure exactly.
  The scope filter is the honest mechanism; the name filter stays narrow.
- **No second export route.** The sheet send is a thin forward that inherits the
  boot-window gate, and it costs nothing, so it takes no day ledger.

**268 boot checks green.** Six falsifications, each reverted alone against a
green baseline and each red on its own named assertion. The unread assertion in
`clientcheck` went correctly red on the new population and was re-aimed rather
than worked around, then strengthened: the verdict flag now has to be written
from the server's answer and from exactly one place.

**HONEST SHAPE: the sheet export has never run against a live Apps Script.** The
URL bound, the payload shape and the refusal paths are executed at boot and in
`clientcheck`; whether Google's deployment answers the way the script expects is
settled by the first real press, and the button reports the row count it was
told rather than assuming.

**`index.html` changed, so this needs a Netlify deploy**, and the contract is
**20260914** on both sides.

---

