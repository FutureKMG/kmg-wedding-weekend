create extension if not exists pgcrypto;

create table if not exists public.guests (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  full_name_norm text not null unique,
  table_label text,
  meal_selection text,
  dietary_restrictions text,
  rsvp_reception text,
  can_upload boolean not null default true,
  is_admin boolean not null default false,
  flight_group_key text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  location text not null,
  start_at timestamptz not null,
  end_at timestamptz not null,
  sort_order int not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.guide_items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null,
  description text not null,
  address text,
  maps_url text,
  sort_order int not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.song_requests (
  id uuid primary key default gen_random_uuid(),
  guest_id uuid not null references public.guests(id) on delete cascade,
  song_title text not null,
  artist text,
  note text,
  created_at timestamptz not null default now()
);

create table if not exists public.photos (
  id uuid primary key default gen_random_uuid(),
  guest_id uuid not null references public.guests(id) on delete cascade,
  storage_path text not null unique,
  caption text,
  is_feed_post boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.feed_updates (
  id uuid primary key default gen_random_uuid(),
  guest_id uuid not null references public.guests(id) on delete cascade,
  message text not null check (char_length(message) between 1 and 280),
  created_at timestamptz not null default now()
);

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

create table if not exists public.app_text_content (
  content_key text primary key,
  content_value text not null,
  updated_by_guest_id uuid references public.guests(id) on delete set null,
  updated_at timestamptz not null default now()
);

create table if not exists public.flight_details (
  id uuid primary key default gen_random_uuid(),
  guest_id uuid not null unique references public.guests(id) on delete cascade,
  arrival_airport text not null,
  arrival_time timestamptz not null,
  airline text,
  flight_number text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_guests_full_name_norm on public.guests(full_name_norm);
create index if not exists idx_guests_flight_group_key on public.guests(flight_group_key);
create index if not exists idx_song_requests_guest_id on public.song_requests(guest_id);
create index if not exists idx_photos_guest_id on public.photos(guest_id);
create index if not exists idx_photos_is_feed_post_created_at on public.photos(is_feed_post, created_at desc);
create index if not exists idx_feed_updates_guest_id on public.feed_updates(guest_id);
create index if not exists idx_feed_updates_created_at on public.feed_updates(created_at desc);
create index if not exists idx_girls_room_threads_created_at on public.girls_room_threads(created_at desc);
create index if not exists idx_girls_room_threads_guest_id on public.girls_room_threads(guest_id);
create index if not exists idx_girls_room_replies_thread_id_created_at on public.girls_room_replies(thread_id, created_at asc);
create index if not exists idx_girls_room_replies_guest_id on public.girls_room_replies(guest_id);
create index if not exists idx_flight_details_arrival_time on public.flight_details(arrival_time);

alter table public.guests enable row level security;
alter table public.events enable row level security;
alter table public.guide_items enable row level security;
alter table public.song_requests enable row level security;
alter table public.photos enable row level security;
alter table public.feed_updates enable row level security;
alter table public.girls_room_threads enable row level security;
alter table public.girls_room_replies enable row level security;
alter table public.app_text_content enable row level security;
alter table public.flight_details enable row level security;

-- Service-role API routes query these tables directly, so client-side access stays closed by default.
create policy "deny all guests"
  on public.guests
  for all
  using (false)
  with check (false);

create policy "deny all events"
  on public.events
  for all
  using (false)
  with check (false);

create policy "deny all guide"
  on public.guide_items
  for all
  using (false)
  with check (false);

create policy "deny all song requests"
  on public.song_requests
  for all
  using (false)
  with check (false);

create policy "deny all photos"
  on public.photos
  for all
  using (false)
  with check (false);

create policy "deny all feed updates"
  on public.feed_updates
  for all
  using (false)
  with check (false);

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

create policy "deny all app text content"
  on public.app_text_content
  for all
  using (false)
  with check (false);

create policy "deny all flight details"
  on public.flight_details
  for all
  using (false)
  with check (false);
