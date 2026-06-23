import { redirect } from "next/navigation";
import { getCustomerIdFromSession } from "@repo/supabase/queries/customers";
import { getStampSessionForCustomer } from "@repo/supabase/queries/stamps";
import { StampRejectedView } from "@/features/stamp";

type StampRejectedPageProps = {
  params: Promise<{ sessionId: string }>;
};

export default async function StampRejectedPage({
  params,
}: StampRejectedPageProps) {
  const { sessionId } = await params;
  const customerId = await getCustomerIdFromSession();
  if (!customerId) redirect("/login");

  const session = await getStampSessionForCustomer(sessionId, customerId);
  if (!session || session.status !== "rejected") redirect("/wallet");

  return (
    <StampRejectedView rejectionReason={session.rejection_reason} />
  );
}
