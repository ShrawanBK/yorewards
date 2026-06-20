import { getTranslations } from "next-intl/server";
import {
  getMerchantActivityFeed,
  getMerchantAnalyticsSummary,
} from "@repo/supabase/queries/analytics";
import { MerchantAnalyticsView } from "@/features/analytics";
import { getMerchantSessionData } from "@/features/dashboard/api/getMerchantSessionData";
import { PageHeader } from "@/shared/ui/PageHeader";

export default async function MerchantAnalyticsPage() {
  const { merchant } = await getMerchantSessionData();
  const t = await getTranslations("analytics");

  const [summary, activity] = await Promise.all([
    getMerchantAnalyticsSummary(merchant.id),
    getMerchantActivityFeed(merchant.id),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title={t("title")} description={t("subtitle")} />
      <MerchantAnalyticsView
        merchantId={merchant.id}
        initialData={{ summary, activity }}
      />
    </div>
  );
}
