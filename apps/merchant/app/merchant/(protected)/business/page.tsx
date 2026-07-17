import { getTranslations } from "next-intl/server";
import { getMerchantSessionData } from "@/features/dashboard/api/getMerchantSessionData";
import { MerchantBusinessHub } from "@/features/business";
import { requireOwnerForMerchantRoute } from "@/shared/utils/require-owner-route";
import {
  getActiveLocationCountsByMerchantIds,
  getLocationsByMerchantId,
} from "@repo/supabase/queries/locations";
import { getLoyaltyCardByMerchantId } from "@repo/supabase/queries/loyalty-cards";
import { PageHeader } from "@/shared/ui/PageHeader";

export default async function BusinessPage() {
  const t = await getTranslations("business");
  const { merchants, merchant } = await getMerchantSessionData();
  await requireOwnerForMerchantRoute(merchant);

  const [branchCounts, locations, loyaltyCard] = await Promise.all([
    getActiveLocationCountsByMerchantIds(merchants.map((m) => m.id)),
    getLocationsByMerchantId(merchant.id),
    getLoyaltyCardByMerchantId(merchant.id),
  ]);

  return (
    <div className="space-y-8">
      <PageHeader title={t("hubTitle")} description={t("hubSubtitle")} />
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
