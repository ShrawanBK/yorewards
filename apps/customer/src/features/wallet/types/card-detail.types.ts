import type { CustomerWalletCard } from "@/features/wallet/types/wallet.types";

export type CustomerCardDetail = CustomerWalletCard & {
  pendingRedemptionCode: string | null;
};
