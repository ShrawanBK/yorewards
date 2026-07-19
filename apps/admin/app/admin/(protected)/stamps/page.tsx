import { AdminStampsWorkbench } from "./AdminStampsWorkbench";

type PageProps = {
  searchParams: Promise<{ cardId?: string }>;
};

export default async function AdminStampsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  return <AdminStampsWorkbench initialCardId={params.cardId} />;
}
