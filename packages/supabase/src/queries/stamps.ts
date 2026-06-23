import { randomUUID } from "node:crypto";
import { createServiceRoleClient } from "../service-role";
import type { StampSessionStatus, RewardStatus } from "../types";

export const STAMP_PENDING_TTL_MS = 5 * 60 * 1000;

const PENDING_TTL_MS = STAMP_PENDING_TTL_MS;

export type PendingStampQueueItem = {
  id: string;
  merchantId: string;
  customerCardId: string;
  locationId: string | null;
  createdAt: string;
  customerName: string | null;
  cardName: string;
  branchName: string | null;
  currentStamps: number;
  stampTarget: number;
};

type StampSessionRow = {
  id: string;
  merchant_id: string;
  customer_card_id: string;
  location_id: string | null;
  created_at: string;
  status: StampSessionStatus;
  customer_cards: {
    current_stamps: number;
    customers: { name: string | null } | null;
    loyalty_cards: { card_name: string; stamp_target: number } | null;
  } | null;
  merchant_locations: { name: string } | null;
};

function mapPendingRow(row: StampSessionRow): PendingStampQueueItem {
  const card = row.customer_cards;
  return {
    id: row.id,
    merchantId: row.merchant_id,
    customerCardId: row.customer_card_id,
    locationId: row.location_id,
    createdAt: row.created_at,
    customerName: card?.customers?.name ?? null,
    cardName: card?.loyalty_cards?.card_name ?? "Loyalty card",
    branchName: row.merchant_locations?.name ?? null,
    currentStamps: card?.current_stamps ?? 0,
    stampTarget: card?.loyalty_cards?.stamp_target ?? 0,
  };
}

function isWithinPendingWindow(createdAt: string): boolean {
  return Date.now() - new Date(createdAt).getTime() < PENDING_TTL_MS;
}

export function isStampSessionWithinPendingWindow(createdAt: string): boolean {
  return isWithinPendingWindow(createdAt);
}

export type StampSessionSuccessContext = {
  customerCardId: string;
  currentStamps: number;
  stampTarget: number;
  rewardStatus: RewardStatus;
  cardName: string;
  businessName: string;
};

export async function expireStalePendingSessions(
  merchantId?: string,
): Promise<number> {
  const supabase = createServiceRoleClient();
  const cutoff = new Date(Date.now() - PENDING_TTL_MS).toISOString();

  let query = supabase
    .from("stamp_sessions")
    .update({ status: "expired", resolved_at: new Date().toISOString() })
    .eq("status", "pending")
    .lt("created_at", cutoff);

  if (merchantId) {
    query = query.eq("merchant_id", merchantId);
  }

  const { data, error } = await query.select("id");
  if (error) throw error;
  return data?.length ?? 0;
}

export async function getPendingStampSessions(
  merchantId: string,
): Promise<PendingStampQueueItem[]> {
  await expireStalePendingSessions(merchantId);

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("stamp_sessions")
    .select(
      `
      id,
      merchant_id,
      customer_card_id,
      location_id,
      created_at,
      status,
      customer_cards (
        current_stamps,
        customers ( name ),
        loyalty_cards ( card_name, stamp_target )
      ),
      merchant_locations ( name )
    `,
    )
    .eq("merchant_id", merchantId)
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  if (error) throw error;

  return (data as StampSessionRow[])
    .filter((row) => isWithinPendingWindow(row.created_at))
    .map(mapPendingRow);
}

export async function getStampSessionById(sessionId: string) {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("stamp_sessions")
    .select("*")
    .eq("id", sessionId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function findActivePendingSessionForCard(
  customerCardId: string,
): Promise<string | null> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("stamp_sessions")
    .select("id, created_at")
    .eq("customer_card_id", customerCardId)
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!data || !isWithinPendingWindow(data.created_at)) return null;
  return data.id;
}

