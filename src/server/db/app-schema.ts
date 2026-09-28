import {
  index,
  int,
  mysqlEnum,
  mysqlTable,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";
import { user } from "./auth-schema";

export const pharmacies = mysqlTable("pharmacies", {
  id: varchar("id", { length: 36 }).primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  slug: varchar("slug", { length: 80 }).notNull().unique(),
  // Plans arrive in Phase 2; nullable until then.
  planId: varchar("plan_id", { length: 36 }),
  creditsBalance: int("credits_balance").notNull().default(0),
  createdAt: timestamp("created_at", { fsp: 3 }).notNull().defaultNow(),
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
    createdAt: timestamp("created_at", { fsp: 3 }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("memberships_user_pharmacy_uq").on(t.userId, t.pharmacyId),
    index("memberships_pharmacy_idx").on(t.pharmacyId),
  ],
);
