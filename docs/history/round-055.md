# §55 — The first live run after the pivot, read line by line — 2026-08-23
Source: CLAUDE.md lines 4678-4775, moved verbatim 2026-09-02 from commit b01d952e4f95d7b69686bc2c4063ca2aa0cb7546 (branch backup/claude-md-monolith). Nothing below this line was edited.

## 55. The first live run after the pivot, read line by line — 2026-08-23

Vin ran TriStar Concrete on the freshly-merged build and sent the screen and the
whole Render log: *"try to fix eveyrhting so next run we are flawless... analzye
eveyr word in the audit and the logs."* The audit itself is the best this system
has produced — the message-match finding, the review-complaint-matches-the-
booking-path synthesis, six genuinely different page renders. The log carried
one RED and the sheet carried three defects.

### The boot went RED on Render on a correct gate

`⛔ FIRECRAWL GATE CHECK: 10 calls did not finish in 15s — a slot is leaking`,
at 22:22:20. No slot was leaking. The check's 15-second wall-clock deadline ran
while `SCREENSHOT SCALER CHECK` was blocking the event loop in multi-second
chunks of synchronous PNG work — Render's own port scanner could not connect at
22:22:09, which is the proof the loop was frozen, not the gate. Five of ten jobs
had dispatched and progress was still being made; the deadline expired anyway
and printed three failures with three different wrong causes.

Two recorded classes at once: a wall-clock ruler on a shared-CPU dyno measures
the dyno (BATCH MEMORY CHECK earned this at 12 seconds), and a message naming
the wrong cause costs what a missing one costs (recorded three times).

**The deadline now measures STALL, not wall clock.** A genuinely leaked slot
stops both dispatch and settlement forever, so it always produces 20 seconds of
zero progress; a starved loop keeps making progress every time it unblocks, so
it never can. Proven both ways in one experiment: the old ruler goes RED on a
correct gate under a synthetic 2.2s-block starver, the new ruler rides through
the identical starvation green, and a leaked slot still goes RED under the new
ruler — with a message that now names the leak signature (all released, one
never settled) instead of guessing. The post-throw probe moved 3s → 30s on the
same argument, and the cascade assertions ("5 dispatches for 10 jobs") are
guarded on the stall verdict so one event can no longer print as three causes.

This RED mattered doubly: with PART 8's health-check step done, a false RED
blocks every deploy.

### Render cuts traffic over a minute before the boot settles

"Your service is live 🎉" printed at 22:21:24; the verdict settled around
22:22:40. Render switches traffic at PORT-OPEN, so every POST in between
answers 503 {booting:true} — and the client retried a booting submit for only
60 seconds. A submit pressed after a deploy therefore failed right before the
door opened, reading as "research is broken" on a healthy build. The retry is
36 × 5s now, and `clientcheck` computes the window from both sides' own code —
shrink the retry or slow the boot and the build fails, not the next deploy.

### "Do not say" warned about one sentence twice

TriStar's sheet carried two entries both quoting *"Nothing answers."* — two
different rules, one sentence, and for the person dialling the instruction is
identical. Deduped on the QUOTED SPAN at assembly, first reason survives:
different quotes both stand, entries with no quote are untouched, and a
fragment under twelve characters is never a dedupe key, because two real
warnings sharing a two-word fragment must not eat each other.

### The forbidden recency framing came back past a 19-line instruction

TriStar's audit: *"a comparison shopper reading the profile sees a business
that may have gone quiet."* The audit prompt's own REVIEW RECENCY block forbids
exactly this — it quotes the 668-day live failure and explains what the
measurement really means. The model wrote the framing anyway. PART 3's rule is
the whole story: instructional guards do not hold, and this family had only an
instruction while every neighbour has a stripper.

`stripRecencyConclusions` now sits in the audit battery beside the quote, money
and spelled-scale gates. The predicate needs BOTH halves because each alone
eats a true sentence: an AGE signal ("newest review … days old", never the bare
word "review", or the customers' own *"went quiet on them"* dies with it) AND a
conclusion (a hypothetical reader concluding, or the ceased-trading vocabulary,
without which the bare measurement dies — and that line is real intelligence:
they stopped ASKING for reviews).

**The first falsification of that check passed on a broken build.** Widening
the age test to any review word left every fixture green, which proved the age
half had no fixture watching it — a falsification that does not reproduce is a
missing case, not a pass. The fixture that guards it now is a reader-conclusion
about the owner ANSWERING reviews, which only the age signal keeps alive.

### And two smaller things from the same read

- The cascade's "makes the leak bigger" was suspected as a typo from the
  screenshot and is correct in source — checked rather than assumed.
- A stray falsification server from this session's own loops was still alive
  during the first full gate run and starved the fuzz server's boot; the gates
  were re-run clean. The failure line ("never reached a green BOOT VERDICT")
  was accurate both times about its own scope.

**220 boot checks green.** Seven falsifications this round, each red alone —
one of which found its own check's missing fixture. TriStar's audit had no
search position because the deploy predated the DataForSEO credentials; the
LOCAL PACK TRUST line says so by name.

**`index.html` changed (the boot-retry window), so this needs a Netlify
deploy.**

---

