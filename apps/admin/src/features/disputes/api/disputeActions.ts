"use server";

import { revalidatePath } from "next/cache";
import { createServiceRoleClient } from "@repo/supabase/service-role";
import {
  getStampDisputeById,
  listPendingDisputesForCustomerCard,
  listStampDisputesForAdmin,
  needsEarlyAdminResolveConfirm,
  resolveStampDisputeAtomic,
  type StampDisputeFilter,
} from "@repo/supabase/queries/stamp-disputes";
import { fail, logActionFailure } from "@repo/utils/action-error";
import type { ActionResult } from "@/shared/types/action-result";
import { requireAdminForAction } from "@/features/auth/utils/requireAdminAuth";

export async function listAdminDisputesAction(filter: StampDisputeFilter = "pending") {
  const guard = await requireAdminForAction();
  if (!guard.ok) return { disputes: [], error: guard.result.error };

  try {
    const disputes = await listStampDisputesForAdmin(filter);
    return { disputes };
  } catch (err) {
    logActionFailure("listAdminDisputes", err);
    return { disputes: [], error: fail("DISPUTE_RESOLVE_FAILED").error };
  }
}

export async function getAdminDisputeAction(disputeId: string) {
  const guard = await requireAdminForAction();
  if (!guard.ok) return { dispute: null, error: guard.result.error };

  try {
    const dispute = await getStampDisputeById(disputeId);
    if (!dispute) return { dispute: null, error: fail("DISPUTE_NOT_FOUND").error };
    return { dispute };
  } catch (err) {
    logActionFailure("getAdminDispute", err);
    return { dispute: null, error: fail("DISPUTE_RESOLVE_FAILED").error };
  }
}

export async function adminResolveDisputeAction(input: {
  disputeId: string;
  status: "approved" | "rejected";
  note: string;
  issueStamp?: boolean;
  confirmBypassMerchantSla?: boolean;
}): Promise<ActionResult> {
  const guard = await requireAdminForAction();
  if (!guard.ok) return guard.result;

  const note = input.note.trim();
  if (note.length < 10) {
    return fail("DISPUTE_RESPONSE_REQUIRED");
  }

  const issueStamp = input.status === "approved" ? (input.issueStamp ?? false) : false;

  try {
    const dispute = await getStampDisputeById(input.disputeId);
    if (!dispute) return fail("DISPUTE_NOT_FOUND");
    if (dispute.status !== "pending") return fail("DISPUTE_ALREADY_RESOLVED");

    if (
      needsEarlyAdminResolveConfirm(dispute.status, dispute.createdAt) &&
      !input.confirmBypassMerchantSla
    ) {
      return fail("DISPUTE_MERCHANT_SLA_ACTIVE");
    }

    await resolveStampDisputeAtomic({
      disputeId: input.disputeId,
      status: input.status,
      response: `[Admin] ${note}`,
      issueStamp,
    });

    const admin = createServiceRoleClient();
    let auditAction: string;
    if (input.status === "rejected") {
      auditAction = "dispute_rejected_admin";
    } else if (issueStamp) {
      auditAction = "dispute_approved_admin_with_stamp";
    } else {
      auditAction = "dispute_approved_admin";
    }

    await admin.from("audit_log").insert({
      action: auditAction,
      admin_id: guard.user.id,
      target_type: "customer",
      target_id: dispute.customerId,
      notes: `Dispute ${input.disputeId} · ${dispute.merchantName}`,
    });

    revalidatePath("/admin/disputes");
    revalidatePath(`/admin/disputes/${input.disputeId}`);
    revalidatePath("/admin/dashboard");
    revalidatePath("/admin/stamps");
    return {};
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === "DISPUTE_ALREADY_RESOLVED") {
        return fail("DISPUTE_ALREADY_RESOLVED");
      }
      if (err.message === "DISPUTE_NOT_FOUND") {
        return fail("DISPUTE_NOT_FOUND");
      }
    }
    logActionFailure("adminResolveDispute", err);
    return fail("DISPUTE_RESOLVE_FAILED");
  }
}

export async function listAdminCardDisputesAction(customerCardId: string) {
  const guard = await requireAdminForAction();
  if (!guard.ok) return { disputes: [], error: guard.result.error };

  try {
    const disputes = await listPendingDisputesForCustomerCard(customerCardId);
    return { disputes };
  } catch (err) {
    logActionFailure("listAdminCardDisputes", err);
    return { disputes: [], error: fail("DISPUTE_RESOLVE_FAILED").error };
  }
}
