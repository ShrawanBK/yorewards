import { notFound } from "next/navigation";
import {
  getCustomerDetailAction,
  AdminCustomerDetailView,
} from "@/features/customers";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminCustomerDetailPage({ params }: PageProps) {
  const { id } = await params;
  const detail = await getCustomerDetailAction(id);

  if (!detail) {
    notFound();
  }

  return <AdminCustomerDetailView detail={detail} />;
}
