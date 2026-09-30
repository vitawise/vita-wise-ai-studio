import { getDb } from "@/server/db/client";
import { user } from "@/server/db/schema";
import { createPharmacyWithOwner } from "@/server/repositories/pharmacies";
import { mintTenantContext, type TenantContext } from "@/server/tenant-context";

/** A fresh onboarded pharmacy (owner + trial credits), for DB-backed tests. */
export async function createTenant(label: string): Promise<TenantContext> {
  const userId = crypto.randomUUID();
  await getDb()
    .insert(user)
    .values({ id: userId, name: label, email: `${label}-${userId}@test.local` });
  const membership = await createPharmacyWithOwner(userId, `${label} pharmacy`);
  return mintTenantContext({ userId, ...membership });
}

export const hasDb = Boolean(process.env.DB_NAME);
