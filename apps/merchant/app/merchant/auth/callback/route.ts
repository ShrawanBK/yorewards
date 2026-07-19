import { NextResponse } from "next/server";
import { createClient } from "@repo/supabase/server";
import { resolvePostAuthRedirect } from "@/features/auth/api/resolvePostAuthRedirect";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const supabase = await createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(`${origin}/merchant/login?error=auth`);
    }
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(`${origin}/merchant/login`);
  }

  const redirectPath = await resolvePostAuthRedirect(
    user.id,
    user.email ?? "",
  );
  return NextResponse.redirect(`${origin}${redirectPath}`);
}
