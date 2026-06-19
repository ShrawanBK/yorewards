import { getTranslations } from "next-intl/server";
import type { MerchantRow } from "@repo/supabase/queries/merchants";
import type { LoyaltyCardRow } from "@repo/supabase/queries/loyalty-cards";
import type { MerchantLocationRow } from "@repo/supabase/queries/locations";
import { LoyaltyCardConfigForm } from "@/features/loyalty-card/components/LoyaltyCardConfigForm";
import { LoyaltyCardBranchQrDownloads } from "@/features/loyalty-card/components/LoyaltyCardBranchQrDownloads";
import { PageHeader } from "@/shared/ui/PageHeader";

export async function LoyaltyCardPageView({
  merchant,
  loyaltyCard,
  locations,
  appBaseUrl,
}: {
  merchant: MerchantRow;
  loyaltyCard: LoyaltyCardRow | null;
  locations: MerchantLocationRow[];
  appBaseUrl: string;
}) {
  const t = await getTranslations("loyaltyCard");
  const readOnly = merchant.status !== "active";

  return (
    <div className="space-y-8">
      <PageHeader title={t("title")} description={t("subtitle")} />

      <LoyaltyCardConfigForm
        merchant={merchant}
        loyaltyCard={loyaltyCard}
        readOnly={readOnly}
      />

      {loyaltyCard && merchant.status === "active" ? (
        <LoyaltyCardBranchQrDownloads
          merchantId={merchant.id}
          loyaltyCardId={loyaltyCard.id}
          locations={locations.filter((l) => l.is_active)}
          appBaseUrl={appBaseUrl}
        />
      ) : null}
    </div>
  );
}
