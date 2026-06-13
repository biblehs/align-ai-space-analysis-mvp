create table if not exists public.upload_rate_limits (
  scope text not null,
  scope_key text not null,
  window_started_at timestamptz not null default timezone('utc', now()),
  last_upload_at timestamptz not null default timezone('utc', now()),
  upload_count integer not null default 0 check (upload_count >= 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (scope, scope_key)
);

create index if not exists upload_rate_limits_scope_window_idx
on public.upload_rate_limits (scope, last_upload_at desc);

drop trigger if exists upload_rate_limits_set_updated_at on public.upload_rate_limits;
create trigger upload_rate_limits_set_updated_at
before update on public.upload_rate_limits
for each row
execute function public.set_updated_at();

alter table public.upload_rate_limits enable row level security;

create table if not exists public.analysis_jobs (
  analysis_id uuid primary key,
  user_id uuid references auth.users (id) on delete set null,
  ip_hash text,
  status text not null default 'processing' check (status in ('processing', 'completed', 'failed')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  completed_at timestamptz
);

create index if not exists analysis_jobs_user_status_idx
on public.analysis_jobs (user_id, status, created_at desc);

create index if not exists analysis_jobs_ip_status_idx
on public.analysis_jobs (ip_hash, status, created_at desc);

drop trigger if exists analysis_jobs_set_updated_at on public.analysis_jobs;
create trigger analysis_jobs_set_updated_at
before update on public.analysis_jobs
for each row
execute function public.set_updated_at();

alter table public.analysis_jobs enable row level security;
