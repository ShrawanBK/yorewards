import { CardDetailView } from "@/features/wallet";

type WalletCardPageProps = {
  params: Promise<{ cardId: string }>;
};

export default async function WalletCardPage({ params }: WalletCardPageProps) {
  const { cardId } = await params;
  return <CardDetailView cardId={cardId} />;
}
