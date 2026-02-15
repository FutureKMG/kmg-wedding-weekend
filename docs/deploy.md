# GitHub and Vercel Deployment

## GitHub
1. Initialize git:
   - `git init`
2. Stage files:
   - `git add .`
3. First commit:
   - `git commit -m "Initial wedding app implementation"`
4. Create a GitHub repo, then connect and push:
   - `git remote add origin https://github.com/<YOUR_USERNAME>/wedding-weekend-app.git`
   - `git branch -M main`
   - `git push -u origin main`

## Vercel
1. Import GitHub repo into Vercel.
2. Set env vars:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SUPABASE_ANON_KEY`
   - `SESSION_SECRET`
   - `VITE_SUPABASE_URL` (same as `SUPABASE_URL`)
   - `VITE_SUPABASE_ANON_KEY` (same as `SUPABASE_ANON_KEY`)
3. Deploy.
4. Smoke test:
   - login
   - timeline load
   - seating lookup
   - song request submit
   - photo upload and display
