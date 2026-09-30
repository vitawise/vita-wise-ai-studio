import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AuthCard } from "@/components/auth/auth-card";
import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { findMembershipForUser } from "@/server/repositories/pharmacies";
import { requireUser } from "@/server/tenancy";
import { OnboardingForm } from "./onboarding-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("onboarding");
  return { title: t("pharmacyName") };
}

export default async function OnboardingPage({ params }: PageProps<"/[locale]/onboarding">) {
  const locale = (await params).locale as Locale;
  setRequestLocale(locale);
  const user = await requireUser(locale);
  if (await findMembershipForUser(user.id)) redirect({ href: "/dashboard", locale });
  const t = await getTranslations("onboarding");
  return (
    <div className="flex min-h-dvh flex-col">
      <AuthCard title={t("title")}>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        <OnboardingForm />
      </AuthCard>
    </div>
  );
}
