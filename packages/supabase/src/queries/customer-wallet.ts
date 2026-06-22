import { createServiceRoleClient } from "../service-role";
import type { CurrencyCode, RewardStatus } from "../types";

export type CustomerWalletCard = {
  id: string;
  merchantId: string;
  loyaltyCardId: string;
  businessName: string;
  logoUrl: string | null;
  primaryColor: string;
  cardName: string;
  description: string;
  stampTarget: number;
  currentStamps: number;
  cycleNumber: number;
  rewardStatus: RewardStatus;
  rewardDescription: string;
  minSpend: number;
  minSpendCurrency: CurrencyCode;
  lastStampedAt: string | null;
};

type WalletCardRow = {
  id: string;
  merchant_id: string;
  loyalty_card_id: string;
  current_stamps: number;
  cycle_number: number;
  reward_status: RewardStatus;
  last_stamped_at: string | null;
  merchants: {
    business_name: string;
    logo_url: string | null;
    primary_color: string;
  } | null;
  loyalty_cards: {
    card_name: string;
    description: string;
    stamp_target: number;
    reward_description: string;
    min_spend: number;
    min_spend_currency: CurrencyCode;
  } | null;
};

export async function getCustomerWalletCards(
  customerId: string,
): Promise<CustomerWalletCard[]> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("customer_cards")
    .select(
      `
      id,
      merchant_id,
      loyalty_card_id,
      current_stamps,
      cycle_number,
      reward_status,
      last_stamped_at,
      merchants ( business_name, logo_url, primary_color ),
      loyalty_cards (
        card_name,
        description,
        stamp_target,
        reward_description,
        min_spend,
        min_spend_currency
      )
    `,
    )
    .eq("customer_id", customerId)
    .order("last_stamped_at", { ascending: false, nullsFirst: false });

  if (error) throw error;

  return ((data ?? []) as WalletCardRow[]).map((row) => {
    const merchant = row.merchants;
    const card = row.loyalty_cards;

    return {
      id: row.id,
      merchantId: row.merchant_id,
      loyaltyCardId: row.loyalty_card_id,
      businessName: merchant?.business_name ?? "Business",
      logoUrl: merchant?.logo_url ?? null,
      primaryColor: merchant?.primary_color ?? "#7C3AED",
      cardName: card?.card_name ?? "Loyalty card",
      description: card?.description ?? "",
      stampTarget: card?.stamp_target ?? 0,
      currentStamps: row.current_stamps,
      cycleNumber: row.cycle_number,
      rewardStatus: row.reward_status,
      rewardDescription: card?.reward_description ?? "",
      minSpend: card?.min_spend ?? 0,
      minSpendCurrency: card?.min_spend_currency ?? "NPR",
      lastStampedAt: row.last_stamped_at,
    };
  });
}

export async function getOrCreateCustomerCard(
  customerId: string,
  loyaltyCardId: string,
  merchantId: string,
): Promise<string> {
  const supabase = createServiceRoleClient();

  const { data: existing, error: existingError } = await supabase
    .from("customer_cards")
    .select("id")
    .eq("customer_id", customerId)
    .eq("loyalty_card_id", loyaltyCardId)
    .maybeSingle();

  if (existingError) throw existingError;
  if (existing) return existing.id;

  const { data: created, error: createError } = await supabase
    .from("customer_cards")
    .insert({
      customer_id: customerId,
      loyalty_card_id: loyaltyCardId,
      merchant_id: merchantId,
    })
    .select("id")
    .single();

  if (createError) throw createError;
  return created.id;
}
