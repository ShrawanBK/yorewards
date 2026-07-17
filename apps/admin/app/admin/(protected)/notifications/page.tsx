import { getTranslations } from "next-intl/server";
import { NotificationsCentreView } from "@/features/notifications";

export default async function AdminNotificationsPage() {
  const t = await getTranslations("notifications.centre");

  return (
    <div className="flex flex-col gap-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("description")}</p>
      </header>
      <NotificationsCentreView />
    </div>
  );
}
