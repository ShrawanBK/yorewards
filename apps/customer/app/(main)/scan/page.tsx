import { ScanView } from "@/features/scan";

type ScanPageProps = {
  searchParams: Promise<{ m?: string; c?: string; l?: string }>;
};

export default async function ScanPage({ searchParams }: ScanPageProps) {
  const params = await searchParams;

  return <ScanView searchParams={params} />;
}
