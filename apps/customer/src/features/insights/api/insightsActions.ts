"use server";

import { getCustomerIdFromSession } from "@repo/supabase/queries/customers";
import {
  getCustomerMonthlyInsights,
  getCustomerSpendingHistory,
  type SpendingHistoryFilters,
} from "@repo/supabase/queries/customer-insights";
import { fail, logActionFailure } from "@repo/utils/action-error";
import type { ActionResult } from "@/shared/types/action-result";
import type {
  CustomerMonthlyInsights,
  SpendingHistoryItem,
} from "@repo/supabase/queries/customer-insights";

export async function fetchCustomerInsightsAction(
  year?: number,
  month?: number,
): Promise<ActionResult<{ insights: CustomerMonthlyInsights }>> {
  const customerId = await getCustomerIdFromSession();
  if (!customerId) return fail("UNAUTHORIZED");

  try {
    const insights = await getCustomerMonthlyInsights(
      customerId,
      year,
      month,
    );
    return { insights };
  } catch (err) {
    logActionFailure("fetchCustomerInsights", err);
    return fail("INSIGHTS_LOAD_FAILED");
  }
}

export async function fetchSpendingHistoryAction(
  filters: SpendingHistoryFilters = {},
): Promise<ActionResult<{ items: SpendingHistoryItem[] }>> {
  const customerId = await getCustomerIdFromSession();
  if (!customerId) return fail("UNAUTHORIZED");

  try {
    const items = await getCustomerSpendingHistory(customerId, filters);
    return { items };
  } catch (err) {
    logActionFailure("fetchSpendingHistory", err);
    return fail("INSIGHTS_LOAD_FAILED");
  }
}
