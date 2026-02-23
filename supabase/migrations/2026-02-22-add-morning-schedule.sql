create table if not exists public.morning_schedule_assignments (
  id uuid primary key default gen_random_uuid(),
  guest_id uuid not null references public.guests(id) on delete cascade,
  service_type text not null
    check (service_type in ('hair', 'makeup', 'bride_hair', 'bride_makeup', 'junior_hair')),
  artist_name text not null,
  start_at timestamptz not null,
  location text not null default 'Fenway Hotel',
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists idx_morning_schedule_guest_service_start_unique
  on public.morning_schedule_assignments(guest_id, service_type, start_at);

create index if not exists idx_morning_schedule_guest_start
  on public.morning_schedule_assignments(guest_id, start_at asc);

create index if not exists idx_morning_schedule_start
  on public.morning_schedule_assignments(start_at asc);

alter table public.morning_schedule_assignments enable row level security;

create policy "deny all morning schedule assignments"
  on public.morning_schedule_assignments
  for all
  using (false)
  with check (false);
