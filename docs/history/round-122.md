# Round 122 — the screen becomes the run you just did, and stops binning what we paid for

**2026-09-04. Client (index.html); server.js moves by one constant. Contract 20261006.**

## What Vin said

> *"the queue at the top of the UI doesnt update with the ones we read it still says
> alot in the queue. also theres a million diffrent numebrs in this contact section...
> when it was laoding it said 17 owners found then the csv shows 15. this section needs
> to be so simple a 5 year old can understand and naviaget it"*

Three layouts were put to him and he refused all three — *"I don't like any of those,
think more"*, *"no clue, think this out"*, *"think design wise"* — and then said the
sentence that decided the round:

> *"when I do a run it needs to be easy to export the ones I just did. So I know the run
> I just did I can export those. **I don't really care to go back to ones I already read
> I have a sheet to do that.** That's the problem — I don't ever go back to re-read ones,
> I just run a bunch then dump them into excel, rinse and repeat."*

His loop is **press Read → export exactly those → paste into Excel → repeat.** The panel
was built around the queue. That is the whole diagnosis.

The email verifier was explicitly out of scope this round ("we are having tech issues").

## What was counted

**45 numbers on that panel**, and they did not all measure the same population. The four
tab counts and `_cUnread` / `_cNoRead` read `_cShown` (the whole queue); the lanes, the
CSV, the result line, `_cRead`, `_cFailed` and `_cNotFit` read `_scoped` (the run *or*
the queue). So "253 not read" sat beside "N could not be read" counting two different
pools, and `Call list (15 of 336)` was the panel printing both populations because it
could not choose — while reading as a fraction, 15 *out of* 336, when it meant "15 this
run, 336 in the queue."

The lens that chose between them, `contactScope`, **defaulted to the queue and was
persisted across sessions**, with its only control three bands *below* the numbers it
governed. So `Download CSV (N)` could silently mean all 380 read leads instead of the 15
just run — which is exactly how rows already pasted into Excel get pasted in again.

## The four defects

**1. "Not read 253" was honest, and that is why it was useless.** It shrinks by exactly
the number of successful reads. It never *looks* like it does because it is queue-wide
and a Find press prepends ~120 fresh unread leads while a read press clears 25. Find
refills it faster than reading drains it. Nothing was miscounted; it was the wrong number
to put at the top of the screen.

**2. The cloud restore could un-read a lead, and erase what was already exported.** The
Supabase merge let the cloud row win every name collision outright, on the reasoning that
*"its score is the newer one"* — but a score is not read state. A queue row pushed to
Supabase **before** a lead was read carries no contact keys at all, and one pushed by a
**failed** read carries `contactReadOk: false`. Either overwrote a local row that had been
read: the lead returned to "Not read" with the Firecrawl credits already spent, and its
`exportedAt` — the only record of what is in Vin's spreadsheet — went with it. `read` is
monotonic now (`mergeQueueRow`), in both directions, so a read banked on another machine
also lands here instead of being paid for twice.

An early return made it worse: `merged.length === local.length && _fresh === 0` compared
only NAMES, so whenever the cloud held the same businesses with different fields — the
entire point of restoring it — it returned before applying them.

**3. The durable queue was deleted and rewritten 25 times a run, and was momentarily
empty each time.** `saveDiscovered` fired a fire-and-forget `DELETE` of the whole
`discovered_queue` followed by a `POST` of all ~650 rows, and `one()` calls it **once per
lead** from a pool of six. No ordering: a late `DELETE` landing after an earlier `POST`
drops rows, and a closed tab between a DELETE and its POST takes the whole queue. The
`DELETE` is gone (the `POST` was already an upsert on the id, so nothing needed it) and
the push is debounced to one write per batch, flushed when the run ends.

**4. The queue cap threw away the leads we paid for, first.**
`[...newOnes, ...existing].slice(0, FIND_QUEUE_MAX)` — a Find press **prepends**, and the
slice keeps the **head**, so everything discarded came off the tail: the oldest rows,
which are the read ones. A lead that cost ~4.7 credits was binned to make room for one
that cost nothing. `capQueue` ranks instead of slicing: an un-exported call-lane lead is
kept last of all, then any read lead, then a settled verdict, then unread — which is free
to find again.

