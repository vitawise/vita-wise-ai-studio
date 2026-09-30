"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";

export function LocaleSwitcher({ className }: { className?: string }) {
  const t = useTranslations("common");
  const locale = useLocale();
  const pathname = usePathname();
  return (
    <Link href={pathname} locale={locale === "ar" ? "en" : "ar"} className={className}>
      {t("switchLocale")}
    </Link>
  );
}
