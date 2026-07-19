import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Button } from "@repo/ui/button";
import { Card, CardContent } from "@repo/ui/card";
import { Users } from "lucide-react";

export async function CrmUpgradeView() {
  const t = await getTranslations("customers.upgrade");

  return (
    <Card className="merchant-glass-card border-border/60">
      <CardContent className="flex flex-col items-start gap-4 p-8 sm:flex-row sm:items-center">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
          <Users className="size-6" aria-hidden="true" />
        </div>
        <div className="flex-1 space-y-2">
          <h2 className="text-lg font-semibold text-foreground">{t("title")}</h2>
          <p className="merchant-body-muted text-sm">{t("description")}</p>
        </div>
        <Button asChild>
          <Link href="/merchant/billing">{t("cta")}</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
