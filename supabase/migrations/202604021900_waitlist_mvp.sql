create table if not exists public.waitlist_users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  status text not null default 'waitlisted',
  priority_score int not null default 0,
  source text,
  referrer text,
  landing_path text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  primary_goal text,
  first_room text,
  feedback_willingness text,
  open_text_note text,
  confirmation_email_sent_at timestamptz,
  invited_at timestamptz,
  claimed_at timestamptz,
  activated_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists waitlist_users_status_priority_idx
on public.waitlist_users (status, priority_score desc, created_at asc);

create index if not exists waitlist_users_source_created_at_idx
on public.waitlist_users (source, created_at desc);

drop trigger if exists waitlist_users_set_updated_at on public.waitlist_users;
create trigger waitlist_users_set_updated_at
before update on public.waitlist_users
for each row
execute function public.set_updated_at();

create table if not exists public.email_events (
  id uuid primary key default gen_random_uuid(),
  waitlist_user_id uuid references public.waitlist_users (id) on delete cascade,
  email text not null,
  email_type text not null,
  provider text,
  provider_message_id text,
  status text not null default 'queued',
  error_message text,
  sent_at timestamptz,
  opened_at timestamptz,
  clicked_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists email_events_waitlist_user_created_at_idx
on public.email_events (waitlist_user_id, created_at desc);

create index if not exists email_events_type_created_at_idx
on public.email_events (email_type, created_at desc);

alter table public.waitlist_users enable row level security;
alter table public.email_events enable row level security;
