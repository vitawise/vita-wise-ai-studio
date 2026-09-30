import { getTranslations } from "next-intl/server";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { SidebarNav } from "@/components/shell/sidebar-nav";
import { SignOutButton } from "@/components/shell/sign-out-button";
import type { Locale } from "@/i18n/routing";
import { getPharmacy } from "@/server/repositories/pharmacies";
import { requireTenant } from "@/server/tenancy";

// Layouts are not re-rendered on client navigation, so every page also calls requireTenant().
export default async function AppLayout({ children, params }: LayoutProps<"/[locale]">) {
  const locale = (await params).locale as Locale;
  const ctx = await requireTenant(locale);
  const [pharmacy, t] = await Promise.all([getPharmacy(ctx), getTranslations("common")]);

  return (
    <div className="flex min-h-dvh flex-col md:flex-row">
      <aside className="flex flex-col gap-4 border-b border-border p-4 md:sticky md:top-0 md:h-dvh md:w-64 md:shrink-0 md:border-b-0 md:border-e">
        <div className="flex items-center justify-between md:flex-col md:items-start md:gap-1">
          <span className="font-bold text-primary">{t("appName")}</span>
          <span className="truncate text-sm text-muted-foreground">{pharmacy?.name}</span>
        </div>
        <SidebarNav />
        <div className="hidden flex-col gap-2 md:mt-auto md:flex">
          <LocaleSwitcher className="px-3 text-sm text-muted-foreground hover:text-foreground" />
          <SignOutButton />
        </div>
      </aside>
      <main className="flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
      <div className="flex items-center justify-between border-t border-border px-4 py-3 md:hidden">
        <LocaleSwitcher className="text-sm text-muted-foreground" />
        <SignOutButton />
      </div>
    </div>
  );
}
