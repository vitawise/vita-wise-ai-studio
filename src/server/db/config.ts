import { z } from "zod";

const dbEnvSchema = z.object({
  DB_HOST: z.string().min(1).default("127.0.0.1"),
  DB_PORT: z.coerce.number().int().positive().default(3306),
  DB_USER: z.string().min(1),
  DB_PASSWORD: z.string(),
  DB_NAME: z.string().min(1),
});

export type DbConfig = {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  connectionLimit: number;
};

/**
 * Hostinger: Node resolves `localhost` to ::1 and MySQL refuses it,
 * so `localhost` is always rewritten to 127.0.0.1.
 */
export function normalizeDbHost(host: string): string {
  return host.trim().toLowerCase() === "localhost" ? "127.0.0.1" : host.trim();
}

export function readDbConfig(env: Record<string, string | undefined>): DbConfig {
  const parsed = dbEnvSchema.parse(env);
  return {
    host: normalizeDbHost(parsed.DB_HOST),
    port: parsed.DB_PORT,
    user: parsed.DB_USER,
    password: parsed.DB_PASSWORD,
    database: parsed.DB_NAME,
    connectionLimit: 5,
  };
}
