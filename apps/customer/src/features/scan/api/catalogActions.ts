"use server";

import {
  listStampableBranches,
  listStampableMerchants,
} from "@repo/supabase/queries/stamp-catalog";
import { fail, logActionFailure } from "@repo/utils/action-error";
import { getCustomerIdFromSession } from "@repo/supabase/queries/customers";
import type { ActionResult } from "@/shared/types/action-result";

export async function fetchStampableMerchantsAction(): Promise<
  ActionResult<{ merchants: Awaited<ReturnType<typeof listStampableMerchants>> }>
> {
  const customerId = await getCustomerIdFromSession();
  if (!customerId) return fail("UNAUTHORIZED");

  try {
    const merchants = await listStampableMerchants();
    return { merchants };
  } catch (err) {
    logActionFailure("fetchStampableMerchants", err);
    return fail("STAMP_CATALOG_LOAD_FAILED");
  }
}

export async function fetchStampableBranchesAction(
  merchantId: string,
  loyaltyCardId: string,
): Promise<
  ActionResult<{ branches: Awaited<ReturnType<typeof listStampableBranches>> }>
> {
  const customerId = await getCustomerIdFromSession();
  if (!customerId) return fail("UNAUTHORIZED");

  try {
    const branches = await listStampableBranches(merchantId, loyaltyCardId);
    return { branches };
  } catch (err) {
    logActionFailure("fetchStampableBranches", err);
    return fail("STAMP_CATALOG_LOAD_FAILED");
  }
}
