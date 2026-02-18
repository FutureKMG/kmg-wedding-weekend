create table if not exists public.girls_room_threads (
  id uuid primary key default gen_random_uuid(),
  guest_id uuid not null references public.guests(id) on delete cascade,
  item text not null check (char_length(item) between 1 and 80),
  message text not null check (char_length(message) between 1 and 500),
  created_at timestamptz not null default now()
);

create table if not exists public.girls_room_replies (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.girls_room_threads(id) on delete cascade,
  guest_id uuid not null references public.guests(id) on delete cascade,
  message text not null check (char_length(message) between 1 and 320),
  created_at timestamptz not null default now()
);

create index if not exists idx_girls_room_threads_created_at
  on public.girls_room_threads(created_at desc);

create index if not exists idx_girls_room_threads_guest_id
  on public.girls_room_threads(guest_id);

create index if not exists idx_girls_room_replies_thread_id_created_at
  on public.girls_room_replies(thread_id, created_at asc);

create index if not exists idx_girls_room_replies_guest_id
  on public.girls_room_replies(guest_id);

alter table public.girls_room_threads enable row level security;
alter table public.girls_room_replies enable row level security;

create policy "deny all girls room threads"
  on public.girls_room_threads
  for all
  using (false)
  with check (false);

create policy "deny all girls room replies"
  on public.girls_room_replies
  for all
  using (false)
  with check (false);
