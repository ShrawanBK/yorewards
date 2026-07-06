import type { RewardStatus } from "@repo/supabase/types";

export type StampSuccessDetails = {
  customerCardId: string;
  currentStamps: number;
  stampTarget: number;
  rewardStatus: RewardStatus;
  cardName: string;
  businessName: string;
  amountSpent: number | null;
  currency: string;
};
