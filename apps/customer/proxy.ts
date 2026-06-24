import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { updateSession } from "@repo/supabase/proxy";

export async function proxy(request: NextRequest) {
  if (process.env.NODE_ENV === "development") {
    const { pathname } = request.nextUrl;
    if (pathname === "/sw.js" || pathname.startsWith("/workbox-")) {
      return new NextResponse(null, { status: 404 });
    }
  }

  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
