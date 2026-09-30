import { getTranslations, setRequestLocale } from "next-intl/server";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import type { Locale } from "@/i18n/routing";
import { getPharmacy } from "@/server/repositories/pharmacies";
import { getSession, requireTenant } from "@/server/tenancy";

export default async function DashboardPage({ params }: PageProps<"/[locale]/dashboard">) {
  const locale = (await params).locale as Locale;
  setRequestLocale(locale);
  const ctx = await requireTenant(locale);
  const [session, pharmacy, t, tRoles] = await Promise.all([
    getSession(),
    getPharmacy(ctx),
    getTranslations("dashboard"),
    getTranslations("roles"),
  ]);
  const stats = [
    { label: t("pharmacy"), value: pharmacy?.name ?? "—" },
    { label: t("role"), value: tRoles(ctx.role) },
    {
      label: t("credits"),
      value: new Intl.NumberFormat(locale).format(pharmacy?.creditsBalance ?? 0),
    },
  ];
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">{t("welcome", { name: session?.user.name ?? "" })}</h1>
      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardHeader className="pb-2">
              <CardDescription>{s.label}</CardDescription>
            </CardHeader>
            <CardContent className="text-lg font-semibold">{s.value}</CardContent>
          </Card>
        ))}
      </div>
      <p className="text-sm text-muted-foreground">{t("nextSteps")}</p>
    </div>
  );
}
