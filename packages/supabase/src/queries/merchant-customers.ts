import { createServiceRoleClient } from "../service-role";
import type { CurrencyCode, RewardStatus } from "../types";
import {
  aggregateCustomerSpend,
  computeCustomerSegment,
  computeVipCustomerIds,
  type CustomerSegment,
} from "../utils/customer-segment";

export type { CustomerSegment };

export type MerchantCustomerRow = {
  customerCardId: string;
  customerId: string;
  customerName: string | null;
  phone: string;
  currentStamps: number;
  stampTarget: number;
  cycleNumber: number;
  rewardStatus: RewardStatus;
  lastStampedAt: string | null;
  totalStampsEver: number;
  lastBranchName: string | null;
  lastBranchId: string | null;
  totalSpend: number;
  visitCount: number;
  averageSpend: number;
  firstVisitAt: string | null;
  segment: CustomerSegment;
  currency: CurrencyCode;
};

export type MerchantCustomerVisitRow = {
  id: string;
  stampedAt: string;
  amountSpent: number;
  branchName: string | null;
};

export type MerchantCustomerRewardRow = {
  id: string;
  status: string;
  createdAt: string;
  redeemedAt: string | null;
  cardName: string;
  rewardDescription: string;
};

export type MerchantCustomerDetail = {
  customerId: string;
  customerName: string | null;
  phone: string;
  segment: CustomerSegment;
  totalSpend: number;
  visitCount: number;
  averageSpend: number;
  lastVisitAt: string | null;
  lastVisitAmount: number | null;
  currency: CurrencyCode;
  currentStamps: number;
  stampTarget: number;
  cycleNumber: number;
  rewardStatus: RewardStatus;
  note: string;
  visits: MerchantCustomerVisitRow[];
  rewards: MerchantCustomerRewardRow[];
};

type CustomerCardQueryRow = {
  id: string;
  customer_id: string;
  current_stamps: number;
  cycle_number: number;
  reward_status: RewardStatus;
  last_stamped_at: string | null;
  total_stamps_ever: number;
  customers: {
    name: string | null;
    phone: string;
  } | null;
  loyalty_cards: {
    stamp_target: number;
    min_spend_currency: CurrencyCode;
  } | null;
};

type TransactionRow = {
  customer_id: string;
  amount_spent: number;
  stamped_at: string;
  location_id: string | null;
};

async function loadSpendByCustomer(
  merchantId: string,
  locationId?: string | null,
): Promise<{
  statsByCustomer: Map<string, ReturnType<typeof aggregateCustomerSpend>>;
  currency: CurrencyCode;
}> {
  const supabase = createServiceRoleClient();

  let txQuery = supabase
    .from("stamp_transactions")
    .select(
      "customer_id, amount_spent, stamped_at, location_id, loyalty_cards ( min_spend_currency )",
    )
    .eq("merchant_id", merchantId);

  if (locationId) {
    txQuery = txQuery.eq("location_id", locationId);
  }

  const { data, error } = await txQuery;
  if (error) throw error;

  const rows = (data ?? []) as (TransactionRow & {
    loyalty_cards: { min_spend_currency: CurrencyCode } | null;
  })[];

  const byCustomer = new Map<string, TransactionRow[]>();
  for (const row of rows) {
    const list = byCustomer.get(row.customer_id) ?? [];
    list.push(row);
    byCustomer.set(row.customer_id, list);
  }

  const statsByCustomer = new Map<
    string,
    ReturnType<typeof aggregateCustomerSpend>
  >();
  for (const [customerId, customerRows] of byCustomer) {
    statsByCustomer.set(customerId, aggregateCustomerSpend(customerRows));
  }

  const currency =
    rows[0]?.loyalty_cards?.min_spend_currency ??
    ((await supabase
      .from("loyalty_cards")
      .select("min_spend_currency")
      .eq("merchant_id", merchantId)
      .limit(1)
      .maybeSingle()).data?.min_spend_currency as CurrencyCode | undefined) ??
    "NPR";

  return { statsByCustomer, currency };
}

