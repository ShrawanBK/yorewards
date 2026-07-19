"use server";

import { getCustomerIdFromSession } from "@repo/supabase/queries/customers";
import { getCustomerCardById } from "@repo/supabase/queries/customer-wallet";
import {
  getCardSpendSummary,
  getCardVisitHistory,
  getCustomerRewardHistory,
} from "@repo/supabase/queries/card-insights";
import { getPendingRedemptionForCustomerCard } from "@repo/supabase/queries/redemptions";
import { fail, logActionFailure } from "@repo/utils/action-error";
import type { ActionResult } from "@/shared/types/action-result";
import type { CustomerCardDetail } from "@/features/wallet/types/card-detail.types";
import type { RewardHistoryItem } from "@repo/supabase/queries/card-insights";

export async function fetchCustomerCardAction(
  cardId: string,
): Promise<ActionResult<{ card: CustomerCardDetail }>> {
  const customerId = await getCustomerIdFromSession();
  if (!customerId) return fail("UNAUTHORIZED");

  try {
    const card = await getCustomerCardById(customerId, cardId);
    if (!card) return fail("CUSTOMER_CARD_NOT_FOUND");

    const [pending, spendSummary, visits] = await Promise.all([
      card.rewardStatus === "unlocked"
        ? getPendingRedemptionForCustomerCard(cardId)
        : Promise.resolve(null),
      getCardSpendSummary(customerId, cardId, card.minSpendCurrency),
      getCardVisitHistory(customerId, cardId, card.minSpendCurrency),
    ]);

    return {
      card: {
        ...card,
        pendingRedemptionCode: pending?.redemptionCode ?? null,
        spendSummary,
        visits,
      },
    };
  } catch (err) {
    logActionFailure("fetchCustomerCard", err);
    return fail("WALLET_LOAD_FAILED");
  }
}

export async function fetchRewardHistoryAction(): Promise<
  ActionResult<{ items: RewardHistoryItem[] }>
> {
  const customerId = await getCustomerIdFromSession();
  if (!customerId) return fail("UNAUTHORIZED");

  try {
    const items = await getCustomerRewardHistory(customerId);
    return { items };
  } catch (err) {
    logActionFailure("fetchRewardHistory", err);
    return fail("WALLET_LOAD_FAILED");
  }
}
