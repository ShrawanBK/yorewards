import { createServiceRoleClient } from "../service-role";

export type RedemptionLookup = {
  id: string;
  redemptionCode: string;
  merchantId: string;
  customerCardId: string;
  cycleNumber: number;
  createdAt: string;
  customerName: string | null;
  cardName: string;
  rewardDescription: string;
  currentStamps: number;
  stampTarget: number;
  approvedStampCountThisCycle: number;
  allTimeApprovedCount: number;
};

type RedemptionRow = {
  id: string;
  redemption_code: string;
  merchant_id: string;
  customer_card_id: string;
  cycle_number: number;
  created_at: string;
  status: string;
  customer_cards: {
    current_stamps: number;
    customers: { name: string | null } | null;
    loyalty_cards: {
      card_name: string;
      stamp_target: number;
      reward_description: string;
    } | null;
  } | null;
};

export async function getRedemptionByCode(
  merchantId: string,
  code: string,
): Promise<RedemptionLookup | null> {
  const normalized = code.trim().toUpperCase();
  if (!normalized) return null;

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("redemptions")
    .select(
      `
      id,
      redemption_code,
      merchant_id,
      customer_card_id,
      cycle_number,
      created_at,
      status,
      customer_cards (
        current_stamps,
        customers ( name ),
        loyalty_cards ( card_name, stamp_target, reward_description )
      )
    `,
    )
    .eq("merchant_id", merchantId)
    .eq("redemption_code", normalized)
    .eq("status", "pending")
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const row = data as RedemptionRow;
  const card = row.customer_cards;

  const [cycleApprovedCount, allTimeApprovedCount] = await Promise.all([
    countApprovedStampsThisCycle(
      row.customer_card_id,
      row.cycle_number,
    ),
    countAllTimeApprovedStamps(row.customer_card_id),
  ]);

  return {
    id: row.id,
    redemptionCode: row.redemption_code,
    merchantId: row.merchant_id,
    customerCardId: row.customer_card_id,
    cycleNumber: row.cycle_number,
    createdAt: row.created_at,
    customerName: card?.customers?.name ?? null,
    cardName: card?.loyalty_cards?.card_name ?? "Loyalty card",
    rewardDescription: card?.loyalty_cards?.reward_description ?? "",
    currentStamps: card?.current_stamps ?? 0,
    stampTarget: card?.loyalty_cards?.stamp_target ?? 0,
    approvedStampCountThisCycle: cycleApprovedCount,
    allTimeApprovedCount,
  };
}

async function countAllTimeApprovedStamps(
  customerCardId: string,
): Promise<number> {
  const supabase = createServiceRoleClient();
  const { count, error } = await supabase
    .from("stamp_sessions")
    .select("id", { count: "exact", head: true })
    .eq("customer_card_id", customerCardId)
    .eq("status", "approved");

  if (error) throw error;
  return count ?? 0;
}

async function countApprovedStampsThisCycle(
  customerCardId: string,
  cycleNumber: number,
): Promise<number> {
  const supabase = createServiceRoleClient();

  let cycleStart: string | null = null;
  if (cycleNumber > 1) {
    const { data: previousRedemption, error: redemptionError } = await supabase
      .from("redemptions")
      .select("redeemed_at")
      .eq("customer_card_id", customerCardId)
      .eq("status", "redeemed")
      .eq("cycle_number", cycleNumber - 1)
      .order("redeemed_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (redemptionError) throw redemptionError;
    cycleStart = previousRedemption?.redeemed_at ?? null;
  }

  let query = supabase
    .from("stamp_sessions")
    .select("id", { count: "exact", head: true })
    .eq("customer_card_id", customerCardId)
    .eq("status", "approved");

  if (cycleStart) {
    query = query.gte("resolved_at", cycleStart);
  }

  const { count, error } = await query;
  if (error) throw error;
  return count ?? 0;
}

export async function completeRedemptionForMerchant(
  merchantId: string,
  redemptionId: string,
): Promise<void> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("redemptions")
    .select("id, merchant_id, status")
    .eq("id", redemptionId)
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error("Redemption not found");
  if (data.merchant_id !== merchantId) {
    throw new Error("Redemption does not belong to this business");
  }
  if (data.status !== "pending") {
    throw new Error("Redemption is no longer pending");
  }

  const { error: rpcError } = await supabase.rpc("complete_redemption", {
    p_redemption_id: redemptionId,
  });
  if (rpcError) throw rpcError;
}

export async function createPendingRedemption(input: {
  merchantId: string;
  customerCardId: string;
  redemptionCode: string;
  cycleNumber?: number;
  locationId?: string | null;
}): Promise<string> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("redemptions")
    .insert({
      merchant_id: input.merchantId,
      customer_card_id: input.customerCardId,
      redemption_code: input.redemptionCode.trim().toUpperCase(),
      cycle_number: input.cycleNumber ?? 1,
      location_id: input.locationId ?? null,
      status: "pending",
    })
    .select("id")
    .single();

  if (error) throw error;
  return data.id;
}

export async function getPendingRedemptionForCustomerCard(
  customerCardId: string,
): Promise<{ redemptionCode: string } | null> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("redemptions")
    .select("redemption_code")
    .eq("customer_card_id", customerCardId)
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!data?.redemption_code) return null;

  return { redemptionCode: data.redemption_code };
}
