"use server";

import { revalidatePath } from "next/cache";
import {
  adminExtendMerchantTrial,
  adminSetMerchantTier,
} from "@repo/supabase/queries/merchant-subscriptions";
import type { SubscriptionTier } from "@repo/supabase/types";
import { fail, logActionFailure } from "@repo/utils/action-error";
import type { ActionResult } from "@/shared/types/action-result";
import { requireAdminForAction } from "@/features/auth/utils/requireAdminAuth";

export async function setMerchantTierAction(
  merchantId: string,
  tier: SubscriptionTier,
): Promise<ActionResult> {
  const guard = await requireAdminForAction();
  if (!guard.ok) return guard.result;

  if (!["free", "starter", "growth", "enterprise"].includes(tier)) {
    return fail("SUBSCRIPTION_UPDATE_FAILED");
  }

  try {
    await adminSetMerchantTier({ merchantId, tier });
    revalidatePath(`/admin/merchants/${merchantId}`);
    revalidatePath("/admin/dashboard");
    return {};
  } catch (err) {
    logActionFailure("setMerchantTier", err);
    return fail("SUBSCRIPTION_UPDATE_FAILED");
  }
}

export async function extendMerchantTrialAction(
  merchantId: string,
  extraDays: number,
): Promise<ActionResult> {
  const guard = await requireAdminForAction();
  if (!guard.ok) return guard.result;

  if (!Number.isFinite(extraDays) || extraDays < 1 || extraDays > 90) {
    return fail("TRIAL_EXTEND_FAILED");
  }

  try {
    await adminExtendMerchantTrial({ merchantId, extraDays });
    revalidatePath(`/admin/merchants/${merchantId}`);
    return {};
  } catch (err) {
    logActionFailure("extendMerchantTrial", err);
    return fail("TRIAL_EXTEND_FAILED");
  }
}
