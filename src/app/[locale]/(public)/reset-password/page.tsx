import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AuthCard } from "@/components/auth/auth-card";
import { ResetForm } from "@/components/auth/reset-form";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth");
  return { title: t("resetTitle") };
}

export default async function ResetPasswordPage({
  params,
  searchParams,
}: PageProps<"/[locale]/reset-password">) {
  setRequestLocale((await params).locale as Locale);
  const { token, error } = await searchParams;
  const t = await getTranslations("auth");
  const validToken = typeof token === "string" && token.length > 0 && !error;
  return (
    <AuthCard
      title={t("resetTitle")}
      footer={
        <Link href={validToken ? "/login" : "/forgot-password"} className="hover:text-foreground">
          {validToken ? t("backToLogin") : t("forgotTitle")}
        </Link>
      }
    >
      {validToken ? <ResetForm token={token} /> : <p className="text-sm">{t("invalidToken")}</p>}
    </AuthCard>
  );
}
