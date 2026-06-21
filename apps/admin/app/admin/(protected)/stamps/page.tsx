import { getTranslations } from "next-intl/server";
import { Card, CardContent } from "@repo/ui/card";

export default async function AdminStampsPlaceholderPage() {
  const t = await getTranslations("placeholders.stamps");

  return (
    <div className="flex flex-col gap-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </header>
      <Card className="admin-card">
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          {t("comingSoon")}
        </CardContent>
      </Card>
    </div>
  );
}
