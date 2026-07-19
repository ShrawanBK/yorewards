import type { CustomerWalletCard } from "@/features/wallet/types/wallet.types";
import type {
  CardSpendSummary,
  CardVisitRow,
} from "@repo/supabase/queries/card-insights";

export type CustomerCardDetail = CustomerWalletCard & {
  pendingRedemptionCode: string | null;
  spendSummary: CardSpendSummary;
  visits: CardVisitRow[];
};
