"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchCustomerWalletAction } from "@/features/wallet/api/walletActions";
import { walletQueryKeys } from "@/features/wallet/api/walletQueries";
import { isActionFailure } from "@/shared/types/action-result";

export function useCustomerWallet(customerId: string | null) {
  return useQuery({
    queryKey: walletQueryKeys.customer(customerId ?? ""),
    enabled: Boolean(customerId),
    staleTime: 30_000,
    queryFn: async () => {
      const result = await fetchCustomerWalletAction();
      if (isActionFailure(result)) {
        throw new Error(result.error.code);
      }
      return result.cards;
    },
  });
}
