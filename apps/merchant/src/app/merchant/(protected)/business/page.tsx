import { getTranslations } from "next-intl/server";
import { getMerchantSessionData } from "@/features/dashboard/api/getMerchantSessionData";
import { MerchantBusinessHub } from "@/features/business";
import {
  getActiveLocationCountsByMerchantIds,
  getLocationsByMerchantId,
} from "@repo/supabase/queries/locations";
import { getLoyaltyCardByMerchantId } from "@repo/supabase/queries/loyalty-cards";

export default async function BusinessPage() {
  const t = await getTranslations("business");
  const { merchants, merchant } = await getMerchantSessionData();

  const [branchCounts, locations, loyaltyCard] = await Promise.all([
    getActiveLocationCountsByMerchantIds(merchants.map((m) => m.id)),
    getLocationsByMerchantId(merchant.id),
    getLoyaltyCardByMerchantId(merchant.id),
  ]);

  return (
    <div className="space-y-2">
      <div className="px-4 pt-4 sm:px-6 sm:pt-6">
        <h1 className="text-2xl font-semibold tracking-tight">
          {t("hubTitle")}
        </h1>
        <p className="text-sm text-muted-foreground">{t("hubSubtitle")}</p>
      </div>
      <MerchantBusinessHub
        merchants={merchants}
        activeMerchantId={merchant.id}
        branchCounts={branchCounts}
        locations={locations}
        loyaltyCard={loyaltyCard}
      />
    </div>
  );
}
