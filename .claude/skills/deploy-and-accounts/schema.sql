-- Every CREATE / ALTER the server expects, collected from the round notes on 2026-09-02.
-- Run in the Supabase SQL editor. Tables the server WRITES need row-level security
-- disabled (see docs/history/round-093.md). SCHEMA PROBE in the boot log names
-- whatever is still missing.

-- §11 (docs/history/round-011.md)
create table places_query_state (
  q text primary key, cat text, city text,
  last_run timestamptz, runs int default 0,
  last_new int default 0, dry_streak int default 0);

-- §12 (docs/history/round-012.md)
create table lead_bench (
  id text primary key, name text, website text, source text,
  score real, payload jsonb, created_at timestamptz default now());

-- §27 (docs/history/round-027.md)
create table lead_pages (
  token text primary key, company text, payload jsonb,
  visits int default 0, last_visit timestamptz,
  created_at timestamptz default now());

-- §34 (docs/history/round-034.md)
create table business_observations (
  id bigserial primary key,
  biz text not null, company text not null,
  at timestamptz default now(), snap jsonb not null);
create index business_observations_biz_at on business_observations (biz, at desc);

-- §35 (docs/history/round-035.md)
create table call_outcomes (
  id bigserial primary key, lead_id text, company text, outcome text not null,
  finding_id text, finding_text text, said text, follow_up_at date,
  next_step text, predicted text, at timestamptz default now());

-- §42 (docs/history/round-042.md)
alter table leads add column if not exists held_back_contact jsonb;
alter table leads add column if not exists corpus_read jsonb;

-- §49 (docs/history/round-049.md)
create table send_log (
  id bigserial primary key, lead_id text, company text, email text,
  sequence_id text, at timestamptz default now());
