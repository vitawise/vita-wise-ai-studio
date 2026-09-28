"use client";

import { useLocale, useTranslations } from "next-intl";
import { useActionState } from "react";
import { Field, FormError } from "@/components/auth/field";
import { Button } from "@/components/ui/button";
import { completeOnboarding, type OnboardingState } from "./actions";

export function OnboardingForm() {
  const t = useTranslations("onboarding");
  const locale = useLocale();
  const [state, action, pending] = useActionState<OnboardingState, FormData>(
    completeOnboarding,
    null,
  );
  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="locale" value={locale} />
      <Field
        id="name"
        label={t("pharmacyName")}
        placeholder={t("placeholder")}
        hint={t("hint")}
        minLength={2}
        maxLength={120}
        required
      />
      <FormError message={state ? t(`errors.${state.error}`) : null} />
      <Button type="submit" disabled={pending}>
        {t("submit")}
      </Button>
    </form>
  );
}
