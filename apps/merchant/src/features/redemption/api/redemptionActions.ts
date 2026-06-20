"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@repo/supabase/server";
import { getMerchantsByUserId } from "@repo/supabase/queries/merchants";
import {
  completeRedemptionForMerchant,
  getRedemptionByCode,
} from "@repo/supabase/queries/redemptions";
import type { RedemptionLookup } from "@repo/supabase/queries/redemptions";
import type { ActionResult } from "@/shared/types/action-result";

async function assertActiveMerchantOwner(userId: string, merchantId: string) {
  const merchants = await getMerchantsByUserId(userId);
  const merchant = merchants.find((m) => m.id === merchantId);
  if (!merchant) return { error: "Business not found" as const };
  if (merchant.status !== "active") {
    return {
      error:
        "Your business must be approved before confirming redemptions." as const,
    };
  }
  return { error: null as null };
}

export async function lookupRedemptionAction(
  merchantId: string,
  code: string,
): Promise<ActionResult & { redemption?: RedemptionLookup | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const denied = await assertActiveMerchantOwner(user.id, merchantId);
  if (denied.error) return denied;

  const normalized = code.trim().toUpperCase();
  if (!normalized || normalized.length !== 6) {
    return { error: "Enter a valid 6-character redemption code." };
  }

  try {
    const redemption = await getRedemptionByCode(merchantId, normalized);
    if (!redemption) {
      return { error: "No pending redemption found for this code." };
    }
    return { redemption };
  } catch {
    return { error: "Could not look up redemption code." };
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
  if (!user) return { error: "Unauthorized" };

  const denied = await assertActiveMerchantOwner(user.id, merchantId);
  if (denied.error) return denied;

  try {
    await completeRedemptionForMerchant(merchantId, redemptionId);
    revalidatePath("/merchant/redeem");
    revalidatePath("/merchant/dashboard");
    revalidatePath("/merchant/analytics");
    return {};
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Could not confirm redemption.";
    if (message.includes("no longer pending") || message.includes("already")) {
      return { error: "This redemption has already been completed." };
    }
    return { error: "Could not confirm redemption." };
  }
}
