alter table public.profiles
add column if not exists preferred_language text,
add column if not exists timezone text,
add column if not exists country_code text,
add column if not exists city text,
add column if not exists signup_source text,
add column if not exists signup_campaign text,
add column if not exists onboarding_goal text,
add column if not exists budget_preference text,
add column if not exists style_preference_default text,
add column if not exists profile_completed_at timestamptz,
add column if not exists last_active_at timestamptz,
add column if not exists first_paid_at timestamptz;

create index if not exists profiles_last_active_at_idx
on public.profiles (last_active_at desc);

create index if not exists profiles_signup_source_idx
on public.profiles (signup_source, created_at desc);

alter table public.analyses
add column if not exists analysis_status text not null default 'completed',
add column if not exists analysis_mode text,
add column if not exists failure_reason text,
add column if not exists fallback_used boolean not null default false,
add column if not exists completed_at timestamptz,
add column if not exists paid_at timestamptz;

create index if not exists analyses_status_created_at_idx
on public.analyses (analysis_status, created_at desc);

create table if not exists public.user_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  session_id text not null,
  ip_hash text,
  user_agent text,
  browser text,
  os text,
  device_type text,
  locale text,
  timezone text,
  referrer text,
  landing_path text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  login_at timestamptz not null default timezone('utc', now()),
  last_seen_at timestamptz not null default timezone('utc', now()),
  logout_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists user_sessions_user_session_idx
on public.user_sessions (user_id, session_id);

create index if not exists user_sessions_login_at_idx
on public.user_sessions (login_at desc);

drop trigger if exists user_sessions_set_updated_at on public.user_sessions;
create trigger user_sessions_set_updated_at
before update on public.user_sessions
for each row
execute function public.set_updated_at();

create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  session_id text,
  analysis_id uuid references public.analyses (id) on delete set null,
  event_name text not null,
  page_path text,
  event_source text,
  properties jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists analytics_events_name_created_at_idx
on public.analytics_events (event_name, created_at desc);

create index if not exists analytics_events_user_created_at_idx
on public.analytics_events (user_id, created_at desc);

create index if not exists analytics_events_analysis_created_at_idx
on public.analytics_events (analysis_id, created_at desc);

alter table public.user_sessions enable row level security;
alter table public.analytics_events enable row level security;
