import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { merchantCanUseCrm } from "@repo/utils/plan-limits";
import { getLocationsByMerchantId } from "@repo/supabase/queries/locations";
import { getMerchantCustomers } from "@repo/supabase/queries/merchant-customers";
import { CrmUpgradeView, MerchantCustomersView } from "@/features/customers";
import { getMerchantSessionData } from "@/features/dashboard/api/getMerchantSessionData";
import { PageHeader } from "@/shared/ui/PageHeader";

type PageProps = {
  searchParams: Promise<{ branch?: string }>;
};

async function CustomersContent({
  branchId,
}: {
  branchId?: string;
}) {
  const { merchant } = await getMerchantSessionData();

  if (!merchantCanUseCrm(merchant.subscription_tier)) {
    return <CrmUpgradeView />;
  }

  const [locations, customers] = await Promise.all([
    getLocationsByMerchantId(merchant.id),
    getMerchantCustomers(
      merchant.id,
      branchId && branchId !== "all" ? branchId : null,
    ),
  ]);

  return (
    <MerchantCustomersView
      merchantId={merchant.id}
      subscriptionTier={merchant.subscription_tier}
      customers={customers}
      locations={locations}
    />
  );
}

export default async function MerchantCustomersPage({ searchParams }: PageProps) {
  const params = await searchParams;

  if (!params.branch) {
    const { activeBranch, branches } = await getMerchantSessionData();
    if (activeBranch && branches.length > 1) {
      redirect(`/merchant/customers?branch=${activeBranch.id}`);
    }
  }

  const t = await getTranslations("customers");

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title={t("title")} description={t("subtitle")} />
      <Suspense fallback={<p className="merchant-body-muted">{t("loading")}</p>}>
        <CustomersContent branchId={params.branch} />
      </Suspense>
    </div>
  );
}
