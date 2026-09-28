import { setRequestLocale } from "next-intl/server";
import { ComingSoon } from "@/components/shell/coming-soon";
import type { Locale } from "@/i18n/routing";
import { requireTenant } from "@/server/tenancy";

export default async function Page({ params }: PageProps<"/[locale]/pricing">) {
  const locale = (await params).locale as Locale;
  setRequestLocale(locale);
  await requireTenant(locale);
  return <ComingSoon module="pricing" />;
}
