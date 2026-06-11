import { redirect } from "next/navigation";
import { requireMerchantAuth } from "@/features/auth";
import { AddBusinessView } from "@/features/business";

export default async function AddBusinessPage() {
  const { user } = await requireMerchantAuth();
  if (!user.email) redirect("/merchant/login");

  return <AddBusinessView ownerEmail={user.email} />;
}
