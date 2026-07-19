"use server";

import { unstable_noStore as noStore } from "next/cache";
import { getCustomerIdFromSession } from "@repo/supabase/queries/customers";
import { getStampSessionForCustomer } from "@repo/supabase/queries/stamps";
import { fail, logActionFailure } from "@repo/utils/action-error";
import type { ActionResult } from "@/shared/types/action-result";
import type { StampSessionStatus } from "@repo/supabase/types";

export async function getStampSessionStatusAction(
  sessionId: string,
): Promise<
  ActionResult<{
    status: StampSessionStatus;
    rejectionReason: string | null;
    customerCardId: string;
  }>
> {
  noStore();
  const customerId = await getCustomerIdFromSession();
  if (!customerId) return fail("UNAUTHORIZED");

  try {
    const session = await getStampSessionForCustomer(sessionId, customerId);
    if (!session) return fail("STAMP_SESSION_NOT_FOUND");

    return {
      status: session.status as StampSessionStatus,
      rejectionReason: session.rejection_reason ?? null,
      customerCardId: session.customer_card_id,
    };
  } catch (err) {
    logActionFailure("getStampSessionStatus", err);
    return fail("UNKNOWN");
  }
}
