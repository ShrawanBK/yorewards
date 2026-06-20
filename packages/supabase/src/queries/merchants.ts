import {
  clearActiveMerchantIdCookie,
  getActiveMerchantIdFromCookie,
  setActiveMerchantIdCookie,
} from "../active-merchant";
import { clearActiveLocationIdCookie } from "../active-location";
import { createServiceRoleClient } from "../service-role";
import type { Database, MerchantStatus } from "../types";

export type MerchantRow = Database["public"]["Tables"]["merchants"]["Row"];
export type { MerchantStatus };

/** All businesses owned by one auth user (multi-business per owner). */
export async function getMerchantsByUserId(
  userId: string,
): Promise<MerchantRow[]> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("merchants")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }
  return data ?? [];
}

/**
 * Active business for the logged-in owner.
 * Uses `yorewards_active_merchant_id` cookie when set; otherwise the first owned business.
 */
export async function getMerchantByUserId(
  userId: string,
): Promise<MerchantRow | null> {
  const merchants = await getMerchantsByUserId(userId);
  if (merchants.length === 0) {
    return null;
  }

  const activeId = await getActiveMerchantIdFromCookie();
  if (activeId) {
    const match = merchants.find((m) => m.id === activeId);
    if (match) {
      return match;
    }
  }

  return merchants[0] ?? null;
}

export async function resolveActiveMerchantForUser(
  userId: string,
  merchantId?: string | null,
): Promise<MerchantRow | null> {
  const merchants = await getMerchantsByUserId(userId);
  if (merchants.length === 0) {
    return null;
  }

  const targetId = merchantId ?? (await getActiveMerchantIdFromCookie());
  const match = targetId ? merchants.find((m) => m.id === targetId) : undefined;
  const active = match ?? merchants[0]!;

  if (!targetId || targetId !== active.id) {
    await setActiveMerchantIdCookie(active.id);
  }

  return active;
}

export async function switchActiveMerchant(
  userId: string,
  merchantId: string,
): Promise<MerchantRow | null> {
  const merchants = await getMerchantsByUserId(userId);
  const match = merchants.find((m) => m.id === merchantId);
  if (!match) {
    return null;
  }
  await setActiveMerchantIdCookie(merchantId);
  await clearActiveLocationIdCookie();
  return match;
}

export async function clearActiveMerchantForUser() {
  await clearActiveMerchantIdCookie();
}

export async function getPendingMerchants() {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("merchants")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }
  return data ?? [];
}

export async function getAllMerchants() {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("merchants")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }
  return data ?? [];
}
