"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@repo/supabase/server";
import { updateMerchantSmartPromoSettings } from "@repo/supabase/queries/smart-promo";
import { merchantCanUseSmartPromo } from "@repo/utils/plan-limits";
import { createServiceRoleClient } from "@repo/supabase/service-role";
import { fail, logActionFailure } from "@repo/utils/action-error";
import type { ActionResult } from "@/shared/types/action-result";
import { assertMerchantAccess } from "@/shared/utils/merchant-access";

export async function updateSmartPromoSettingsAction(
  merchantId: string,
  formData: FormData,
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return fail("UNAUTHORIZED");

  const access = await assertMerchantAccess(user.id, merchantId, "owner");
  if ("error" in access) return access;

  const enabled = formData.get("enabled") === "true";
  const threshold = Number(formData.get("threshold") ?? 2);

  if (![1, 2, 3].includes(threshold)) {
    return fail("UNKNOWN");
  }

  const { data: merchant, error: merchantError } = await createServiceRoleClient()
    .from("merchants")
    .select("subscription_tier")
    .eq("id", merchantId)
    .maybeSingle();

  if (merchantError) throw merchantError;
  if (!merchant || !merchantCanUseSmartPromo(merchant.subscription_tier)) {
    return fail("PLAN_FEATURE_REQUIRED");
  }

  try {
    await updateMerchantSmartPromoSettings(merchantId, enabled, threshold);
    revalidatePath("/merchant/settings");
    return {};
  } catch (err) {
    logActionFailure("updateSmartPromoSettings", err);
    return fail("UNKNOWN");
  }
}
