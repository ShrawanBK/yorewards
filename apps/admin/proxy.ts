import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { updateSession } from "@repo/supabase/proxy";

export async function proxy(request: NextRequest) {
  if (process.env.NODE_ENV === "development") {
    const { pathname } = request.nextUrl;
    if (
      pathname.startsWith("/_next/webpack-hmr") ||
      pathname.startsWith("/_next/turbopack")
    ) {
      return NextResponse.next({ request });
    }
  }

  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|_next/webpack-hmr|_next/turbopack|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
