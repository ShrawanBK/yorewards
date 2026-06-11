import { NextResponse } from "next/server";
import { createClient } from "@repo/supabase/server";
import { getMerchantsByUserId } from "@repo/supabase/queries/merchants";

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

  const merchants = await getMerchantsByUserId(user.id);
  if (merchants.length === 0) {
    return NextResponse.redirect(`${origin}/merchant/login?tab=signup`);
  }
  return NextResponse.redirect(`${origin}/merchant/dashboard`);
}
