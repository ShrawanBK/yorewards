import { getRequestConfig } from "next-intl/server";

export default getRequestConfig(async () => ({
  locale: "en",
  // Fixed timeZone keeps next-intl date formatting deterministic across
  // server render and client hydration (avoids hydration mismatches).
  timeZone: "Asia/Kathmandu",
  messages: (await import("../messages/en.json")).default,
}));
