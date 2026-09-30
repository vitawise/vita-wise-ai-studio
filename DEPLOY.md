# DEPLOY.md — Hostinger (Business Web Hosting, managed Node.js Web App)

## Status

| Item                             | Value                              | Verified on Hostinger        |
| -------------------------------- | ---------------------------------- | ---------------------------- |
| Node.js version                  | 22.x (`engines` in `package.json`) | ☐ pending                    |
| Install command                  | `npm ci`                           | ☐ pending                    |
| Build command                    | `npm run build`                    | ☐ pending                    |
| Start command                    | `npm run start` (`next start`)     | ☐ pending                    |
| `output: 'standalone'` required? | No (not set)                       | ☐ pending                    |
| `sharp` installs on build image  | Works locally (libvips 8.18.7)     | ☐ pending — see `/admin/env` |
| Live URL                         | —                                  | ☐ pending                    |

Update this table with the exact values that worked once the first deploy is live.

## Database migrations

Schema lives in `src/server/db/*.ts`; SQL migrations are committed in `src/server/db/migrations/`.

- Change schema → `npm run db:generate` → commit the new SQL.
- Apply → `npm run db:migrate` (reads the same `DB_*` vars as the app). Run it once after every
  deploy that adds a migration — or set the build command to
  `npm run db:migrate && npm run build` so it runs automatically (the DB must be reachable
  from the build).

## One-time setup

1. **MySQL** — hPanel → Databases → create DB + user. Host is always `127.0.0.1`
   (the app also rewrites `localhost` → `127.0.0.1`).
2. **Cloudflare R2** — create a **private** bucket + API token scoped to it
   (Object Read & Write). Note account ID, access key ID, secret.
3. **Node.js app** — hPanel → Websites → Add → Node.js Web App → connect GitHub repo
   `vitawise/vita-wise-ai-studio`, branch `main`.
   - Node version: 22.x
   - Build: `npm run build` · Start: `npm run start`
4. **Environment variables** — hPanel Node.js panel. Phase 0 needs:
   `DB_HOST DB_PORT DB_USER DB_PASSWORD DB_NAME R2_ACCOUNT_ID R2_ACCESS_KEY_ID
R2_SECRET_ACCESS_KEY R2_BUCKET ADMIN_USER ADMIN_PASSWORD LOG_LEVEL`.
   Full list with descriptions: `.env.example`. Vars must exist at build time;
   **redeploy/restart after any change.**
5. Point the owner's domain at the app (hPanel → Domains).
6. **Phase 1 auth** — also set `BETTER_AUTH_SECRET` (e.g. `openssl rand -base64 32`),
   `BETTER_AUTH_URL` (the public https URL, no trailing slash), `SMTP_*`, and optionally
   `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` (Google button is hidden until both are set).
   Google OAuth redirect URI: `{BETTER_AUTH_URL}/api/auth/callback/google`.

## Vercel (preview only — not the production target)

Project `vita-wise-ai-studio` (team `vita-wise`): framework **Next.js**, Node **22.x** (also
declared in `vercel.json`). Production URL: `https://vita-wise-ai-studio-vita-wise.vercel.app`
(`vita-wise-ai-studio.vercel.app` belongs to someone else). Every push to `main` deploys to
production; every other branch gets a preview URL. Without `DB_*` + `BETTER_AUTH_SECRET` the
public pages work and auth pages show a "not configured" notice instead of failing.

Migrations run automatically on Vercel: `vercel.json` sets the build command to
`npm run db:migrate && npm run build`. Environments without `DB_NAME`/`DB_USER` (previews) skip
the step; a production build whose DB is unreachable fails, and the last good deployment stays live.

Vercel builds whatever is on `main`. If `main` has no app (only `CLAUDE.md`) Vercel serves
`404: NOT_FOUND` — merge the app into `main` first. Vercel cannot reach Hostinger's MySQL at
`127.0.0.1`; auth pages need a MySQL that accepts remote connections (hPanel → Remote MySQL,
host `%`) and `DB_HOST` set to that server's public hostname.

## Phase 0 acceptance check

| Check        | How                                             | Expected                                  |
| ------------ | ----------------------------------------------- | ----------------------------------------- |
| Hello page   | `GET /`                                         | Arabic RTL page                           |
| Health       | `GET /api/health`                               | `200 {"status":"ok","db":"OK","r2":"OK"}` |
| Admin gate   | `GET /admin/env` without credentials            | `401`                                     |
| Env presence | `/admin/env` with `ADMIN_USER`/`ADMIN_PASSWORD` | Phase 0 vars "set"; values never shown    |
| R2 upload    | `/admin/env` → **Run R2 upload test**           | "R2 upload OK" (write → read → delete)    |
| sharp        | `/admin/env` → sharp line                       | Record result in the table above          |

`/api/health` is public and read-only (MySQL `SELECT 1` + R2 `HeadBucket`); it returns
`503` when either fails. Error details go to logs only (pino → stdout → hPanel logs).

## CI

GitHub Actions (`.github/workflows/ci.yml`) runs typecheck, lint, format check, tests
and build on every PR and push to `main`. Merge to `main` only when green — Hostinger
auto-deploys from `main`.

## Local development

```bash
cp .env.example .env.local   # fill in values
npm ci
npm run dev
npm run typecheck && npm run lint && npm test && npm run build
```
