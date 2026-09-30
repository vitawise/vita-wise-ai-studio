import { getTranslations } from "next-intl/server";

export async function AuthNotConfigured() {
  const t = await getTranslations("auth");
  return (
    <p role="status" className="rounded-md border border-border bg-muted p-3 text-sm">
      {t("notConfigured")}
    </p>
  );
}
