# MOMA Robotics Club Attendance

Frontend: static page in `public/`. Backend: Vercel serverless functions in `api/`. Database: Neon Postgres.

## Deploy
1. Create a Neon project and copy its connection string.
2. Push this folder to GitHub, then import it in Vercel (no build settings needed).
3. In Vercel > Settings > Environment Variables add (optional `ADMIN_USERNAME`, default `admin`):
   - `DATABASE_URL` (Neon connection string)
   - `ADMIN_PASSWORD` (the supervisors' sign-in password)
   - `AUTH_SECRET` (any long random string)
4. Deploy. Tables are created automatically on first use (`schema.sql` is for reference).

## Local test
`npm i -g vercel && npm install && cp .env.example .env.local` (fill it in) then `vercel dev`.

## Install as a mobile app (PWA)
- Android (Chrome): open the site, tap "Install app" in the menu (or the browser's install prompt).
- iPhone (Safari): Share > Add to Home Screen.
- The app shell loads offline, but marking attendance needs an internet connection.

## Package with PWABuilder (Android / iOS)
1. Deploy to Vercel first and note the HTTPS address.
2. Go to pwabuilder.com, paste the address and click Start. Fix anything it flags.
3. Choose Package for stores, then Android. Set a package ID such as `edu.gh.moma.robotics` and keep the signing key it generates (back it up).
4. Download the package. It contains the .aab for Google Play and a signing-key fingerprint.
5. Put that SHA-256 fingerprint and your package ID into `public/.well-known/assetlinks.json` (format below), redeploy, so the app opens without a browser bar.
6. iOS: PWABuilder produces an Xcode project. It needs a Mac and an Apple Developer account.

assetlinks.json format:
[{"relation":["delegate_permission/common.handle_all_urls"],"target":{"namespace":"android_app","package_name":"YOUR.PACKAGE.ID","sha256_cert_fingerprints":["YOUR:SHA256:FINGERPRINT"]}}]

## Admins and groups
- Sign in as `admin` (or your `ADMIN_USERNAME`) with `ADMIN_PASSWORD`. This is the main admin and can switch between the JHS and Lower and Upper Primary groups.
- The main admin adds other admins under Admins. Each is locked to one group (or both) and only sees that group's learners, meetings and reports.
- On a fresh Neon database everything is created automatically on the first request. `schema.sql` holds the full schema if you prefer to run it yourself in the Neon SQL Editor.
