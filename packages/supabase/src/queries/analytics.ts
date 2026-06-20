import { createServiceRoleClient } from "../service-role";

export type AnalyticsPeriod = "today" | "week" | "month";

export type MerchantAnalyticsSummary = {
  activeCollectors: number;
  stampsIssued: Record<AnalyticsPeriod, number>;
  rewardsRedeemed: Record<AnalyticsPeriod, number>;
  redemptionRate: number;
  targetsReached: number;
};

export type ActivityFeedItem = {
  id: string;
  type: "stamp_approved" | "stamp_voided" | "redemption";
  label: string;
  occurredAt: string;
};

function periodStart(period: AnalyticsPeriod): string {
  const now = new Date();
  const start = new Date(now);

  if (period === "today") {
    start.setHours(0, 0, 0, 0);
  } else if (period === "week") {
    start.setDate(now.getDate() - 7);
  } else {
    start.setMonth(now.getMonth() - 1);
  }

  return start.toISOString();
}

async function countApprovedStamps(
  merchantId: string,
  period: AnalyticsPeriod,
): Promise<number> {
  const supabase = createServiceRoleClient();
  const { count, error } = await supabase
    .from("stamp_sessions")
    .select("id", { count: "exact", head: true })
    .eq("merchant_id", merchantId)
    .eq("status", "approved")
    .gte("created_at", periodStart(period));

  if (error) throw error;
  return count ?? 0;
}

async function countRedeemedRewards(
  merchantId: string,
  period: AnalyticsPeriod,
): Promise<number> {
  const supabase = createServiceRoleClient();
  const { count, error } = await supabase
    .from("redemptions")
    .select("id", { count: "exact", head: true })
    .eq("merchant_id", merchantId)
    .eq("status", "redeemed")
    .gte("redeemed_at", periodStart(period));

  if (error) throw error;
  return count ?? 0;
}

export async function getMerchantAnalyticsSummary(
  merchantId: string,
): Promise<MerchantAnalyticsSummary> {
  const supabase = createServiceRoleClient();

  const { count: activeCollectors, error: collectorsError } = await supabase
    .from("customer_cards")
    .select("id", { count: "exact", head: true })
    .eq("merchant_id", merchantId)
    .eq("reward_status", "collecting")
    .gt("current_stamps", 0);

  if (collectorsError) throw collectorsError;

  const { data: targetsData, error: targetsError } = await supabase
    .from("customer_cards")
    .select("targets_reached")
    .eq("merchant_id", merchantId);

  if (targetsError) throw targetsError;

  const targetsReached = (targetsData ?? []).reduce(
    (sum, row) => sum + (row.targets_reached ?? 0),
    0,
  );

  const [stampsToday, stampsWeek, stampsMonth, redeemedToday, redeemedWeek, redeemedMonth] =
    await Promise.all([
      countApprovedStamps(merchantId, "today"),
      countApprovedStamps(merchantId, "week"),
      countApprovedStamps(merchantId, "month"),
      countRedeemedRewards(merchantId, "today"),
      countRedeemedRewards(merchantId, "week"),
      countRedeemedRewards(merchantId, "month"),
    ]);

  const totalRedeemed = redeemedMonth;
  const redemptionRate =
    targetsReached > 0
      ? Math.round((totalRedeemed / targetsReached) * 1000) / 10
      : 0;

  return {
    activeCollectors: activeCollectors ?? 0,
    stampsIssued: {
      today: stampsToday,
      week: stampsWeek,
      month: stampsMonth,
    },
    rewardsRedeemed: {
      today: redeemedToday,
      week: redeemedWeek,
      month: redeemedMonth,
    },
    redemptionRate,
    targetsReached,
  };
}

export async function getMerchantActivityFeed(
  merchantId: string,
  limit = 20,
): Promise<ActivityFeedItem[]> {
  const supabase = createServiceRoleClient();

  const [stampsResult, redemptionsResult] = await Promise.all([
    supabase
      .from("stamp_sessions")
      .select(
        `
        id,
        status,
        resolved_at,
        created_at,
        customer_cards (
          customers ( name ),
          loyalty_cards ( card_name )
        )
      `,
      )
      .eq("merchant_id", merchantId)
      .in("status", ["approved", "voided"])
      .order("resolved_at", { ascending: false })
      .limit(limit),
    supabase
      .from("redemptions")
      .select(
        `
        id,
        redeemed_at,
        created_at,
        customer_cards (
          customers ( name ),
          loyalty_cards ( card_name )
        )
      `,
      )
      .eq("merchant_id", merchantId)
      .eq("status", "redeemed")
      .order("redeemed_at", { ascending: false })
      .limit(limit),
  ]);

  if (stampsResult.error) throw stampsResult.error;
  if (redemptionsResult.error) throw redemptionsResult.error;

  type StampRow = {
    id: string;
    status: string;
    resolved_at: string | null;
    created_at: string;
    customer_cards: {
      customers: { name: string | null } | null;
      loyalty_cards: { card_name: string } | null;
    } | null;
  };

  type RedemptionRow = {
    id: string;
    redeemed_at: string | null;
    created_at: string;
    customer_cards: {
      customers: { name: string | null } | null;
      loyalty_cards: { card_name: string } | null;
    } | null;
  };

  const stampItems: ActivityFeedItem[] = ((stampsResult.data ?? []) as StampRow[]).map(
    (row) => {
      const name = row.customer_cards?.customers?.name ?? "Customer";
      const card = row.customer_cards?.loyalty_cards?.card_name ?? "card";
      return {
        id: `stamp-${row.id}`,
        type: row.status === "voided" ? "stamp_voided" : "stamp_approved",
        label: `${name} · ${card}`,
        occurredAt: row.resolved_at ?? row.created_at,
      };
    },
  );

  const redemptionItems: ActivityFeedItem[] = (
    (redemptionsResult.data ?? []) as RedemptionRow[]
  ).map((row) => {
    const name = row.customer_cards?.customers?.name ?? "Customer";
    const card = row.customer_cards?.loyalty_cards?.card_name ?? "card";
    return {
      id: `redemption-${row.id}`,
      type: "redemption",
      label: `${name} · ${card}`,
      occurredAt: row.redeemed_at ?? row.created_at,
    };
  });

  return [...stampItems, ...redemptionItems]
    .sort(
      (a, b) =>
        new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
    )
    .slice(0, limit);
}
