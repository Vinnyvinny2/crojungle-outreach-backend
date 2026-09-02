# §14 — The size gate was blocking the businesses we sell to — FIXED 2026-08-20
Source: CLAUDE.md lines 813-870, moved verbatim 2026-09-02 from commit b01d952e4f95d7b69686bc2c4063ca2aa0cb7546 (branch backup/claude-md-monolith). Nothing below this line was edited.

## 14. The size gate was blocking the businesses we sell to — FIXED 2026-08-20

From the first run on the rebuilt discovery, in the log's own numbers: the size
gate blocked 15 leads, **9 on a verified headcount and 6 on a name pattern**. All
nine headcount blocks were right. **Five of the six name blocks were wrong**, and
wrong in our hardest trades:

```
Twin Sisters Construction Company LLC          "construction company"
Vineyard Construction Company LLC              "construction company"
Louisville Paving & Construction Company       "construction company"
Audrey Echt Dermatology & Skin Cancer Center   "cancer center"
South Carolina Skin Cancer Center              "cancer center"
```

A dermatology practice named after the dermatologist is the most owner-operated
business there is. "Construction Company" is a legal suffix on a two-person
builder, not a size signal. Tested against twenty-five realistic owner-operated
names from our own trade list, the old pattern refused **thirteen** — including
"National Roofing & Sheet Metal" on *national*, "Federal Way Plumbing" on
*federal* (Federal Way is a city in Washington) and "Municipal Plumbing Supply"
on *municipal*.

**Why.** The list mixed three kinds of signal and applied one rule to all of them:
INSTITUTION words (university, county of, housing authority), which are reliable;
SCALE words (enterprises inc, holdings inc, fulfillment center), which are
reliable; and words that are merely **common in small-business names**, which are
not, and which were doing all the damage. Only the third kind was cut, and
`ICP FILTER CHECK` asserts both halves — the seventeen names that must survive
and the seventeen institutions that must still be refused, because a filter
loosened until it catches nothing is the more expensive failure.

**And there were two copies of it.** `looksLikeEnterpriseByName` decided whether
to spend a Companies API credit sizing a business; the size gate three hundred
lines later decided whether to keep it. Both refused "construction company", so a
two-person builder was **never sized AND then blocked for having no size** — two
copies of one wrong rule reinforcing each other. One shared filter now.

**Health is owned by one rule.** `ICP_BIG_HEALTH` is the only one of these
carrying a small-practice escape, and the same terms were duplicated in the
institution list *without* it — so a dermatology practice survived the rule
written to spare it and was then refused by a copy of that rule. The recorded
name for this is a guard in the wrong function.

**A measurement beats a guess about a name.** A verified headcount under 200 now
overrules the name pattern entirely. On this run that gate was right nine times
out of nine while the name pattern was wrong five times out of six.

**What the first version of the check got wrong.** It pulled the regexes back out
of the file text and found the WRONG COPY — the older filter sat earlier in the
file — then failed to compile what it grabbed and reported that it could not
check anything. Which was true, and which is exactly how a duplicate rule stays
invisible: a check that reads source cannot tell you there are two of the thing
it is reading. It executes the real constants now, and asserts there is exactly
one definition of each.

---

