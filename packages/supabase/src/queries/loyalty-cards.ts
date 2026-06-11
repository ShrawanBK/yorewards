import { createServiceRoleClient } from "../service-role";
import type { Database } from "../types";

export type LoyaltyCardRow =
  Database["public"]["Tables"]["loyalty_cards"]["Row"];

export type LoyaltyCardInsert =
  Database["public"]["Tables"]["loyalty_cards"]["Insert"];

export async function getLoyaltyCardByMerchantId(
  merchantId: string,
): Promise<LoyaltyCardRow | null> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("loyalty_cards")
    .select("*")
    .eq("merchant_id", merchantId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function upsertLoyaltyCardForMerchant(
  merchantId: string,
  input: Omit<LoyaltyCardInsert, "merchant_id" | "id">,
): Promise<LoyaltyCardRow> {
  const supabase = createServiceRoleClient();
  const existing = await getLoyaltyCardByMerchantId(merchantId);

  if (existing) {
    const { data, error } = await supabase
      .from("loyalty_cards")
      .update(input)
      .eq("id", existing.id)
      .eq("merchant_id", merchantId)
      .select("*")
      .single();

    if (error) throw error;
    return data;
  }

  const { data, error } = await supabase
    .from("loyalty_cards")
    .insert({ ...input, merchant_id: merchantId })
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function updateMerchantBranding(
  merchantId: string,
  patch: Pick<
    Database["public"]["Tables"]["merchants"]["Update"],
    "logo_url" | "primary_color"
  >,
): Promise<void> {
  const supabase = createServiceRoleClient();
  const { error } = await supabase
    .from("merchants")
    .update(patch)
    .eq("id", merchantId);

  if (error) throw error;
}
