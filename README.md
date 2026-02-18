# Kara & Kevin Wedding Weekend App

Mobile-first React app for an immersive wedding weekend companion with name-based guest login.

## Features
- First + last name login (no password)
- Wedding-day timeline with live "happening now" indicator
- Featured Welcome Party timeline card linking to `/welcome-party`
- Local Dunedin/Tampa guide synced from Zola travel details
- Flight details hub (save arrival details + view shared arrivals by last name or group key)
- Live Tampa weather card on Home
- One-tap Uber request quick action from Home
- Private seating lookup
- Song request submission
- Wedding Feed + Full Gallery photo experience
- Wedding Feed text updates from guests (add/edit/delete own updates)
- Upload toggle to post on the public-in-app Wedding Feed
- Multi-photo upload in one action
- Guests can edit/delete only photos they uploaded
- Admin-only dashboard text editor (`/content-editor`)
- Global art deco watercolor visual system aligned to Fenway palette
- Phillies-inspired Welcome Party microsite with directions + calendar actions
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
   - If your project was created before text updates, run `supabase/migrations/2026-02-16-add-feed-updates.sql`
   - If your project has older seed content, run `supabase/migrations/2026-02-16-sync-zola-content.sql`
   - If you want in-app dashboard text editing, run `supabase/migrations/2026-02-16-add-app-text-content.sql`
   - If your project was created before admin controls, run `supabase/migrations/2026-02-16-add-guests-admin-flag.sql`
   - If your project was created before flight tracking, run `supabase/migrations/2026-02-16-add-flight-details.sql`
   - If your project was created before flight sharing groups, run `supabase/migrations/2026-02-16-add-flight-group-key.sql`
   - If your project was created before seating meal fields, run `supabase/migrations/2026-02-18-add-guest-meal-and-diet.sql`
   - If your project was created before Girls Room, run `supabase/migrations/2026-02-18-add-girls-room.sql`
2. Seed event + guide data:
   - `supabase/seed.sql`
3. Import guest CSV using:
   - `docs/guest-import-template.csv`
4. Optional RSVP enrichment import:
   - `npm run rsvp:check-conflicts`
   - `npm run rsvp:import`
5. Create storage bucket `wedding-photos` (private).

Detailed steps: `docs/supabase-setup.md`

## API Routes
- `POST /api/login`
- `POST /api/logout`
- `GET /api/me`
- `GET /api/events`
- `GET /api/guide`
- `GET /api/flight-details`
- `POST /api/flight-details`
- `GET /api/seating`
- `POST /api/song-requests`
- `GET /api/feed-updates`
- `POST /api/feed-updates`
- `POST /api/feed-updates/update`
- `POST /api/feed-updates/delete`
- `GET /api/content-text`
- `POST /api/content-text/save` (admin-only)
- `GET /api/photos`
  - Optional query: `scope=feed|all`
- `POST /api/photos/upload-url`
- `POST /api/photos/complete`
  - Accepts: `path`, optional `caption`, optional `shareToFeed`
- `POST /api/photos/update`
  - Accepts: `photoId`, optional `caption`, optional `shareToFeed`
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
- Welcome party hero assets live in `public/theme`
- Regenerate hero assets from source artwork:
- `npm run theme:assets`
- `npm run theme:welcome-assets`
- `npm run theme:home-assets`
- Optional custom source path:
- `npm run theme:assets -- \"/absolute/path/to/Invite Image.heic\"`
- `npm run theme:welcome-assets -- \"/absolute/path/to/IMG_4425_websize.jpg\"`
- `npm run theme:home-assets -- --hero=\"/absolute/path/to/stained-glass.jpg\" --portraitOne=\"/absolute/path/to/portrait-1.jpg\" --portraitTwo=\"/absolute/path/to/portrait-2.jpg\"`

## Welcome Party Content Edits
- Update copy, dates, and links in `src/content/welcomeParty.ts`
- Timeline featured card and page both read from that content model

Detailed guidance: `docs/theme-guide.md`

## Deployment
GitHub and Vercel steps are in `docs/deploy.md`.

## Custom Script Font (Pinellas Brush)
- Source assets live in `assets/font-src`.
- Build pipeline script: `scripts/build-font.pe` (run through `scripts/build-font.sh`).
- Build command: `npm run font:build`
- Output directory: `public/fonts`
- Full workflow and kerning guidance: `docs/fontforge-script-font.md`
