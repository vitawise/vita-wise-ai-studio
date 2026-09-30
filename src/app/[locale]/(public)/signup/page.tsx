import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AuthNotConfigured } from "@/components/auth/not-configured";
import { AuthCard } from "@/components/auth/auth-card";
import { GoogleButton } from "@/components/auth/google-button";
import { SignupForm } from "@/components/auth/signup-form";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { isAuthConfigured } from "@/server/auth/configured";
import { googleEnabled } from "@/server/auth/auth";
import { redirectIfSignedIn } from "@/server/auth/redirect-if-signed-in";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth");
  return { title: t("signupTitle") };
}

export default async function SignupPage({ params }: PageProps<"/[locale]/signup">) {
  const locale = (await params).locale as Locale;
  setRequestLocale(locale);
  await redirectIfSignedIn(locale);
  const t = await getTranslations("auth");
  return (
    <AuthCard
      title={t("signupTitle")}
      footer={
        <span>
          {t("haveAccount")}{" "}
          <Link href="/login" className="text-primary hover:underline">
            {t("loginTitle")}
          </Link>
        </span>
      }
    >
      {isAuthConfigured() ? (
        <>
          <SignupForm />
          {googleEnabled() && <GoogleButton />}
        </>
      ) : (
        <AuthNotConfigured />
      )}
    </AuthCard>
  );
}
