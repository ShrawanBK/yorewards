"use server";

import { createClient } from "@repo/supabase/server";
import { getMerchantsByUserId } from "@repo/supabase/queries/merchants";
import {
  getMerchantActivityFeed,
  getMerchantAnalyticsSummary,
} from "@repo/supabase/queries/analytics";
import type { ActionResult } from "@/shared/types/action-result";
import type { MerchantAnalyticsPayload } from "@/features/analytics/types/analytics.types";

async function assertOwnsMerchant(userId: string, merchantId: string) {
  const merchants = await getMerchantsByUserId(userId);
  if (!merchants.some((m) => m.id === merchantId)) {
    return { error: "Business not found" as const };
  }
  return { error: null as null };
}

export async function getMerchantAnalyticsAction(
  merchantId: string,
): Promise<ActionResult & { data?: MerchantAnalyticsPayload }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const denied = await assertOwnsMerchant(user.id, merchantId);
  if (denied.error) return denied;

  try {
    const [summary, activity] = await Promise.all([
      getMerchantAnalyticsSummary(merchantId),
      getMerchantActivityFeed(merchantId),
    ]);
    return { data: { summary, activity } };
  } catch {
    return { error: "Could not load analytics." };
  }
}
