import { getTranslations } from "next-intl/server";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/card";

export default async function SettingsPage() {
  const t = await getTranslations("settings");

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t("comingSoon.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {t("comingSoon.description")}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
