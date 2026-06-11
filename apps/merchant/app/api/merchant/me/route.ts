import { NextResponse } from "next/server";
import { createClient } from "@repo/supabase/server";
import {
  getMerchantByUserId,
  getMerchantsByUserId,
} from "@repo/supabase/queries/merchants";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ merchant: null, merchants: [] });
  }

  const [merchants, merchant] = await Promise.all([
    getMerchantsByUserId(user.id),
    getMerchantByUserId(user.id),
  ]);

  return NextResponse.json({ merchant, merchants });
}
