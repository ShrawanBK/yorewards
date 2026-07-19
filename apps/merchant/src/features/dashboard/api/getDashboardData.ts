import {
  getLocationsByMerchantId,
} from "@repo/supabase/queries/locations";
import { getLoyaltyCardByMerchantId } from "@repo/supabase/queries/loyalty-cards";
import { getPendingStampSessions } from "@repo/supabase/queries/stamps";
import { getMerchantAnalyticsSummary } from "@repo/supabase/queries/analytics";
import { syncMerchantEmailVerification } from "@repo/supabase/queries/merchant-email-verification";
import { getMerchantSessionData } from "@/features/dashboard/api/getMerchantSessionData";
import { logActionFailure } from "@repo/utils/action-error";

export async function getDashboardData() {
  const session = await getMerchantSessionData();
  let { merchants, merchant, activeBranch, user } = session;

  try {
    const sync = await syncMerchantEmailVerification(user.id);
    if (sync.activated > 0) {
      const refreshed = await getMerchantSessionData();
      merchants = refreshed.merchants;
      merchant = refreshed.merchant;
      activeBranch = refreshed.activeBranch;
      user = refreshed.user;
    }
  } catch (err) {
    logActionFailure("syncMerchantEmailVerification", err);
  }

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
