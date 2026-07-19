import { getMerchantsByUserId } from "@repo/supabase/queries/merchants";
import { requireMerchantSession } from "@/features/auth";
import { AddBusinessView } from "@/features/business";

export default async function AddBusinessPage() {
  const { user } = await requireMerchantSession();
  const merchants = await getMerchantsByUserId(user.id);

  return (
    <AddBusinessView
      ownerEmail={user.email ?? ""}
      isFirstBusiness={merchants.length === 0}
    />
  );
}
