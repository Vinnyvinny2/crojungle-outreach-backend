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

-- §124 (docs/history/round-124.md) — the server-owned Find queue and the read runs.
-- RUN THIS BEFORE THE ROUND 124 SERVER DEPLOYS: PostgREST refuses a whole row on
-- one unknown column, so a queue write or a run row is lost until it has run.
create table if not exists discovered_queue (
  id text primary key, name text, website text, icp_score real, source text, signals jsonb,
  job_title text, location text, manual_role_count int, stacked boolean, reachability real,
  size_verified boolean, size_unverified boolean, verified_employees int, extra jsonb);
alter table discovered_queue add column if not exists batch_id uuid;
alter table discovered_queue add column if not exists read_at timestamptz;
alter table discovered_queue add column if not exists read_failed boolean;
alter table discovered_queue add column if not exists fail_reason text;
alter table discovered_queue add column if not exists moved_to_research_at timestamptz;
alter table discovered_queue add column if not exists ruled_out_at timestamptz;
alter table discovered_queue add column if not exists ruled_out_why text;
alter table discovered_queue add column if not exists from_trigger_source boolean default false;
alter table discovered_queue add column if not exists reach_predict int;
alter table discovered_queue add column if not exists exported_at timestamptz;
alter table discovered_queue add column if not exists exported_to text;
create index if not exists discovered_queue_batch_id_idx on discovered_queue (batch_id);
create table if not exists read_runs (
  id uuid primary key, started_at timestamptz not null default now(), finished_at timestamptz,
  progress_at timestamptz, status text not null default 'running',
  requested_count int not null, read_count int not null default 0, failed_count int not null default 0,
  ruled_out_count int not null default 0, credits_estimated int, credits_used real, scope jsonb, error text);
-- The Settings row a background run reads its keys from (the page already writes it).
create table if not exists user_settings (id text primary key, data jsonb);
-- The old page wrote extra as a JSON STRING inside jsonb; the server writes objects.
-- This turns every old string into the object it holds, once.
update discovered_queue set extra = (extra #>> '{}')::jsonb where jsonb_typeof(extra) = 'string';
-- Until index.html is re-dragged into Netlify the OLD page still deletes the whole
-- queue on every action. Nothing on the server deletes a queue row, so:
revoke delete on discovered_queue from anon, authenticated;
