"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

export function GoogleButton() {
  const t = useTranslations();
  const locale = useLocale();
  const [pending, setPending] = useState(false);
  return (
    <>
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        {t("common.or")}
        <span className="h-px flex-1 bg-border" />
      </div>
      <Button
        type="button"
        variant="outline"
        disabled={pending}
        onClick={async () => {
          setPending(true);
          const { error } = await authClient.signIn.social({
            provider: "google",
            callbackURL: `/${locale}/dashboard`,
          });
          if (error) setPending(false);
        }}
      >
        {t("auth.google")}
      </Button>
    </>
  );
}
