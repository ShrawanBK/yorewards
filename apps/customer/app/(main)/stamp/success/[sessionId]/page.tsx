import { redirect } from "next/navigation";
import { getCustomerIdFromSession } from "@repo/supabase/queries/customers";
import { getStampSessionForCustomer } from "@repo/supabase/queries/stamps";
import { StampSuccessView } from "@/features/stamp";

type StampSuccessPageProps = {
  params: Promise<{ sessionId: string }>;
};

export default async function StampSuccessPage({
  params,
}: StampSuccessPageProps) {
  const { sessionId } = await params;
  const customerId = await getCustomerIdFromSession();
  if (!customerId) redirect("/login");

  const session = await getStampSessionForCustomer(sessionId, customerId);
  if (!session || session.status !== "approved") redirect("/wallet");

  return <StampSuccessView />;
}
