// Round 134 — the batch list stops being one batch at a time.
//
// Each entry reverts ONE part of this round against the green baseline and
// must go red on its own named line. All three were run on 2026-09-10 and all
// three fired; the results are quoted in round-134.md.
module.exports = [
  {
    name: '134-a-the-merge-stops-deduping',
    path: 'index.html',
    old: "for (const l of leads) { if (!l || seen.has(l.id)) continue; seen.add(l.id); out.push(l); }",
    new: "for (const l of leads) { if (!l) continue; out.push(l); }",
    prove: 'clientcheck',
    mustPrint: /one CSV across several batches carries the same business twice/,
  },
  {
    name: '134-b-the-many-batch-csv-gets-its-own-exporter',
    path: 'index.html',
    old: "const csvForRuns = () => csvForRun(tickedIds);",
    new: "const csvForRuns = () => exportCsv(runLeads(tickedIds));",
    prove: 'clientcheck',
    mustPrint: /the many-batch CSV does not go through the one exporter/,
  },
  {
    name: '134-c-the-many-batch-move-gets-its-own-filter',
    path: 'index.html',
    old: "const ids = sendableIdsIn(await runLeads(tickedIds));",
    new: "const ids = (await runLeads(tickedIds)).map(l => l.id);",
    prove: 'clientcheck',
    mustPrint: /the many-batch move does not use the one move rule/,
  },
];
