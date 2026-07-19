import { listStampDisputesForCustomerCard } from "@repo/supabase/queries/stamp-disputes";
import { CardDetailView } from "@/features/wallet";

type WalletCardPageProps = {
  params: Promise<{ cardId: string }>;
};

export default async function WalletCardPage({ params }: WalletCardPageProps) {
  const { cardId } = await params;
  let disputes: Awaited<ReturnType<typeof listStampDisputesForCustomerCard>> = [];

  try {
    disputes = await listStampDisputesForCustomerCard(cardId);
  } catch {
    disputes = [];
  }

  return <CardDetailView cardId={cardId} initialDisputes={disputes} />;
}
