# Changelog

## [0.2.0] — Phase 2: jobs, credits, billing (trial)

### Added

- Tables `plans`, `subscriptions`, `credit_ledger`, `jobs`; seed plans (Trial 50 credits /
  Starter / Pro / Chain — placeholder prices) and a 14-day trial for existing pharmacies.
- Credit ledger: append-only, balance = SUM(delta) under a per-pharmacy row lock, cached in
  `pharmacies.credits_balance`, idempotent per (reason, reference). Trial granted on onboarding.
- Job queue: reserve credits on enqueue, atomic claim (`UPDATE … LIMIT 1` + lock token),
  retries with exponential backoff (max 3), permanent errors, stale-lock recovery, refund on
  final failure. `POST /api/jobs/tick` (cron secret), `GET /api/jobs/{id}`,
  `POST /api/jobs/{id}/nudge` (tenant-scoped).
- Billing page: current plan and trial end, balance, plans, cost per action, credit history.
- Tests: job lifecycle, retries/refund, insufficient credits, racing runners, stale locks,
  ledger idempotency, tenant isolation of jobs and ledger.

### Fixed

- Onboarding no longer takes a gap lock on `memberships` (concurrent sign-ups could deadlock).
- Removed unused `pharmacies.plan_id` (the subscription holds the plan).

### Not yet

- Moyasar payments: official docs unreachable from the build environment; not implemented
  (no endpoints guessed). Plan buttons show "online payment coming soon".

## [0.1.1] — Production DB fixes

### Fixed

- Initial migration failed on Hostinger MySQL (`Invalid default value`) because of legacy
  `TIMESTAMP` defaults. All date columns are now `DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3)`.
- `db:migrate` is plain JS (runs on any Node) and prints the underlying MySQL error.

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
