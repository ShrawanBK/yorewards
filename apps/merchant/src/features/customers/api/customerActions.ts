"use server";

import { createClient } from "@repo/supabase/server";
import { getMerchantsByUserId } from "@repo/supabase/queries/merchants";
import {
  getMerchantCustomerDetail,
  upsertMerchantCustomerNote,
} from "@repo/supabase/queries/merchant-customers";
import { fail, logActionFailure } from "@repo/utils/action-error";
import type { ActionResult } from "@/shared/types/action-result";
import type { MerchantCustomerDetail } from "@repo/supabase/queries/merchant-customers";

async function assertOwnsMerchant(userId: string, merchantId: string) {
  const merchants = await getMerchantsByUserId(userId);
  if (!merchants.some((m) => m.id === merchantId)) {
    return fail("BUSINESS_NOT_FOUND");
  }
  return null;
}

export async function fetchCustomerDetailAction(
  merchantId: string,
  customerId: string,
): Promise<ActionResult<{ detail: MerchantCustomerDetail }>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return fail("UNAUTHORIZED");

  const denied = await assertOwnsMerchant(user.id, merchantId);
  if (denied) return denied;

  try {
    const detail = await getMerchantCustomerDetail(merchantId, customerId);
    if (!detail) return fail("CUSTOMER_NOT_FOUND");
    return { detail };
  } catch (err) {
    logActionFailure("fetchCustomerDetail", err);
    return fail("CUSTOMER_DETAIL_LOAD_FAILED");
  }
}

export async function saveCustomerNoteAction(
  merchantId: string,
  customerId: string,
  note: string,
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return fail("UNAUTHORIZED");

  const denied = await assertOwnsMerchant(user.id, merchantId);
  if (denied) return denied;

  if (note.length > 2000) {
    return fail("CUSTOMER_NOTE_SAVE_FAILED");
  }

  try {
    await upsertMerchantCustomerNote(merchantId, customerId, note.trim());
    return {};
  } catch (err) {
    logActionFailure("saveCustomerNote", err);
    return fail("CUSTOMER_NOTE_SAVE_FAILED");
  }
}
