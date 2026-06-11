import { getMerchantSessionData } from "@/features/dashboard/api/getMerchantSessionData";

export async function getDashboardData() {
  const { merchants, merchant } = await getMerchantSessionData();
  return { merchants, merchant };
}
