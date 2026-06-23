export const rewardQueryKeys = {
  all: ["reward"] as const,
  claim: (cardId: string) => ["reward", "claim", cardId] as const,
};
