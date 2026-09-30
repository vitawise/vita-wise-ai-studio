import "server-only";
import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { getSession } from "../tenancy";

export async function redirectIfSignedIn(locale: Locale) {
  if (await getSession()) redirect({ href: "/dashboard", locale });
}
