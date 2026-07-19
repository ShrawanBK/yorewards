"use server";

import {
  countUnreadInAppNotifications,
  listInAppNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@repo/supabase/queries/notifications";
import { fail, logActionFailure } from "@repo/utils/action-error";
import { requireAdminForAction } from "@/features/auth/utils/requireAdminAuth";

export async function listAdminNotificationsAction() {
  const guard = await requireAdminForAction();
  if (!guard.ok) return { notifications: [], error: guard.result.error };

  try {
    const notifications = await listInAppNotifications({
      recipientType: "admin",
      recipientId: guard.user.id,
    });
    return { notifications };
  } catch (err) {
    logActionFailure("listAdminNotifications", err);
    return { notifications: [], error: fail("NOTIFICATIONS_LOAD_FAILED").error };
  }
}

export async function getAdminUnreadCountAction() {
  const guard = await requireAdminForAction();
  if (!guard.ok) return { count: 0, error: guard.result.error };

  try {
    const count = await countUnreadInAppNotifications({
      recipientType: "admin",
      recipientId: guard.user.id,
    });
    return { count };
  } catch (err) {
    logActionFailure("getAdminUnreadCount", err);
    return { count: 0, error: fail("NOTIFICATIONS_LOAD_FAILED").error };
  }
}

export async function markAdminNotificationReadAction(notificationId: string) {
  const guard = await requireAdminForAction();
  if (!guard.ok) return guard.result;

  try {
    await markNotificationRead(notificationId);
    return {};
  } catch (err) {
    logActionFailure("markAdminNotificationRead", err);
    return fail("NOTIFICATIONS_UPDATE_FAILED");
  }
}

export async function markAllAdminNotificationsReadAction() {
  const guard = await requireAdminForAction();
  if (!guard.ok) return guard.result;

  try {
    await markAllNotificationsRead({
      recipientType: "admin",
      recipientId: guard.user.id,
    });
    return {};
  } catch (err) {
    logActionFailure("markAllAdminNotificationsRead", err);
    return fail("NOTIFICATIONS_UPDATE_FAILED");
  }
}
