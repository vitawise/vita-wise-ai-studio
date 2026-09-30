import type { JobType } from "../db/schema";

/** Must match the `trial` row seeded in migration 0002. */
export const TRIAL_PLAN_ID = "trial";
export const TRIAL_CREDITS = 50;
export const TRIAL_DAYS = 14;

/** Credits reserved when a job of this type is queued; refunded if it fails. */
export const CREDIT_COSTS: Record<JobType, number> = {
  "product.research": 3,
  "product.generate_content": 5,
  "product.generate_image": 4,
  "price.check": 2,
  "campaign.generate_text": 3,
  "campaign.generate_image": 4,
  "trends.run": 5,
  "salla.push": 0,
};
