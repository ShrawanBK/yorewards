import { sendNotificationEmail } from "@repo/utils/transactional-email";
import { createClient } from "../server";
import { createServiceRoleClient } from "../service-role";
import type {
  NotificationChannel,
  NotificationRecipientType,
  NotificationType,
} from "../types";

export type NotificationRow = {
  id: string;
  recipientType: NotificationRecipientType;
  recipientId: string;
  type: NotificationType;
  titleKey: string;
  bodyKey: string;
  payload: Record<string, unknown>;
  channel: NotificationChannel;
  readAt: string | null;
  createdAt: string;
};

type DbNotificationRow = {
  id: string;
  recipient_type: NotificationRecipientType;
  recipient_id: string;
  type: NotificationType;
  title_key: string;
  body_key: string;
  payload: Record<string, unknown> | null;
  channel: NotificationChannel;
  read_at: string | null;
  created_at: string;
};

function mapNotification(row: DbNotificationRow): NotificationRow {
  return {
    id: row.id,
    recipientType: row.recipient_type,
    recipientId: row.recipient_id,
    type: row.type,
    titleKey: row.title_key,
    bodyKey: row.body_key,
    payload: row.payload ?? {},
    channel: row.channel,
    readAt: row.read_at,
    createdAt: row.created_at,
  };
}

export async function insertNotification(input: {
  recipientType: NotificationRecipientType;
  recipientId: string;
  type: NotificationType;
  titleKey: string;
  bodyKey: string;
  payload?: Record<string, unknown>;
  channel?: NotificationChannel;
}): Promise<string> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("notifications")
    .insert({
      recipient_type: input.recipientType,
      recipient_id: input.recipientId,
      type: input.type,
      title_key: input.titleKey,
      body_key: input.bodyKey,
      payload: input.payload ?? {},
      channel: input.channel ?? "in_app",
    })
    .select("id")
    .single();

  if (error) throw error;
  return data.id;
}

export async function listInAppNotifications(input: {
  recipientType: NotificationRecipientType;
  recipientId: string;
  limit?: number;
}): Promise<NotificationRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("recipient_type", input.recipientType)
    .eq("recipient_id", input.recipientId)
    .eq("channel", "in_app")
    .order("created_at", { ascending: false })
    .limit(input.limit ?? 50);

  if (error) throw error;
  return (data ?? []).map((row) => mapNotification(row as DbNotificationRow));
}

export async function countUnreadInAppNotifications(input: {
  recipientType: NotificationRecipientType;
  recipientId: string;
}): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("recipient_type", input.recipientType)
    .eq("recipient_id", input.recipientId)
    .eq("channel", "in_app")
    .is("read_at", null);

  if (error) throw error;
  return count ?? 0;
}

export async function markNotificationRead(notificationId: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", notificationId)
    .is("read_at", null);

  if (error) throw error;
}

export async function markAllNotificationsRead(input: {
  recipientType: NotificationRecipientType;
  recipientId: string;
}): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("recipient_type", input.recipientType)
    .eq("recipient_id", input.recipientId)
    .eq("channel", "in_app")
    .is("read_at", null);

  if (error) throw error;
}

export async function listAdminUserIds(): Promise<string[]> {
  const admin = createServiceRoleClient();
  const ids: string[] = [];
  let page = 1;

  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: 1000,
    });
    if (error) throw error;

    for (const user of data.users) {
      if (user.app_metadata?.role === "admin") {
        ids.push(user.id);
      }
    }

    if (data.users.length < 1000) break;
    page += 1;
  }

  return ids;
}

export async function getMerchantManagerUserIds(
  merchantId: string,
): Promise<string[]> {
  const supabase = createServiceRoleClient();
  const userIds = new Set<string>();

  const { data: merchant, error: merchantError } = await supabase
    .from("merchants")
    .select("user_id, email")
    .eq("id", merchantId)
    .maybeSingle();

  if (merchantError) throw merchantError;
  if (merchant?.user_id) userIds.add(merchant.user_id);

  const { data: staff, error: staffError } = await supabase
    .from("merchant_staff")
    .select("user_id, role")
    .eq("merchant_id", merchantId)
    .eq("status", "active")
    .in("role", ["manager", "owner"]);

  if (staffError) throw staffError;
  for (const row of staff ?? []) {
    if (row.user_id) userIds.add(row.user_id);
  }

  return [...userIds];
}

export async function getUserEmail(userId: string): Promise<string | null> {
  const admin = createServiceRoleClient();
  const { data, error } = await admin.auth.admin.getUserById(userId);
  if (error) throw error;
  return data.user.email ?? null;
}

export async function getMerchantOwnerEmail(merchantId: string): Promise<string | null> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("merchants")
    .select("email, user_id")
    .eq("id", merchantId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  if (data.email?.trim()) return data.email.trim();
  if (data.user_id) return getUserEmail(data.user_id);
  return null;
}

export async function processDisputeSlaBreachEmails(): Promise<number> {
  const supabase = createServiceRoleClient();

  const { data: disputes, error } = await supabase
    .from("stamp_disputes")
    .select("id, merchant_id, sla_alerted_at")
    .eq("status", "pending")
    .not("sla_alerted_at", "is", null);

  if (error) throw error;
  if (!disputes?.length) return 0;

  const merchantIds = [...new Set(disputes.map((row) => row.merchant_id))];
  const { data: merchants, error: merchantsError } = await supabase
    .from("merchants")
    .select("id, business_name")
    .in("id", merchantIds);

  if (merchantsError) throw merchantsError;

  const merchantNames = new Map(
    (merchants ?? []).map((row) => [row.id, row.business_name]),
  );

  const adminIds = await listAdminUserIds();
  let sent = 0;

  for (const dispute of disputes) {
    const merchantName = merchantNames.get(dispute.merchant_id) ?? "Merchant";

    for (const adminId of adminIds) {
      const email = await getUserEmail(adminId);
      if (!email) continue;

      const { count } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("recipient_type", "admin")
        .eq("recipient_id", adminId)
        .eq("type", "dispute_sla_breach")
        .contains("payload", { disputeId: dispute.id })
        .eq("channel", "email");

      if ((count ?? 0) > 0) continue;

      await insertNotification({
        recipientType: "admin",
        recipientId: adminId,
        type: "dispute_sla_breach",
        titleKey: "notifications.disputeSlaBreach.title",
        bodyKey: "notifications.disputeSlaBreach.body",
        payload: { disputeId: dispute.id, merchantName },
        channel: "email",
      });

      void sendNotificationEmail({
        to: email,
        type: "dispute_sla_breach",
        payload: { disputeId: dispute.id, merchantName },
      });
      sent += 1;
    }
  }

  return sent;
}
