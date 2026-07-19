import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import {
  getMerchantSubscription,
  listMerchantInvoices,
} from "@repo/supabase/queries/merchant-subscriptions";
import { PLAN_PRICES_NPR } from "@repo/utils/plan-limits";
import { BillingView } from "@/features/billing";
import { getMerchantSessionData } from "@/features/dashboard/api/getMerchantSessionData";
import { PageHeader } from "@/shared/ui/PageHeader";

export default async function MerchantBillingPage() {
  const { merchant, role } = await getMerchantSessionData();
  const t = await getTranslations("billing");

  if (role !== "owner") {
    redirect("/merchant/dashboard");
  }

  const [subscription, invoices] = await Promise.all([
    getMerchantSubscription(merchant.id),
    listMerchantInvoices(merchant.id),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title={t("title")} description={t("subtitle")} />
      <BillingView
        merchantId={merchant.id}
        tier={merchant.subscription_tier}
        subscription={subscription}
        invoices={invoices}
        starterPriceNpr={PLAN_PRICES_NPR.starter}
      />
    </div>
  );
}
