import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getStampDisputeById } from "@repo/supabase/queries/stamp-disputes";
import {
  getMerchantRoleForUser,
  roleMeetsMinimum,
} from "@repo/supabase/queries/merchant-staff";
import {
  MerchantDisputeDetailView,
  SwitchMerchantForDispute,
} from "@/features/disputes";
import { getMerchantSessionData } from "@/features/dashboard/api/getMerchantSessionData";
import { PageHeader } from "@/shared/ui/PageHeader";

type PageProps = {
  params: Promise<{ disputeId: string }>;
  searchParams: Promise<{ switched?: string }>;
};

export default async function MerchantDisputeDetailPage({
  params,
  searchParams,
}: PageProps) {
  const { disputeId } = await params;
  const { switched } = await searchParams;
  const { merchant, role, merchants, user } = await getMerchantSessionData();

  const dispute = await getStampDisputeById(disputeId);
  if (!dispute) {
    notFound();
  }

  if (dispute.merchantId !== merchant.id) {
    const target = merchants.find((row) => row.id === dispute.merchantId);
    if (!target) {
      notFound();
    }

    const targetRole = await getMerchantRoleForUser(user.id, dispute.merchantId);
    if (!targetRole || !roleMeetsMinimum(targetRole, "manager")) {
      notFound();
    }

    const t = await getTranslations("disputes.detail");
    return (
      <div className="flex flex-col gap-8">
        <PageHeader title={t("title")} description={t("subtitle")} />
        <SwitchMerchantForDispute
          disputeId={dispute.id}
          merchantId={dispute.merchantId}
          businessName={target.business_name}
        />
      </div>
    );
  }

  if (role === "cashier") {
    redirect("/merchant/dashboard");
  }

  const t = await getTranslations("disputes.detail");

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title={t("title")} description={t("subtitle")} />
      <MerchantDisputeDetailView
        dispute={dispute}
        merchantId={merchant.id}
        switchedBusinessName={switched ?? null}
      />
    </div>
  );
}
