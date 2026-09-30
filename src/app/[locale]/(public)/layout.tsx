import { getTranslations } from "next-intl/server";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { Link } from "@/i18n/navigation";

export default async function PublicLayout({ children }: LayoutProps<"/[locale]">) {
  const t = await getTranslations("common");
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex items-center justify-between border-b border-border px-4 py-3 md:px-8">
        <Link href="/" className="font-bold text-primary">
          {t("appName")}
        </Link>
        <LocaleSwitcher className="text-sm text-muted-foreground hover:text-foreground" />
      </header>
      <div className="flex flex-1 flex-col">{children}</div>
    </div>
  );
}
