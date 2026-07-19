import { createServiceRoleClient } from "../service-role";
import {
  assertWithinLimit,
  getPlanLimits,
  normalizeSubscriptionTier,
} from "@repo/utils/plan-limits";
import type { SubscriptionTier } from "../types";

type LimitDenied = {
  ok: false;
  resource: "customers" | "cards" | "staff";
  limit: number;
};

export async function countMerchantCustomerCards(
  merchantId: string,
): Promise<number> {
  const supabase = createServiceRoleClient();
  const { count, error } = await supabase
    .from("customer_cards")
    .select("id", { count: "exact", head: true })
    .eq("merchant_id", merchantId);

  if (error) throw error;
  return count ?? 0;
}

export async function countMerchantLoyaltyCards(
  merchantId: string,
): Promise<number> {
  const supabase = createServiceRoleClient();
  const { count, error } = await supabase
    .from("loyalty_cards")
    .select("id", { count: "exact", head: true })
    .eq("merchant_id", merchantId);

  if (error) throw error;
  return count ?? 0;
}

export async function countMerchantStaff(
  merchantId: string,
): Promise<number> {
  const supabase = createServiceRoleClient();
  const { count, error } = await supabase
    .from("merchant_staff")
    .select("id", { count: "exact", head: true })
    .eq("merchant_id", merchantId)
    .in("status", ["active", "pending"]);

  if (error) throw error;
  return count ?? 0;
}

export async function getMerchantTier(
  merchantId: string,
): Promise<SubscriptionTier> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("merchants")
    .select("subscription_tier")
    .eq("id", merchantId)
    .maybeSingle();

  if (error) throw error;
  return normalizeSubscriptionTier(data?.subscription_tier);
}

export async function assertMerchantCustomerLimit(
  merchantId: string,
): Promise<{ ok: true } | LimitDenied> {
  const tier = await getMerchantTier(merchantId);
  const limits = getPlanLimits(tier);
  const current = await countMerchantCustomerCards(merchantId);
  const result = assertWithinLimit(
    current,
    limits.maxActiveCustomers,
    "customers",
  );
  if (!result.ok) return result;
  return { ok: true };
}

export async function assertMerchantStaffLimit(
  merchantId: string,
): Promise<{ ok: true } | LimitDenied> {
  const tier = await getMerchantTier(merchantId);
  const limits = getPlanLimits(tier);
  const current = await countMerchantStaff(merchantId);
  const result = assertWithinLimit(current, limits.maxStaff, "staff");
  if (!result.ok) return result;
  return { ok: true };
}

export async function assertMerchantLoyaltyCardLimit(
  merchantId: string,
): Promise<{ ok: true } | LimitDenied> {
  const tier = await getMerchantTier(merchantId);
  const limits = getPlanLimits(tier);
  const current = await countMerchantLoyaltyCards(merchantId);
  const result = assertWithinLimit(current, limits.maxLoyaltyCards, "cards");
  if (!result.ok) return result;
  return { ok: true };
}
