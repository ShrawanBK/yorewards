import { Button } from "@repo/ui/button";
import type { MerchantRow } from "@repo/supabase/queries/merchants";
import type { Database } from "@repo/supabase/types";
import { getTranslations } from "next-intl/server";
import { logoutAction } from "@/features/auth";
import { MerchantBusinessSwitcher } from "@/features/business";
import { MerchantStatusPanel } from "@/features/dashboard";

type Merchant = Database["public"]["Tables"]["merchants"]["Row"];

export async function MerchantDashboard({
  merchants,
  merchant,
}: {
  merchants: MerchantRow[];
  merchant: Merchant;
}) {
  const t = await getTranslations("dashboard");

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {t("title")}
          </h1>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
        <form action={logoutAction}>
          <Button type="submit" variant="outline">
            {t("logout")}
          </Button>
        </form>
      </div>

      <MerchantBusinessSwitcher
        merchants={merchants}
        activeMerchantId={merchant.id}
      />

      <MerchantStatusPanel
        businessName={merchant.business_name}
        status={merchant.status}
        rejectionReason={merchant.rejection_reason}
      />

      {merchant.status === "active" ? (
        <p className="text-sm text-muted-foreground">{t("activeHint")}</p>
      ) : null}
    </div>
  );
}