export async function getStampSessionForCustomer(
  sessionId: string,
  customerId: string,
) {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("stamp_sessions")
    .select(
      `
      id,
      status,
      rejection_reason,
      created_at,
      customer_card_id,
      customer_cards!inner ( customer_id )
    `,
    )
    .eq("id", sessionId)
    .eq("customer_cards.customer_id", customerId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

type StampSuccessRow = {
  customer_card_id: string;
  customer_cards: {
    current_stamps: number;
    reward_status: RewardStatus;
    merchants: { business_name: string } | null;
    loyalty_cards: { card_name: string; stamp_target: number } | null;
  } | null;
};

export async function getStampSuccessContextForCustomer(
  sessionId: string,
  customerId: string,
): Promise<StampSessionSuccessContext | null> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("stamp_sessions")
    .select(
      `
      id,
      status,
      customer_card_id,
      customer_cards!inner (
        customer_id,
        current_stamps,
        reward_status,
        merchants ( business_name ),
        loyalty_cards ( card_name, stamp_target )
      )
    `,
    )
    .eq("id", sessionId)
    .eq("customer_cards.customer_id", customerId)
    .eq("status", "approved")
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const row = data as StampSuccessRow;
  const card = row.customer_cards;
  if (!card) return null;

  return {
    customerCardId: row.customer_card_id,
    currentStamps: card.current_stamps,
    stampTarget: card.loyalty_cards?.stamp_target ?? 0,
    rewardStatus: card.reward_status,
    cardName: card.loyalty_cards?.card_name ?? "Loyalty card",
    businessName: card.merchants?.business_name ?? "Business",
  };
}

export async function approveStampSession(sessionId: string): Promise<void> {
  const supabase = createServiceRoleClient();
  const { error } = await supabase.rpc("approve_stamp_session", {
    p_session_id: sessionId,
  });

  if (!error) return;

  if (!error.message.includes("Could not find the function")) {
    throw error;
  }

  const session = await getStampSessionById(sessionId);
  if (!session) throw new Error("Stamp request not found");
  if (session.status !== "pending") {
    throw new Error("Stamp request is not pending");
  }
  if (!isWithinPendingWindow(session.created_at)) {
    await supabase
      .from("stamp_sessions")
      .update({ status: "expired", resolved_at: new Date().toISOString() })
      .eq("id", sessionId)
      .eq("status", "pending");
    throw new Error("Stamp request has expired");
  }

  const { data: card, error: cardError } = await supabase
    .from("customer_cards")
    .select("current_stamps, loyalty_card_id, loyalty_cards ( stamp_target )")
    .eq("id", session.customer_card_id)
    .single();

  if (cardError || !card) throw cardError ?? new Error("Customer card not found");

  const stampTarget =
    (card.loyalty_cards as { stamp_target: number } | null)?.stamp_target ?? 0;
  const newCount = card.current_stamps + 1;
  const newStatus = newCount >= stampTarget ? "pending_otp" : "collecting";

  const { error: approveError } = await supabase
    .from("stamp_sessions")
    .update({ status: "approved", resolved_at: new Date().toISOString() })
    .eq("id", sessionId)
    .eq("status", "pending");

  if (approveError) throw approveError;

  const { error: incrementError } = await supabase.rpc("increment_stamps", {
    card_id: session.customer_card_id,
    new_status: newStatus,
  });
  if (incrementError) throw incrementError;
}

export async function rejectStampSession(
  sessionId: string,
  reason?: string | null,
): Promise<void> {
  const supabase = createServiceRoleClient();
  const session = await getStampSessionById(sessionId);
  if (!session) {
    throw new Error("Stamp request not found");
  }
  if (session.status !== "pending") {
    throw new Error("Stamp request is no longer pending");
  }
  if (!isWithinPendingWindow(session.created_at)) {
    await supabase
      .from("stamp_sessions")
      .update({ status: "expired", resolved_at: new Date().toISOString() })
      .eq("id", sessionId)
      .eq("status", "pending");
    throw new Error("Stamp request has expired");
  }

  const { error } = await supabase
    .from("stamp_sessions")
    .update({
      status: "rejected",
      resolved_at: new Date().toISOString(),
      rejection_reason: reason?.trim() || null,
    })
    .eq("id", sessionId)
    .eq("status", "pending");

  if (error) throw error;
}

export async function createPendingStampSession(input: {
  merchantId: string;
  customerCardId: string;
  locationId?: string | null;
}): Promise<string> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("stamp_sessions")
    .insert({
      merchant_id: input.merchantId,
      customer_card_id: input.customerCardId,
      location_id: input.locationId ?? null,
      session_token: randomUUID(),
      source: "qr_scan",
      status: "pending",
    })
    .select("id")
    .single();

  if (error) throw error;
  return data.id;
}
