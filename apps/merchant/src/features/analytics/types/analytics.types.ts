import type {
  ActivityFeedItem,
  MerchantAnalyticsSummary,
} from "@repo/supabase/queries/analytics";
import type { MerchantSpendSummary } from "@repo/supabase/queries/merchant-spend-analytics";

export type MerchantAnalyticsPayload = {
  summary: MerchantAnalyticsSummary;
  activity: ActivityFeedItem[];
  spend: MerchantSpendSummary;
};
