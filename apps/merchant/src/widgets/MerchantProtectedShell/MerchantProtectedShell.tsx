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

  const { merchants, merchant, branches, activeBranch } = session;

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
