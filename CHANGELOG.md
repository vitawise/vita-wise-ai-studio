# Changelog

## [0.0.1] — Phase 0: deployment skeleton

### Added

- Next.js 16 (App Router) + TypeScript strict + Tailwind v4; Arabic RTL hello page.
- `GET /api/health` — MySQL (`SELECT 1` via Drizzle/mysql2, pool ≤ 5) + R2 `HeadBucket`; 200/503.
- `/admin/env` (Basic Auth via `src/proxy.ts`) — env var presence (never values),
  Node version, DB/R2 status, `sharp` probe, R2 write→read→delete upload test.
- `localhost` → `127.0.0.1` DB host rewrite for Hostinger.
- `ENV_MANIFEST` + `.env.example` (kept in sync by test).
- pino structured logging to stdout; error details logged, never returned to clients.
- Vitest unit tests (basic auth, DB config, env manifest); GitHub Actions CI.
- `DEPLOY.md` with Hostinger setup and Phase 0 acceptance checklist.
