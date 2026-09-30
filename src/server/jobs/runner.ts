import "server-only";
import type { JobProgress, JobType } from "../db/schema";
import { logger } from "../logger";
import {
  claimNextJob,
  completeJob,
  failJob,
  recoverStaleJobs,
  reportProgress,
  type ClaimedJob,
} from "./queue";

export type JobContext = {
  job: ClaimedJob;
  progress: (p: JobProgress) => Promise<void>;
};

export type JobHandler = (ctx: JobContext) => Promise<unknown>;

/** Thrown by handlers for errors a retry cannot fix (bad input, unverifiable product…). */
export class PermanentJobError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PermanentJobError";
  }
}

export type RunSummary = { processed: number; done: number; retried: number; failed: number };

/**
 * Processes jobs until the time budget is spent or the queue is empty.
 * Called by the cron tick (all tenants) and by a client "nudge" (one job).
 * A job is only started while at least `minStartMs` of budget remains.
 */
export async function runJobs({
  handlers,
  budgetMs,
  onlyJobId,
  minStartMs = 5_000,
}: {
  handlers: Partial<Record<JobType, JobHandler>>;
  budgetMs: number;
  onlyJobId?: string;
  minStartMs?: number;
}): Promise<RunSummary> {
  const deadline = Date.now() + budgetMs;
  const summary: RunSummary = { processed: 0, done: 0, retried: 0, failed: 0 };
  if (!onlyJobId) await recoverStaleJobs();

  while (deadline - Date.now() > minStartMs) {
    const job = await claimNextJob(onlyJobId);
    if (!job) break;
    summary.processed++;
    const handler = handlers[job.type];
    try {
      if (!handler) throw new PermanentJobError(`No handler for job type ${job.type}`);
      const result = await handler({ job, progress: (p) => reportProgress(job, p) });
      await completeJob(job, result ?? null);
      summary.done++;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const outcome = await failJob(job, message, {
        permanent: err instanceof PermanentJobError,
      });
      summary[outcome === "retry" ? "retried" : "failed"]++;
      logger.warn({ jobId: job.id, type: job.type, attempt: job.attempts, outcome }, message);
    }
    if (onlyJobId) break;
  }
  return summary;
}
