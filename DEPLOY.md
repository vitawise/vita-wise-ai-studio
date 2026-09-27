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
