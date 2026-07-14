export const APP_LOCALES = ["en", "ne", "fi"] as const;

export type AppLocale = (typeof APP_LOCALES)[number];

export const LOCALE_COOKIE = "NEXT_LOCALE";

export function resolveAppLocale(raw?: string | null): AppLocale {
  if (raw && APP_LOCALES.includes(raw as AppLocale)) {
    return raw as AppLocale;
  }
  return "en";
}

export const LOCALE_LABELS: Record<AppLocale, string> = {
  en: "English",
  ne: "नेपाली",
  fi: "Suomi",
};
