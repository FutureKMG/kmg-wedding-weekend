# Supabase Setup

1. Create a new Supabase project.
2. In SQL editor, run `supabase/schema.sql`.
3. If your project was created before the feed feature, run migration:
   - `supabase/migrations/2026-02-15-add-photo-feed-flag.sql`
   - This backfills existing photos into the Wedding Feed (`is_feed_post=true`).
4. If your project was created before guest text updates, run migration:
   - `supabase/migrations/2026-02-16-add-feed-updates.sql`
   - This enables shared wedding feed text updates from logged-in guests.
5. If your project already has older timeline/guide seed data, run migration:
   - `supabase/migrations/2026-02-16-sync-zola-content.sql`
   - This syncs events + guide items to the latest Zola details.
6. If you want owner-only dashboard text editing in-app, run migration:
   - `supabase/migrations/2026-02-16-add-app-text-content.sql`
   - This enables editable card/dashboard text storage.
7. If your project was created before admin controls, run migration:
   - `supabase/migrations/2026-02-16-add-guests-admin-flag.sql`
   - This adds `guests.is_admin` and marks `kara margraf` as admin by default.
8. If your project was created before the flight details feature, run migration:
   - `supabase/migrations/2026-02-16-add-flight-details.sql`
   - This enables each guest to save their arrival airport/time and optional flight info.
9. If you want manual travel-party grouping across different last names, run migration:
   - `supabase/migrations/2026-02-16-add-flight-group-key.sql`
   - Guests with matching `flight_group_key` can see each other's shared flight details.
10. Create storage bucket:
   - Name: `wedding-photos`
   - Public bucket: `false`
11. Run `supabase/seed.sql`.
12. Import your guest CSV using `docs/guest-import-template.csv` columns.
13. Manually fix any table labels or name spelling issues.
14. Validate duplicates:
   - `select full_name_norm, count(*) from guests group by full_name_norm having count(*) > 1;`
   - Ensure zero duplicates before launch.

## Name normalization rule
`full_name_norm` should always be lowercase with single spaces:
- `Kara   Gilmore` -> `kara gilmore`

## Suggested upload policy
Set `can_upload=false` for any guest entries you want to block from photo uploads.

## Suggested admin policy
Grant dashboard-text edit rights by setting:
- `is_admin=true` for the guest row(s) you trust to manage app copy.

## Optional: travel-party manual grouping
Use this if you want shared flight visibility for people beyond matching last names.

```sql
update public.guests
set flight_group_key = 'kara-party'
where full_name_norm in ('kara margraf', 'kevin gilmore');
```

Guests with the same `flight_group_key` will see one another's flight details in Travel Hub.

If you use a different bucket name (for example `Wedding_Photos`), set:
- `PHOTO_BUCKET_NAME=<your_bucket_name>`
- `VITE_PHOTO_BUCKET_NAME=<your_bucket_name>`

## Photo Feed scope
- Wedding Feed: only photos with `is_feed_post=true`
- Full Gallery: all photos
