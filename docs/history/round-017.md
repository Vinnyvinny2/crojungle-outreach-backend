# §17 — The review ceiling was deleting 282 paid-for businesses a run — FIXED 2026-08-20
Source: CLAUDE.md lines 942-968, moved verbatim 2026-09-02 from commit b01d952e4f95d7b69686bc2c4063ca2aa0cb7546 (branch backup/claude-md-monolith). Nothing below this line was edited.

## 17. The review ceiling was deleting 282 paid-for businesses a run — FIXED 2026-08-20

`GP_MAX_REVIEWS` is 750, and 282 businesses a run were deleted on it. The argument
that demoted the rating band applies word for word: **Google bills per CALL and a
call returns twenty businesses, so deleting a result cannot save a penny**, and
nothing remembered them, so the next run paid to find the same 282 and delete them
again.

There is a second reason the band did not have. Twenty lines above the ceiling this
file states, from its own reading: *"Review count measures whether a business ASKS,
not how big it is."* The ceiling then uses review count to measure how big a
business is. Both cannot be right — a pest control company running 40-60 jobs a day
and asking each time crosses 750 while still being fifteen people and one owner; a
surgeon at 750 really is a large multi-provider practice. `reviewFloorFor` already
raises the FLOOR for exactly those high-volume trades. The ceiling was never given
the same treatment.

**No number was invented to fix that, because there is no measurement behind one.**
The ceiling keeps its value and stops DELETING: a business above it is returned
behind every other lead, sorts last, and fills the bench. It is still never audited
while a better lead exists, which is all the ceiling was ever doing. `GP_SIZE_MODE=cut`
restores the delete.

Both demotion reasons now feed **one** flag, so no gate can be fixed for one and
left open for the other — falsified by pointing the per-category cap and the final
comparator back at the band alone, and both went red.

