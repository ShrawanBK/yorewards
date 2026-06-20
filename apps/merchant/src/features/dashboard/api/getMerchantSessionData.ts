import { redirect } from "next/navigation";
import { createClient } from "@repo/supabase/server";
import {
  getMerchantByUserId,
  getMerchantsByUserId,
} from "@repo/supabase/queries/merchants";
import {
  getActiveLocationsByMerchantId,
  resolveActiveLocationForMerchant,
} from "@repo/supabase/queries/locations";

export async function getMerchantSessionData() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/merchant/login");
  }

  const merchants = await getMerchantsByUserId(user.id);
  if (merchants.length === 0) {
    redirect("/merchant/add-business");
  }

  const merchant = await getMerchantByUserId(user.id);
  if (!merchant) {
    redirect("/merchant/add-business");
  }

  const [branches, activeBranch] = await Promise.all([
    getActiveLocationsByMerchantId(merchant.id),
    resolveActiveLocationForMerchant(merchant.id),
  ]);

  return {
    user,
    merchants,
    merchant,
    branches,
    activeBranch,
  };
}
