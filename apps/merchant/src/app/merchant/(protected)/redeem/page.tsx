import { getTranslations } from "next-intl/server";
import { RedemptionCodeForm } from "@/features/redemption";
import { getMerchantSessionData } from "@/features/dashboard/api/getMerchantSessionData";
import { PageHeader } from "@/shared/ui/PageHeader";

export default async function MerchantRedeemPage() {
  const { merchant } = await getMerchantSessionData();
  const t = await getTranslations("redemption");

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title={t("title")} description={t("subtitle")} />
      {merchant.status === "active" ? (
        <RedemptionCodeForm merchantId={merchant.id} />
      ) : (
        <p className="merchant-body-muted">{t("inactiveNotice")}</p>
      )}
    </div>
  );
}
