import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AuthCard } from "@/components/auth/auth-card";
import { ForgotForm } from "@/components/auth/forgot-form";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

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
      <ForgotForm />
    </AuthCard>
  );
}
