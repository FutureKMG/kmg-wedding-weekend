alter table public.guests
  add column if not exists account_type text not null default 'guest',
  add column if not exists vendor_name text,
  add column if not exists can_access_vendor_forum boolean not null default false;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'guests_account_type_check'
  ) then
    alter table public.guests
      add constraint guests_account_type_check
      check (account_type in ('guest', 'vendor'));
  end if;
end $$;

update public.guests
set account_type = 'guest'
where account_type is null;

insert into public.guests (
  first_name,
  last_name,
  full_name_norm,
  account_type,
  vendor_name,
  can_access_vendor_forum,
  can_upload,
  is_admin
)
values
  ('Fenway Hotel', 'Vendor', 'fenway hotel vendor', 'vendor', 'Fenway Hotel', true, true, false),
  ('Seashine Weddings', 'Vendor', 'seashine weddings vendor', 'vendor', 'Seashine Weddings', true, true, false),
  ('Breezin'' Entertainment', 'Vendor', 'breezin'' entertainment vendor', 'vendor', 'Breezin'' Entertainment', true, true, false),
  ('Leaf It To Us', 'Vendor', 'leaf it to us vendor', 'vendor', 'Leaf It To Us', true, true, false),
  ('Gabro', 'Vendor', 'gabro vendor', 'vendor', 'Gabro', true, true, false),
  ('Hellophoto', 'Vendor', 'hellophoto vendor', 'vendor', 'Hellophoto', true, true, false),
  ('Good Times Roll', 'Vendor', 'good times roll vendor', 'vendor', 'Good Times Roll', true, true, false),
  ('Femme Akoi Beauty Studio', 'Vendor', 'femme akoi beauty studio vendor', 'vendor', 'Femme Akoi Beauty Studio', true, true, false),
  ('Fuego Cigar Truck', 'Vendor', 'fuego cigar truck vendor', 'vendor', 'Fuego Cigar Truck', true, true, false)
on conflict (full_name_norm) do update
set
  first_name = excluded.first_name,
  last_name = excluded.last_name,
  account_type = excluded.account_type,
  vendor_name = excluded.vendor_name,
  can_access_vendor_forum = excluded.can_access_vendor_forum,
  can_upload = excluded.can_upload;

create table if not exists public.vendor_forum_threads (
  id uuid primary key default gen_random_uuid(),
  guest_id uuid not null references public.guests(id) on delete cascade,
  item text not null check (char_length(item) between 1 and 80),
  message text not null check (char_length(message) between 1 and 500),
  created_at timestamptz not null default now()
);

create table if not exists public.vendor_forum_replies (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.vendor_forum_threads(id) on delete cascade,
  guest_id uuid not null references public.guests(id) on delete cascade,
  message text not null check (char_length(message) between 1 and 320),
  created_at timestamptz not null default now()
);

create index if not exists idx_vendor_forum_threads_created_at
  on public.vendor_forum_threads(created_at desc);

create index if not exists idx_vendor_forum_threads_guest_id
  on public.vendor_forum_threads(guest_id);

create index if not exists idx_vendor_forum_replies_thread_id_created_at
  on public.vendor_forum_replies(thread_id, created_at asc);

create index if not exists idx_vendor_forum_replies_guest_id
  on public.vendor_forum_replies(guest_id);

alter table public.vendor_forum_threads enable row level security;
alter table public.vendor_forum_replies enable row level security;

create policy "deny all vendor forum threads"
  on public.vendor_forum_threads
  for all
  using (false)
  with check (false);

create policy "deny all vendor forum replies"
  on public.vendor_forum_replies
  for all
  using (false)
  with check (false);
