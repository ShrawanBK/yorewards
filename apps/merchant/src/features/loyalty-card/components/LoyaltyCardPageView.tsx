import { getTranslations } from "next-intl/server";
import type { MerchantRow } from "@repo/supabase/queries/merchants";
import type { LoyaltyCardRow } from "@repo/supabase/queries/loyalty-cards";
import type { MerchantLocationRow } from "@repo/supabase/queries/locations";
import type { LoyaltyCardLocationRow } from "@repo/supabase/queries/loyalty-card-locations";
import { LoyaltyCardConfigForm } from "@/features/loyalty-card/components/LoyaltyCardConfigForm";
import { LoyaltyCardBranchQrDownloads } from "@/features/loyalty-card/components/LoyaltyCardBranchQrDownloads";
import { filterStampableBranchIds } from "@repo/supabase/queries/loyalty-card-locations";
import { PageHeader } from "@/shared/ui/PageHeader";
import {
  canUseCounterWorkflow,
  isMerchantAccountBlocked,
} from "@/shared/utils/merchant-status";

export async function LoyaltyCardPageView({
  merchant,
  loyaltyCard,
  locations,
  locationRules,
  appBaseUrl,
}: {
  merchant: MerchantRow;
  loyaltyCard: LoyaltyCardRow | null;
  locations: MerchantLocationRow[];
  locationRules: LoyaltyCardLocationRow[];
  appBaseUrl: string;
}) {
  const t = await getTranslations("loyaltyCard");
  const readOnly = isMerchantAccountBlocked(merchant.status);
  const showPendingSetupHint = merchant.status === "pending";
  const activeLocations = locations.filter((l) => l.is_active);
  const stampableIds = filterStampableBranchIds(
    activeLocations.map((l) => l.id),
    locationRules,
  );
  const stampableLocations = activeLocations.filter((l) =>
    stampableIds.includes(l.id),
  );

  return (
    <div className="space-y-8">
      <PageHeader title={t("title")} description={t("subtitle")} />

      <LoyaltyCardConfigForm
        merchant={merchant}
        loyaltyCard={loyaltyCard}
        locations={locations}
        locationRules={locationRules}
        readOnly={readOnly}
        showPendingSetupHint={showPendingSetupHint}
      />

      {loyaltyCard && canUseCounterWorkflow(merchant.status) ? (
        <LoyaltyCardBranchQrDownloads
          merchantId={merchant.id}
          loyaltyCardId={loyaltyCard.id}
          locations={stampableLocations}
          appBaseUrl={appBaseUrl}
        />
      ) : null}
    </div>
  );
}
