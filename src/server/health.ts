import "server-only";
import { randomUUID } from "node:crypto";
import { sql } from "drizzle-orm";
import { getDb } from "./db/client";
import { logger } from "./logger";
import { deleteObject, getObjectText, headBucket, putObject } from "./storage/r2";

export type CheckResult = { ok: boolean; latencyMs: number; error?: string };

/** Error name/code only — never messages, which can carry hosts or keys. */
function errorLabel(err: unknown): string {
  if (err instanceof Error) {
    const code = (err as { code?: unknown }).code;
    return typeof code === "string" ? `${err.name}:${code}` : err.name;
  }
  return "UnknownError";
}

async function timed(name: string, fn: () => Promise<void>): Promise<CheckResult> {
  const start = performance.now();
  try {
    await fn();
    return { ok: true, latencyMs: Math.round(performance.now() - start) };
  } catch (err) {
    logger.error({ check: name, err }, "health check failed");
    return {
      ok: false,
      latencyMs: Math.round(performance.now() - start),
      error: errorLabel(err),
    };
  }
}

export function checkDb(): Promise<CheckResult> {
  return timed("db", async () => {
    await getDb().execute(sql`select 1`);
  });
}

/** Read-only R2 reachability + credentials check. */
export function checkR2(): Promise<CheckResult> {
  return timed("r2", headBucket);
}

/** Full write → read → delete round trip. Admin-only (it writes). */
export function checkR2Upload(): Promise<CheckResult> {
  return timed("r2-upload", async () => {
    const key = `_health/upload-test-${randomUUID()}.txt`;
    const payload = `vitawise r2 test ${new Date().toISOString()}`;
    await putObject(key, payload, "text/plain; charset=utf-8");
    try {
      const echoed = await getObjectText(key);
      if (echoed !== payload) throw new Error("R2 round-trip content mismatch");
    } finally {
      await deleteObject(key);
    }
  });
}
