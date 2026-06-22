"use server";

import { getCustomerIdFromSession } from "@repo/supabase/queries/customers";
import { getCustomerWalletCards } from "@repo/supabase/queries/customer-wallet";
import { fail, logActionFailure } from "@repo/utils/action-error";
import type { ActionResult } from "@/shared/types/action-result";
import type { CustomerWalletCard } from "@/features/wallet/types/wallet.types";

export async function fetchCustomerWalletAction(): Promise<
  ActionResult<{ cards: CustomerWalletCard[] }>
> {
  const customerId = await getCustomerIdFromSession();
  if (!customerId) return fail("UNAUTHORIZED");

  try {
    const cards = await getCustomerWalletCards(customerId);
    return { cards };
  } catch (err) {
    logActionFailure("fetchCustomerWallet", err);
    return fail("WALLET_LOAD_FAILED");
  }
}
