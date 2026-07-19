"use server";

import { getCustomerIdFromSession } from "@repo/supabase/queries/customers";
import {
  countUnreadInAppNotifications,
  listInAppNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@repo/supabase/queries/notifications";
import { fail, logActionFailure } from "@repo/utils/action-error";

export async function listCustomerNotificationsAction() {
  const customerId = await getCustomerIdFromSession();
  if (!customerId) return { notifications: [], error: fail("UNAUTHORIZED").error };

  try {
    const notifications = await listInAppNotifications({
      recipientType: "customer",
      recipientId: customerId,
    });
    return { notifications };
  } catch (err) {
    logActionFailure("listCustomerNotifications", err);
    return { notifications: [], error: fail("NOTIFICATIONS_LOAD_FAILED").error };
  }
}

export async function getCustomerUnreadCountAction() {
  const customerId = await getCustomerIdFromSession();
  if (!customerId) return { count: 0, error: fail("UNAUTHORIZED").error };

  try {
    const count = await countUnreadInAppNotifications({
      recipientType: "customer",
      recipientId: customerId,
    });
    return { count };
  } catch (err) {
    logActionFailure("getCustomerUnreadCount", err);
    return { count: 0, error: fail("NOTIFICATIONS_LOAD_FAILED").error };
  }
}

export async function markCustomerNotificationReadAction(notificationId: string) {
  const customerId = await getCustomerIdFromSession();
  if (!customerId) return fail("UNAUTHORIZED");

  try {
    await markNotificationRead(notificationId);
    return {};
  } catch (err) {
    logActionFailure("markCustomerNotificationRead", err);
    return fail("NOTIFICATIONS_UPDATE_FAILED");
  }
}

export async function markAllCustomerNotificationsReadAction() {
  const customerId = await getCustomerIdFromSession();
  if (!customerId) return fail("UNAUTHORIZED");

  try {
    await markAllNotificationsRead({
      recipientType: "customer",
      recipientId: customerId,
    });
    return {};
  } catch (err) {
    logActionFailure("markAllCustomerNotificationsRead", err);
    return fail("NOTIFICATIONS_UPDATE_FAILED");
  }
}
