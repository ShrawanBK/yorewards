"use client";

import { useQuery } from "@tanstack/react-query";
import type { AnalyticsPeriod } from "@repo/supabase/queries/analytics";
import { getMerchantAnalyticsAction } from "@/features/analytics/api/analyticsActions";
import type { MerchantAnalyticsPayload } from "@/features/analytics/types/analytics.types";

export type { MerchantAnalyticsPayload };

async function fetchAnalytics(
  merchantId: string,
): Promise<MerchantAnalyticsPayload> {
  const result = await getMerchantAnalyticsAction(merchantId);
  if (result.error || !result.data) {
    throw new Error(result.error ?? "Failed to load analytics");
  }
  return result.data;
}

export function useMerchantAnalytics(
  merchantId: string,
  initialData?: MerchantAnalyticsPayload,
) {
  return useQuery({
    queryKey: ["merchant-analytics", merchantId],
    queryFn: () => fetchAnalytics(merchantId),
    initialData,
  });
}

export type { AnalyticsPeriod };
