"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@repo/supabase/server";
import {
  countPendingDisputesForMerchant,
  getStampDisputeById,
  listStampDisputesForMerchant,
  resolveStampDisputeAtomic,
  type StampDisputeFilter,
} from "@repo/supabase/queries/stamp-disputes";
import { fail, logActionFailure } from "@repo/utils/action-error";
import type { ActionResult } from "@/shared/types/action-result";
import { assertMerchantAccess } from "@/shared/utils/merchant-access";

export async function listMerchantDisputesAction(
  merchantId: string,
  filter: StampDisputeFilter = "all",
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: fail("UNAUTHORIZED").error, disputes: [] };

  const access = await assertMerchantAccess(user.id, merchantId, "manager");
  if ("error" in access) return { error: access.error, disputes: [] };

  try {
    const disputes = await listStampDisputesForMerchant(merchantId, filter);
    return { disputes };
  } catch (err) {
    logActionFailure("listMerchantDisputes", err);
    return { error: fail("DISPUTE_RESOLVE_FAILED").error, disputes: [] };
  }
}

export async function countMerchantPendingDisputesAction(merchantId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { count: 0, error: fail("UNAUTHORIZED").error };

  const access = await assertMerchantAccess(user.id, merchantId, "manager");
  if ("error" in access) return { count: 0, error: access.error };

  try {
    const count = await countPendingDisputesForMerchant(merchantId);
    return { count };
  } catch (err) {
    logActionFailure("countMerchantPendingDisputes", err);
    return { count: 0, error: fail("DISPUTE_RESOLVE_FAILED").error };
  }
}

export async function resolveMerchantDisputeAction(input: {
  disputeId: string;
  merchantId: string;
  status: "approved" | "rejected";
  note: string;
  issueStamp?: boolean;
}): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return fail("UNAUTHORIZED");

  const access = await assertMerchantAccess(user.id, input.merchantId, "manager");
  if ("error" in access) return access;

  const note = input.note.trim();
  if (note.length < 10 || note.length > 500) {
    return fail("DISPUTE_RESPONSE_REQUIRED");
  }

  const issueStamp = input.status === "approved" ? (input.issueStamp ?? false) : false;

  try {
    const dispute = await getStampDisputeById(input.disputeId);
    if (!dispute || dispute.merchantId !== input.merchantId) {
      return fail("DISPUTE_NOT_FOUND");
    }
    if (dispute.status !== "pending") {
      return fail("DISPUTE_ALREADY_RESOLVED");
    }

    await resolveStampDisputeAtomic({
      disputeId: input.disputeId,
      status: input.status,
      response: note,
      issueStamp,
    });

    // Client React Query invalidation updates the UI — avoid revalidatePath so
    // the disputes page does not hard-refresh / remount on every resolve.
    revalidatePath("/merchant/dashboard");
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
    logActionFailure("resolveMerchantDispute", err);
    return fail("DISPUTE_RESOLVE_FAILED");
  }
}
