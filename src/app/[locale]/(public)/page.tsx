import { getTranslations, setRequestLocale } from "next-intl/server";
import { AiDisclaimer } from "@/components/disclaimer";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

export default async function LandingPage({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  const t = await getTranslations("landing");
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center gap-6 px-4 py-16">
      <h1 className="text-3xl font-bold leading-tight md:text-4xl">{t("title")}</h1>
      <p className="text-lg text-muted-foreground">{t("subtitle")}</p>
      <div className="flex flex-wrap gap-3">
        <Button asChild size="lg">
          <Link href="/signup">{t("ctaSignup")}</Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/login">{t("ctaLogin")}</Link>
        </Button>
      </div>
      <AiDisclaimer />
    </main>
  );
}
