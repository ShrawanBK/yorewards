import { createServiceRoleClient } from "../service-role";
import { findCustomerByPhone } from "./customers";
import type { RewardStatus } from "../types";

export type AdminStampSessionRow = {
  id: string;
  source: string;
  createdAt: string;
  resolvedAt: string | null;
};

export type AdminStampCardLookup = {
  customerCardId: string;
  customerId: string;
  customerName: string | null;
  phone: string;
  merchantId: string;
  merchantName: string;
  cardName: string;
  currentStamps: number;
  stampTarget: number;
  rewardStatus: RewardStatus;
  recentApprovedSessions: AdminStampSessionRow[];
};

type CustomerCardQueryRow = {
  id: string;
  customer_id: string;
  merchant_id: string;
  current_stamps: number;
  reward_status: RewardStatus;
  customers: { name: string | null; phone: string } | null;
  merchants: { business_name: string } | null;
  loyalty_cards: { card_name: string; stamp_target: number } | null;
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function getApprovedSessionsForCard(
  cardId: string,
  limit = 10,
): Promise<AdminStampSessionRow[]> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("stamp_sessions")
    .select("id, source, created_at, resolved_at")
    .eq("customer_card_id", cardId)
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id,
    source: row.source,
    createdAt: row.created_at,
    resolvedAt: row.resolved_at,
  }));
}

async function getAdminStampCardLookup(
  cardId: string,
): Promise<AdminStampCardLookup | null> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("customer_cards")
    .select(
      `
      id,
      customer_id,
      merchant_id,
      current_stamps,
      reward_status,
      customers ( name, phone ),
      merchants ( business_name ),
      loyalty_cards ( card_name, stamp_target )
    `,
    )
    .eq("id", cardId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const row = data as CustomerCardQueryRow;
  const recentApprovedSessions = await getApprovedSessionsForCard(cardId);

  return {
    customerCardId: row.id,
    customerId: row.customer_id,
    customerName: row.customers?.name ?? null,
    phone: row.customers?.phone ?? "",
    merchantId: row.merchant_id,
    merchantName: row.merchants?.business_name ?? "—",
    cardName: row.loyalty_cards?.card_name ?? "—",
    currentStamps: row.current_stamps,
    stampTarget: row.loyalty_cards?.stamp_target ?? 0,
    rewardStatus: row.reward_status,
    recentApprovedSessions,
  };
}

/** Search by customer phone or customer_cards.id (UUID). */
export async function lookupAdminStampCards(
  query: string,
): Promise<AdminStampCardLookup[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  let cardIds: string[] = [];

  if (UUID_RE.test(trimmed)) {
    cardIds = [trimmed];
  } else {
    const customer = await findCustomerByPhone(trimmed);
    if (!customer) return [];

    const supabase = createServiceRoleClient();
    const { data, error } = await supabase
      .from("customer_cards")
      .select("id")
      .eq("customer_id", customer.id)
      .order("last_stamped_at", { ascending: false, nullsFirst: false });

    if (error) throw error;
    cardIds = (data ?? []).map((row) => row.id);
  }

  if (cardIds.length === 0) return [];

  const lookups = await Promise.all(
    cardIds.map((cardId) => getAdminStampCardLookup(cardId)),
  );

  return lookups.filter((item): item is AdminStampCardLookup => item !== null);
}

export async function refreshAdminStampCardLookup(
  cardId: string,
): Promise<AdminStampCardLookup | null> {
  return getAdminStampCardLookup(cardId);
}
