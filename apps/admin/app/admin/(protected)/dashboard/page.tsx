import { getPlatformDashboardData, AdminDashboardView } from "@/features/dashboard";

export default async function AdminDashboardPage() {
  const data = await getPlatformDashboardData();
  return <AdminDashboardView data={data} />;
}
