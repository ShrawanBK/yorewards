"use client";

import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import type { AnalyticsPeriod } from "@repo/supabase/queries/analytics";
import { getMerchantAnalyticsAction } from "@/features/analytics/api/analyticsActions";
import type { MerchantAnalyticsPayload } from "@/features/analytics/types/analytics.types";
import { resolveActionError } from "@/shared/utils/resolve-action-error";

export type { MerchantAnalyticsPayload };

export function useMerchantAnalytics(
  merchantId: string,
  initialData?: MerchantAnalyticsPayload,
) {
  const tErrors = useTranslations("errors.actions");

  return useQuery({
    queryKey: ["merchant-analytics", merchantId],
    queryFn: async () => {
      const result = await getMerchantAnalyticsAction(merchantId);
      if (result.error) {
        throw new Error(resolveActionError(tErrors, result.error));
      }
      if (!result.data) {
        throw new Error(tErrors("ANALYTICS_LOAD_FAILED"));
      }
      return result.data;
    },
    initialData,
  });
}

export type { AnalyticsPeriod };
