import { RewardClaimView } from "@/features/reward";

type RewardPageProps = {
  params: Promise<{ cardId: string }>;
};

export default async function RewardPage({ params }: RewardPageProps) {
  const { cardId } = await params;
  return <RewardClaimView cardId={cardId} />;
}
