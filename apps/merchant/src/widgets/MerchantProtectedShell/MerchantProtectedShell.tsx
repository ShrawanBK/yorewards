import { countPendingDisputesForMerchant } from "@repo/supabase/queries/stamp-disputes";
import { getMerchantSessionForShell } from "@/features/dashboard/api/getMerchantSessionData";
import { MerchantShell } from "@/widgets/MerchantShell";

export async function MerchantProtectedShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getMerchantSessionForShell();

  if (!session.merchant) {
    return <>{children}</>;
  }

  const { merchants, merchant, branches, activeBranch, role, staff, actingStaffUserId } =
    session;

  const initialPendingDisputeCount =
    role === "cashier"
      ? 0
      : await countPendingDisputesForMerchant(merchant.id);

  return (
    <MerchantShell
      merchants={merchants}
      activeMerchantId={merchant.id}
      branches={branches}
      activeBranchId={activeBranch?.id ?? null}
      role={role}
      staff={staff}
      actingStaffUserId={actingStaffUserId}
      initialPendingDisputeCount={initialPendingDisputeCount}
    >
      {children}
    </MerchantShell>
  );
}
