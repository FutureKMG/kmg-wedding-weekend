alter table public.photos
  add column if not exists is_feed_post boolean;

update public.photos
set is_feed_post = true
where is_feed_post is null;

alter table public.photos
  alter column is_feed_post set default true;

alter table public.photos
  alter column is_feed_post set not null;

create index if not exists idx_photos_is_feed_post_created_at
  on public.photos(is_feed_post, created_at desc);
