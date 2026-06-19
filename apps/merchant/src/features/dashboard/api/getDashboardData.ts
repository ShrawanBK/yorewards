import {
  getLocationsByMerchantId,
} from "@repo/supabase/queries/locations";
import { getLoyaltyCardByMerchantId } from "@repo/supabase/queries/loyalty-cards";
import { getMerchantSessionData } from "@/features/dashboard/api/getMerchantSessionData";

export async function getDashboardData() {
  const { merchants, merchant } = await getMerchantSessionData();

  const [locations, loyaltyCard] = await Promise.all([
    getLocationsByMerchantId(merchant.id),
    getLoyaltyCardByMerchantId(merchant.id),
  ]);

  const activeBranchCount = locations.filter((l) => l.is_active).length;
  const loyaltyCardConfigured =
    !!loyaltyCard &&
    loyaltyCard.stamp_target > 0 &&
    loyaltyCard.reward_description.trim().length > 0;

  return {
    merchants,
    merchant,
    metrics: {
      branchCount: locations.length,
      activeBranchCount,
      loyaltyCardConfigured,
      loyaltyCardName: loyaltyCard?.card_name ?? null,
    },
  };
}
