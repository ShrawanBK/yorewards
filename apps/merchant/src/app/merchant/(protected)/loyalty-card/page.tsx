import { LoyaltyCardPageView } from "@/features/loyalty-card";
import { getMerchantSessionData } from "@/features/dashboard/api/getMerchantSessionData";
import { getActiveLocationsByMerchantId } from "@repo/supabase/queries/locations";
import { getLoyaltyCardByMerchantId } from "@repo/supabase/queries/loyalty-cards";

export default async function LoyaltyCardPage() {
  const { merchant } = await getMerchantSessionData();
  const [loyaltyCard, locations] = await Promise.all([
    getLoyaltyCardByMerchantId(merchant.id),
    getActiveLocationsByMerchantId(merchant.id),
  ]);

  const appBaseUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  return (
    <LoyaltyCardPageView
      merchant={merchant}
      loyaltyCard={loyaltyCard}
      locations={locations}
      appBaseUrl={appBaseUrl}
    />
  );
}
