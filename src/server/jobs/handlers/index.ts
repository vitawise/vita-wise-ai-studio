import type { JobType } from "../../db/schema";
import type { JobHandler } from "../runner";

/**
 * Handlers by job type. Each module (Product Studio, Pricing, …) registers its
 * handlers here as it ships; a job without a handler fails permanently and is refunded.
 * Handlers must be idempotent: a retried job may run again after a partial attempt.
 */
export const jobHandlers: Partial<Record<JobType, JobHandler>> = {};
