import { getDashboardData } from "@/features/dashboard";
import { MerchantDashboard } from "@/widgets/MerchantDashboard";

export default async function MerchantDashboardPage() {
  const { merchants, merchant } = await getDashboardData();
  return <MerchantDashboard merchants={merchants} merchant={merchant} />;
}
