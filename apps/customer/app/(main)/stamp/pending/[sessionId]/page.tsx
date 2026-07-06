import { redirect } from "next/navigation";
import { getCustomerIdFromSession } from "@repo/supabase/queries/customers";
import {
  getStampSessionForCustomer,
  isStampSessionWithinPendingWindow,
} from "@repo/supabase/queries/stamps";
import { StampPendingView } from "@/features/stamp";

export const dynamic = "force-dynamic";

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
    redirect(`/stamp/rejected/${sessionId}`);
  }
  if (
    session.status === "expired" ||
    (session.status === "pending" &&
      !isStampSessionWithinPendingWindow(session.created_at))
  ) {
    redirect(`/stamp/expired/${sessionId}`);
  }

  return (
    <StampPendingView sessionId={sessionId} createdAt={session.created_at} />
  );
}
