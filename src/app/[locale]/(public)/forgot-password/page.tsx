import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AuthNotConfigured } from "@/components/auth/not-configured";
import { AuthCard } from "@/components/auth/auth-card";
import { ForgotForm } from "@/components/auth/forgot-form";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { isAuthConfigured } from "@/server/auth/configured";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth");
  return { title: t("forgotTitle") };
}

export default async function ForgotPasswordPage({
  params,
}: PageProps<"/[locale]/forgot-password">) {
  setRequestLocale((await params).locale as Locale);
  const t = await getTranslations("auth");
  return (
    <AuthCard
      title={t("forgotTitle")}
      footer={
        <Link href="/login" className="hover:text-foreground">
          {t("backToLogin")}
        </Link>
      }
    >
      {isAuthConfigured() ? <ForgotForm /> : <AuthNotConfigured />}
    </AuthCard>
  );
}
