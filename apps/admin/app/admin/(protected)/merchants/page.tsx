import { getTranslations } from "next-intl/server";
import { getAllMerchantsAction, MerchantQueue } from "@/features/merchants";

export default async function AdminMerchantsPage() {
  const [merchants, t] = await Promise.all([
    getAllMerchantsAction(),
    getTranslations("merchants"),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </header>
      <MerchantQueue merchants={merchants} />
    </div>
  );
}
