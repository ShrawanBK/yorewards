import { createServiceRoleClient } from "../service-role";
import type { CustomerStatus, Database, RewardStatus } from "../types";

export type CustomerRow = Database["public"]["Tables"]["customers"]["Row"];

export type AdminCustomerListRow = {
  id: string;
  name: string | null;
  phone: string;
  countryCode: string;
  status: CustomerStatus;
  cardCount: number;
  createdAt: string;
  lastActiveAt: string;
};

export type AdminCustomerCardSummary = {
  id: string;
  merchantId: string;
  merchantName: string;
  cardName: string;
  currentStamps: number;
  stampTarget: number;
  rewardStatus: RewardStatus;
  cycleNumber: number;
};

export type AdminCustomerDetail = {
  customer: CustomerRow;
  cards: AdminCustomerCardSummary[];
};

type CustomerListQueryRow = {
  id: string;
  name: string | null;
  phone: string;
  country_code: string;
  status: CustomerStatus;
  created_at: string;
  last_active_at: string;
  customer_cards: { id: string }[] | null;
};

type CustomerCardQueryRow = {
  id: string;
  merchant_id: string;
  current_stamps: number;
  cycle_number: number;
  reward_status: RewardStatus;
  merchants: { business_name: string } | null;
  loyalty_cards: { card_name: string; stamp_target: number } | null;
};

export async function getAllCustomersForAdmin(): Promise<AdminCustomerListRow[]> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("customers")
    .select(
      `
      id,
      name,
      phone,
      country_code,
      status,
      created_at,
      last_active_at,
      customer_cards ( id )
    `,
    )
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return ((data ?? []) as CustomerListQueryRow[]).map((row) => ({
    id: row.id,
    name: row.name,
    phone: row.phone,
    countryCode: row.country_code,
    status: row.status,
    cardCount: row.customer_cards?.length ?? 0,
    createdAt: row.created_at,
    lastActiveAt: row.last_active_at,
  }));
}

export async function getCustomerDetailForAdmin(
  customerId: string,
): Promise<AdminCustomerDetail | null> {
  const supabase = createServiceRoleClient();

  const { data: customer, error: customerError } = await supabase
    .from("customers")
    .select("*")
    .eq("id", customerId)
    .is("deleted_at", null)
    .maybeSingle();

  if (customerError) throw customerError;
  if (!customer) return null;

  const { data: cardRows, error: cardsError } = await supabase
    .from("customer_cards")
    .select(
      `
      id,
      merchant_id,
      current_stamps,
      cycle_number,
      reward_status,
      merchants ( business_name ),
      loyalty_cards ( card_name, stamp_target )
    `,
    )
    .eq("customer_id", customerId)
    .order("last_stamped_at", { ascending: false, nullsFirst: false });

  if (cardsError) throw cardsError;

  const cards: AdminCustomerCardSummary[] = (
    (cardRows ?? []) as CustomerCardQueryRow[]
  ).map((row) => ({
    id: row.id,
    merchantId: row.merchant_id,
    merchantName: row.merchants?.business_name ?? "—",
    cardName: row.loyalty_cards?.card_name ?? "—",
    currentStamps: row.current_stamps,
    stampTarget: row.loyalty_cards?.stamp_target ?? 0,
    rewardStatus: row.reward_status,
    cycleNumber: row.cycle_number,
  }));

  return { customer, cards };
}
