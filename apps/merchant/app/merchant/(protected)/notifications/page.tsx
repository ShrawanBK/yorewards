import { getTranslations } from "next-intl/server";
import { NotificationsCentreView } from "@/features/notifications";
import { PageHeader } from "@/shared/ui/PageHeader";

export default async function MerchantNotificationsPage() {
  const t = await getTranslations("notifications.centre");

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title={t("title")} description={t("description")} />
      <NotificationsCentreView />
    </div>
  );
}
