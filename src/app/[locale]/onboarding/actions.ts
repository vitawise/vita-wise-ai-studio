"use server";

import { z } from "zod";
import { redirect } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { logger } from "@/server/logger";
import { AlreadyOnboardedError, createPharmacyWithOwner } from "@/server/repositories/pharmacies";
import { getSession } from "@/server/tenancy";

const inputSchema = z.object({
  name: z.string().trim().min(2).max(120),
  locale: z.enum(routing.locales),
});

export type OnboardingState = { error: "invalid" | "generic" } | null;

export async function completeOnboarding(
  _prev: OnboardingState,
  formData: FormData,
): Promise<OnboardingState> {
  const parsed = inputSchema.safeParse({
    name: formData.get("name"),
    locale: formData.get("locale"),
  });
  if (!parsed.success) return { error: "invalid" };
  const { name, locale } = parsed.data;

  // userId comes from the session, never from the form.
  const session = await getSession();
  if (!session) return redirect({ href: "/login", locale });

  try {
    await createPharmacyWithOwner(session.user.id, name);
  } catch (err) {
    if (!(err instanceof AlreadyOnboardedError)) {
      logger.error({ err, userId: session.user.id }, "onboarding failed");
      return { error: "generic" };
    }
  }
  return redirect({ href: "/dashboard", locale });
}
