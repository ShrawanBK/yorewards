import type { NotificationRow } from "@repo/supabase/queries/notifications";
import type { NotificationType } from "@repo/supabase/types";

export type NotificationCategory = "disputes" | "rewards" | "promotions";

export const CUSTOMER_NOTIFICATION_CATEGORIES: NotificationCategory[] = [
  "disputes",
  "rewards",
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
    case "reward_unlocked":
      return "rewards";
    case "smart_promo":
    case "merchant_approved":
      return "promotions";
    default:
      return "promotions";
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
  const cardId = payloadString(payload, "customerCardId");

  switch (notification.type) {
    case "dispute_resolved":
      return "/disputes";
    case "reward_unlocked":
      return cardId ? `/reward/${cardId}` : "/wallet/rewards";
    case "smart_promo":
      return cardId ? `/wallet/${cardId}` : "/wallet";
    default:
      return null;
  }
}

export function getNotificationActionLabelKey(
  type: NotificationType,
): "actions.openCard" | "actions.openReward" | "actions.view" | "actions.openDisputes" {
  switch (type) {
    case "reward_unlocked":
      return "actions.openReward";
    case "dispute_resolved":
      return "actions.openDisputes";
    case "smart_promo":
      return "actions.openCard";
    default:
      return "actions.view";
  }
}
