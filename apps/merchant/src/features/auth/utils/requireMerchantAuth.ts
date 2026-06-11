import { redirect } from "next/navigation";
import { createClient } from "@repo/supabase/server";
import { getMerchantsByUserId } from "@repo/supabase/queries/merchants";

export async function requireMerchantSession() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/merchant/login");
  }
  return { user };
}

export async function requireMerchantWithBusiness() {
  const { user } = await requireMerchantSession();
  const merchants = await getMerchantsByUserId(user.id);
  if (merchants.length === 0) {
    redirect("/merchant/add-business");
  }
  return { user, merchants };
}

/** @deprecated Use requireMerchantSession or requireMerchantWithBusiness */
export const requireMerchantAuth = requireMerchantWithBusiness;
