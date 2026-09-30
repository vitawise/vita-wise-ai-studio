import "server-only";

/**
 * Auth needs a database and a signing secret. Until both are configured on the host
 * (e.g. a fresh Vercel preview), auth pages show a notice instead of crashing.
 */
export function isAuthConfigured(env: Record<string, string | undefined> = process.env): boolean {
  return Boolean(env.DB_USER && env.DB_NAME && env.BETTER_AUTH_SECRET);
}
