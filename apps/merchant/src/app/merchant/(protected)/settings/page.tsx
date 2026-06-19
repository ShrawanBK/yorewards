import { getTranslations } from "next-intl/server";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/card";
import { PageHeader } from "@/shared/ui/PageHeader";

export default async function SettingsPage() {
  const t = await getTranslations("settings");

  return (
    <div className="space-y-8">
      <PageHeader title={t("title")} description={t("subtitle")} />
      <Card className="merchant-glass-card">
        <CardHeader>
          <CardTitle className="text-lg">{t("comingSoon.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm merchant-body-muted">
            {t("comingSoon.description")}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
