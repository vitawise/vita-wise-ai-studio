import type { MembershipRole } from "./db/schema";

declare const tenantBrand: unique symbol;

/**
 * Proof that pharmacyId came from the signed-in user's membership.
 * Only `src/server/tenancy.ts` mints it; repositories accept nothing else,
 * so a pharmacyId from client input can't reach a query.
 */
export type TenantContext = {
  readonly userId: string;
  readonly pharmacyId: string;
  readonly role: MembershipRole;
  readonly [tenantBrand]: true;
};

export function mintTenantContext(ctx: {
  userId: string;
  pharmacyId: string;
  role: MembershipRole;
}): TenantContext {
  return ctx as TenantContext;
}
