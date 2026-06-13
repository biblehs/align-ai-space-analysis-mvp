create index if not exists waitlist_users_goal_room_created_at_idx
on public.waitlist_users (primary_goal, first_room, created_at desc);

create index if not exists waitlist_users_feedback_priority_idx
on public.waitlist_users (feedback_willingness, priority_score desc, created_at asc);
