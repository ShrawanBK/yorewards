import { getTranslations } from "next-intl/server";
import { getAllMerchantsAction, logoutAction } from "@/app/admin/actions";
import { MerchantQueue } from "@/components/merchant-queue";
import { Button } from "@repo/ui/button";

export default async function AdminMerchantsPage() {
  const [merchants, t] = await Promise.all([
    getAllMerchantsAction(),
    getTranslations("merchants"),
  ]);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
        <form action={logoutAction}>
          <Button type="submit" variant="outline">
            {t("logout")}
          </Button>
        </form>
      </div>
      <MerchantQueue merchants={merchants} />
    </div>
  );
}
