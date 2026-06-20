"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@repo/supabase/server";
import { getMerchantsByUserId } from "@repo/supabase/queries/merchants";
import {
  completeRedemptionForMerchant,
  getRedemptionByCode,
} from "@repo/supabase/queries/redemptions";
import type { RedemptionLookup } from "@repo/supabase/queries/redemptions";
import { fail, logActionFailure } from "@repo/utils/action-error";
import type { ActionFailure, ActionResult } from "@/shared/types/action-result";

async function assertActiveMerchantOwner(
  userId: string,
  merchantId: string,
): Promise<ActionFailure | null> {
  const merchants = await getMerchantsByUserId(userId);
  const merchant = merchants.find((m) => m.id === merchantId);
  if (!merchant) return fail("BUSINESS_NOT_FOUND");
  if (merchant.status !== "active") {
    return fail("BUSINESS_NOT_ACTIVE");
  }
  return null;
}

export async function lookupRedemptionAction(
  merchantId: string,
  code: string,
): Promise<ActionResult & { redemption?: RedemptionLookup | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return fail("UNAUTHORIZED");

  const denied = await assertActiveMerchantOwner(user.id, merchantId);
  if (denied) return denied;

  const normalized = code.trim().toUpperCase();
  if (!normalized || normalized.length !== 6) {
    return fail("REDEMPTION_CODE_INVALID");
  }

  try {
    const redemption = await getRedemptionByCode(merchantId, normalized);
    if (!redemption) {
      return fail("REDEMPTION_NOT_FOUND");
    }
    return { redemption };
  } catch (err) {
    logActionFailure("lookupRedemption", err);
    return fail("REDEMPTION_LOOKUP_FAILED");
  }
}

export async function confirmRedemptionAction(
  merchantId: string,
  redemptionId: string,
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return fail("UNAUTHORIZED");

  const denied = await assertActiveMerchantOwner(user.id, merchantId);
  if (denied) return denied;

  try {
    await completeRedemptionForMerchant(merchantId, redemptionId);
    revalidatePath("/merchant/redeem");
    revalidatePath("/merchant/dashboard");
    revalidatePath("/merchant/analytics");
    return {};
  } catch (err) {
    logActionFailure("confirmRedemption", err);
    const message = err instanceof Error ? err.message : "";
    if (message.includes("no longer pending") || message.includes("already")) {
      return fail("REDEMPTION_ALREADY_COMPLETED");
    }
    return fail("REDEMPTION_CONFIRM_FAILED");
  }
}
