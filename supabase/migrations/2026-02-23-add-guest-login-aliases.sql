create table if not exists public.guest_login_aliases (
  id uuid primary key default gen_random_uuid(),
  guest_id uuid not null references public.guests(id) on delete cascade,
  alias_full_name_norm text not null unique,
  created_at timestamptz not null default now()
);

create unique index if not exists idx_guest_login_aliases_alias
  on public.guest_login_aliases(alias_full_name_norm);

create index if not exists idx_guest_login_aliases_guest_id
  on public.guest_login_aliases(guest_id);

insert into public.guest_login_aliases (guest_id, alias_full_name_norm)
select id, 'katie margraf'
from public.guests
where full_name_norm = 'katie jaffe'
on conflict (alias_full_name_norm) do update
set guest_id = excluded.guest_id;

alter table public.guest_login_aliases enable row level security;

create policy "deny all guest login aliases"
  on public.guest_login_aliases
  for all
  using (false)
  with check (false);
