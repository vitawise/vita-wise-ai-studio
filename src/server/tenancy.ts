import "server-only";
import { headers } from "next/headers";
import { cache } from "react";
import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { getAuth } from "./auth/auth";
import { isAuthConfigured } from "./auth/configured";
import { findMembershipForUser } from "./repositories/pharmacies";
import { mintTenantContext, type TenantContext } from "./tenant-context";

export const getSession = cache(async () => {
  // Read headers first: it opts the route into dynamic rendering before auth/DB init.
  const requestHeaders = await headers();
  if (!isAuthConfigured()) return null;
  return getAuth().api.getSession({ headers: requestHeaders });
});

/** Signed-in user or redirect to login. */
export async function requireUser(locale: Locale) {
  const session = await getSession();
  if (!session) return redirect({ href: "/login", locale });
  return session.user;
}

/** Tenant scope for API routes: null when signed out or not onboarded (caller answers 401). */
export const getTenantContext = cache(async (): Promise<TenantContext | null> => {
  const session = await getSession();
  if (!session) return null;
  const membership = await findMembershipForUser(session.user.id);
  return membership ? mintTenantContext({ userId: session.user.id, ...membership }) : null;
});

/** Tenant scope for every page. Redirects to login / onboarding as needed. */
export const requireTenant = cache(async (locale: Locale): Promise<TenantContext> => {
  const user = await requireUser(locale);
  const membership = await findMembershipForUser(user.id);
  if (!membership) return redirect({ href: "/onboarding", locale });
  return mintTenantContext({ userId: user.id, ...membership });
});

export async function requireOwner(locale: Locale): Promise<TenantContext> {
  const ctx = await requireTenant(locale);
  if (ctx.role !== "owner") return redirect({ href: "/dashboard", locale });
  return ctx;
}
