# Supabase Setup

1. Create a new Supabase project.
2. In SQL editor, run `supabase/schema.sql`.
3. If your project was created before the feed feature, run migration:
   - `supabase/migrations/2026-02-15-add-photo-feed-flag.sql`
   - This backfills existing photos into the Wedding Feed (`is_feed_post=true`).
4. Create storage bucket:
   - Name: `wedding-photos`
   - Public bucket: `false`
5. Run `supabase/seed.sql`.
6. Import your guest CSV using `docs/guest-import-template.csv` columns.
7. Manually fix any table labels or name spelling issues.
8. Validate duplicates:
   - `select full_name_norm, count(*) from guests group by full_name_norm having count(*) > 1;`
   - Ensure zero duplicates before launch.

## Name normalization rule
`full_name_norm` should always be lowercase with single spaces:
- `Kara   Gilmore` -> `kara gilmore`

## Suggested upload policy
Set `can_upload=false` for any guest entries you want to block from photo uploads.

If you use a different bucket name (for example `Wedding_Photos`), set:
- `PHOTO_BUCKET_NAME=<your_bucket_name>`
- `VITE_PHOTO_BUCKET_NAME=<your_bucket_name>`

## Photo Feed scope
- Wedding Feed: only photos with `is_feed_post=true`
- Full Gallery: all photos
