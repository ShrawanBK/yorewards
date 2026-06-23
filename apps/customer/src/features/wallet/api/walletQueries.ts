import type { QueryClient } from "@tanstack/react-query";

export const walletQueryKeys = {
  all: ["wallet"] as const,
  customer: (customerId: string) => ["wallet", customerId] as const,
  card: (cardId: string) => ["card", cardId] as const,
};

export function invalidateCustomerWallet(
  queryClient: QueryClient,
  customerId: string,
) {
  return queryClient.invalidateQueries({
    queryKey: walletQueryKeys.customer(customerId),
  });
}

export function invalidateCustomerCard(
  queryClient: QueryClient,
  cardId: string,
) {
  return queryClient.invalidateQueries({
    queryKey: walletQueryKeys.card(cardId),
  });
}
