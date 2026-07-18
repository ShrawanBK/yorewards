"use client";

import { useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { cn } from "@repo/ui/lib/utils";
import {
  APP_LOCALES,
  LOCALE_LABELS,
  type AppLocale,
} from "@/shared/i18n/locales";
import { setLocaleAction } from "@/shared/i18n/setLocaleAction";

export function LocaleSwitcher({ className }: { className?: string }) {
  const t = useTranslations("locale");
  const locale = useLocale() as AppLocale;
  const [pending, startTransition] = useTransition();

  function handleChange(next: AppLocale) {
    if (next === locale) return;
    startTransition(async () => {
      await setLocaleAction(next);
    });
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <label htmlFor="locale-switcher" className="sr-only">
        {t("label")}
      </label>
      <select
        id="locale-switcher"
        value={locale}
        disabled={pending}
        onChange={(e) => handleChange(e.target.value as AppLocale)}
        className="h-11 min-w-[7rem] rounded-md border border-input bg-background px-2 text-sm text-foreground"
        aria-label={t("label")}
      >
        {APP_LOCALES.map((value) => (
          <option key={value} value={value}>
            {LOCALE_LABELS[value]}
          </option>
        ))}
      </select>
    </div>
  );
}
