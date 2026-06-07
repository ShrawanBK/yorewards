"use server";

import { redirect } from "next/navigation";
import { createClient } from "@repo/supabase/server";
import { createServiceRoleClient } from "@repo/supabase/service-role";
import { getAllMerchants } from "@repo/supabase/queries/merchants";
import type { MerchantStatus } from "@repo/supabase/types";
import { revalidatePath } from "next/cache";

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };
  redirect("/admin/merchants");
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

export async function getAllMerchantsAction() {
  return getAllMerchants();
}

export type MerchantActionResult = { error?: string };

/**
 * Move a merchant to `active`. Covers both approving a pending registration
 * and reactivating a suspended/rejected merchant. No-op (guarded) if already active.
 */
export async function approveMerchantAction(
  merchantId: string,
): Promise<MerchantActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const admin = createServiceRoleClient();
  const { error: updateError } = await admin
    .from("merchants")
    .update({
      status: "active" satisfies MerchantStatus,
      approved_at: new Date().toISOString(),
      approved_by: user.id,
      rejection_reason: null,
    })
    .eq("id", merchantId)
    .neq("status", "active" satisfies MerchantStatus);
  if (updateError) return { error: updateError.message };

  await admin.from("audit_log").insert({
    action: "approve_merchant",
    admin_id: user.id,
    target_type: "merchant",
    target_id: merchantId,
  });

  revalidatePath("/admin/merchants");
  return {};
}

/** Move an active merchant to `suspended`. */
export async function suspendMerchantAction(
  merchantId: string,
): Promise<MerchantActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const admin = createServiceRoleClient();
  const { error: updateError } = await admin
    .from("merchants")
    .update({ status: "suspended" satisfies MerchantStatus })
    .eq("id", merchantId)
    .eq("status", "active" satisfies MerchantStatus);
  if (updateError) return { error: updateError.message };

  await admin.from("audit_log").insert({
    action: "suspend_merchant",
    admin_id: user.id,
    target_type: "merchant",
    target_id: merchantId,
  });

  revalidatePath("/admin/merchants");
  return {};
}

export async function rejectMerchantAction(
  merchantId: string,
  reason: string,
): Promise<MerchantActionResult> {
  const trimmedReason = reason.trim();
  if (!trimmedReason) return { error: "Missing rejection reason" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const admin = createServiceRoleClient();
  const { error: updateError } = await admin
    .from("merchants")
    .update({
      status: "rejected" satisfies MerchantStatus,
      rejection_reason: trimmedReason,
    })
    .eq("id", merchantId)
    .eq("status", "pending" satisfies MerchantStatus);
  if (updateError) return { error: updateError.message };

  await admin.from("audit_log").insert({
    action: "reject_merchant",
    admin_id: user.id,
    target_type: "merchant",
    target_id: merchantId,
    notes: trimmedReason,
  });

  revalidatePath("/admin/merchants");
  return {};
}