## "17 owners found" then "CSV 15"

Both numbers were right, and that was the problem. The loading bar counted
`contactRun.withOwner` — *the ladder found a name*. The file is `exportableContact` —
*read, **and** in the call lane, **and** something to dial or write to*. An owner in the
email lane, under the floor, at a product company or on a TheirStack lead is a name that
cannot go on a call sheet.

**Owners-found is not a number Vin can export**, so it is gone. The counter is
`readyToCall`, incremented with `exportableContact`, so the number during the run, the
number when it finishes, the number on the download button and the row count in the file
are one number and cannot disagree.

One trap on the way: `exportableContact` calls `contactTabOf`, which refuses a row with
no `name` — and `fields` is the server's answer, which carries none. Asked about `fields`
directly the counter would have sat at zero all run. It is asked about the named row.

## The design

The panel opens with the run, not the queue:

```
YOUR LAST RUN                                      read 25 of 27

     15   ready to call
          all 15 are new — you have not exported these

  [ Download these 15 ]      [ Send these 15 to the Sheet ]

  also from this run: 3 email only · 7 with no name yet
  what happened in this run ▸
  ─────────────────────────────────────────────────────────
  253 waiting to be read · 380 read in total · [47 never exported]
```

While the press runs, the same block in the same place says `11 ready to call so far`.

- **The run is the view**, and no toggle decides it. `contactView` is not persisted.
- **The buttons name their own cargo** — `Download these 15` cannot mean the queue.
- **The panel says what is already in Excel**, from the `exportedAt` stamp that has been
  recorded since Vin said *"i have no clue which ones ive already exported and which i
  dont"* and then shown in one cell of a 44-column file.
- **`47 never exported`** is the one reason to leave the run view: without it a second
  press before an export buries the first run for good.
- **A zero is not drawn.** `Nothing to read 0` and `No lane (0 of 7)` are gone.
- **The thirty-number sentence is not deleted** — `findTallyLine` still builds it over
  the same population, one click away under *what happened in this run*, beside the number
  it explains. The line that answers "why 15 and not 17" went with it.

**8 numbers on the panel; 3 in the block Vin looks at.**

Deliberately kept: the four tabs (they are the navigation to the Read button, and their
counts do reconcile) and the lane buttons. What went was the second population, not the
structure.

## Checks

`clientcheck.js` gained an executed block — `mergeQueueRow`, `queueKeepRank` and
`capQueue` are lifted and run against real shapes, not read: the cloud-before-the-read
row, a read banked on another machine, a failed read arriving from the cloud, and a cap
that must keep the paid lead when three free ones are prepended. The scope assertions that
pinned the deleted lens were rewritten to pin the new rule, not relaxed.

**Falsified: 14 reverts, 14 red on their own named assertion, restored byte-for-byte.**

Two stayed green first time and both were real findings, not noise:

- the harness grepped the wrong assertion's text for the merge block (the block *is*
  pinned — by the failed-read case);
- **nothing asserted that `runDiscover` actually calls `capQueue`.** The function was
  executed and correct while its one call site was unpinned — "a check that does not
  assert its call site is half a check", from `check-writing-traps`. Reverting that line
  alone left every `capQueue` assertion green. Two call-site needles were added, for the
  Find press and for the durable Supabase copy.

`bash ci-gates.sh`: all stages green, `BOOT VERDICT: GREEN — 280 checks passed`.

## Handover

**Almost none of this is live on merge.** `server.js` moves by one constant so Render
redeploys and the contract matches, but every visible change is `index.html`, which
**deploys to Netlify by hand**. Vin already owed a drag-in for 20261005 (Round 120); this
supersedes it and **one drag-in after this merge covers both**. Until then the browser
keeps the old panel and the server warns the client is stale.

Nothing new for Supabase — `discovered_queue`'s schema is unchanged; only how we write to
it changed.

**On the next run, check:** the number on screen during the press equals the number on the
download button when it ends; `Download these N` puts exactly N rows in the file; the run
block still shows that run after a hard refresh; `all N are new` flips to `N new, M
already downloaded` on a second export; and no `Queue cache write failed` in the console.