export async function getMerchantCustomers(
  merchantId: string,
  locationId?: string | null,
): Promise<MerchantCustomerRow[]> {
  const supabase = createServiceRoleClient();

  let cardIdsForBranch: string[] | null = null;
  if (locationId) {
    const { data: sessionRows, error: sessionError } = await supabase
      .from("stamp_sessions")
      .select("customer_card_id")
      .eq("merchant_id", merchantId)
      .eq("location_id", locationId);

    if (sessionError) throw sessionError;

    cardIdsForBranch = [
      ...new Set((sessionRows ?? []).map((row) => row.customer_card_id)),
    ];

    if (cardIdsForBranch.length === 0) {
      return [];
    }
  }

  let query = supabase
    .from("customer_cards")
    .select(
      `
      id,
      customer_id,
      current_stamps,
      cycle_number,
      reward_status,
      last_stamped_at,
      total_stamps_ever,
      customers ( name, phone ),
      loyalty_cards ( stamp_target, min_spend_currency )
    `,
    )
    .eq("merchant_id", merchantId)
    .order("last_stamped_at", { ascending: false, nullsFirst: false });

  if (cardIdsForBranch) {
    query = query.in("id", cardIdsForBranch);
  }

  const [{ data, error }, { statsByCustomer, currency }] = await Promise.all([
    query,
    loadSpendByCustomer(merchantId, locationId),
  ]);

  if (error) throw error;

  const rows = (data ?? []) as CustomerCardQueryRow[];
  const cardIds = rows.map((row) => row.id);

  const spendByCustomer = new Map<string, number>();
  for (const [customerId, stats] of statsByCustomer) {
    spendByCustomer.set(customerId, stats.totalSpend);
  }
  const vipIds = computeVipCustomerIds(spendByCustomer);

  const lastBranchByCard = new Map<
    string,
    { branchId: string | null; branchName: string | null }
  >();

  if (cardIds.length > 0) {
    const { data: recentSessions, error: recentError } = await supabase
      .from("stamp_sessions")
      .select(
        `
        customer_card_id,
        location_id,
        created_at,
        merchant_locations ( name )
      `,
      )
      .eq("merchant_id", merchantId)
      .in("customer_card_id", cardIds)
      .order("created_at", { ascending: false });

    if (recentError) throw recentError;

    for (const session of recentSessions ?? []) {
      const cardId = session.customer_card_id as string;
      if (lastBranchByCard.has(cardId)) continue;
      lastBranchByCard.set(cardId, {
        branchId: session.location_id as string | null,
        branchName:
          (session.merchant_locations as { name: string } | null)?.name ?? null,
      });
    }
  }

  return rows.map((row) => {
    const branch = lastBranchByCard.get(row.id);
    const stats = statsByCustomer.get(row.customer_id) ?? {
      totalSpend: 0,
      visitCount: 0,
      firstVisitAt: null,
      lastVisitAt: null,
      visitsLast30Days: 0,
    };
    const cardCurrency =
      row.loyalty_cards?.min_spend_currency ?? currency;

    return {
      customerCardId: row.id,
      customerId: row.customer_id,
      customerName: row.customers?.name ?? null,
      phone: row.customers?.phone ?? "",
      currentStamps: row.current_stamps,
      stampTarget: row.loyalty_cards?.stamp_target ?? 0,
      cycleNumber: row.cycle_number,
      rewardStatus: row.reward_status,
      lastStampedAt: row.last_stamped_at,
      totalStampsEver: row.total_stamps_ever,
      lastBranchName: branch?.branchName ?? null,
      lastBranchId: branch?.branchId ?? null,
      totalSpend: stats.totalSpend,
      visitCount: stats.visitCount,
      averageSpend:
        stats.visitCount > 0 ? stats.totalSpend / stats.visitCount : 0,
      firstVisitAt: stats.firstVisitAt,
      segment: computeCustomerSegment(stats, vipIds.has(row.customer_id)),
      currency: cardCurrency,
    };
  });
}

