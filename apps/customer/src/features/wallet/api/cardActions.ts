"use server";

import { getCustomerIdFromSession } from "@repo/supabase/queries/customers";
import { getCustomerCardById } from "@repo/supabase/queries/customer-wallet";
import { getPendingRedemptionForCustomerCard } from "@repo/supabase/queries/redemptions";
import { fail, logActionFailure } from "@repo/utils/action-error";
import type { ActionResult } from "@/shared/types/action-result";
import type { CustomerCardDetail } from "@/features/wallet/types/card-detail.types";

export async function fetchCustomerCardAction(
  cardId: string,
): Promise<ActionResult<{ card: CustomerCardDetail }>> {
  const customerId = await getCustomerIdFromSession();
  if (!customerId) return fail("UNAUTHORIZED");

  try {
    const card = await getCustomerCardById(customerId, cardId);
    if (!card) return fail("CUSTOMER_CARD_NOT_FOUND");

    let pendingRedemptionCode: string | null = null;
    if (card.rewardStatus === "unlocked") {
      const pending = await getPendingRedemptionForCustomerCard(cardId);
      pendingRedemptionCode = pending?.redemptionCode ?? null;
    }

    return {
      card: {
        ...card,
        pendingRedemptionCode,
      },
    };
  } catch (err) {
    logActionFailure("fetchCustomerCard", err);
    return fail("WALLET_LOAD_FAILED");
  }
}
