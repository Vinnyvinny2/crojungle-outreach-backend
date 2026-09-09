-- Every CREATE / ALTER the server expects, collected from the round notes on 2026-09-02.
-- Run in the Supabase SQL editor. Since §127 (2026-09-09) row-level security is ON on
-- every table with NO policy for anon: the server's SUPABASE_KEY is the service_role
-- (sb_secret_) key, which bypasses RLS, and the browser never talks to Supabase. (Rounds
-- 16 and 93 had RLS off because the server then used the anon key.) SCHEMA PROBE in the
-- boot log names whatever is still missing.

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

-- §129 — what we have learned about a domain's mail, so a
-- sleeping free instance stops re-buying it every morning. The two process-lifetime Maps
-- (catchAllCache, domainPatternMemory) stay in front as the hot-path cache; this is their
-- backing store. RUN THIS BEFORE THE ROUND 129 SERVER DEPLOYS: PostgREST refuses a whole
-- row on one unknown column, so every fact learned before it runs is lost.
-- NULL means "we have no measurement", never "we measured no". The UNKNOWN catch-all
-- verdict is deliberately never written here: it is a fact about the probe's moment.
create table if not exists domain_mail_facts (
  domain text primary key,
  catch_all boolean,
  catch_all_at timestamptz,
  pattern text,
  pattern_at timestamptz,
  pattern_source text,
  mail_provider text,
  mail_provider_at timestamptz,
  updated_at timestamptz default now());
alter table domain_mail_facts enable row level security;

-- §129 — the free-100 mailbox-verifier allowance, seeded at boot so an instance that
-- slept resumes the day instead of starting it again. Best-effort, not accounting: the
-- vendor's own refusal (the VERIFIER_EXHAUSTED latch) remains the authority. `service` is
-- a column and not a table, so a second metered allowance needs no new SQL.
create table if not exists api_day_spend (
  day date not null,
  service text not null,
  used real not null default 0,
  updated_at timestamptz default now(),
  primary key (day, service));
alter table api_day_spend enable row level security;

-- §127 (docs/history/round-127.md) — row-level security ON, the browser locked out.

-- Run ONLY after the Round 127 index.html is live on Netlify and APP_TOKEN is set
-- on Render: from that build the page never talks to Supabase, and the server
-- holds the service_role (sb_secret_) key, which bypasses these policies.
-- The old page (any build before 2026-09-09) stops syncing the moment this runs.
alter table places_query_state enable row level security;
alter table lead_bench enable row level security;
alter table business_observations enable row level security;
alter table call_outcomes enable row level security;
alter table lead_pages enable row level security;
alter table send_log enable row level security;
alter table leads enable row level security;
alter table discovered_queue enable row level security;
alter table read_runs enable row level security;
alter table user_settings enable row level security;
alter table contact_cache enable row level security;
alter table company_size_cache enable row level security;
alter table cron_state enable row level security;
-- No policy is ever added for anon or authenticated: the publishable key reads nothing.
revoke all on all tables in schema public from anon, authenticated;
alter default privileges in schema public revoke all on tables from anon, authenticated;
-- The keys that sat in the Settings row for the life of the project come out of it.
update user_settings set data = data - 'apiKey' - 'firecrawlKey' - 'companiesApiKey' - 'theirstackKey' - 'pdlKey' - 'hunterKey' - 'verifierKey' - 'apifyToken' - 'ninjaPearKey' - 'fbToken' - 'adzunaId' - 'adzunaKey' - 'pageSpeedKey' where id = 'singleton';
-- Rollback (not expected): `alter table <t> disable row level security;` per table and
-- `grant select, insert, update, delete on all tables in schema public to anon, authenticated;`.
