import { createServiceRoleClient } from "../service-role";
import type { Database } from "../types";
import { getLoyaltyCardByMerchantId } from "./loyalty-cards";
import type { LoyaltyCardRow } from "./loyalty-cards";
import { getMerchantSubscription } from "./merchant-subscriptions";
import type { MerchantSubscriptionRow } from "./merchant-subscriptions";

export type AdminMerchantAuditEntry = {
  id: string;
  action: string;
  notes: string | null;
  occurredAt: string;
};

export type AdminMerchantDetail = {
  merchant: Database["public"]["Tables"]["merchants"]["Row"];
  branchesCount: number;
  activeBranchesCount: number;
  loyaltyCard: LoyaltyCardRow | null;
  subscription: MerchantSubscriptionRow | null;
  recentAudit: AdminMerchantAuditEntry[];
};

export async function getMerchantDetailForAdmin(
  merchantId: string,
): Promise<AdminMerchantDetail | null> {
  const supabase = createServiceRoleClient();

  const { data: merchant, error: merchantError } = await supabase
    .from("merchants")
    .select("*")
    .eq("id", merchantId)
    .maybeSingle();

  if (merchantError) throw merchantError;
  if (!merchant) return null;

  const [loyaltyCard, subscription, branchesResult, auditResult] = await Promise.all([
    getLoyaltyCardByMerchantId(merchantId),
    getMerchantSubscription(merchantId),
    supabase
      .from("merchant_locations")
      .select("id, is_active")
      .eq("merchant_id", merchantId),
    supabase
      .from("audit_log")
      .select("id, action, notes, created_at")
      .eq("target_type", "merchant")
      .eq("target_id", merchantId)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  if (branchesResult.error) throw branchesResult.error;
  if (auditResult.error) throw auditResult.error;

  const branches = branchesResult.data ?? [];

  return {
    merchant,
    branchesCount: branches.length,
    activeBranchesCount: branches.filter((branch) => branch.is_active).length,
    loyaltyCard,
    subscription,
    recentAudit: (auditResult.data ?? []).map((row) => ({
      id: row.id,
      action: row.action,
      notes: row.notes,
      occurredAt: row.created_at,
    })),
  };
}
