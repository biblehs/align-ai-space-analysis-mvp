alter table public.analyses
add column if not exists request_ip_hash text,
add column if not exists registration_required boolean not null default false,
add column if not exists registration_completed_at timestamptz;

create index if not exists analyses_request_ip_hash_idx
on public.analyses (request_ip_hash, created_at desc);

create table if not exists public.anonymous_upload_limits (
  ip_hash text primary key,
  upload_count integer not null default 0 check (upload_count >= 0),
  first_upload_at timestamptz not null default timezone('utc', now()),
  last_upload_at timestamptz not null default timezone('utc', now()),
  last_analysis_id uuid,
  last_user_agent text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.security_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  severity text not null default 'info',
  ip_hash text,
  analysis_id uuid references public.analyses (id) on delete set null,
  request_path text,
  user_agent text,
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists anonymous_upload_limits_last_upload_idx
on public.anonymous_upload_limits (last_upload_at desc);

create index if not exists security_events_type_created_idx
on public.security_events (event_type, created_at desc);

drop trigger if exists anonymous_upload_limits_set_updated_at on public.anonymous_upload_limits;
create trigger anonymous_upload_limits_set_updated_at
before update on public.anonymous_upload_limits
for each row
execute function public.set_updated_at();

alter table public.anonymous_upload_limits enable row level security;
alter table public.security_events enable row level security;
