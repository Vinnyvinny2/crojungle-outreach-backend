# §125 — A guess is asked about twice before it is called a guess, and the tag that says so stops hiding — 2026-09-08
Written 2026-09-08 for docs/history (one file per round; CLAUDE.md carries no history). Not a moved section: verify-split.sh skips it.

## 125. A guess is asked about twice before it is called a guess, and the tag that says so stops hiding — 2026-09-08

The first live read on the Round 124 build: five leads, four named owners,
four addresses, 19 credits, finished with the tab closed. Two of the four
addresses — `wright@museplasticsurgery.com`, `dean@davisfacialsurgery.com` —
sat under "No email" on the review screen, and Vin asked why. He was right
to: on screen they looked like good addresses.

### What was found

- **The addresses were guesses, and the screen hid the word.** Both were
  inferred from the business carrying the owner's name (Round 99's eponymous
  rule, tier 3, never sent). The review row prints a grey `unverif` tag after
  the address, the cell truncates, and on an address that long the tag was the
  part that vanished. A guess read as a good address. The filter was honest;
  the row was not.
- **Davis's mail server answers, and was asked once.** The catch-all probe got
  a definite no to a random address, so the server does answer. `dean@` was
  then probed among the four likeliest patterns and came back "won't say" —
  neither a yes nor a no — which is what greylisting looks like: the server
  accepts the same question a few seconds later. Nothing asked again, and the
  address shipped as a guess the rep cannot send to.
- Muse's mail server never answered inside thirty seconds; Bose's refused the
  address outright; Bryan Garrett's address was published on their team page
  and Rudderman's was confirmed. Those four were graded right.

Vin's ruling, on being told that guesses do not reach the sequence: *"id
rather have gaurnteed ones then sending questionable emaisl"* — the send door
already refuses a guess, so nothing here loosens; this round only turns more
guesses into facts, for one verifier credit each.

### What changed

- **The second ask.** In the eponymous branch of the email engine, when the
  owner's first-name mailbox on their own domain was not refused outright and
  the verifier may be asked, the address is probed once more after three
  seconds. A yes makes it tier 2, SMTP-verified, sendable, and the domain
  remembers the pattern. A no is honoured by the existing gate (not inferred).
  "Won't say" twice leaves it the guess it is, and the log says so in those
  words. Cost: one verifier credit on an eponymous lead whose patterns did not
  resolve — a few a batch.
- **The tag first.** The review row prints `unverif ` before the address, so
  truncation takes the end of the address and never the word.
- Contract **20261007** on both sides.

### The checks

`ADDRESS ROUTE CHECK` pins the second ask by position: it must exist, and it
must sit before the guess is returned — a retry after the return is a retry
nobody sees. `clientcheck.js` pins the tag in front of the address.

FALSIFICATION_RESULTS

### Deploy

`index.html` changed, so this round needs the Netlify drag-in as well as the
merge. No SQL. Grep the next batch for `T2 SMTP-VERIFIED on the second ask`
(a guess became a fact) and `would not say twice` (it stayed one).
