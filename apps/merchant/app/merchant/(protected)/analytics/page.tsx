import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import {
  getMerchantActivityFeed,
  getMerchantAnalyticsSummary,
} from "@repo/supabase/queries/analytics";
import { getLocationsByMerchantId } from "@repo/supabase/queries/locations";
import { getMerchantSpendSummary } from "@repo/supabase/queries/merchant-spend-analytics";
import { MerchantAnalyticsView } from "@/features/analytics";
import { getMerchantSessionData } from "@/features/dashboard/api/getMerchantSessionData";
import { PageHeader } from "@/shared/ui/PageHeader";

type PageProps = {
  searchParams: Promise<{ branch?: string }>;
};

async function AnalyticsContent({ branchId }: { branchId?: string }) {
  const { merchant } = await getMerchantSessionData();
  const locationId = branchId && branchId !== "all" ? branchId : null;

  const [summary, activity, spend, locations] = await Promise.all([
    getMerchantAnalyticsSummary(merchant.id),
    getMerchantActivityFeed(merchant.id),
    getMerchantSpendSummary(merchant.id, locationId),
    getLocationsByMerchantId(merchant.id),
  ]);

  return (
    <MerchantAnalyticsView
      merchantId={merchant.id}
      locations={locations}
      initialData={{ summary, activity, spend }}
    />
  );
}

export default async function MerchantAnalyticsPage({ searchParams }: PageProps) {
  const params = await searchParams;

  if (!params.branch) {
    const { activeBranch, branches } = await getMerchantSessionData();
    if (activeBranch && branches.length > 1) {
      redirect(`/merchant/analytics?branch=${activeBranch.id}`);
    }
  }

  const t = await getTranslations("analytics");

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title={t("title")} description={t("subtitle")} />
      <Suspense fallback={<p className="merchant-body-muted">{t("loading")}</p>}>
        <AnalyticsContent branchId={params.branch} />
      </Suspense>
    </div>
  );
}
