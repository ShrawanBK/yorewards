import {
  createServerClient,
  type CookieMethodsServer,
  type CookieOptions,
} from "@supabase/ssr";
import { cookies } from "next/headers";

import { getSupabaseAuthCookieOptions } from "./auth-cookie";
import type { Database } from "./types";

export async function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY",
    );
  }

  const cookieStore = await cookies();

  const cookieMethods = {
    getAll() {
      return cookieStore.getAll();
    },
    setAll(
      cookiesToSet: { name: string; value: string; options: CookieOptions }[],
      headers: Record<string, string>,
    ) {
      void headers;
      try {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, options);
        });
      } catch {
        // Server Components cannot set cookies — proxy.ts refreshes sessions.
      }
    },
  } satisfies CookieMethodsServer;

  return createServerClient<Database>(url, anonKey, {
    cookieOptions: getSupabaseAuthCookieOptions(),
    cookies: cookieMethods,
  });
}
