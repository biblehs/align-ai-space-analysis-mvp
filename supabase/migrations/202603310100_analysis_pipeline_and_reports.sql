alter table public.analyses
add column if not exists pipeline_stage text not null default 'initialized',
add column if not exists pipeline_status text not null default 'pending',
add column if not exists preanalysis_status text not null default 'pending',
add column if not exists snapshot_status text not null default 'pending',
add column if not exists full_report_status text not null default 'locked',
add column if not exists attempt_count integer not null default 0,
add column if not exists last_error_code text,
add column if not exists last_error_message text,
add column if not exists prompt_version text,
add column if not exists schema_version text,
add column if not exists model_name text,
add column if not exists preanalysis_version text,
add column if not exists preanalysis_generated_at timestamptz,
add column if not exists snapshot_generated_at timestamptz,
add column if not exists full_report_generated_at timestamptz,
add column if not exists report_result jsonb;

create index if not exists analyses_pipeline_stage_created_at_idx
on public.analyses (pipeline_stage, created_at desc);

create index if not exists analyses_pipeline_status_created_at_idx
on public.analyses (pipeline_status, created_at desc);

alter table public.analysis_jobs
add column if not exists job_type text not null default 'analysis',
add column if not exists stage text not null default 'snapshot',
add column if not exists attempt_count integer not null default 0,
add column if not exists max_attempts integer not null default 3,
add column if not exists started_at timestamptz not null default timezone('utc', now()),
add column if not exists last_error text,
add column if not exists next_retry_at timestamptz;

alter table public.analysis_jobs
drop constraint if exists analysis_jobs_status_check;

alter table public.analysis_jobs
add constraint analysis_jobs_status_check
check (status in ('queued', 'processing', 'retrying', 'completed', 'failed'));

create index if not exists analysis_jobs_stage_status_created_at_idx
on public.analysis_jobs (stage, status, created_at desc);

create table if not exists public.analysis_artifacts (
  id uuid primary key default gen_random_uuid(),
  analysis_id uuid not null,
  artifact_type text not null,
  artifact_version text,
  storage_path text,
  payload jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists analysis_artifacts_analysis_type_created_at_idx
on public.analysis_artifacts (analysis_id, artifact_type, created_at desc);

drop trigger if exists analysis_artifacts_set_updated_at on public.analysis_artifacts;
create trigger analysis_artifacts_set_updated_at
before update on public.analysis_artifacts
for each row
execute function public.set_updated_at();

alter table public.analysis_artifacts enable row level security;
