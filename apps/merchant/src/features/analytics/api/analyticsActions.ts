"use server";

import { createClient } from "@repo/supabase/server";
import { getMerchantsByUserId } from "@repo/supabase/queries/merchants";
import {
  getMerchantActivityFeed,
  getMerchantAnalyticsSummary,
} from "@repo/supabase/queries/analytics";
import { fail, logActionFailure } from "@repo/utils/action-error";
import type { ActionFailure, ActionResult } from "@/shared/types/action-result";
import type { MerchantAnalyticsPayload } from "@/features/analytics/types/analytics.types";

async function assertOwnsMerchant(
  userId: string,
  merchantId: string,
): Promise<ActionFailure | null> {
  const merchants = await getMerchantsByUserId(userId);
  if (!merchants.some((m) => m.id === merchantId)) {
    return fail("BUSINESS_NOT_FOUND");
  }
  return null;
}

export async function getMerchantAnalyticsAction(
  merchantId: string,
): Promise<ActionResult & { data?: MerchantAnalyticsPayload }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return fail("UNAUTHORIZED");

  const denied = await assertOwnsMerchant(user.id, merchantId);
  if (denied) return denied;

  try {
    const [summary, activity] = await Promise.all([
      getMerchantAnalyticsSummary(merchantId),
      getMerchantActivityFeed(merchantId),
    ]);
    return { data: { summary, activity } };
  } catch (err) {
    logActionFailure("getMerchantAnalytics", err);
    return fail("ANALYTICS_LOAD_FAILED");
  }
}
