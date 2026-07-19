import type { NotificationRow } from "@repo/supabase/queries/notifications";
import type { NotificationType } from "@repo/supabase/types";

/** UI categories — extend when new product notification types ship. */
export type NotificationCategory = "disputes" | "account" | "promotions";

export const MERCHANT_NOTIFICATION_CATEGORIES: NotificationCategory[] = [
  "disputes",
  "account",
  "promotions",
];

export function getNotificationCategory(
  type: NotificationType,
): NotificationCategory {
  switch (type) {
    case "dispute_filed":
    case "dispute_resolved":
    case "dispute_sla_breach":
      return "disputes";
    case "merchant_approved":
      return "account";
    case "reward_unlocked":
    case "smart_promo":
      return "promotions";
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

/** Deep-link for the primary action. Null = informational only. */
export function getNotificationActionHref(
  notification: NotificationRow,
): string | null {
  const payload = notification.payload;

  switch (notification.type) {
    case "dispute_filed":
    case "dispute_resolved":
    case "dispute_sla_breach": {
      const disputeId = payloadString(payload, "disputeId");
      return disputeId
        ? `/merchant/disputes/${disputeId}`
        : "/merchant/disputes";
    }
    case "merchant_approved":
      return "/merchant/dashboard";
    case "reward_unlocked":
    case "smart_promo":
      return null;
    default:
      return null;
  }
}

export function getNotificationActionLabelKey(
  type: NotificationType,
): "actions.openDispute" | "actions.openDashboard" | "actions.view" {
  switch (type) {
    case "dispute_filed":
    case "dispute_resolved":
    case "dispute_sla_breach":
      return "actions.openDispute";
    case "merchant_approved":
      return "actions.openDashboard";
    default:
      return "actions.view";
  }
}
