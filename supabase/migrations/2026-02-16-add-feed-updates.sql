create table if not exists public.feed_updates (
  id uuid primary key default gen_random_uuid(),
  guest_id uuid not null references public.guests(id) on delete cascade,
  message text not null check (char_length(message) between 1 and 280),
  created_at timestamptz not null default now()
);

create index if not exists idx_feed_updates_guest_id on public.feed_updates(guest_id);
create index if not exists idx_feed_updates_created_at on public.feed_updates(created_at desc);

alter table public.feed_updates enable row level security;

create policy "deny all feed updates"
  on public.feed_updates
  for all
  using (false)
  with check (false);
