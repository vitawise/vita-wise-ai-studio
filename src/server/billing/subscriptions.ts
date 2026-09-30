import "server-only";
import { asc, eq } from "drizzle-orm";
import { getDb } from "../db/client";
import { plans, subscriptions } from "../db/schema";
import type { TenantContext } from "../tenant-context";

export async function getSubscription(ctx: TenantContext) {
  const [row] = await getDb()
    .select({
      status: subscriptions.status,
      currentPeriodEnd: subscriptions.currentPeriodEnd,
      planId: plans.id,
      planNameAr: plans.nameAr,
      planNameEn: plans.nameEn,
      monthlyCredits: plans.monthlyCredits,
    })
    .from(subscriptions)
    .innerJoin(plans, eq(plans.id, subscriptions.planId))
    .where(eq(subscriptions.pharmacyId, ctx.pharmacyId))
    .limit(1);
  return row ?? null;
}

export async function listPublicPlans() {
  return getDb()
    .select({
      id: plans.id,
      nameAr: plans.nameAr,
      nameEn: plans.nameEn,
      priceSar: plans.priceSar,
      monthlyCredits: plans.monthlyCredits,
      features: plans.features,
    })
    .from(plans)
    .where(eq(plans.isPublic, true))
    .orderBy(asc(plans.sortOrder));
}
