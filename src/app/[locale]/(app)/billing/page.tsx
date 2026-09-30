import { Check } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Locale } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { getBalance, listLedger } from "@/server/billing/credits";
import { CREDIT_COSTS } from "@/server/billing/plans";
import { getSubscription, listPublicPlans } from "@/server/billing/subscriptions";
import { jobTypes } from "@/server/db/schema";
import { requireTenant } from "@/server/tenancy";

const knownReasons = ["trial.grant", "job.reserve", "job.refund"] as const;
type KnownReason = (typeof knownReasons)[number];
const isKnownReason = (r: string): r is KnownReason =>
  (knownReasons as readonly string[]).includes(r);

// Message keys can't contain dots (next-intl treats them as nesting).
type Underscored<S extends string> = S extends `${infer A}.${infer B}` ? `${A}_${B}` : S;
const messageKey = <S extends string>(s: S) => s.replace(".", "_") as Underscored<S>;

export default async function BillingPage({ params }: PageProps<"/[locale]/billing">) {
  const locale = (await params).locale as Locale;
  setRequestLocale(locale);
  const ctx = await requireTenant(locale);
  const [subscription, balance, ledger, plans, t, tNav] = await Promise.all([
    getSubscription(ctx),
    getBalance(ctx),
    listLedger(ctx),
    listPublicPlans(),
    getTranslations("billing"),
    getTranslations("nav"),
  ]);
  const num = new Intl.NumberFormat(locale);
  const date = new Intl.DateTimeFormat(locale, { dateStyle: "medium" });
  const dateTime = new Intl.DateTimeFormat(locale, { dateStyle: "short", timeStyle: "short" });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">{tNav("billing")}</h1>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t("currentPlan")}</CardDescription>
            <CardTitle>
              {subscription
                ? locale === "ar"
                  ? subscription.planNameAr
                  : subscription.planNameEn
                : "—"}
            </CardTitle>
          </CardHeader>
          {subscription && (
            <CardContent className="text-sm text-muted-foreground">
              {t(`status.${subscription.status}`)} ·{" "}
              {subscription.status === "trialing"
                ? t("trialEnds", { date: date.format(subscription.currentPeriodEnd) })
                : t("renews", { date: date.format(subscription.currentPeriodEnd) })}
            </CardContent>
          )}
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t("balance")}</CardDescription>
            <CardTitle className="text-3xl">{num.format(balance)}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">{t("plans")}</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              className={cn(subscription?.planId === plan.id && "border-primary")}
            >
              <CardHeader>
                <CardTitle>{locale === "ar" ? plan.nameAr : plan.nameEn}</CardTitle>
                <p className="text-2xl font-bold">
                  {num.format(plan.priceSar)}{" "}
                  <span className="text-sm font-normal text-muted-foreground">{t("perMonth")}</span>
                </p>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <ul className="flex flex-col gap-2 text-sm">
                  <li className="flex items-center gap-2">
                    <Check className="size-4 text-primary" aria-hidden />
                    {t("monthlyCredits", { count: num.format(plan.monthlyCredits) })}
                  </li>
                  {plan.features.sallaSync && (
                    <li className="flex items-center gap-2">
                      <Check className="size-4 text-primary" aria-hidden />
                      {t("features.sallaSync")}
                    </li>
                  )}
                  {plan.features.trends && (
                    <li className="flex items-center gap-2">
                      <Check className="size-4 text-primary" aria-hidden />
                      {t("features.trends")}
                    </li>
                  )}
                  <li className="flex items-center gap-2">
                    <Check className="size-4 text-primary" aria-hidden />
                    {t("features.maxUsers", { count: plan.features.maxUsers })}
                  </li>
                </ul>
                <Button variant="outline" disabled>
                  {t("paymentsSoon")}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">{t("vatNote")}</p>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("costs")}</CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="py-2 text-start font-medium">{t("action")}</th>
                  <th className="py-2 text-end font-medium">{t("cost")}</th>
                </tr>
              </thead>
              <tbody>
                {jobTypes.map((type) => (
                  <tr key={type} className="border-b border-border/50">
                    <td className="py-2">{t(`jobTypes.${messageKey(type)}`)}</td>
                    <td className="py-2 text-end">{num.format(CREDIT_COSTS[type])}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("history")}</CardTitle>
          </CardHeader>
          <CardContent>
            {ledger.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("empty")}</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="py-2 text-start font-medium">{t("date")}</th>
                    <th className="py-2 text-start font-medium">{t("reason")}</th>
                    <th className="py-2 text-end font-medium">{t("change")}</th>
                  </tr>
                </thead>
                <tbody>
                  {ledger.map((entry) => (
                    <tr key={entry.id} className="border-b border-border/50">
                      <td className="py-2 whitespace-nowrap">{dateTime.format(entry.createdAt)}</td>
                      <td className="py-2">
                        {isKnownReason(entry.reason)
                          ? t(`reasons.${messageKey(entry.reason)}`)
                          : entry.reason}
                      </td>
                      <td
                        dir="ltr"
                        className={cn(
                          "py-2 text-end font-medium",
                          entry.delta < 0 ? "text-destructive" : "text-primary",
                        )}
                      >
                        {entry.delta > 0 ? "+" : ""}
                        {num.format(entry.delta)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
