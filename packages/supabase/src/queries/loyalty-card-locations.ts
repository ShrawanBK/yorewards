import { createServiceRoleClient } from "../service-role";

export type LoyaltyCardLocationRule = {
  locationId: string;
  stampAllowed: boolean;
  redeemAllowed: boolean;
};

export type LoyaltyCardLocationRow = {
  loyalty_card_id: string;
  location_id: string;
  stamp_allowed: boolean;
  redeem_allowed: boolean;
};

/** No rows for card = all active branches allowed. */
export async function assertLocationStampAllowed(
  loyaltyCardId: string,
  locationId: string,
): Promise<void> {
  const supabase = createServiceRoleClient();

  const { count, error: countError } = await supabase
    .from("loyalty_card_locations")
    .select("*", { count: "exact", head: true })
    .eq("loyalty_card_id", loyaltyCardId);

  if (countError) throw countError;
  if (!count) return;

  const { data, error } = await supabase
    .from("loyalty_card_locations")
    .select("stamp_allowed")
    .eq("loyalty_card_id", loyaltyCardId)
    .eq("location_id", locationId)
    .maybeSingle();

  if (error) throw error;
  if (!data?.stamp_allowed) {
    throw new Error("stamp_branch_not_allowed");
  }
}

export async function assertLocationRedeemAllowed(
  loyaltyCardId: string,
  locationId: string | null,
): Promise<void> {
  if (!locationId) return;

  const supabase = createServiceRoleClient();

  const { count, error: countError } = await supabase
    .from("loyalty_card_locations")
    .select("*", { count: "exact", head: true })
    .eq("loyalty_card_id", loyaltyCardId);

  if (countError) throw countError;
  if (!count) return;

  const { data, error } = await supabase
    .from("loyalty_card_locations")
    .select("redeem_allowed")
    .eq("loyalty_card_id", loyaltyCardId)
    .eq("location_id", locationId)
    .maybeSingle();

  if (error) throw error;
  if (!data?.redeem_allowed) {
    throw new Error("stamp_branch_redeem_not_allowed");
  }
}

export async function getLoyaltyCardLocationRules(
  loyaltyCardId: string,
): Promise<LoyaltyCardLocationRow[]> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("loyalty_card_locations")
    .select("loyalty_card_id, location_id, stamp_allowed, redeem_allowed")
    .eq("loyalty_card_id", loyaltyCardId);

  if (error) throw error;
  return data ?? [];
}

export async function replaceLoyaltyCardLocationRules(
  loyaltyCardId: string,
  rules: LoyaltyCardLocationRule[],
  activeLocationIds: string[],
): Promise<void> {
  const supabase = createServiceRoleClient();

  const allFullyOpen =
    activeLocationIds.length > 0 &&
    activeLocationIds.every((locationId) => {
      const rule = rules.find((r) => r.locationId === locationId);
      return rule?.stampAllowed && rule?.redeemAllowed;
    }) &&
    rules.length === activeLocationIds.length;

  const { error: deleteError } = await supabase
    .from("loyalty_card_locations")
    .delete()
    .eq("loyalty_card_id", loyaltyCardId);

  if (deleteError) throw deleteError;

  if (allFullyOpen || rules.length === 0) return;

  const rows = rules.map((rule) => ({
    loyalty_card_id: loyaltyCardId,
    location_id: rule.locationId,
    stamp_allowed: rule.stampAllowed,
    redeem_allowed: rule.redeemAllowed,
  }));

  const { error: insertError } = await supabase
    .from("loyalty_card_locations")
    .insert(rows);

  if (insertError) throw insertError;
}

export function filterStampableBranchIds(
  activeLocationIds: string[],
  rules: LoyaltyCardLocationRow[],
): string[] {
  if (rules.length === 0) return activeLocationIds;
  const allowed = new Set(
    rules.filter((r) => r.stamp_allowed).map((r) => r.location_id),
  );
  return activeLocationIds.filter((id) => allowed.has(id));
}
