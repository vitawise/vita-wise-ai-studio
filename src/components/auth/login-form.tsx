"use client";

import { useTranslations } from "next-intl";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "@/i18n/navigation";
import { authClient } from "@/lib/auth-client";
import { authErrorKey } from "./auth-error";
import { Field, FormError } from "./field";

export function LoginForm() {
  const t = useTranslations("auth");
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setPending(true);
    setError(null);
    const { error } = await authClient.signIn.email({
      email: String(form.get("email")),
      password: String(form.get("password")),
    });
    if (error) {
      setError(t(`errors.${authErrorKey(error)}`));
      setPending(false);
      return;
    }
    router.replace("/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <Field id="email" type="email" label={t("email")} autoComplete="email" dir="ltr" required />
      <Field
        id="password"
        type="password"
        label={t("password")}
        autoComplete="current-password"
        dir="ltr"
        required
      />
      <FormError message={error} />
      <Button type="submit" disabled={pending}>
        {t("loginSubmit")}
      </Button>
    </form>
  );
}
