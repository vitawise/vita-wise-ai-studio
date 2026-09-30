import "server-only";
import { and, desc, eq, sql } from "drizzle-orm";
import { CREDIT_COSTS } from "../billing/plans";
import { appendLedger } from "../billing/credits";
import { getDb } from "../db/client";
import { jobs, type JobProgress, type JobStatus, type JobType } from "../db/schema";
import type { TenantContext } from "../tenant-context";

export const MAX_ATTEMPTS = 3;
export const STALE_LOCK_MINUTES = 5;
const BASE_BACKOFF_SECONDS = 30;

/** Queues a job and reserves its credits in one transaction (throws InsufficientCreditsError). */
export async function enqueueJob(
  ctx: TenantContext,
  type: JobType,
  payload: unknown,
): Promise<string> {
  const id = crypto.randomUUID();
  const cost = CREDIT_COSTS[type];
  await getDb().transaction(async (tx) => {
    if (cost > 0) {
      await appendLedger(tx, ctx.pharmacyId, {
        delta: -cost,
        reason: "job.reserve",
        refType: "job",
        refId: id,
      });
    }
    await tx.insert(jobs).values({
      id,
      pharmacyId: ctx.pharmacyId,
      type,
      payload,
      creditsReserved: cost,
    });
  });
  return id;
}

export type JobView = {
  id: string;
  type: JobType;
  status: JobStatus;
  attempts: number;
  progress: JobProgress | null;
  result: unknown;
  lastError: string | null;
  createdAt: Date;
};

const jobViewColumns = {
  id: jobs.id,
  type: jobs.type,
  status: jobs.status,
  attempts: jobs.attempts,
  progress: jobs.progress,
  result: jobs.result,
  lastError: jobs.lastError,
  createdAt: jobs.createdAt,
};

/** Tenant-scoped read used by the polling endpoint. */
export async function getJob(ctx: TenantContext, jobId: string): Promise<JobView | null> {
  const [row] = await getDb()
    .select(jobViewColumns)
    .from(jobs)
    .where(and(eq(jobs.id, jobId), eq(jobs.pharmacyId, ctx.pharmacyId)))
    .limit(1);
  return row ?? null;
}

export async function listJobs(ctx: TenantContext, limit = 20): Promise<JobView[]> {
  return getDb()
    .select(jobViewColumns)
    .from(jobs)
    .where(eq(jobs.pharmacyId, ctx.pharmacyId))
    .orderBy(desc(jobs.createdAt))
    .limit(limit);
}

// ---- Runner-side operations (system scope: they act on jobs of every tenant) ----

export type ClaimedJob = {
  id: string;
  pharmacyId: string;
  type: JobType;
  payload: unknown;
  attempts: number;
  lockToken: string;
};

/**
 * Atomically claims the oldest runnable job (optionally a specific one).
 * A single UPDATE … LIMIT 1 with a random lock token works on MySQL and MariaDB
 * without SKIP LOCKED: only one runner's UPDATE can flip a row from queued to running.
 */
export async function claimNextJob(onlyJobId?: string): Promise<ClaimedJob | null> {
  const token = crypto.randomUUID();
  const db = getDb();
  await db.execute(sql`
    UPDATE ${jobs}
    SET status = 'running', lock_token = ${token}, locked_at = CURRENT_TIMESTAMP(3),
        attempts = attempts + 1
    WHERE status = 'queued' AND run_after <= CURRENT_TIMESTAMP(3)
      ${onlyJobId ? sql`AND id = ${onlyJobId}` : sql``}
    ORDER BY created_at
    LIMIT 1`);
  const [row] = await db
    .select({
      id: jobs.id,
      pharmacyId: jobs.pharmacyId,
      type: jobs.type,
      payload: jobs.payload,
      attempts: jobs.attempts,
    })
    .from(jobs)
    .where(eq(jobs.lockToken, token))
    .limit(1);
  return row ? { ...row, lockToken: token } : null;
}

export async function reportProgress(job: ClaimedJob, progress: JobProgress): Promise<void> {
  await getDb()
    .update(jobs)
    .set({ progress })
    .where(and(eq(jobs.id, job.id), eq(jobs.lockToken, job.lockToken)));
}

export async function completeJob(job: ClaimedJob, result: unknown): Promise<void> {
  await getDb()
    .update(jobs)
    .set({ status: "done", result, lastError: null, lockToken: null, lockedAt: null })
    .where(and(eq(jobs.id, job.id), eq(jobs.lockToken, job.lockToken)));
}

/**
 * Records a failed attempt. Retries with exponential backoff (30s, 60s, …) until
 * MAX_ATTEMPTS, then marks the job failed and refunds its reserved credits.
 */
export async function failJob(
  job: ClaimedJob,
  error: string,
  { permanent = false } = {},
): Promise<"retry" | "failed"> {
  const message = error.slice(0, 2000);
  if (!permanent && job.attempts < MAX_ATTEMPTS) {
    const delay = BASE_BACKOFF_SECONDS * 2 ** (job.attempts - 1);
    await getDb().execute(sql`
      UPDATE ${jobs}
      SET status = 'queued', last_error = ${message}, lock_token = NULL, locked_at = NULL,
          run_after = DATE_ADD(CURRENT_TIMESTAMP(3), INTERVAL ${delay} SECOND)
      WHERE id = ${job.id} AND lock_token = ${job.lockToken}`);
    return "retry";
  }
  await markFailedAndRefund(job.id, message, job.lockToken);
  return "failed";
}

async function markFailedAndRefund(jobId: string, message: string, lockToken: string | null) {
  await getDb().transaction(async (tx) => {
    const guard = lockToken ? eq(jobs.lockToken, lockToken) : eq(jobs.status, "running");
    const [res] = await tx
      .update(jobs)
      .set({ status: "failed", lastError: message, lockToken: null, lockedAt: null })
      .where(and(eq(jobs.id, jobId), guard));
    if (res.affectedRows !== 1) return;
    const [job] = await tx
      .select({ pharmacyId: jobs.pharmacyId, credits: jobs.creditsReserved })
      .from(jobs)
      .where(eq(jobs.id, jobId));
    if (job && job.credits > 0) {
      await appendLedger(tx, job.pharmacyId, {
        delta: job.credits,
        reason: "job.refund",
        refType: "job",
        refId: jobId,
      });
    }
  });
}

/**
 * Jobs locked longer than STALE_LOCK_MINUTES belong to a runner that died (request
 * timeout, redeploy). They go back to the queue, or fail with a refund when out of attempts.
 */
export async function recoverStaleJobs(): Promise<number> {
  const db = getDb();
  const stale = await db
    .select({ id: jobs.id, attempts: jobs.attempts })
    .from(jobs)
    .where(
      sql`${jobs.status} = 'running' AND ${jobs.lockedAt} < DATE_SUB(CURRENT_TIMESTAMP(3), INTERVAL ${STALE_LOCK_MINUTES} MINUTE)`,
    );
  for (const job of stale) {
    if (job.attempts >= MAX_ATTEMPTS) {
      await markFailedAndRefund(job.id, "Timed out (runner stopped)", null);
    } else {
      await db
        .update(jobs)
        .set({ status: "queued", lockToken: null, lockedAt: null })
        .where(and(eq(jobs.id, job.id), eq(jobs.status, "running")));
    }
  }
  return stale.length;
}
