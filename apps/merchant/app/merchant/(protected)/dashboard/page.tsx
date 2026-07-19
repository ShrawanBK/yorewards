import { getDashboardData } from "@/features/dashboard";
import { MerchantDashboard } from "@/widgets/MerchantDashboard";

export default async function MerchantDashboardPage() {
  const { merchants, merchant, metrics, pendingQueue, activeBranch, user } =
    await getDashboardData();
  return (
    <MerchantDashboard
      merchants={merchants}
      merchant={merchant}
      metrics={metrics}
      pendingQueue={pendingQueue}
      activeBranchName={activeBranch?.name ?? null}
      userId={user.id}
    />
  );
}
