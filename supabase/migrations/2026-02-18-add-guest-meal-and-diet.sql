alter table public.guests
  add column if not exists meal_selection text,
  add column if not exists dietary_restrictions text,
  add column if not exists rsvp_reception text;
