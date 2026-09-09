# §N — <title> — YYYY-MM-DD
Written YYYY-MM-DD for docs/history (one file per round; CLAUDE.md carries no history). Not a moved section: verify-split.sh skips it.

## N. <title> — YYYY-MM-DD

<Vin's words, quoted: what he saw and asked for.>

### What was found
<Each defect, reproduced by executing the real function on the exact string from the log; what it did to a lead; which bug class; where it recurred (round pointers).>

### What changed, at the root
<Each fix, why it is shaped that way, what it deliberately does NOT do.>

### What the falsification runs found in the checks themselves
<Each revert in `docs/history/round-NNN-reverts.js`, run with `node falsify.js`: RED on its named assertion, or what was wrong with the check and how it was rewritten. Any falsification run by hand, recorded separately.>

**NNN boot checks green.** <gates run>. The contract is <number> on both sides.

**`index.html` changed / did not change, so this needs / does not need a Netlify deploy.** <SQL to run, env vars to set, accounts to top up.>

### Needs your eyes
<Only what a machine cannot prove: the merge (never while a batch runs), the Netlify drag, Render variables and Supabase SQL, anything a rep or a prospect sees, spend, whether the names read right — each with what to look at and what "good" looks like. Everything above is proven, with the command that proved it.>
