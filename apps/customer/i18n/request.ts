import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";
import { LOCALE_COOKIE, resolveAppLocale } from "@/shared/i18n/locales";

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const locale = resolveAppLocale(cookieStore.get(LOCALE_COOKIE)?.value);
  const en = (await import("../messages/en.json")).default;

  if (locale === "en") {
    return { locale, messages: en };
  }

  const overlay = (await import(`../messages/${locale}.json`)).default;

  return {
    locale,
    messages: {
      ...en,
      ...overlay,
      nav: { ...en.nav, ...overlay.nav },
      auth: { ...en.auth, ...overlay.auth },
      scan: { ...en.scan, ...overlay.scan },
      stamp: { ...en.stamp, ...overlay.stamp },
      dispute: { ...en.dispute, ...overlay.dispute },
      errors: {
        ...en.errors,
        actions: { ...en.errors.actions, ...overlay.errors?.actions },
      },
    },
  };
});
