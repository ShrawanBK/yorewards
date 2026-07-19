"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@repo/supabase/server";
import { switchActiveMerchant } from "@repo/supabase/queries/merchants";
import {
  getMerchantRoleForUser,
  roleMeetsMinimum,
} from "@repo/supabase/queries/merchant-staff";
import { getStampDisputeById } from "@repo/supabase/queries/stamp-disputes";
import { fail, logActionFailure } from "@repo/utils/action-error";

/**
 * Cookie writes must run in a Server Action (not an RSC page).
 * Switches active business then opens the dispute detail.
 */
export async function switchActiveMerchantForDisputeAction(input: {
  disputeId: string;
  merchantId: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return fail("UNAUTHORIZED");

  let businessName: string;
  try {
    const dispute = await getStampDisputeById(input.disputeId);
    if (!dispute || dispute.merchantId !== input.merchantId) {
      return fail("DISPUTE_NOT_FOUND");
    }

    const role = await getMerchantRoleForUser(user.id, input.merchantId);
    if (!role || !roleMeetsMinimum(role, "manager")) {
      return fail("FORBIDDEN");
    }

    const switched = await switchActiveMerchant(user.id, input.merchantId);
    if (!switched) return fail("BUSINESS_NOT_FOUND");
    businessName = switched.business_name;
  } catch (err) {
    logActionFailure("switchActiveMerchantForDispute", err);
    return fail("DISPUTE_RESOLVE_FAILED");
  }

  revalidatePath("/merchant", "layout");
  redirect(
    `/merchant/disputes/${input.disputeId}?switched=${encodeURIComponent(businessName)}`,
  );
}
