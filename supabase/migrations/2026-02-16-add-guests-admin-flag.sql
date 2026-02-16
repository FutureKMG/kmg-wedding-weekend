alter table public.guests
  add column if not exists is_admin boolean;

update public.guests
set is_admin = false
where is_admin is null;

alter table public.guests
  alter column is_admin set default false;

alter table public.guests
  alter column is_admin set not null;

update public.guests
set is_admin = true
where full_name_norm = 'kara margraf';
