import { notFound } from "next/navigation";
import { getMerchantDetailAction } from "@/features/merchants/api/merchantActions";
import { MerchantDetailView } from "@/features/merchants/components/MerchantDetailView";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminMerchantDetailPage({ params }: PageProps) {
  const { id } = await params;
  const detail = await getMerchantDetailAction(id);

  if (!detail) {
    notFound();
  }

  return <MerchantDetailView detail={detail} />;
}
