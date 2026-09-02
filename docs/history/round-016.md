# §16 — The log line named the one thing that was fine — FIXED 2026-08-20
Source: CLAUDE.md lines 909-941, moved verbatim 2026-09-02 from commit b01d952e4f95d7b69686bc2c4063ca2aa0cb7546 (branch backup/claude-md-monolith). Nothing below this line was edited.

## 16. The log line named the one thing that was fine — FIXED 2026-08-20

The query memory failed to save and the run printed **"Check that the
places_query_state table exists."** The table existed. Row-level security was
refusing the write. The one instruction printed sent whoever read it to inspect
the only healthy part of the system.

Five different problems arrive as the same `return null` and each needs a
different action: create a table, add a policy, add a column, fix the key, fix
the network. Supabase names which one in its response body every time, in a
documented code. The line guessed, and a guess printed as an instruction reads
exactly like a measurement.

This is the SMTP lesson in the other direction. PART 4 §3 already says: "The real
defect here is the log line, not the code... A message that overstates its own
severity costs exactly as much as one that understates it." Naming the wrong cause
costs the same again.

The reason is now READ from the error code, kept per table, and **cleared the
moment that table answers** — a stale cause reported after the fix is the same lie
pointing the other way. `SUPABASE FAILURE CAUSE CHECK` runs the diagnoser against
the real PostgREST bodies and asserts the permission case says the table EXISTS and
never says "does not exist".

**Two of its own assertions were wrong on the first run and only running them
showed it.** A 401 "permission denied" and a 403 "row-level security" are ONE
problem with ONE fix, and demanding they produce different sentences was noise —
so fixtures now carry the cause they belong to, and only different causes may not
collide. And the assertion banning the old sentence was written as a literal, so it
matched **its own source text** and failed a correct build. That trap is recorded in
this file twice already. It comes back every time somebody writes a needle the
natural way.

