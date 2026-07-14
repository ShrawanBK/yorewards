import { createServiceRoleClient } from "../service-role";
import type { RewardStatus } from "../types";

export type AdminStampSessionRow = {
  id: string;
  source: string;
  createdAt: string;
  resolvedAt: string | null;
  amountSpent: number | null;
  branchName: string | null;
  approvedByLabel: string | null;
};

export type AdminStampCardLookup = {
  customerCardId: string;
  customerId: string;
  customerName: string | null;
  phone: string;
  merchantId: string;
  merchantName: string;
  cardName: string;
  currencyCode: string;
  currentStamps: number;
  stampTarget: number;
  rewardStatus: RewardStatus;
  recentApprovedSessions: AdminStampSessionRow[];
};

export const ADMIN_STAMP_SEARCH_TYPES = [
  "phone",
  "customer_name",
  "merchant_name",
  "loyalty_card_name",
  "card_id",
] as const;

export type AdminStampSearchType = (typeof ADMIN_STAMP_SEARCH_TYPES)[number];

export function isAdminStampSearchType(value: string): value is AdminStampSearchType {
  return (ADMIN_STAMP_SEARCH_TYPES as readonly string[]).includes(value);
}

type CustomerCardQueryRow = {
  id: string;
  customer_id: string;
  merchant_id: string;
  current_stamps: number;
  reward_status: RewardStatus;
  customers: { name: string | null; phone: string } | null;
  merchants: { business_name: string } | null;
  loyalty_cards: { card_name: string; stamp_target: number; min_spend_currency: string } | null;
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const LOOKUP_LIMIT = 50;

function escapeIlikePattern(value: string): string {
  return value.replace(/[%_\\]/g, "\\$&");
}

function phoneIlikePattern(query: string): string {
  const digits = query.replace(/\D/g, "");
  const term = digits.length > 0 ? digits : query.trim();
  return `%${escapeIlikePattern(term)}%`;
}

async function resolveApproverLabels(
  merchantId: string,
  approverIds: (string | null)[],
): Promise<Map<string, string>> {
  const ids = [...new Set(approverIds.filter((id): id is string => Boolean(id)))];
  if (ids.length === 0) return new Map();

  const supabase = createServiceRoleClient();
  const [staffResult, merchantResult] = await Promise.all([
    supabase
      .from("merchant_staff")
      .select("user_id, display_name")
      .eq("merchant_id", merchantId)
      .in("user_id", ids),
    supabase.from("merchants").select("user_id").eq("id", merchantId).maybeSingle(),
  ]);

  if (staffResult.error) throw staffResult.error;
  if (merchantResult.error) throw merchantResult.error;

  const labels = new Map<string, string>();
  for (const row of staffResult.data ?? []) {
    if (row.user_id) {
      labels.set(row.user_id, row.display_name?.trim() || "Staff");
    }
  }
  if (merchantResult.data?.user_id && ids.includes(merchantResult.data.user_id)) {
    labels.set(merchantResult.data.user_id, "Owner");
  }
  return labels;
}

async function getApprovedSessionsForCard(
  cardId: string,
  merchantId: string,
  limit = 10,
): Promise<AdminStampSessionRow[]> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("stamp_sessions")
    .select(
      `
      id,
      source,
      created_at,
      resolved_at,
      amount_spent,
      approved_by,
      merchant_locations ( name )
    `,
    )
    .eq("customer_card_id", cardId)
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;

  const rows = data ?? [];
  const approverLabels = await resolveApproverLabels(
    merchantId,
    rows.map((row) => row.approved_by),
  );

  return rows.map((row) => {
    const branch = row.merchant_locations as { name: string } | null;
    let approvedByLabel: string | null = null;
    if (row.approved_by) {
      approvedByLabel = approverLabels.get(row.approved_by) ?? null;
    }
    if (!approvedByLabel && row.source === "admin_manual") {
      approvedByLabel = "Admin";
    }

    return {
      id: row.id,
      source: row.source,
      createdAt: row.created_at,
      resolvedAt: row.resolved_at,
      amountSpent: row.amount_spent != null ? Number(row.amount_spent) : null,
      branchName: branch?.name ?? null,
      approvedByLabel,
    };
  });
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
      loyalty_cards ( card_name, stamp_target, min_spend_currency )
    `,
    )
    .eq("id", cardId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const row = data as CustomerCardQueryRow;
  const recentApprovedSessions = await getApprovedSessionsForCard(cardId, row.merchant_id);

  return {
    customerCardId: row.id,
    customerId: row.customer_id,
    customerName: row.customers?.name ?? null,
    phone: row.customers?.phone ?? "",
    merchantId: row.merchant_id,
    merchantName: row.merchants?.business_name ?? "—",
    cardName: row.loyalty_cards?.card_name ?? "—",
    currencyCode: row.loyalty_cards?.min_spend_currency ?? "NPR",
    currentStamps: row.current_stamps,
    stampTarget: row.loyalty_cards?.stamp_target ?? 0,
    rewardStatus: row.reward_status,
    recentApprovedSessions,
  };
}

async function findCardIdsByCustomerIds(customerIds: string[]): Promise<string[]> {
  if (customerIds.length === 0) return [];

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("customer_cards")
    .select("id")
    .in("customer_id", customerIds)
    .limit(LOOKUP_LIMIT);

  if (error) throw error;
  return (data ?? []).map((row) => row.id);
}

async function findCardIdsByMerchantIds(merchantIds: string[]): Promise<string[]> {
  if (merchantIds.length === 0) return [];

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("customer_cards")
    .select("id")
    .in("merchant_id", merchantIds)
    .limit(LOOKUP_LIMIT);

  if (error) throw error;
  return (data ?? []).map((row) => row.id);
}

async function findCardIdsByLoyaltyCardIds(loyaltyCardIds: string[]): Promise<string[]> {
  if (loyaltyCardIds.length === 0) return [];

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("customer_cards")
    .select("id")
    .in("loyalty_card_id", loyaltyCardIds)
    .limit(LOOKUP_LIMIT);

  if (error) throw error;
  return (data ?? []).map((row) => row.id);
}

async function findCardIdsForLookup(
  query: string,
  searchType: AdminStampSearchType,
): Promise<string[]> {
  const supabase = createServiceRoleClient();

  if (searchType === "card_id") {
    return UUID_RE.test(query) ? [query] : [];
  }

  if (searchType === "phone") {
    const { data, error } = await supabase
      .from("customers")
      .select("id")
      .is("deleted_at", null)
      .ilike("phone", phoneIlikePattern(query))
      .limit(LOOKUP_LIMIT);

    if (error) throw error;
    const customerIds = (data ?? []).map((row) => row.id);
    return findCardIdsByCustomerIds(customerIds);
  }

  if (searchType === "customer_name") {
    const ilikePattern = `%${escapeIlikePattern(query)}%`;
    const { data, error } = await supabase
      .from("customers")
      .select("id")
      .is("deleted_at", null)
      .ilike("name", ilikePattern)
      .limit(LOOKUP_LIMIT);

    if (error) throw error;
    const customerIds = (data ?? []).map((row) => row.id);
    return findCardIdsByCustomerIds(customerIds);
  }

  if (searchType === "merchant_name") {
    const ilikePattern = `%${escapeIlikePattern(query)}%`;
    const { data, error } = await supabase
      .from("merchants")
      .select("id")
      .ilike("business_name", ilikePattern)
      .limit(LOOKUP_LIMIT);

    if (error) throw error;
    const merchantIds = (data ?? []).map((row) => row.id);
    return findCardIdsByMerchantIds(merchantIds);
  }

  const ilikePattern = `%${escapeIlikePattern(query)}%`;
  const { data, error } = await supabase
    .from("loyalty_cards")
    .select("id")
    .ilike("card_name", ilikePattern)
    .limit(LOOKUP_LIMIT);

  if (error) throw error;
  const loyaltyCardIds = (data ?? []).map((row) => row.id);
  return findCardIdsByLoyaltyCardIds(loyaltyCardIds);
}

/** Search loyalty cards by the selected field (phone, name, merchant, card name, or card UUID). */
export async function lookupAdminStampCards(
  query: string,
  searchType: AdminStampSearchType,
): Promise<AdminStampCardLookup[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const cardIds = (await findCardIdsForLookup(trimmed, searchType)).slice(0, 20);
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

export function isValidAdminStampCardId(value: string): boolean {
  return UUID_RE.test(value.trim());
}
