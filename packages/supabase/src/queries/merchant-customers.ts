import { createServiceRoleClient } from "../service-role";
import type { RewardStatus } from "../types";

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
  } | null;
};

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
      loyalty_cards ( stamp_target )
    `,
    )
    .eq("merchant_id", merchantId)
    .order("last_stamped_at", { ascending: false, nullsFirst: false });

  if (cardIdsForBranch) {
    query = query.in("id", cardIdsForBranch);
  }

  const { data, error } = await query;
  if (error) throw error;

  const rows = (data ?? []) as CustomerCardQueryRow[];
  const cardIds = rows.map((row) => row.id);

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
    };
  });
}
