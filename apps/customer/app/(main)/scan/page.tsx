import { ScanView } from "@/features/scan";

type ScanPageProps = {
  searchParams: Promise<{ m?: string; c?: string; l?: string }>;
};

export default async function ScanPage({ searchParams }: ScanPageProps) {
  const params = await searchParams;
  const deepLink =
    params.m && params.c && params.l
      ? {
          merchantId: params.m,
          loyaltyCardId: params.c,
          locationId: params.l,
        }
      : undefined;

  return <ScanView deepLink={deepLink} />;
}
