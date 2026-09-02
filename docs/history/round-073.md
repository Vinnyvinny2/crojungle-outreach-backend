# §73 — The batch learned to take orders, and the leads read stopped fighting the database — 2026-08-25
Source: CLAUDE.md lines 6422-6453, moved verbatim 2026-09-02 from commit b01d952e4f95d7b69686bc2c4063ca2aa0cb7546 (branch backup/claude-md-monolith). Nothing below this line was edited.

## 73. The batch learned to take orders, and the leads read stopped fighting the database — 2026-08-25

Vin, live on the board: *"it forces me to audit the leads like i cant select
which leads to run the 50 audits on it pre chooses."* He was right — the bulk
button took the top-scored waiting leads and the operator had no say.

**Every board row now carries a tick box, and a ticked set IS the batch.**
`batchCandidates` takes `pickedIds`: a non-empty set replaces the top-N pick
entirely (the pick is the limit), while eligibility still applies — a running,
not-a-fit or no-website lead cannot be bought into a run by ticking it, and a
ticked already-audited lead still needs the re-audit box, which is exactly how
a chosen re-run is supposed to happen. The panel says whose choice is running
("3 of your 5 ticked leads will run — the rest are..."), the button says
"Audit N ticked leads", a Clear-ticks button undoes the pick, and the ticks
are consumed by the run they start — a stale pick silently steering next
week's batch is the quiet-scope class the search box already had once. No
ticks means the old behaviour exactly, asserted by fixture. Executed in
`batchcheck` four ways and pinned at both call sites in `clientcheck`; three
falsifications, each red alone.

**And the leads read starts at 20 rows, down from 40.** Live the same day: a
40-row page hit the database's statement timeout (rows have grown a whole
audit heavier since §68 chose the size) and every boot burned a failed
statement before the halving ladder rescued it. The ladder is unchanged — it
is what turned that timeout into a slow load instead of a lost pipeline, and
Vin watched it do exactly that. The new start size is a tuning constant, not
a guarded mechanism; the ladder is the guard, and it is already fixtured.

**`index.html` changed, so this needs a Netlify deploy.**

---

