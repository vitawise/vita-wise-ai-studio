import { eq, sql } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { createTenant, hasDb } from "../../../test/db-fixtures";
import { getBalance, listLedger } from "../billing/credits";
import { CREDIT_COSTS, TRIAL_CREDITS } from "../billing/plans";
import { getDb } from "../db/client";
import { jobs, type JobType } from "../db/schema";
import { InsufficientCreditsError } from "../billing/credits";
import { enqueueJob, getJob, MAX_ATTEMPTS, recoverStaleJobs } from "./queue";
import { PermanentJobError, runJobs, type JobHandler } from "./runner";

const TYPE: JobType = "product.generate_content";
const COST = CREDIT_COSTS[TYPE];

const run = (handler: JobHandler, onlyJobId: string) =>
  runJobs({ handlers: { [TYPE]: handler }, budgetMs: 10_000, minStartMs: 0, onlyJobId });

/** Backoff delays are real; tests make the retry due immediately. */
const makeDue = (id: string) =>
  getDb()
    .update(jobs)
    .set({ runAfter: sql`CURRENT_TIMESTAMP(3)` })
    .where(eq(jobs.id, id));

describe.skipIf(!hasDb)("job runner", () => {
  it("reserves credits on enqueue and keeps them when the job succeeds", async () => {
    const ctx = await createTenant("job-ok");
    const id = await enqueueJob(ctx, TYPE, { productId: "p1" });
    expect(await getBalance(ctx)).toBe(TRIAL_CREDITS - COST);
    expect((await getJob(ctx, id))?.status).toBe("queued");

    const summary = await run(async ({ progress }) => {
      await progress({ step: 1, total: 1, label: "done" });
      return { ok: true };
    }, id);

    expect(summary).toMatchObject({ processed: 1, done: 1 });
    const job = await getJob(ctx, id);
    expect(job).toMatchObject({ status: "done", attempts: 1, result: { ok: true } });
    expect(job?.progress).toEqual({ step: 1, total: 1, label: "done" });
    expect(await getBalance(ctx)).toBe(TRIAL_CREDITS - COST);
  });

  it("retries with backoff, then fails and refunds exactly once", async () => {
    const ctx = await createTenant("job-fail");
    const id = await enqueueJob(ctx, TYPE, {});
    const boom: JobHandler = async () => {
      throw new Error("provider down");
    };

    for (let attempt = 1; attempt < MAX_ATTEMPTS; attempt++) {
      expect(await run(boom, id)).toMatchObject({ retried: 1 });
      const job = await getJob(ctx, id);
      expect(job).toMatchObject({
        status: "queued",
        attempts: attempt,
        lastError: "provider down",
      });
      // Not due yet: backoff holds it back.
      expect(await run(boom, id)).toMatchObject({ processed: 0 });
      await makeDue(id);
    }
    expect(await run(boom, id)).toMatchObject({ failed: 1 });
    expect((await getJob(ctx, id))?.status).toBe("failed");
    expect(await getBalance(ctx)).toBe(TRIAL_CREDITS);

    const refunds = (await listLedger(ctx)).filter((e) => e.reason === "job.refund");
    expect(refunds).toHaveLength(1);
    expect(refunds[0]?.delta).toBe(COST);
  });

  it("fails permanent errors immediately with a refund", async () => {
    const ctx = await createTenant("job-perm");
    const id = await enqueueJob(ctx, TYPE, {});
    await run(async () => {
      throw new PermanentJobError("barcode not found");
    }, id);
    expect(await getJob(ctx, id)).toMatchObject({ status: "failed", attempts: 1 });
    expect(await getBalance(ctx)).toBe(TRIAL_CREDITS);
  });

  it("fails jobs without a handler and refunds", async () => {
    const ctx = await createTenant("job-nohandler");
    const id = await enqueueJob(ctx, TYPE, {});
    await runJobs({ handlers: {}, budgetMs: 10_000, minStartMs: 0, onlyJobId: id });
    expect((await getJob(ctx, id))?.status).toBe("failed");
    expect(await getBalance(ctx)).toBe(TRIAL_CREDITS);
  });

  it("refuses to queue a job the pharmacy can't afford", async () => {
    const ctx = await createTenant("job-broke");
    const affordable = Math.floor(TRIAL_CREDITS / COST);
    for (let i = 0; i < affordable; i++) await enqueueJob(ctx, TYPE, {});
    await expect(enqueueJob(ctx, TYPE, {})).rejects.toBeInstanceOf(InsufficientCreditsError);
    expect(await getBalance(ctx)).toBe(TRIAL_CREDITS - affordable * COST);
  });

  it("never runs a job twice when runners race", async () => {
    const ctx = await createTenant("job-race");
    const id = await enqueueJob(ctx, TYPE, {});
    let calls = 0;
    const slow: JobHandler = async () => {
      calls++;
      await new Promise((r) => setTimeout(r, 200));
      return null;
    };
    const results = await Promise.all([run(slow, id), run(slow, id), run(slow, id)]);
    expect(calls).toBe(1);
    expect(results.reduce((n, r) => n + r.processed, 0)).toBe(1);
  });

  it("requeues jobs whose runner died", async () => {
    const ctx = await createTenant("job-stale");
    const id = await enqueueJob(ctx, TYPE, {});
    await getDb()
      .update(jobs)
      .set({
        status: "running",
        attempts: 1,
        lockToken: crypto.randomUUID(),
        lockedAt: sql`DATE_SUB(CURRENT_TIMESTAMP(3), INTERVAL 10 MINUTE)`,
      })
      .where(eq(jobs.id, id));
    expect(await recoverStaleJobs()).toBeGreaterThanOrEqual(1);
    expect((await getJob(ctx, id))?.status).toBe("queued");
  });

  it("hides jobs from other tenants", async () => {
    const a = await createTenant("job-a");
    const b = await createTenant("job-b");
    const id = await enqueueJob(a, TYPE, {});
    expect(await getJob(a, id)).not.toBeNull();
    expect(await getJob(b, id)).toBeNull();
  });
});
