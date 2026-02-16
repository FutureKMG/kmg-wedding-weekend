alter table public.guests
  add column if not exists flight_group_key text;

update public.guests
set flight_group_key = null
where flight_group_key is not null
  and btrim(flight_group_key) = '';

create index if not exists idx_guests_flight_group_key
  on public.guests(flight_group_key);
