"use server";

import { createClient } from "@repo/supabase/server";
import {
  countUnreadInAppNotifications,
  listInAppNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@repo/supabase/queries/notifications";
import { fail, logActionFailure } from "@repo/utils/action-error";

export async function listMerchantNotificationsAction() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { notifications: [], error: fail("UNAUTHORIZED").error };

  try {
    const notifications = await listInAppNotifications({
      recipientType: "merchant_staff",
      recipientId: user.id,
    });
    return { notifications };
  } catch (err) {
    logActionFailure("listMerchantNotifications", err);
    return { notifications: [], error: fail("NOTIFICATIONS_LOAD_FAILED").error };
  }
}

export async function getMerchantUnreadCountAction() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { count: 0, error: fail("UNAUTHORIZED").error };

  try {
    const count = await countUnreadInAppNotifications({
      recipientType: "merchant_staff",
      recipientId: user.id,
    });
    return { count };
  } catch (err) {
    logActionFailure("getMerchantUnreadCount", err);
    return { count: 0, error: fail("NOTIFICATIONS_LOAD_FAILED").error };
  }
}

export async function markMerchantNotificationReadAction(notificationId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return fail("UNAUTHORIZED");

  try {
    await markNotificationRead(notificationId);
    return {};
  } catch (err) {
    logActionFailure("markMerchantNotificationRead", err);
    return fail("NOTIFICATIONS_UPDATE_FAILED");
  }
}

export async function markAllMerchantNotificationsReadAction() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return fail("UNAUTHORIZED");

  try {
    await markAllNotificationsRead({
      recipientType: "merchant_staff",
      recipientId: user.id,
    });
    return {};
  } catch (err) {
    logActionFailure("markAllMerchantNotificationsRead", err);
    return fail("NOTIFICATIONS_UPDATE_FAILED");
  }
}
