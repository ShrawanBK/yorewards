import { redirect } from "next/navigation";
import { getCustomerIdFromSession } from "@repo/supabase/queries/customers";
import {
  getStampSessionForCustomer,
  isStampSessionWithinPendingWindow,
} from "@repo/supabase/queries/stamps";
import { StampExpiredView } from "@/features/stamp";

type StampExpiredPageProps = {
  params: Promise<{ sessionId: string }>;
};

export default async function StampExpiredPage({
  params,
}: StampExpiredPageProps) {
  const { sessionId } = await params;
  const customerId = await getCustomerIdFromSession();
  if (!customerId) redirect("/login");

  const session = await getStampSessionForCustomer(sessionId, customerId);
  if (!session) redirect("/wallet");

  const isExpired =
    session.status === "expired" ||
    (session.status === "pending" &&
      !isStampSessionWithinPendingWindow(session.created_at));

  if (!isExpired) {
    if (session.status === "approved") {
      redirect(`/stamp/success/${sessionId}`);
    }
    if (session.status === "rejected") {
      redirect(`/stamp/rejected/${sessionId}`);
    }
    if (session.status === "pending") {
      redirect(`/stamp/pending/${sessionId}`);
    }
    redirect("/wallet");
  }

  return <StampExpiredView />;
}
