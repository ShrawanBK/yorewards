import { redirect } from "next/navigation";
import { getServerAuthUser } from "@/shared/lib/get-server-auth-user";
import { getMerchantsByUserId } from "@repo/supabase/queries/merchants";

export async function requireMerchantSession() {
  const {
    data: { user },
  } = await getServerAuthUser();
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
