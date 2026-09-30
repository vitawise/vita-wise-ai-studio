"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "@/i18n/navigation";
import { authClient } from "@/lib/auth-client";
import { authErrorKey } from "./auth-error";
import { Field, FormError } from "./field";

export const MIN_PASSWORD_LENGTH = 10;

export function SignupForm() {
  const t = useTranslations("auth");
  const locale = useLocale();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setPending(true);
    setError(null);
    const { error } = await authClient.signUp.email({
      name: String(form.get("name")).trim(),
      email: String(form.get("email")).trim(),
      password: String(form.get("password")),
      callbackURL: `/${locale}/onboarding`,
    });
    if (error) {
      setError(t(`errors.${authErrorKey(error)}`));
      setPending(false);
      return;
    }
    router.replace("/onboarding");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <Field id="name" label={t("name")} autoComplete="name" required maxLength={100} />
      <Field id="email" type="email" label={t("email")} autoComplete="email" dir="ltr" required />
      <Field
        id="password"
        type="password"
        label={t("password")}
        hint={t("passwordHint")}
        autoComplete="new-password"
        minLength={MIN_PASSWORD_LENGTH}
        dir="ltr"
        required
      />
      <FormError message={error} />
      <Button type="submit" disabled={pending}>
        {t("signupSubmit")}
      </Button>
    </form>
  );
}
