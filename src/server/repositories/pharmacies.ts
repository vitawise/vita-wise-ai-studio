import "server-only";
import { asc, eq, sql } from "drizzle-orm";
import { pharmacySlug } from "@/lib/slug";
import { getDb } from "../db/client";
import { appendLedger } from "../billing/credits";
import { TRIAL_CREDITS, TRIAL_DAYS, TRIAL_PLAN_ID } from "../billing/plans";
import { memberships, pharmacies, subscriptions, user, type MembershipRole } from "../db/schema";
import type { TenantContext } from "../tenant-context";

export type Membership = { pharmacyId: string; role: MembershipRole };

/** The user's pharmacy (one per user for now). Used to build the TenantContext. */
export async function findMembershipForUser(userId: string): Promise<Membership | null> {
  const [row] = await getDb()
    .select({ pharmacyId: memberships.pharmacyId, role: memberships.role })
    .from(memberships)
    .where(eq(memberships.userId, userId))
    .orderBy(asc(memberships.createdAt))
    .limit(1);
  return row ?? null;
}

export class AlreadyOnboardedError extends Error {
  constructor() {
    super("User already belongs to a pharmacy");
    this.name = "AlreadyOnboardedError";
  }
}

/** Onboarding: creates the pharmacy, makes the user its owner and starts the free trial. Runs once per user. */
export async function createPharmacyWithOwner(userId: string, name: string): Promise<Membership> {
  return getDb().transaction(async (tx) => {
    // Lock the user's own row (not an empty index range, which deadlocks concurrent sign-ups)
    // so two onboarding submits for the same user run one after the other.
    await tx.select({ id: user.id }).from(user).where(eq(user.id, userId)).for("update");
    const existing = await tx
      .select({ id: memberships.id })
      .from(memberships)
      .where(eq(memberships.userId, userId))
      .limit(1);
    if (existing.length > 0) throw new AlreadyOnboardedError();

    const pharmacyId = crypto.randomUUID();
    await tx.insert(pharmacies).values({ id: pharmacyId, name, slug: pharmacySlug(name) });
    await tx
      .insert(memberships)
      .values({ id: crypto.randomUUID(), userId, pharmacyId, role: "owner" });
    await tx.insert(subscriptions).values({
      pharmacyId,
      planId: TRIAL_PLAN_ID,
      status: "trialing",
      currentPeriodEnd: sql`DATE_ADD(CURRENT_TIMESTAMP(3), INTERVAL ${TRIAL_DAYS} DAY)`,
    });
    await appendLedger(tx, pharmacyId, {
      delta: TRIAL_CREDITS,
      reason: "trial.grant",
      refType: "pharmacy",
      refId: pharmacyId,
    });
    return { pharmacyId, role: "owner" };
  });
}

export async function getPharmacy(ctx: TenantContext) {
  const [row] = await getDb()
    .select({
      id: pharmacies.id,
      name: pharmacies.name,
      slug: pharmacies.slug,
      creditsBalance: pharmacies.creditsBalance,
      createdAt: pharmacies.createdAt,
    })
    .from(pharmacies)
    .where(eq(pharmacies.id, ctx.pharmacyId))
    .limit(1);
  return row ?? null;
}

export async function listMembers(ctx: TenantContext) {
  return getDb()
    .select({ userId: user.id, name: user.name, email: user.email, role: memberships.role })
    .from(memberships)
    .innerJoin(user, eq(user.id, memberships.userId))
    .where(eq(memberships.pharmacyId, ctx.pharmacyId))
    .orderBy(asc(memberships.createdAt));
}
