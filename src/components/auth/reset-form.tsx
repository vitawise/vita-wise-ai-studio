"use client";

import { useTranslations } from "next-intl";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { authClient } from "@/lib/auth-client";
import { authErrorKey } from "./auth-error";
import { Field, FormError } from "./field";
import { MIN_PASSWORD_LENGTH } from "./signup-form";

export function ResetForm({ token }: { token: string }) {
  const t = useTranslations("auth");
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setPending(true);
    setError(null);
    const { error } = await authClient.resetPassword({
      token,
      newPassword: String(form.get("password")),
    });
    setPending(false);
    if (!error) setDone(true);
    else if (error.code === "INVALID_TOKEN") setError(t("invalidToken"));
    else setError(t(`errors.${authErrorKey(error)}`));
  }

  if (done) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-sm">{t("resetDone")}</p>
        <Button asChild>
          <Link href="/login">{t("loginSubmit")}</Link>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <Field
        id="password"
        type="password"
        label={t("newPassword")}
        hint={t("passwordHint")}
        autoComplete="new-password"
        minLength={MIN_PASSWORD_LENGTH}
        dir="ltr"
        required
      />
      <FormError message={error} />
      <Button type="submit" disabled={pending}>
        {t("resetSubmit")}
      </Button>
    </form>
  );
}
