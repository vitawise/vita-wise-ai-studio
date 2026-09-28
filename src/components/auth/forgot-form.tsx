"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { authErrorKey } from "./auth-error";
import { Field, FormError } from "./field";

export function ForgotForm() {
  const t = useTranslations("auth");
  const locale = useLocale();
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setPending(true);
    setError(null);
    const { error } = await authClient.requestPasswordReset({
      email: String(form.get("email")).trim(),
      redirectTo: `/${locale}/reset-password`,
    });
    setPending(false);
    if (error) setError(t(`errors.${authErrorKey(error)}`));
    else setSent(true);
  }

  if (sent) return <p className="text-sm">{t("forgotSent")}</p>;

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <Field id="email" type="email" label={t("email")} autoComplete="email" dir="ltr" required />
      <FormError message={error} />
      <Button type="submit" disabled={pending}>
        {t("forgotSubmit")}
      </Button>
    </form>
  );
}
