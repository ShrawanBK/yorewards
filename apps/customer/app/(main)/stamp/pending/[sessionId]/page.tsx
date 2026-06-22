import { redirect } from "next/navigation";
import { getCustomerIdFromSession } from "@repo/supabase/queries/customers";
import { getStampSessionForCustomer } from "@repo/supabase/queries/stamps";
import { StampPendingView } from "@/features/stamp";

type StampPendingPageProps = {
  params: Promise<{ sessionId: string }>;
};

export default async function StampPendingPage({
  params,
}: StampPendingPageProps) {
  const { sessionId } = await params;
  const customerId = await getCustomerIdFromSession();
  if (!customerId) redirect("/login");

  const session = await getStampSessionForCustomer(sessionId, customerId);
  if (!session) redirect("/wallet");

  if (session.status === "approved") {
    redirect(`/stamp/success/${sessionId}`);
  }
  if (session.status === "rejected") {
    const reason = session.rejection_reason
      ? `?reason=${encodeURIComponent(session.rejection_reason)}`
      : "";
    redirect(`/stamp/rejected/${sessionId}${reason}`);
  }
  if (session.status === "expired") {
    redirect("/wallet");
  }

  return <StampPendingView sessionId={sessionId} />;
}
