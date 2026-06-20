import { createServiceRoleClient } from "../service-role";
import type { Database } from "../types";
import {
  clearActiveLocationIdCookie,
  getActiveLocationIdFromCookie,
  setActiveLocationIdCookie,
} from "../active-location";

export type MerchantLocationRow =
  Database["public"]["Tables"]["merchant_locations"]["Row"];

export type MerchantLocationInsert =
  Database["public"]["Tables"]["merchant_locations"]["Insert"];

export async function getLocationsByMerchantId(
  merchantId: string,
): Promise<MerchantLocationRow[]> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("merchant_locations")
    .select("*")
    .eq("merchant_id", merchantId)
    .order("is_primary", { ascending: false })
    .order("name", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function getActiveLocationsByMerchantId(
  merchantId: string,
): Promise<MerchantLocationRow[]> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("merchant_locations")
    .select("*")
    .eq("merchant_id", merchantId)
    .eq("is_active", true)
    .order("is_primary", { ascending: false })
    .order("name", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

/** Active branch counts keyed by merchant_id (for business list badges). */
export async function getActiveLocationCountsByMerchantIds(
  merchantIds: string[],
): Promise<Record<string, number>> {
  if (merchantIds.length === 0) return {};

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("merchant_locations")
    .select("merchant_id")
    .in("merchant_id", merchantIds)
    .eq("is_active", true);

  if (error) throw error;

  const counts: Record<string, number> = {};
  for (const id of merchantIds) counts[id] = 0;
  for (const row of data ?? []) {
    counts[row.merchant_id] = (counts[row.merchant_id] ?? 0) + 1;
  }
  return counts;
}

export async function createMerchantLocation(
  input: MerchantLocationInsert,
): Promise<MerchantLocationRow> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("merchant_locations")
    .insert(input)
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function createDefaultLocationForMerchant(
  merchantId: string,
  name: string,
): Promise<MerchantLocationRow> {
  return createMerchantLocation({
    merchant_id: merchantId,
    name: name.trim() || "Main location",
    is_primary: true,
    is_active: true,
  });
}

export async function updateMerchantLocation(
  locationId: string,
  merchantId: string,
  patch: Database["public"]["Tables"]["merchant_locations"]["Update"],
): Promise<MerchantLocationRow> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("merchant_locations")
    .update(patch)
    .eq("id", locationId)
    .eq("merchant_id", merchantId)
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function setPrimaryLocation(
  locationId: string,
  merchantId: string,
): Promise<void> {
  const supabase = createServiceRoleClient();

  const { error: clearError } = await supabase
    .from("merchant_locations")
    .update({ is_primary: false })
    .eq("merchant_id", merchantId);

  if (clearError) throw clearError;

  const { error: setError } = await supabase
    .from("merchant_locations")
    .update({ is_primary: true, is_active: true })
    .eq("id", locationId)
    .eq("merchant_id", merchantId);

  if (setError) throw setError;
}

export async function deactivateMerchantLocation(
  locationId: string,
  merchantId: string,
): Promise<void> {
  const supabase = createServiceRoleClient();

  const locations = await getLocationsByMerchantId(merchantId);
  const target = locations.find((l) => l.id === locationId);
  if (!target) throw new Error("Branch not found");

  const activeCount = locations.filter((l) => l.is_active).length;
  if (activeCount <= 1 && target.is_active) {
    throw new Error("Cannot deactivate the last active branch");
  }

  if (target.is_primary && target.is_active) {
    const fallback = locations.find(
      (l) => l.is_active && l.id !== locationId,
    );
    if (!fallback) {
      throw new Error("Set another branch as primary before deactivating");
    }
    await setPrimaryLocation(fallback.id, merchantId);
  }

  const { error } = await supabase
    .from("merchant_locations")
    .update({ is_active: false, is_primary: false })
    .eq("id", locationId)
    .eq("merchant_id", merchantId);

  if (error) throw error;
}

export async function countActiveLocations(merchantId: string): Promise<number> {
  const supabase = createServiceRoleClient();
  const { count, error } = await supabase
    .from("merchant_locations")
    .select("*", { count: "exact", head: true })
    .eq("merchant_id", merchantId)
    .eq("is_active", true);

  if (error) throw error;
  return count ?? 0;
}

function pickDefaultLocation(
  locations: MerchantLocationRow[],
): MerchantLocationRow | null {
  if (locations.length === 0) return null;
  return (
    locations.find((l) => l.is_primary) ??
    locations.find((l) => l.is_active) ??
    locations[0] ??
    null
  );
}

/** Read-only: cookie match, else primary / first active (no cookie write — use in RSC). */
export async function resolveActiveLocationForMerchant(
  merchantId: string,
): Promise<MerchantLocationRow | null> {
  const activeLocations = await getActiveLocationsByMerchantId(merchantId);
  if (activeLocations.length === 0) return null;

  const cookieId = await getActiveLocationIdFromCookie();
  if (cookieId) {
    const match = activeLocations.find((l) => l.id === cookieId);
    if (match) return match;
  }

  return pickDefaultLocation(activeLocations);
}

export async function switchActiveLocation(
  merchantId: string,
  locationId: string,
): Promise<MerchantLocationRow | null> {
  const activeLocations = await getActiveLocationsByMerchantId(merchantId);
  const match = activeLocations.find((l) => l.id === locationId);
  if (!match) return null;

  await setActiveLocationIdCookie(locationId);
  return match;
}

export async function clearActiveLocationForMerchant() {
  await clearActiveLocationIdCookie();
}
