# Where each bug class recurred (round pointers)

Not exhaustive: grep `docs/history` for the phrase to find more. Numbers are § round numbers; file is `docs/history/round-NNN.md`.

| Class | Rounds |
|---|---|
| Computed but not passed | 18, 22, 24, 39, 49, 54, 64, 76, 77, 80, 85, 94, 98, 99, 101, 104 |
| Line order is not scope | 40 (the third out-of-scope name to kill the ladder: deepPain, reviewPainFound, location); guard is `scopecheck.js` |
| Unmeasured treated as zero / null laundering | 6, 59, 66, 76, 80, 85, 89, 93, 98, 104, 105 |
| A guard in the wrong function | 14, 44, 58, 77, 79, 97, 100 |
| A test harness that lies | 44, 47, 59, 70, 74, 76, 83, 86, 89, 90, 93, 96, 98 |
| A shared helper is 60 bugs at once | PART 6 (fetchT); 43 (credit latch), 76 (fcCall) |
| Two hand-kept copies of one rule | 10, 14, 18, 32, 45, 46, 48, 50, 51, 61, 68, 77, 81, 92, 97 |
| A stem with a word boundary after it | 15, 37, 57, 71, 74, 79, 94 |
| CRLF | 74, 89, 93, 103 |
| A mechanism no fixture can reach rots | 66, 67, 69, 84, 97 |
| Duplicate object keys | PART 6 (`rowToLead`, nine collisions); guard is `dupkeys.js` at baseline 0 |
| A message naming the wrong cause | 3 (SMTP), 16 (Supabase table), 41, 50, 55, 85, 99, 104 |
