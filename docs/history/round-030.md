# §30 — The search we measured him on was not the one he sells on
Source: CLAUDE.md lines 2008-2045, moved verbatim 2026-09-02 from commit b01d952e4f95d7b69686bc2c4063ca2aa0cb7546 (branch backup/claude-md-monolith). Nothing below this line was edited.

## 30. The search we measured him on was not the one he sells on

Jose Barrera, on why he deleted a true email: *"they clearly don't know that my
patients find me because they're looking for a FACIAL plastic surgeon in San
Antonio."*

We searched "plastic surgery practice in San Antonio" — the `GP_CATEGORIES`
bucket we happened to DISCOVER him under. That bucket is chosen so a Places query
returns lots of plausible businesses, which is a different job from naming what a
customer types. On a generalist the two coincide. On a specialist they do not,
and the specialists are the top of this ICP.

The correction costs nothing and is not a guess: **he named his own business.** A
modifier in the registered name is his own statement of what he sells and the
same word his customers type. Bounded four ways — the modifier must be DECLARED,
it must be in the NAME rather than somewhere on the site, the category must not
already carry it, and the head noun has to be nearby so "Mobile Home Park
Management" does not narrow "plumber".

**The stem trap, for the third time in this file.** A trade appears in a name
under a different ending every time: dentist/Dentistry, plumber/Plumbing,
roofer/Roofing. Matching the category word literally found none of them, and
"Bright Pediatric Dentistry" failed to narrow "dentist" — caught by this check's
own fixture before it shipped.

**And a floor that was never there.** "You are not in the top three" is a finding
when twenty businesses compete and arithmetic when five do. Below six results the
rank read now refuses rather than claiming a position. That matters most on a
narrowed phrase, which is exactly where a field goes thin.

`TRADE PHRASE CHECK` fixtures both directions: four specialist names must narrow,
seven generalist names must not, and "Coral Springs Plumbing" and "Moral Fiber
Landscaping" must not trip the `oral` modifier.

**`index.html` is unchanged this round, so no Netlify deploy is needed.**

---

