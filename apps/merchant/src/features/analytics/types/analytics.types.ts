import type {
  ActivityFeedItem,
  MerchantAnalyticsSummary,
} from "@repo/supabase/queries/analytics";

export type MerchantAnalyticsPayload = {
  summary: MerchantAnalyticsSummary;
  activity: ActivityFeedItem[];
};
