import {
  createServerClient,
  type CookieMethodsServer,
  type CookieOptions,
} from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseAuthCookieOptions } from "./auth-cookie";

/** Refresh Supabase Auth session — use from app `proxy.ts` (Next.js 16). */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return supabaseResponse;
  }

  const cookieMethods = {
    getAll() {
      return request.cookies.getAll();
    },
    setAll(
      cookiesToSet: { name: string; value: string; options: CookieOptions }[],
      headers: Record<string, string>,
    ) {
      cookiesToSet.forEach(({ name, value }) => {
        request.cookies.set(name, value);
      });
      supabaseResponse = NextResponse.next({ request });
      cookiesToSet.forEach(({ name, value, options }) => {
        supabaseResponse.cookies.set(name, value, options);
      });
      Object.entries(headers).forEach(([key, value]) => {
        supabaseResponse.headers.set(key, value);
      });
    },
  } satisfies CookieMethodsServer;

  const supabase = createServerClient(url, anonKey, {
    cookieOptions: getSupabaseAuthCookieOptions(),
    cookies: cookieMethods,
  });

  await supabase.auth.getUser();

  return supabaseResponse;
}
