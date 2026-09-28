# Changelog

## [0.1.0] — Phase 1: auth, tenancy, i18n shell

### Added

- Better Auth (email/password + Google when configured) on Drizzle MySQL; httpOnly cookies
  (`vw` prefix), password reset (30-min, hashed tokens, revokes sessions), email verification
  sent on sign-up (not yet required), DB-backed rate limits (sign-in 5/min, sign-up and reset 3/min).
- Hostinger SMTP via nodemailer; bilingual emails sent after the response; bodies never logged.
- Schema + first migration: Better Auth tables, `pharmacies`, `memberships` (`owner|staff`).
  `npm run db:generate` / `npm run db:migrate`.
- Tenancy: `requireTenant()` mints a branded `TenantContext` from the session; repositories
  accept only that. Onboarding creates pharmacy + owner membership once per user.
- next-intl routing (`/ar` default, `/en`), `dir` per locale, language switcher.
- Pages: landing, login, signup, forgot/reset password, onboarding, RTL sidebar shell
  (Dashboard, AI Trends, Product Studio, Pricing, Content, Salla, Billing, Settings);
  dashboard + settings (profile, team) live, other modules "coming soon".
- shadcn-style UI primitives (button, input, label, card) with theme tokens.
- Tests: tenant isolation against MySQL, onboarding-once, messages key parity, auth error
  mapping, slugs. CI runs MySQL 8 and migrations before tests.

### Changed

- `/admin/*` Basic Auth moved into the combined proxy with locale routing.

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
