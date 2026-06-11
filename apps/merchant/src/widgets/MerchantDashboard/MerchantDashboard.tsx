import Link from "next/link";
import { Button } from "@repo/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/card";
import { Badge } from "@repo/ui/badge";
import type { MerchantRow } from "@repo/supabase/queries/merchants";
import type { Database } from "@repo/supabase/types";
import { getTranslations } from "next-intl/server";

type Merchant = Database["public"]["Tables"]["merchants"]["Row"];

export async function MerchantDashboard({
  merchant,
}: {
  merchants: MerchantRow[];
  merchant: Merchant;
}) {
  const t = await getTranslations("dashboard");

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
          <CardTitle className="text-lg">{merchant.business_name}</CardTitle>
          <Badge variant="secondary" className="capitalize">
            {t(`status.${merchant.status}.label`)}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {t(`status.${merchant.status}.description`)}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/merchant/business">{t("links.business")}</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/merchant/loyalty-card">{t("links.loyaltyCard")}</Link>
            </Button>
          </div>
          {merchant.status === "active" ? (
            <p className="text-sm text-muted-foreground">{t("activeHint")}</p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
