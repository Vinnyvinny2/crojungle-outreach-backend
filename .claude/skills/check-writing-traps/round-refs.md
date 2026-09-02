# Where each check-writing trap recurred (round pointers)

Not exhaustive: grep `docs/history` for the phrase. Numbers are § round numbers.

| Trap | Rounds |
|---|---|
| Self-matching needle | 13, 16, 24, 33, 44, 45, 47, 52, 54, 67, 69, 76, 79, 81, 82, 85, 89, 91, 98, 103, 105 |
| Half a check (no call-site assertion) | 25, 27, 29, 46, 47, 77, 85, 94, 97, 98, 101 |
| NO VERDICT / harness that lies | 44, 47, 59, 70, 74, 76, 83, 86, 87, 89, 90, 93, 96, 98 |
| Falsification did not reproduce the defect | 25, 44, 45, 55, 59, 66, 76, 95, 105 |
| Fixture that measures nothing | 21, 23, 57, 66, 71, 75, 85, 89, 90, 93, 95, 97 |
| Message naming the wrong cause | 3, 16, 24, 41, 50, 55, 85, 99, 104 |
| Two hand-kept copies (inside a check) | 10, 32, 46, 50, 97 |
| Wall-clock ruler on a shared dyno | 39, 55 |
| Check requirement taken from the code under test | 18, 38 |
| Preference written as an invariant | 28 |
