# §35 — The first evidence this project will ever have — 2026-08-21
Source: CLAUDE.md lines 2286-2331, moved verbatim 2026-09-02 from commit b01d952e4f95d7b69686bc2c4063ca2aa0cb7546 (branch backup/claude-md-monolith). Nothing below this line was edited.

## 35. The first evidence this project will ever have — 2026-08-21

Twelve emails, zero human replies, and every quality judgement in this file is
the system grading its own homework. Fifty cold calls a day answers in thirty
seconds with a reason attached — but only if somebody writes down WHICH FINDING
opened the call, because the outcome without the finding is a diary.

`POST /api/call-outcome` stores seven states against the finding id, the
prospect-model prediction frozen at the time of the call, and — the most valuable
field — **what he actually said.** The outcome says which findings work; only his
own words say why one did not.

Four rules, each because the opposite is how thin numbers get believed:

- **Rates are over CONVERSATIONS, not dials.** A finding cannot be blamed for a
  voicemail, and mixing the two is how you conclude the copy is broken when the
  phone list is.
- **Under twelve conversations is marked UNREADABLE**, out loud, on the report.
- **The outcome is stored HERE before any CRM sees it**, and the webhook is
  fire-and-forget: a CRM being down must never lose a call or block the person
  logging one.
- **A free-text status is refused.** A column you cannot group is a list.

The CRM is a **webhook** rather than a native integration, deliberately: Mike has
not picked one yet, and a HubSpot adapter written today is wasted if he buys
Close. `CRM_WEBHOOK_URL` reaches HubSpot, Close, Pipedrive, GoHighLevel, Zapier,
Make or a spreadsheet with no code from us. Needs a table:

```sql
create table call_outcomes (
  id bigserial primary key, lead_id text, company text, outcome text not null,
  finding_id text, finding_text text, said text, follow_up_at date,
  next_step text, predicted text, at timestamptz default now());
```

`GET /api/call-outcomes` returns the report grouped by finding, `?format=csv` for
a spreadsheet. `CALL OUTCOME CHECK`, seven guards, all falsified.

**This is the lever, and it is the only one that is not inference.** PART 5 has
two proven things and three replies behind them. Forty conversations logged
against findings would be more evidence than this project has accumulated in its
whole life, and it needs no code to produce — just somebody pressing a button
after each call.

---

