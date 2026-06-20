import { getMerchantSessionData } from "@/features/dashboard/api/getMerchantSessionData";
import { MerchantShell } from "@/widgets/MerchantShell";

export async function MerchantProtectedShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const { merchants, merchant, branches, activeBranch } =
    await getMerchantSessionData();

  return (
    <MerchantShell
      merchants={merchants}
      activeMerchantId={merchant.id}
      branches={branches}
      activeBranchId={activeBranch?.id ?? null}
    >
      {children}
    </MerchantShell>
  );
}
