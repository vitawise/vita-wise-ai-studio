import { eq, inArray } from "drizzle-orm";
import { beforeAll, describe, expect, it } from "vitest";
import { getDb } from "../db/client";
import { pharmacies, user } from "../db/schema";
import { mintTenantContext, type TenantContext } from "../tenant-context";
import {
  AlreadyOnboardedError,
  createPharmacyWithOwner,
  findMembershipForUser,
  getPharmacy,
  listMembers,
} from "./pharmacies";

// Needs a migrated MySQL/MariaDB: set DB_HOST/DB_USER/DB_PASSWORD/DB_NAME (CI provides one).
const hasDb = Boolean(process.env.DB_NAME);

async function createUser(label: string) {
  const id = crypto.randomUUID();
  await getDb()
    .insert(user)
    .values({ id, name: label, email: `${label}-${id}@test.local` });
  return id;
}

describe.skipIf(!hasDb)("pharmacies repository — tenant isolation", () => {
  let ctxA: TenantContext;
  let ctxB: TenantContext;
  let userA: string;
  let userB: string;

  beforeAll(async () => {
    userA = await createUser("owner-a");
    userB = await createUser("owner-b");
    const a = await createPharmacyWithOwner(userA, "Pharmacy A");
    const b = await createPharmacyWithOwner(userB, "صيدلية ب");
    ctxA = mintTenantContext({ userId: userA, ...a });
    ctxB = mintTenantContext({ userId: userB, ...b });
    return async () => {
      await getDb()
        .delete(pharmacies)
        .where(inArray(pharmacies.id, [a.pharmacyId, b.pharmacyId]));
      await getDb()
        .delete(user)
        .where(inArray(user.id, [userA, userB]));
    };
  });

  it("makes the onboarding user the owner", async () => {
    expect(await findMembershipForUser(userA)).toEqual({
      pharmacyId: ctxA.pharmacyId,
      role: "owner",
    });
  });

  it("returns only the caller's pharmacy", async () => {
    expect((await getPharmacy(ctxA))?.name).toBe("Pharmacy A");
    expect((await getPharmacy(ctxB))?.name).toBe("صيدلية ب");
  });

  it("never lists another tenant's members", async () => {
    const membersA = await listMembers(ctxA);
    const membersB = await listMembers(ctxB);
    expect(membersA.map((m) => m.userId)).toEqual([userA]);
    expect(membersB.map((m) => m.userId)).toEqual([userB]);
  });

  it("allows onboarding only once per user", async () => {
    await expect(createPharmacyWithOwner(userA, "Second")).rejects.toBeInstanceOf(
      AlreadyOnboardedError,
    );
    const rows = await getDb()
      .select({ id: pharmacies.id })
      .from(pharmacies)
      .where(eq(pharmacies.name, "Second"));
    expect(rows).toHaveLength(0);
  });
});
