import type { NotificationRow } from "@repo/supabase/queries/notifications";
import type { NotificationType } from "@repo/supabase/types";

export type NotificationCategory = "disputes" | "account";

export const ADMIN_NOTIFICATION_CATEGORIES: NotificationCategory[] = [
  "disputes",
  "account",
];

export function getNotificationCategory(
  type: NotificationType,
): NotificationCategory {
  switch (type) {
    case "dispute_filed":
    case "dispute_resolved":
    case "dispute_sla_breach":
      return "disputes";
    default:
      return "account";
  }
}

function payloadString(
  payload: Record<string, unknown>,
  key: string,
): string | null {
  const value = payload[key];
  return typeof value === "string" && value.length > 0 ? value : null;
}

export function getNotificationActionHref(
  notification: NotificationRow,
): string | null {
  const payload = notification.payload;

  switch (notification.type) {
    case "dispute_filed":
    case "dispute_resolved":
    case "dispute_sla_breach": {
      const disputeId = payloadString(payload, "disputeId");
      return disputeId ? `/admin/disputes/${disputeId}` : "/admin/disputes";
    }
    default:
      return null;
  }
}

export function getNotificationActionLabelKey(
  type: NotificationType,
): "actions.openDispute" | "actions.view" {
  switch (type) {
    case "dispute_filed":
    case "dispute_resolved":
    case "dispute_sla_breach":
      return "actions.openDispute";
    default:
      return "actions.view";
  }
}
