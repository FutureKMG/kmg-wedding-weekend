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

create index if not exists idx_flight_details_arrival_time
  on public.flight_details(arrival_time);

alter table public.flight_details enable row level security;

drop policy if exists "deny all flight details" on public.flight_details;
create policy "deny all flight details"
  on public.flight_details
  for all
  using (false)
  with check (false);
