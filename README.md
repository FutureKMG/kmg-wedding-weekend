# Kara & Kevin Wedding Weekend App

Mobile-first React app for an immersive wedding weekend companion with name-based guest login.

## Features
- First + last name login (no password)
- Wedding-day timeline with live "happening now" indicator
- Local Dunedin/Tampa guide
- Private seating lookup
- Song request submission
- Wedding Feed + Full Gallery photo experience
- Upload toggle to post on the public-in-app Wedding Feed
- Multi-photo upload in one action
- Guests can delete only photos they uploaded
- Global art deco watercolor visual system aligned to Fenway palette
- Vercel-ready API routes and deployment config

## Stack
- Frontend: React + TypeScript + Vite
- Backend: Vercel serverless functions (`/api`)
- Database + storage: Supabase (Postgres + Storage)

## Quick Start
1. Install dependencies:
   - `npm install`
2. Create local env file:
   - `cp .env.example .env.local`
3. Fill required values in `.env.local`.
4. Run app:
   - `npm run dev`

## Environment Variables
Server/API:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_ANON_KEY`
- `SESSION_SECRET`
- `PHOTO_BUCKET_NAME` (defaults to `wedding-photos`)

Frontend:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_PHOTO_BUCKET_NAME` (defaults to `wedding-photos`)

## Database Setup
1. Run SQL in Supabase:
   - `supabase/schema.sql`
   - If your project already exists, also run `supabase/migrations/2026-02-15-add-photo-feed-flag.sql`
2. Seed event + guide data:
   - `supabase/seed.sql`
3. Import guest CSV using:
   - `docs/guest-import-template.csv`
4. Create storage bucket `wedding-photos` (private).

Detailed steps: `docs/supabase-setup.md`

## API Routes
- `POST /api/login`
- `POST /api/logout`
- `GET /api/me`
- `GET /api/events`
- `GET /api/guide`
- `GET /api/seating`
- `POST /api/song-requests`
- `GET /api/photos`
  - Optional query: `scope=feed|all`
- `POST /api/photos/upload-url`
- `POST /api/photos/complete`
  - Accepts: `path`, optional `caption`, optional `shareToFeed`
- `POST /api/photos/delete`
  - Accepts: `photoId` (only photo owner can delete)

## Testing and Build
- `npm run test`
- `npm run build`
- `npm run check:mobile` (mobile viewport guardrails)

## Theme System
- Tokens live in `src/styles/theme.css`
- Component/layout styling lives in `src/index.css`
- Invite hero assets live in `public/theme`
- Regenerate hero assets from source artwork:
  - `npm run theme:assets`
  - Optional custom source path:
  - `npm run theme:assets -- \"/absolute/path/to/Invite Image.heic\"`

Detailed guidance: `docs/theme-guide.md`

## Deployment
GitHub and Vercel steps are in `docs/deploy.md`.
