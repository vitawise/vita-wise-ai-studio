import { useTranslations } from "next-intl";

/** Required wherever AI output appears (CLAUDE.md §6). */
export function AiDisclaimer() {
  const t = useTranslations("landing");
  return <p className="text-xs text-muted-foreground">{t("disclaimer")}</p>;
}
