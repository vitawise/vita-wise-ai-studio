/**
 * Every environment variable the app reads, in one place.
 * `.env.example` must list exactly these names (enforced by env-manifest.test.ts).
 * Values are set in the hPanel Node.js panel, never committed.
 */
export type EnvVarSpec = {
  name: string;
  description: string;
  /** Build phase (CLAUDE.md §12) from which the variable is required. */
  phase: number;
};

export const ENV_MANIFEST: readonly EnvVarSpec[] = [
  // Phase 0 — deployment skeleton
  {
    name: "DB_HOST",
    description: "MySQL host. Must be 127.0.0.1 on Hostinger, not localhost.",
    phase: 0,
  },
  { name: "DB_PORT", description: "MySQL port (default 3306).", phase: 0 },
  { name: "DB_USER", description: "MySQL user created in hPanel.", phase: 0 },
  { name: "DB_PASSWORD", description: "MySQL user password.", phase: 0 },
  { name: "DB_NAME", description: "MySQL database name.", phase: 0 },
  { name: "R2_ACCOUNT_ID", description: "Cloudflare account ID (R2 endpoint host).", phase: 0 },
  { name: "R2_ACCESS_KEY_ID", description: "R2 API token access key ID.", phase: 0 },
  { name: "R2_SECRET_ACCESS_KEY", description: "R2 API token secret access key.", phase: 0 },
  {
    name: "R2_BUCKET",
    description: "Private R2 bucket for uploads and generated images.",
    phase: 0,
  },
  {
    name: "ADMIN_USER",
    description: "Username for Basic Auth on /admin (Phase 0 only).",
    phase: 0,
  },
  {
    name: "ADMIN_PASSWORD",
    description: "Password for Basic Auth on /admin (long, random).",
    phase: 0,
  },
  {
    name: "LOG_LEVEL",
    description: "pino log level: info (default), debug, warn, error.",
    phase: 0,
  },
  // Phase 1 — auth
  {
    name: "BETTER_AUTH_SECRET",
    description: "Better Auth signing secret (32+ random bytes).",
    phase: 1,
  },
  {
    name: "BETTER_AUTH_URL",
    description: "Public base URL of the app, e.g. https://studio.example.com.",
    phase: 1,
  },
  { name: "GOOGLE_CLIENT_ID", description: "Google OAuth client ID.", phase: 1 },
  { name: "GOOGLE_CLIENT_SECRET", description: "Google OAuth client secret.", phase: 1 },
  { name: "SMTP_HOST", description: "Hostinger SMTP host.", phase: 1 },
  { name: "SMTP_PORT", description: "Hostinger SMTP port.", phase: 1 },
  { name: "SMTP_USER", description: "SMTP mailbox username.", phase: 1 },
  { name: "SMTP_PASSWORD", description: "SMTP mailbox password.", phase: 1 },
  { name: "SMTP_FROM", description: "From address for transactional email.", phase: 1 },
  // Phase 2 — jobs + billing
  {
    name: "CRON_SECRET",
    description: "Shared secret sent as x-cron-secret by the hPanel cron job.",
    phase: 2,
  },
  {
    name: "MOYASAR_PUBLISHABLE_KEY",
    description: "Moyasar publishable key (test key until launch).",
    phase: 2,
  },
  { name: "MOYASAR_SECRET_KEY", description: "Moyasar secret key.", phase: 2 },
  {
    name: "MOYASAR_WEBHOOK_SECRET",
    description: "Secret used to verify Moyasar webhooks.",
    phase: 2,
  },
  // Phase 3+ — AI + research
  { name: "ANTHROPIC_API_KEY", description: "Anthropic API key (text generation).", phase: 3 },
  { name: "ANTHROPIC_MODEL", description: "Claude model ID used for text generation.", phase: 3 },
  { name: "FIRECRAWL_API_KEY", description: "Firecrawl API key (search + scrape).", phase: 3 },
  { name: "GEMINI_API_KEY", description: "Google Gemini API key (images).", phase: 5 },
  { name: "GEMINI_IMAGE_MODEL", description: "Gemini image model ID.", phase: 5 },
  // Phase 8 — Salla
  { name: "SALLA_CLIENT_ID", description: "Salla Partners app client ID.", phase: 8 },
  { name: "SALLA_CLIENT_SECRET", description: "Salla Partners app client secret.", phase: 8 },
  {
    name: "ENCRYPTION_KEY",
    description: "Base64 32-byte AES-256-GCM key for tokens at rest.",
    phase: 8,
  },
];

export type EnvPresence = { spec: EnvVarSpec; present: boolean };

/** Reports which variables are set. Never returns values. */
export function envPresence(env: Record<string, string | undefined>): EnvPresence[] {
  return ENV_MANIFEST.map((spec) => ({
    spec,
    present: typeof env[spec.name] === "string" && env[spec.name] !== "",
  }));
}
