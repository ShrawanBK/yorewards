"use server";

import { createServiceRoleClient } from "@repo/supabase/service-role";
import {
  getAllCustomersForAdmin,
  getCustomerDetailForAdmin,
} from "@repo/supabase/queries/admin-customers";
import type { CustomerStatus } from "@repo/supabase/types";
import { revalidatePath } from "next/cache";
import { fail, logActionFailure } from "@repo/utils/action-error";
import type { ActionResult } from "@/shared/types/action-result";
import { requireAdminForAction } from "@/features/auth/utils/requireAdminAuth";

export type CustomerActionResult = ActionResult;

export async function getAllCustomersAction() {
  const guard = await requireAdminForAction();
  if (!guard.ok) return [];

  return getAllCustomersForAdmin();
}

export async function getCustomerDetailAction(customerId: string) {
  const guard = await requireAdminForAction();
  if (!guard.ok) return null;

  return getCustomerDetailForAdmin(customerId);
}

export async function suspendCustomerAction(
  customerId: string,
  reason: string,
): Promise<CustomerActionResult> {
  const trimmedReason = reason.trim();
  if (!trimmedReason) return fail("ACTION_REASON_REQUIRED");

  const guard = await requireAdminForAction();
  if (!guard.ok) return guard.result;

  const admin = createServiceRoleClient();
  const { data: customer, error: fetchError } = await admin
    .from("customers")
    .select("id, status, name, phone")
    .eq("id", customerId)
    .is("deleted_at", null)
    .maybeSingle();

  if (fetchError) {
    logActionFailure("suspendCustomer.fetch", fetchError);
    return fail("CUSTOMER_UPDATE_FAILED");
  }
  if (!customer) return fail("CUSTOMER_NOT_FOUND");
  if (customer.status === "suspended") return {};

  const { error: updateError } = await admin
    .from("customers")
    .update({
      status: "suspended" satisfies CustomerStatus,
      status_reason: trimmedReason,
    })
    .eq("id", customerId)
    .eq("status", "active" satisfies CustomerStatus);

  if (updateError) {
    logActionFailure("suspendCustomer", updateError);
    return fail("CUSTOMER_UPDATE_FAILED");
  }

  await admin.from("audit_log").insert({
    action: "suspend_customer",
    admin_id: guard.user.id,
    target_type: "customer",
    target_id: customerId,
    notes: trimmedReason,
  });

  revalidatePath("/admin/customers");
  revalidatePath(`/admin/customers/${customerId}`);
  revalidatePath("/admin/audit");
  revalidatePath("/admin/dashboard");
  return {};
}

export async function reactivateCustomerAction(
  customerId: string,
  reason: string,
): Promise<CustomerActionResult> {
  const trimmedReason = reason.trim();
  if (!trimmedReason) return fail("ACTION_REASON_REQUIRED");

  const guard = await requireAdminForAction();
  if (!guard.ok) return guard.result;

  const admin = createServiceRoleClient();
  const { data: customer, error: fetchError } = await admin
    .from("customers")
    .select("id, status, name, phone")
    .eq("id", customerId)
    .is("deleted_at", null)
    .maybeSingle();

  if (fetchError) {
    logActionFailure("reactivateCustomer.fetch", fetchError);
    return fail("CUSTOMER_UPDATE_FAILED");
  }
  if (!customer) return fail("CUSTOMER_NOT_FOUND");
  if (customer.status === "active") return {};

  const { error: updateError } = await admin
    .from("customers")
    .update({
      status: "active" satisfies CustomerStatus,
      status_reason: null,
    })
    .eq("id", customerId)
    .eq("status", "suspended" satisfies CustomerStatus);

  if (updateError) {
    logActionFailure("reactivateCustomer", updateError);
    return fail("CUSTOMER_UPDATE_FAILED");
  }

  await admin.from("audit_log").insert({
    action: "reactivate_customer",
    admin_id: guard.user.id,
    target_type: "customer",
    target_id: customerId,
    notes: trimmedReason,
  });

  revalidatePath("/admin/customers");
  revalidatePath(`/admin/customers/${customerId}`);
  revalidatePath("/admin/audit");
  revalidatePath("/admin/dashboard");
  return {};
}
