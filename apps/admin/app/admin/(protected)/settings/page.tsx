import { getTranslations } from "next-intl/server";
import { requireAdminSession } from "@/features/auth/utils/requireAdminAuth";
import { AdminSettingsView } from "@/features/settings/components/AdminSettingsView";

export default async function AdminSettingsPage() {
  await requireAdminSession();
  const t = await getTranslations("settings");

  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </header>
      <AdminSettingsView />
    </div>
  );
}
