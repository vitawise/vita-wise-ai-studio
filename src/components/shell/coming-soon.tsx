import { getTranslations } from "next-intl/server";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { NavKey } from "./nav-items";

export async function ComingSoon({ module }: { module: NavKey }) {
  const [tNav, t] = await Promise.all([getTranslations("nav"), getTranslations("comingSoon")]);
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">{tNav(module)}</h1>
      <Card>
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
          <CardDescription>{t("body")}</CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