export async function getMerchantCustomerDetail(
  merchantId: string,
  customerId: string,
): Promise<MerchantCustomerDetail | null> {
  const supabase = createServiceRoleClient();

  const [cardResult, noteResult, visitsResult, rewardsResult, spendData] =
    await Promise.all([
      supabase
        .from("customer_cards")
        .select(
          `
          id,
          customer_id,
          current_stamps,
          cycle_number,
          reward_status,
          customers ( name, phone ),
          loyalty_cards ( stamp_target, min_spend_currency, reward_description )
        `,
        )
        .eq("merchant_id", merchantId)
        .eq("customer_id", customerId)
        .maybeSingle(),
      supabase
        .from("merchant_customer_notes")
        .select("note")
        .eq("merchant_id", merchantId)
        .eq("customer_id", customerId)
        .maybeSingle(),
      supabase
        .from("stamp_transactions")
        .select(
          `
          id,
          amount_spent,
          stamped_at,
          merchant_locations ( name )
        `,
        )
        .eq("merchant_id", merchantId)
        .eq("customer_id", customerId)
        .order("stamped_at", { ascending: false })
        .limit(30),
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
            loyalty_cards ( card_name, reward_description )
          )
        `,
        )
        .eq("merchant_id", merchantId)
        .eq("customer_cards.customer_id", customerId)
        .order("created_at", { ascending: false })
        .limit(20),
      loadSpendByCustomer(merchantId),
    ]);

  if (cardResult.error) throw cardResult.error;
  if (noteResult.error) throw noteResult.error;
  if (visitsResult.error) throw visitsResult.error;
  if (rewardsResult.error) throw rewardsResult.error;

  const card = cardResult.data;
  if (!card) return null;

  const visits = (visitsResult.data ?? []).map((row) => ({
    id: row.id,
    stampedAt: row.stamped_at,
    amountSpent: Number(row.amount_spent),
    branchName:
      (row.merchant_locations as { name: string } | null)?.name ?? null,
  }));

  const stats = spendData.statsByCustomer.get(customerId) ?? {
    totalSpend: 0,
    visitCount: 0,
    firstVisitAt: null,
    lastVisitAt: null,
    visitsLast30Days: 0,
  };

  const spendByCustomer = new Map<string, number>();
  for (const [id, customerStats] of spendData.statsByCustomer) {
    spendByCustomer.set(id, customerStats.totalSpend);
  }
  const segment = computeCustomerSegment(
    stats,
    computeVipCustomerIds(spendByCustomer).has(customerId),
  );

  const loyaltyCard = card.loyalty_cards as {
    stamp_target: number;
    min_spend_currency: CurrencyCode;
    reward_description: string;
  } | null;

  const rewards: MerchantCustomerRewardRow[] = (rewardsResult.data ?? []).map(
    (row) => {
      const cc = row.customer_cards as {
        loyalty_cards: {
          card_name: string;
          reward_description: string;
        } | null;
      };
      return {
        id: row.id,
        status: row.status,
        createdAt: row.created_at,
        redeemedAt: row.redeemed_at,
        cardName: cc?.loyalty_cards?.card_name ?? "Card",
        rewardDescription:
          cc?.loyalty_cards?.reward_description ?? "Reward",
      };
    },
  );

  return {
    customerId,
    customerName: (card.customers as { name: string | null } | null)?.name ?? null,
    phone: (card.customers as { phone: string } | null)?.phone ?? "",
    segment,
    totalSpend: stats.totalSpend,
    visitCount: stats.visitCount,
    averageSpend: stats.visitCount > 0 ? stats.totalSpend / stats.visitCount : 0,
    lastVisitAt: stats.lastVisitAt,
    lastVisitAmount: visits[0]?.amountSpent ?? null,
    currency: loyaltyCard?.min_spend_currency ?? "NPR",
    currentStamps: card.current_stamps,
    stampTarget: loyaltyCard?.stamp_target ?? 0,
    cycleNumber: card.cycle_number,
    rewardStatus: card.reward_status,
    note: noteResult.data?.note ?? "",
    visits,
    rewards,
  };
}

export async function upsertMerchantCustomerNote(
  merchantId: string,
  customerId: string,
  note: string,
): Promise<void> {
  const supabase = createServiceRoleClient();
  const { error } = await supabase.from("merchant_customer_notes").upsert(
    {
      merchant_id: merchantId,
      customer_id: customerId,
      note,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "merchant_id,customer_id" },
  );
  if (error) throw error;
}

export function merchantCanExportCsv(
  tier: string | null | undefined,
): boolean {
  return tier === "starter" || tier === "growth" || tier === "enterprise";
}
