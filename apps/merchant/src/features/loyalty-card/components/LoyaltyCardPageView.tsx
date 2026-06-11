import { getTranslations } from "next-intl/server";
import type { MerchantRow } from "@repo/supabase/queries/merchants";
import type { LoyaltyCardRow } from "@repo/supabase/queries/loyalty-cards";
import type { MerchantLocationRow } from "@repo/supabase/queries/locations";
import { LoyaltyCardConfigForm } from "@/features/loyalty-card/components/LoyaltyCardConfigForm";
import { LoyaltyCardBranchQrDownloads } from "@/features/loyalty-card/components/LoyaltyCardBranchQrDownloads";

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
    <div className="space-y-8 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>

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
