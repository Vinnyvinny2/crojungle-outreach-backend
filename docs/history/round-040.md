# §40 — The harm ladder had been dead on every lead — 2026-08-21
Source: CLAUDE.md lines 2649-2697, moved verbatim 2026-09-02 from commit b01d952e4f95d7b69686bc2c4063ca2aa0cb7546 (branch backup/claude-md-monolith). Nothing below this line was edited.

## 40. The harm ladder had been dead on every lead — 2026-08-21

Vin ran five leads and sent the whole Render log. Three lines in it, repeated
once per lead:

```
harm ladder failed — location is not defined
▶ COMPOSE TRACE step 3: _harmsForResponse=false
```

`observationKeyFor({ placeId, website, company, location })` used `location` as
a shorthand property. There is no `location` in that scope — the lead's city
arrives as `req.body.location` — so the line threw on **every lead, on every
run, since the observation ledger shipped**, inside the ladder's try.

The cost is not one field. It is all 43 rungs: no factual spine, no problem
list, no subject lines, no opener verdict. **Both findings with a real human
reply behind them are rungs.** On that run Bret Rodgers had BOTH measured —
`DEEP PAIN: 2 verified repeating patterns` and `RANK ROW: 1 of the 7 above them
have FEWER reviews` — and neither reached his audit. Every audit in the run was
written by the model with nothing under it. The observation ledger has also
never written a single row: both its calls sit below the throwing line, so §34's
clock has been recording nothing and every future look will also be a first look.

**This is the third time one out-of-scope name has killed the whole ladder**
(`deepPain`, `reviewPainFound`, now `location`), and both guards written for it
missed this one:

- **`scopecheck.js` shared ONE globals list between server.js and index.html**,
  and that list whitelists the browser globals — `window document navigator
  location history localStorage`. None of them exist in Node. The gate written
  for exactly this class reported the file clean. It is three lists now, chosen
  by the file's runtime, with a self-test asserting they stay disjoint and that
  `location` in particular stays browser-scoped. A sweep with the fixed walker
  found `location` was the only one.
- **`LADDER SURVIVAL CHECK` is a denylist of three names somebody remembered** —
  `deepPain|reviewPainFound|painSummary` — inside one argument slot. The new
  crash was a fourth name in a different call ninety lines away. A hand-kept list
  is exactly what nobody updates; the general guard is scopecheck.

**And a crashed ladder looked exactly like a clean business.** One grey log line,
and the audit shipped normally to the screen and the export. Those are opposite
facts. The failure is now recorded rather than only logged, named outside the
guard that goes false when it happens, carried in the response literal, and
rendered as a red block on both the audit screen and the exported sheet.
`LADDER CRASH VISIBILITY CHECK`, four falsifications.

---

