import { createServiceRoleClient } from "../service-role";
import type { CurrencyCode } from "../types";

export type MerchantSpendBreakdown = {
  merchantId: string;
  businessName: string;
  totalSpent: number;
  visitCount: number;
  currency: CurrencyCode;
};

export type CurrencyMonthlyTotal = {
  currency: CurrencyCode;
  total: number;
  lastMonthTotal: number;
};

export type CustomerMonthlyInsights = {
  year: number;
  month: number;
  currencyTotals: CurrencyMonthlyTotal[];
  merchantBreakdown: MerchantSpendBreakdown[];
  stampsThisMonth: number;
};

export type SpendingHistoryItem = {
  id: string;
  merchantId: string;
  businessName: string;
  amountSpent: number;
  currency: CurrencyCode;
  stampedAt: string;
  branchName: string | null;
};

export type SpendingHistoryFilters = {
  merchantId?: string;
  fromDate?: string;
  toDate?: string;
  minAmount?: number;
};

function monthRange(year: number, month: number) {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);
  return { start: start.toISOString(), end: end.toISOString() };
}

export async function getCustomerMonthlyInsights(
  customerId: string,
  year = new Date().getFullYear(),
  month = new Date().getMonth() + 1,
): Promise<CustomerMonthlyInsights> {
  const supabase = createServiceRoleClient();
  const current = monthRange(year, month);
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  const previous = monthRange(prevYear, prevMonth);

  const [currentResult, previousResult] = await Promise.all([
    supabase
      .from("stamp_transactions")
      .select(
        `
        id,
        amount_spent,
        stamped_at,
        merchant_id,
        merchants ( business_name ),
        loyalty_cards ( min_spend_currency )
      `,
      )
      .eq("customer_id", customerId)
      .gte("stamped_at", current.start)
      .lt("stamped_at", current.end),
    supabase
      .from("stamp_transactions")
      .select("amount_spent, loyalty_cards ( min_spend_currency )")
      .eq("customer_id", customerId)
      .gte("stamped_at", previous.start)
      .lt("stamped_at", previous.end),
  ]);

  if (currentResult.error) throw currentResult.error;
  if (previousResult.error) throw previousResult.error;

  const currentRows = currentResult.data ?? [];
  const previousRows = previousResult.data ?? [];

  const currencyTotalsMap = new Map<
    CurrencyCode,
    { total: number; lastMonthTotal: number }
  >();

  for (const row of currentRows) {
    const currency =
      (row.loyalty_cards as { min_spend_currency: CurrencyCode } | null)
        ?.min_spend_currency ?? "NPR";
    const entry = currencyTotalsMap.get(currency) ?? {
      total: 0,
      lastMonthTotal: 0,
    };
    entry.total += Number(row.amount_spent);
    currencyTotalsMap.set(currency, entry);
  }

  for (const row of previousRows) {
    const currency =
      (row.loyalty_cards as { min_spend_currency: CurrencyCode } | null)
        ?.min_spend_currency ?? "NPR";
    const entry = currencyTotalsMap.get(currency) ?? {
      total: 0,
      lastMonthTotal: 0,
    };
    entry.lastMonthTotal += Number(row.amount_spent);
    currencyTotalsMap.set(currency, entry);
  }

  const merchantMap = new Map<string, MerchantSpendBreakdown>();
  for (const row of currentRows) {
    const merchantId = row.merchant_id as string;
    const merchant = row.merchants as { business_name: string } | null;
    const currency =
      (row.loyalty_cards as { min_spend_currency: CurrencyCode } | null)
        ?.min_spend_currency ?? "NPR";
    const existing = merchantMap.get(merchantId);
    if (existing) {
      existing.totalSpent += Number(row.amount_spent);
      existing.visitCount += 1;
    } else {
      merchantMap.set(merchantId, {
        merchantId,
        businessName: merchant?.business_name ?? "Business",
        totalSpent: Number(row.amount_spent),
        visitCount: 1,
        currency,
      });
    }
  }

  const merchantBreakdown = [...merchantMap.values()].sort(
    (a, b) => b.totalSpent - a.totalSpent,
  );

  return {
    year,
    month,
    currencyTotals: [...currencyTotalsMap.entries()].map(
      ([currency, totals]) => ({
        currency,
        total: totals.total,
        lastMonthTotal: totals.lastMonthTotal,
      }),
    ),
    merchantBreakdown,
    stampsThisMonth: currentRows.length,
  };
}

export async function getCustomerSpendingHistory(
  customerId: string,
  filters: SpendingHistoryFilters = {},
  limit = 100,
): Promise<SpendingHistoryItem[]> {
  const supabase = createServiceRoleClient();

  let query = supabase
    .from("stamp_transactions")
    .select(
      `
      id,
      amount_spent,
      stamped_at,
      merchant_id,
      merchants ( business_name ),
      loyalty_cards ( min_spend_currency ),
      merchant_locations ( name )
    `,
    )
    .eq("customer_id", customerId)
    .order("stamped_at", { ascending: false })
    .limit(limit);

  if (filters.merchantId) {
    query = query.eq("merchant_id", filters.merchantId);
  }
  if (filters.fromDate) {
    query = query.gte("stamped_at", filters.fromDate);
  }
  if (filters.toDate) {
    query = query.lte("stamped_at", filters.toDate);
  }
  if (filters.minAmount !== undefined) {
    query = query.gte("amount_spent", filters.minAmount);
  }

  const { data, error } = await query;
  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id,
    merchantId: row.merchant_id,
    businessName:
      (row.merchants as { business_name: string } | null)?.business_name ??
      "Business",
    amountSpent: Number(row.amount_spent),
    currency:
      (row.loyalty_cards as { min_spend_currency: CurrencyCode } | null)
        ?.min_spend_currency ?? "NPR",
    stampedAt: row.stamped_at,
    branchName:
      (row.merchant_locations as { name: string } | null)?.name ?? null,
  }));
}
