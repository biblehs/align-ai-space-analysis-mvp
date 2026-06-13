create extension if not exists "pgcrypto";

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  full_name text,
  avatar_url text,
  provider text,
  marketing_opt_in boolean not null default false,
  marketing_opt_in_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.analyses (
  id uuid primary key,
  user_id uuid references auth.users (id) on delete set null,
  email text,
  photo_url text,
  space_data jsonb not null,
  goal_data jsonb not null,
  snapshot_result jsonb not null,
  plan_result jsonb,
  paid boolean not null default false,
  stripe_session_id text unique,
  ai_model text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.checkins (
  id uuid primary key default gen_random_uuid(),
  analysis_id uuid not null references public.analyses (id) on delete cascade,
  user_id uuid references auth.users (id) on delete set null,
  steps_completed integer,
  satisfaction_score integer check (satisfaction_score between 1 and 10),
  feedback text,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists analyses_user_id_idx on public.analyses (user_id, created_at desc);
create index if not exists analyses_paid_idx on public.analyses (paid, created_at desc);
create index if not exists analyses_stripe_session_id_idx on public.analyses (stripe_session_id);
create index if not exists checkins_analysis_id_idx on public.checkins (analysis_id, created_at desc);

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

drop trigger if exists analyses_set_updated_at on public.analyses;
create trigger analyses_set_updated_at
before update on public.analyses
for each row
execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.analyses enable row level security;
alter table public.checkins enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles
for insert
to authenticated
with check (auth.uid() = id);

drop policy if exists "analyses_select_own" on public.analyses;
create policy "analyses_select_own"
on public.analyses
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "checkins_select_own" on public.checkins;
create policy "checkins_select_own"
on public.checkins
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "checkins_insert_own" on public.checkins;
create policy "checkins_insert_own"
on public.checkins
for insert
to authenticated
with check (auth.uid() = user_id);

insert into storage.buckets (id, name, public)
values ('room-photos', 'room-photos', false)
on conflict (id) do update set public = excluded.public;

drop policy if exists "room_photos_public_read" on storage.objects;

drop policy if exists "room_photos_service_insert" on storage.objects;
create policy "room_photos_service_insert"
on storage.objects
for insert
to service_role
with check (bucket_id = 'room-photos');

drop policy if exists "room_photos_service_update" on storage.objects;
create policy "room_photos_service_update"
on storage.objects
for update
to service_role
using (bucket_id = 'room-photos')
with check (bucket_id = 'room-photos');

drop policy if exists "room_photos_service_delete" on storage.objects;
create policy "room_photos_service_delete"
on storage.objects
for delete
to service_role
using (bucket_id = 'room-photos');
