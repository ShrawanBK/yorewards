import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { listStampDisputesForMerchant } from "@repo/supabase/queries/stamp-disputes";
import { MerchantDisputesView } from "@/features/disputes";
import { getMerchantSessionData } from "@/features/dashboard/api/getMerchantSessionData";
import { PageHeader } from "@/shared/ui/PageHeader";

export default async function MerchantDisputesPage() {
  const { merchant, role } = await getMerchantSessionData();

  if (role === "cashier") {
    redirect("/merchant/dashboard");
  }

  const disputes = await listStampDisputesForMerchant(merchant.id);
  const t = await getTranslations("disputes");

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title={t("title")} description={t("subtitle")} />
      <MerchantDisputesView merchantId={merchant.id} initialDisputes={disputes} />
    </div>
  );
}
