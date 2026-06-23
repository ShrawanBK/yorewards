"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchCustomerCardAction } from "@/features/wallet/api/cardActions";
import { walletQueryKeys } from "@/features/wallet/api/walletQueries";
import { isActionFailure } from "@/shared/types/action-result";

export function useCustomerCard(cardId: string) {
  return useQuery({
    queryKey: walletQueryKeys.card(cardId),
    staleTime: 30_000,
    queryFn: async () => {
      const result = await fetchCustomerCardAction(cardId);
      if (isActionFailure(result)) {
        throw new Error(result.error.code);
      }
      return result.card;
    },
  });
}
