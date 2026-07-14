import { getTranslations } from "next-intl/server";
import { listStampDisputesForAdmin } from "@repo/supabase/queries/stamp-disputes";
import { DisputesCentreView } from "@/features/disputes";

type PageProps = {
  searchParams: Promise<{ filter?: string }>;
};

export default async function AdminDisputesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const filter =
    params.filter === "resolved" || params.filter === "all"
      ? params.filter
      : "pending";

  const disputes = await listStampDisputesForAdmin(filter);
  const t = await getTranslations("disputes");

  return (
    <div className="flex flex-col gap-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </header>
      <DisputesCentreView initialFilter={filter} initialDisputes={disputes} />
    </div>
  );
}
