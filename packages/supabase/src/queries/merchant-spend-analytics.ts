import { createServiceRoleClient } from "../service-role";
import type { CurrencyCode } from "../types";
import { toLocalDateKey } from "../utils/local-date";

export type WeeklySpendPoint = {
  date: string;
  total: number;
};

export type MerchantSpendSummary = {
  loyaltyRevenue: number;
  avgSpendPerVisit: number;
  visitCount: number;
  currency: CurrencyCode;
  weeklyTrend: WeeklySpendPoint[];
};

export async function getMerchantSpendSummary(
  merchantId: string,
  locationId?: string | null,
): Promise<MerchantSpendSummary> {
  const supabase = createServiceRoleClient();

  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 6);
  weekStart.setHours(0, 0, 0, 0);

  let allTimeQuery = supabase
    .from("stamp_transactions")
    .select("amount_spent, loyalty_cards ( min_spend_currency )")
    .eq("merchant_id", merchantId);

  let weekQuery = supabase
    .from("stamp_transactions")
    .select("amount_spent, stamped_at")
    .eq("merchant_id", merchantId)
    .gte("stamped_at", weekStart.toISOString());

  if (locationId) {
    allTimeQuery = allTimeQuery.eq("location_id", locationId);
    weekQuery = weekQuery.eq("location_id", locationId);
  }

  const [allTimeResult, weekResult] = await Promise.all([
    allTimeQuery,
    weekQuery,
  ]);

  if (allTimeResult.error) throw allTimeResult.error;
  if (weekResult.error) throw weekResult.error;

  const allRows = allTimeResult.data ?? [];
  const weekRows = weekResult.data ?? [];

  const loyaltyRevenue = allRows.reduce(
    (sum, row) => sum + Number(row.amount_spent),
    0,
  );
  const visitCount = allRows.length;
  const currency =
    (allRows[0]?.loyalty_cards as { min_spend_currency: CurrencyCode } | null)
      ?.min_spend_currency ?? "NPR";

  const dayTotals = new Map<string, number>();
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    dayTotals.set(toLocalDateKey(d), 0);
  }

  for (const row of weekRows) {
    const key = toLocalDateKey(row.stamped_at);
    if (dayTotals.has(key)) {
      dayTotals.set(key, (dayTotals.get(key) ?? 0) + Number(row.amount_spent));
    }
  }

  const weeklyTrend = [...dayTotals.entries()].map(([date, total]) => ({
    date,
    total,
  }));

  return {
    loyaltyRevenue,
    avgSpendPerVisit: visitCount > 0 ? loyaltyRevenue / visitCount : 0,
    visitCount,
    currency,
    weeklyTrend,
  };
}
