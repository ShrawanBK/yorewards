import { LoyaltyCardPageView } from "@/features/loyalty-card";
import { getMerchantSessionData } from "@/features/dashboard/api/getMerchantSessionData";
import { requireOwnerForMerchantRoute } from "@/shared/utils/require-owner-route";
import { getActiveLocationsByMerchantId } from "@repo/supabase/queries/locations";
import { getLoyaltyCardByMerchantId } from "@repo/supabase/queries/loyalty-cards";
import { getLoyaltyCardLocationRules } from "@repo/supabase/queries/loyalty-card-locations";

export default async function LoyaltyCardPage() {
  const { merchant } = await getMerchantSessionData();
  await requireOwnerForMerchantRoute(merchant);
  const loyaltyCard = await getLoyaltyCardByMerchantId(merchant.id);
  const [locations, locationRules] = await Promise.all([
    getActiveLocationsByMerchantId(merchant.id),
    loyaltyCard
      ? getLoyaltyCardLocationRules(loyaltyCard.id)
      : Promise.resolve([]),
  ]);

  const appBaseUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  return (
    <LoyaltyCardPageView
      merchant={merchant}
      loyaltyCard={loyaltyCard}
      locations={locations}
      locationRules={locationRules}
      appBaseUrl={appBaseUrl}
    />
  );
}
