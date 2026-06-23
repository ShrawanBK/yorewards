import type { CookieOptionsWithName } from "@supabase/ssr";

export type YorewardsApp = "customer" | "merchant" | "admin";

const AUTH_COOKIE_BY_APP: Record<YorewardsApp, string> = {
  customer: "sb-yorewards-customer-auth-token",
  merchant: "sb-yorewards-merchant-auth-token",
  admin: "sb-yorewards-admin-auth-token",
};

function getConfiguredApp(): YorewardsApp | null {
  const app = process.env.NEXT_PUBLIC_YOREWARDS_APP;
  if (app === "customer" || app === "merchant" || app === "admin") {
    return app;
  }
  return null;
}

/**
 * Per-app Supabase auth cookie name. Required for local dev where customer (:3000),
 * merchant (:3001), and admin (:3002) share the same host and would otherwise
 * overwrite a single default `sb-<ref>-auth-token` cookie.
 */
export function getSupabaseAuthCookieName(): string {
  const explicit = process.env.NEXT_PUBLIC_SUPABASE_AUTH_COOKIE_NAME?.trim();
  if (explicit) return explicit;

  const app = getConfiguredApp();
  if (app) return AUTH_COOKIE_BY_APP[app];

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const match = url.match(/https?:\/\/([^.]+)\.supabase\.co/);
  if (match?.[1]) {
    return `sb-${match[1]}-auth-token`;
  }

  return "sb-yorewards-auth-token";
}

export function getSupabaseAuthCookieOptions(): CookieOptionsWithName {
  return { name: getSupabaseAuthCookieName() };
}
