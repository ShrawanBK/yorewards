import {
  getLocationsByMerchantId,
} from "@repo/supabase/queries/locations";
import { getLoyaltyCardByMerchantId } from "@repo/supabase/queries/loyalty-cards";
import { getPendingStampSessions } from "@repo/supabase/queries/stamps";
import { getMerchantAnalyticsSummary } from "@repo/supabase/queries/analytics";
import { getMerchantSessionData } from "@/features/dashboard/api/getMerchantSessionData";

export async function getDashboardData() {
  const { merchants, merchant, activeBranch, user } =
    await getMerchantSessionData();

  const [locations, loyaltyCard, pendingQueue, analyticsSummary] =
    await Promise.all([
      getLocationsByMerchantId(merchant.id),
      getLoyaltyCardByMerchantId(merchant.id),
      merchant.status === "active"
        ? getPendingStampSessions(merchant.id)
        : Promise.resolve([]),
      getMerchantAnalyticsSummary(merchant.id),
    ]);

  const activeBranchCount = locations.filter((l) => l.is_active).length;
  const loyaltyCardConfigured =
    !!loyaltyCard &&
    loyaltyCard.stamp_target > 0 &&
    loyaltyCard.reward_description.trim().length > 0;

  return {
    merchants,
    merchant,
    activeBranch,
    user,
    pendingQueue,
    metrics: {
      branchCount: locations.length,
      activeBranchCount,
      loyaltyCardConfigured,
      loyaltyCardName: loyaltyCard?.card_name ?? null,
      activeCollectors: analyticsSummary.activeCollectors,
      stampsThisWeek: analyticsSummary.stampsIssued.week,
      redeemedThisWeek: analyticsSummary.rewardsRedeemed.week,
    },
  };
}
