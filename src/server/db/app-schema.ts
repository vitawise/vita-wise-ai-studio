import { sql } from "drizzle-orm";
import {
  boolean,
  datetime,
  index,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  text,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";
import { user } from "./auth-schema";

export const pharmacies = mysqlTable("pharmacies", {
  id: varchar("id", { length: 36 }).primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  slug: varchar("slug", { length: 80 }).notNull().unique(),
  // Cached SUM(credit_ledger.delta), updated in the same transaction as every ledger insert.
  creditsBalance: int("credits_balance").notNull().default(0),
  createdAt: datetime("created_at", { fsp: 3, mode: "date" })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP(3)`),
});

export const membershipRoles = ["owner", "staff"] as const;
export type MembershipRole = (typeof membershipRoles)[number];

export const memberships = mysqlTable(
  "memberships",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    userId: varchar("user_id", { length: 36 })
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    pharmacyId: varchar("pharmacy_id", { length: 36 })
      .notNull()
      .references(() => pharmacies.id, { onDelete: "cascade" }),
    role: mysqlEnum("role", membershipRoles).notNull(),
    createdAt: datetime("created_at", { fsp: 3, mode: "date" })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`),
  },
  (t) => [
    uniqueIndex("memberships_user_pharmacy_uq").on(t.userId, t.pharmacyId),
    index("memberships_pharmacy_idx").on(t.pharmacyId),
  ],
);

const createdAt = () =>
  datetime("created_at", { fsp: 3, mode: "date" })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP(3)`);

export const plans = mysqlTable("plans", {
  id: varchar("id", { length: 32 }).primaryKey(),
  nameAr: varchar("name_ar", { length: 60 }).notNull(),
  nameEn: varchar("name_en", { length: 60 }).notNull(),
  priceSar: int("price_sar").notNull(),
  monthlyCredits: int("monthly_credits").notNull(),
  features: json("features").$type<PlanFeatures>().notNull(),
  isPublic: boolean("is_public").notNull().default(true),
  sortOrder: int("sort_order").notNull().default(0),
});

export type PlanFeatures = {
  sallaSync: boolean;
  trends: boolean;
  maxUsers: number;
};

export const subscriptionStatuses = ["trialing", "active", "past_due", "canceled"] as const;
export type SubscriptionStatus = (typeof subscriptionStatuses)[number];

export const subscriptions = mysqlTable("subscriptions", {
  pharmacyId: varchar("pharmacy_id", { length: 36 })
    .primaryKey()
    .references(() => pharmacies.id, { onDelete: "cascade" }),
  planId: varchar("plan_id", { length: 32 })
    .notNull()
    .references(() => plans.id),
  status: mysqlEnum("status", subscriptionStatuses).notNull(),
  currentPeriodEnd: datetime("current_period_end", { fsp: 3, mode: "date" }).notNull(),
  // Encrypted card token for recurring charges (Moyasar integration, pending docs verification).
  moyasarTokenEnc: text("moyasar_token_enc"),
  createdAt: createdAt(),
});

export const creditLedger = mysqlTable(
  "credit_ledger",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    pharmacyId: varchar("pharmacy_id", { length: 36 })
      .notNull()
      .references(() => pharmacies.id, { onDelete: "cascade" }),
    delta: int("delta").notNull(),
    reason: varchar("reason", { length: 40 }).notNull(),
    refType: varchar("ref_type", { length: 40 }),
    refId: varchar("ref_id", { length: 36 }),
    createdAt: createdAt(),
  },
  (t) => [
    index("credit_ledger_pharmacy_idx").on(t.pharmacyId, t.createdAt),
    // One entry per (reason, reference): makes reserve/refund idempotent.
    uniqueIndex("credit_ledger_ref_uq").on(t.refType, t.refId, t.reason),
  ],
);

export const jobTypes = [
  "product.research",
  "product.generate_content",
  "product.generate_image",
  "price.check",
  "campaign.generate_text",
  "campaign.generate_image",
  "trends.run",
  "salla.push",
] as const;
export type JobType = (typeof jobTypes)[number];

export const jobStatuses = ["queued", "running", "done", "failed"] as const;
export type JobStatus = (typeof jobStatuses)[number];

export type JobProgress = { step: number; total: number; label: string };

export const jobs = mysqlTable(
  "jobs",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    pharmacyId: varchar("pharmacy_id", { length: 36 })
      .notNull()
      .references(() => pharmacies.id, { onDelete: "cascade" }),
    type: varchar("type", { length: 64 }).$type<JobType>().notNull(),
    payload: json("payload").$type<unknown>().notNull(),
    status: mysqlEnum("status", jobStatuses).notNull().default("queued"),
    attempts: int("attempts").notNull().default(0),
    creditsReserved: int("credits_reserved").notNull().default(0),
    lastError: text("last_error"),
    result: json("result").$type<unknown>(),
    progress: json("progress").$type<JobProgress>(),
    lockToken: varchar("lock_token", { length: 36 }),
    lockedAt: datetime("locked_at", { fsp: 3, mode: "date" }),
    runAfter: datetime("run_after", { fsp: 3, mode: "date" })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`),
    createdAt: createdAt(),
  },
  (t) => [
    index("jobs_status_created_idx").on(t.status, t.createdAt),
    index("jobs_pharmacy_idx").on(t.pharmacyId, t.createdAt),
  ],
);
