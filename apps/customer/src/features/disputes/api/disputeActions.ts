"use server";

import { getCustomerIdFromSession } from "@repo/supabase/queries/customers";
import { getCustomerCardById } from "@repo/supabase/queries/customer-wallet";
import {
  countCustomerDisputesThisMonth,
  createStampDispute,
} from "@repo/supabase/queries/stamp-disputes";
import { fail, logActionFailure } from "@repo/utils/action-error";
import type { ActionResult } from "@/shared/types/action-result";

export async function submitStampDisputeAction(
  formData: FormData,
): Promise<ActionResult> {
  const customerId = await getCustomerIdFromSession();
  if (!customerId) return fail("UNAUTHORIZED");

  const customerCardId = String(formData.get("customerCardId") ?? "");
  const visitDate = String(formData.get("visitDate") ?? "").trim();
  const amountRaw = String(formData.get("amount") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();

  if (!visitDate) return fail("DISPUTE_VISIT_DATE_REQUIRED");
  const amount = Number(amountRaw);
  if (!Number.isFinite(amount) || amount <= 0) return fail("DISPUTE_AMOUNT_INVALID");
  if (description.length < 10 || description.length > 500) {
    return fail("DISPUTE_DESCRIPTION_INVALID");
  }

  try {
    const card = await getCustomerCardById(customerId, customerCardId);
    if (!card) return fail("CUSTOMER_CARD_NOT_FOUND");

    const count = await countCustomerDisputesThisMonth(
      customerId,
      card.merchantId,
    );
    if (count >= 2) return fail("DISPUTE_LIMIT_EXCEEDED");

    await createStampDispute({
      customerId,
      customerCardId,
      merchantId: card.merchantId,
      visitDate,
      amountClaimed: amount,
      currencyCode: card.minSpendCurrency,
      description,
    });

    return {};
  } catch (err) {
    logActionFailure("submitStampDispute", err);
    return fail("DISPUTE_SUBMIT_FAILED");
  }
}
