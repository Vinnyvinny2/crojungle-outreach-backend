# §20 — The byte ceiling deleted the render the pixel ceiling had just saved — FIXED 2026-08-20
Source: CLAUDE.md lines 1082-1102, moved verbatim 2026-09-02 from commit b01d952e4f95d7b69686bc2c4063ca2aa0cb7546 (branch backup/claude-md-monolith). Nothing below this line was edited.

## 20. The byte ceiling deleted the render the pixel ceiling had just saved — FIXED 2026-08-20

Jose Barrera's homepage rendered at 1920x9544, the scaler brought it under the
7,800px vision ceiling — the log celebrated "the model is reading the whole
homepage top to bottom" — and one line later the byte check found 9MB and threw
the image away: *"Screenshot too large (9MB) — skipping image, auditing from
text."* Two ceilings, and only one knew how to shrink. A photo-heavy page
compresses badly, so clearing the pixel limit says nothing about the byte
limit, and the audit ran blind on a picture we were holding.

`fitPngToBudget` is now the one fit against BOTH ceilings, for the homepage and
every interior render: bytes over budget scale the image smaller (edge ×
√(budget/bytes), up to three passes from the original buffer), and only below a
1,200px floor is refusing honest. Every decode still goes through the single
gated door. `RENDER BYTE BUDGET CHECK` forces the second pass at boot with a
real PNG. And the interior renders are now **labelled by their own path**
instead of the word "page" — five leads logged "booking, page, page, page,
page", and Vin read a run that HAD rendered every page as "it's clearly not
taking pics of the other important pages." A label that hides what was bought
reads exactly like the thing not having been bought.

