import { redirect } from "next/navigation";
import { getCustomerIdFromSession } from "@repo/supabase/queries/customers";
import { getStampSuccessContextForCustomer } from "@repo/supabase/queries/stamps";
import { StampSuccessView } from "@/features/stamp";

export const dynamic = "force-dynamic";

type StampSuccessPageProps = {
  params: Promise<{ sessionId: string }>;
};

export default async function StampSuccessPage({
  params,
}: StampSuccessPageProps) {
  const { sessionId } = await params;
  const customerId = await getCustomerIdFromSession();
  if (!customerId) redirect("/login");

  const context = await getStampSuccessContextForCustomer(
    sessionId,
    customerId,
  );
  if (!context) redirect("/wallet");

  return <StampSuccessView {...context} />;
}
