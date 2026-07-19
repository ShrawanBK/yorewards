import { createServiceRoleClient } from "../service-role";
import type { CurrencyCode } from "../types";

export type CardSpendSummary = {
  totalSpent: number;
  visitCount: number;
  averageSpent: number;
  lastVisitAt: string | null;
  currency: CurrencyCode;
};

export type CardVisitRow = {
  id: string;
  stampedAt: string;
  amountSpent: number;
  branchName: string | null;
  currency: CurrencyCode;
};

export type RewardHistoryItem = {
  id: string;
  kind: "stamp" | "redemption";
  occurredAt: string;
  businessName: string;
  cardName: string;
  detail: string;
  status: "active" | "redeemed" | "expired" | "earned";
};

export async function getCardSpendSummary(
  customerId: string,
  customerCardId: string,
  currency: CurrencyCode,
): Promise<CardSpendSummary> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("stamp_transactions")
    .select("amount_spent, stamped_at")
    .eq("customer_id", customerId)
    .eq("customer_card_id", customerCardId)
    .order("stamped_at", { ascending: false });

  if (error) throw error;
  const rows = data ?? [];
  const totalSpent = rows.reduce((sum, r) => sum + Number(r.amount_spent), 0);
  const visitCount = rows.length;

  return {
    totalSpent,
    visitCount,
    averageSpent: visitCount > 0 ? totalSpent / visitCount : 0,
    lastVisitAt: rows[0]?.stamped_at ?? null,
    currency,
  };
}

export async function getCardVisitHistory(
  customerId: string,
  customerCardId: string,
  currency: CurrencyCode,
  limit = 20,
): Promise<CardVisitRow[]> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("stamp_transactions")
    .select(
      `
      id,
      amount_spent,
      stamped_at,
      merchant_locations ( name )
    `,
    )
    .eq("customer_id", customerId)
    .eq("customer_card_id", customerCardId)
    .order("stamped_at", { ascending: false })
    .limit(limit);

  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id,
    stampedAt: row.stamped_at,
    amountSpent: Number(row.amount_spent),
    branchName:
      (row.merchant_locations as { name: string } | null)?.name ?? null,
    currency,
  }));
}

export async function getCustomerRewardHistory(
  customerId: string,
): Promise<RewardHistoryItem[]> {
  const supabase = createServiceRoleClient();

  const [txResult, redemptionResult] = await Promise.all([
    supabase
      .from("stamp_transactions")
      .select(
        `
        id,
        amount_spent,
        stamped_at,
        merchants ( business_name ),
        loyalty_cards ( card_name, min_spend_currency )
      `,
      )
      .eq("customer_id", customerId)
      .order("stamped_at", { ascending: false })
      .limit(50),
    supabase
      .from("redemptions")
      .select(
        `
        id,
        status,
        created_at,
        redeemed_at,
        customer_cards!inner (
          customer_id,
          merchants ( business_name ),
          loyalty_cards ( card_name, reward_description )
        )
      `,
      )
      .eq("customer_cards.customer_id", customerId)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  if (txResult.error) throw txResult.error;
  if (redemptionResult.error) throw redemptionResult.error;

  const stamps: RewardHistoryItem[] = (txResult.data ?? []).map((row) => {
    const merchant = row.merchants as { business_name: string } | null;
    const card = row.loyalty_cards as {
      card_name: string;
      min_spend_currency: CurrencyCode;
    } | null;
    const currency = card?.min_spend_currency ?? "NPR";
    return {
      id: `stamp-${row.id}`,
      kind: "stamp" as const,
      occurredAt: row.stamped_at,
      businessName: merchant?.business_name ?? "Business",
      cardName: card?.card_name ?? "Loyalty card",
      detail: `${currency} ${Number(row.amount_spent).toLocaleString()}`,
      status: "active" as const,
    };
  });

  const redemptions: RewardHistoryItem[] = (redemptionResult.data ?? []).map(
    (row) => {
      const cc = row.customer_cards as {
        merchants: { business_name: string } | null;
        loyalty_cards: {
          card_name: string;
          reward_description: string;
        } | null;
      };
      const status: RewardHistoryItem["status"] =
        row.status === "redeemed" ? "redeemed" : "active";
      return {
        id: `redemption-${row.id}`,
        kind: "redemption" as const,
        occurredAt: row.redeemed_at ?? row.created_at,
        businessName: cc?.merchants?.business_name ?? "Business",
        cardName: cc?.loyalty_cards?.card_name ?? "Loyalty card",
        detail: cc?.loyalty_cards?.reward_description ?? "Reward",
        status,
      };
    },
  );

  return [...stamps, ...redemptions].sort(
    (a: RewardHistoryItem, b: RewardHistoryItem) =>
      new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
  );
}
