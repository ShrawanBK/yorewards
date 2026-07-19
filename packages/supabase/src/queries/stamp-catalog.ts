import { createServiceRoleClient } from "../service-role";
import {
  filterStampableBranchIds,
  getLoyaltyCardLocationRules,
} from "./loyalty-card-locations";

export type StampableMerchantOption = {
  merchantId: string;
  businessName: string;
  loyaltyCardId: string;
  cardName: string;
};

export type StampableBranchOption = {
  locationId: string;
  branchName: string;
};

export async function listStampableMerchants(): Promise<StampableMerchantOption[]> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("merchants")
    .select(
      `
      id,
      business_name,
      loyalty_cards!inner ( id, card_name, is_active )
    `,
    )
    .eq("status", "active")
    .eq("loyalty_cards.is_active", true)
    .order("business_name");

  if (error) throw error;

  return (data ?? []).flatMap((row) => {
    const cards = Array.isArray(row.loyalty_cards)
      ? row.loyalty_cards
      : row.loyalty_cards
        ? [row.loyalty_cards]
        : [];
    const card = cards[0];
    if (!card) return [];
    return [
      {
        merchantId: row.id,
        businessName: row.business_name,
        loyaltyCardId: card.id,
        cardName: card.card_name,
      },
    ];
  });
}

export async function listStampableBranches(
  merchantId: string,
  loyaltyCardId: string,
): Promise<StampableBranchOption[]> {
  const supabase = createServiceRoleClient();
  const { data: locations, error } = await supabase
    .from("merchant_locations")
    .select("id, name")
    .eq("merchant_id", merchantId)
    .eq("is_active", true)
    .order("name");

  if (error) throw error;
  if (!locations?.length) return [];

  const rules = await getLoyaltyCardLocationRules(loyaltyCardId);
  const stampableIds = filterStampableBranchIds(
    locations.map((l) => l.id),
    rules,
  );
  const allowed = new Set(stampableIds);

  return locations
    .filter((l) => allowed.has(l.id))
    .map((l) => ({ locationId: l.id, branchName: l.name }));
}
