import { getTranslations, setRequestLocale } from "next-intl/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Locale } from "@/i18n/routing";
import { getPharmacy, listMembers } from "@/server/repositories/pharmacies";
import { requireTenant } from "@/server/tenancy";

export default async function SettingsPage({ params }: PageProps<"/[locale]/settings">) {
  const locale = (await params).locale as Locale;
  setRequestLocale(locale);
  const ctx = await requireTenant(locale);
  const [pharmacy, members, t, tNav, tRoles] = await Promise.all([
    getPharmacy(ctx),
    listMembers(ctx),
    getTranslations("settings"),
    getTranslations("nav"),
    getTranslations("roles"),
  ]);
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">{tNav("settings")}</h1>
      <Card>
        <CardHeader>
          <CardTitle>{t("profile")}</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
            <dt className="text-muted-foreground">{t("name")}</dt>
            <dd>{pharmacy?.name}</dd>
            <dt className="text-muted-foreground">{t("slug")}</dt>
            <dd dir="ltr" className="text-start font-mono">
              {pharmacy?.slug}
            </dd>
          </dl>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>{t("team")}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="py-2 text-start font-medium">{t("name")}</th>
                <th className="py-2 text-start font-medium">{t("email")}</th>
                <th className="py-2 text-start font-medium">{t("role")}</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.userId} className="border-b border-border/50">
                  <td className="py-2">{m.name}</td>
                  <td className="py-2" dir="ltr">
                    {m.email}
                  </td>
                  <td className="py-2">{tRoles(m.role)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-xs text-muted-foreground">{t("invitesSoon")}</p>
        </CardContent>
      </Card>
    </div>
  );
}
