import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { refreshAdminStampCardLookup } from "@repo/supabase/queries/admin-stamps";
import { getStampDisputeById } from "@repo/supabase/queries/stamp-disputes";
import { DisputeDetailView } from "@/features/disputes";

type PageProps = {
  params: Promise<{ disputeId: string }>;
};

export default async function AdminDisputeDetailPage({ params }: PageProps) {
  const { disputeId } = await params;
  const dispute = await getStampDisputeById(disputeId);

  if (!dispute) {
    notFound();
  }

  const cardContext = await refreshAdminStampCardLookup(dispute.customerCardId);
  const t = await getTranslations("disputes.detail");

  return (
    <div className="flex flex-col gap-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">
          {dispute.customerName ?? t("unnamedCustomer")} · {dispute.merchantName}
        </p>
      </header>
      <DisputeDetailView dispute={dispute} cardContext={cardContext} />
    </div>
  );
}
