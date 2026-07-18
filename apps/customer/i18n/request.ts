import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";
import { deepMergeMessages } from "@repo/utils/deep-merge-messages";
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
    messages: deepMergeMessages(
      en as Record<string, unknown>,
      overlay as Record<string, unknown>,
    ),
  };
});
