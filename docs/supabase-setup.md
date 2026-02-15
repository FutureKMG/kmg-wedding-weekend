# Supabase Setup

1. Create a new Supabase project.
2. In SQL editor, run `supabase/schema.sql`.
3. Create storage bucket:
   - Name: `wedding-photos`
   - Public bucket: `false`
4. Run `supabase/seed.sql`.
5. Import your guest CSV using `docs/guest-import-template.csv` columns.
6. Manually fix any table labels or name spelling issues.
7. Validate duplicates:
   - `select full_name_norm, count(*) from guests group by full_name_norm having count(*) > 1;`
   - Ensure zero duplicates before launch.

## Name normalization rule
`full_name_norm` should always be lowercase with single spaces:
- `Kara   Gilmore` -> `kara gilmore`

## Suggested upload policy
Set `can_upload=false` for any guest entries you want to block from photo uploads.
