create table if not exists public.app_text_content (
  content_key text primary key,
  content_value text not null,
  updated_by_guest_id uuid references public.guests(id) on delete set null,
  updated_at timestamptz not null default now()
);

alter table public.app_text_content enable row level security;

drop policy if exists "deny all app text content" on public.app_text_content;
create policy "deny all app text content"
  on public.app_text_content
  for all
  using (false)
  with check (false);
