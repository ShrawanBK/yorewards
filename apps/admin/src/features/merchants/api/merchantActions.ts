"use server";

import { createServiceRoleClient } from "@repo/supabase/service-role";
import { getAllMerchants } from "@repo/supabase/queries/merchants";
import { getMerchantDetailForAdmin } from "@repo/supabase/queries/admin-merchants";
import type { MerchantStatus } from "@repo/supabase/types";
import { revalidatePath } from "next/cache";
import { fail, logActionFailure } from "@repo/utils/action-error";
import { sendMerchantApprovedEmail } from "@repo/utils/merchant-email";
import { notifyMerchantApprovedInApp } from "@repo/supabase/notifications/dispatch";
import type { ActionResult } from "@/shared/types/action-result";
import { requireAdminForAction } from "@/features/auth/utils/requireAdminAuth";

export async function getAllMerchantsAction() {
  const guard = await requireAdminForAction();
  if (!guard.ok) return [];

  return getAllMerchants();
}

export async function getMerchantDetailAction(merchantId: string) {
  const guard = await requireAdminForAction();
  if (!guard.ok) return null;

  return getMerchantDetailForAdmin(merchantId);
}

export type MerchantActionResult = ActionResult;

/**
 * Move a merchant to `active`. Covers both approving a pending registration
 * and reactivating a suspended/rejected merchant. No-op (guarded) if already active.
 */
export async function approveMerchantAction(
  merchantId: string,
): Promise<MerchantActionResult> {
  const guard = await requireAdminForAction();
  if (!guard.ok) return guard.result;

  const admin = createServiceRoleClient();
  const { data: merchant, error: fetchError } = await admin
    .from("merchants")
    .select("email, business_name, status, user_id")
    .eq("id", merchantId)
    .single();

  if (fetchError || !merchant) {
    logActionFailure("approveMerchant.fetch", fetchError);
    return fail("MERCHANT_NOT_FOUND");
  }

  const wasActive = merchant.status === "active";

  const { error: updateError } = await admin
    .from("merchants")
    .update({
      status: "active" satisfies MerchantStatus,
      approved_at: new Date().toISOString(),
      approved_by: guard.user.id,
      rejection_reason: null,
      status_reason: null,
    })
    .eq("id", merchantId)
    .neq("status", "active" satisfies MerchantStatus);
  if (updateError) {
    logActionFailure("approveMerchant", updateError);
    return fail("MERCHANT_UPDATE_FAILED");
  }

  await admin.from("audit_log").insert({
    action: "approve_merchant",
    admin_id: guard.user.id,
    target_type: "merchant",
    target_id: merchantId,
  });

  if (!wasActive) {
    try {
      await sendMerchantApprovedEmail({
        to: merchant.email,
        businessName: merchant.business_name,
      });
    } catch (err) {
      logActionFailure("sendMerchantApprovedEmail", err);
    }
    if (merchant.user_id) {
      try {
        await notifyMerchantApprovedInApp({
          ownerUserId: merchant.user_id,
          businessName: merchant.business_name,
        });
      } catch (err) {
        logActionFailure("notifyMerchantApprovedInApp", err);
      }
    }
  }

  revalidatePath("/admin/merchants");
  revalidatePath(`/admin/merchants/${merchantId}`);
  return {};
}

/** Move an active merchant to `suspended`. */
export async function suspendMerchantAction(
  merchantId: string,
  reason: string,
): Promise<MerchantActionResult> {
  const trimmedReason = reason.trim();
  if (!trimmedReason) return fail("ACTION_REASON_REQUIRED");

  const guard = await requireAdminForAction();
  if (!guard.ok) return guard.result;

  const admin = createServiceRoleClient();
  const { error: updateError } = await admin
    .from("merchants")
    .update({
      status: "suspended" satisfies MerchantStatus,
      status_reason: trimmedReason,
    })
    .eq("id", merchantId)
    .eq("status", "active" satisfies MerchantStatus);
  if (updateError) {
    logActionFailure("suspendMerchant", updateError);
    return fail("MERCHANT_UPDATE_FAILED");
  }

  await admin.from("audit_log").insert({
    action: "suspend_merchant",
    admin_id: guard.user.id,
    target_type: "merchant",
    target_id: merchantId,
    notes: trimmedReason,
  });

  revalidatePath("/admin/merchants");
  revalidatePath(`/admin/merchants/${merchantId}`);
  revalidatePath("/admin/audit");
  revalidatePath("/admin/dashboard");
  return {};
}

/** Reactivate a suspended merchant (does not apply to pending/rejected). */
export async function reactivateMerchantAction(
  merchantId: string,
  reason: string,
): Promise<MerchantActionResult> {
  const trimmedReason = reason.trim();
  if (!trimmedReason) return fail("ACTION_REASON_REQUIRED");

  const guard = await requireAdminForAction();
  if (!guard.ok) return guard.result;

  const admin = createServiceRoleClient();
  const { error: updateError } = await admin
    .from("merchants")
    .update({
      status: "active" satisfies MerchantStatus,
      approved_at: new Date().toISOString(),
      approved_by: guard.user.id,
      rejection_reason: null,
      status_reason: null,
    })
    .eq("id", merchantId)
    .eq("status", "suspended" satisfies MerchantStatus);
  if (updateError) {
    logActionFailure("reactivateMerchant", updateError);
    return fail("MERCHANT_UPDATE_FAILED");
  }

  await admin.from("audit_log").insert({
    action: "reactivate_merchant",
    admin_id: guard.user.id,
    target_type: "merchant",
    target_id: merchantId,
    notes: trimmedReason,
  });

  revalidatePath("/admin/merchants");
  revalidatePath(`/admin/merchants/${merchantId}`);
  revalidatePath("/admin/audit");
  revalidatePath("/admin/dashboard");
  return {};
}

export async function rejectMerchantAction(
  merchantId: string,
  reason: string,
): Promise<MerchantActionResult> {
  const trimmedReason = reason.trim();
  if (!trimmedReason) return fail("REJECTION_REASON_REQUIRED");

  const guard = await requireAdminForAction();
  if (!guard.ok) return guard.result;

  const admin = createServiceRoleClient();
  const { error: updateError } = await admin
    .from("merchants")
    .update({
      status: "rejected" satisfies MerchantStatus,
      rejection_reason: trimmedReason,
    })
    .eq("id", merchantId)
    .eq("status", "pending" satisfies MerchantStatus);
  if (updateError) {
    logActionFailure("rejectMerchant", updateError);
    return fail("MERCHANT_UPDATE_FAILED");
  }

  await admin.from("audit_log").insert({
    action: "reject_merchant",
    admin_id: guard.user.id,
    target_type: "merchant",
    target_id: merchantId,
    notes: trimmedReason,
  });

  revalidatePath("/admin/merchants");
  revalidatePath(`/admin/merchants/${merchantId}`);
  return {};
}
