import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AuthCard } from "@/components/auth/auth-card";
import { GoogleButton } from "@/components/auth/google-button";
import { LoginForm } from "@/components/auth/login-form";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { googleEnabled } from "@/server/auth/auth";
import { redirectIfSignedIn } from "@/server/auth/redirect-if-signed-in";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth");
  return { title: t("loginTitle") };
}

export default async function LoginPage({ params }: PageProps<"/[locale]/login">) {
  const locale = (await params).locale as Locale;
  setRequestLocale(locale);
  await redirectIfSignedIn(locale);
  const t = await getTranslations("auth");
  return (
    <AuthCard
      title={t("loginTitle")}
      footer={
        <div className="flex flex-col gap-2">
          <Link href="/forgot-password" className="hover:text-foreground">
            {t("forgot")}
          </Link>
          <span>
            {t("noAccount")}{" "}
            <Link href="/signup" className="text-primary hover:underline">
              {t("signupTitle")}
            </Link>
          </span>
        </div>
      }
    >
      <LoginForm />
      {googleEnabled() && <GoogleButton />}
    </AuthCard>
  );
}
