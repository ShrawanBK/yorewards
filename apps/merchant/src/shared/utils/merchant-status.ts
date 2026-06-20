import type { MerchantStatus } from "@repo/supabase/types";

/** Pending merchants can set up their card before admin approval. */
export function canConfigureLoyaltyCard(status: MerchantStatus): boolean {
  return status === "pending" || status === "active";
}

/** Stamp queue, redeem, and live customer flows require an approved business. */
export function canUseCounterWorkflow(status: MerchantStatus): boolean {
  return status === "active";
}

export function isMerchantAccountBlocked(status: MerchantStatus): boolean {
  return status === "suspended" || status === "rejected";
}
