import { createServiceRoleClient } from "../service-role";

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
