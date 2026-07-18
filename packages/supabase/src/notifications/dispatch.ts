import { sendNotificationEmail } from "@repo/utils/transactional-email";
import { createServiceRoleClient } from "../service-role";
import {
  getMerchantManagerUserIds,
  getMerchantOwnerEmail,
  getUserEmail,
  insertNotification,
  listAdminUserIds,
  processDisputeSlaBreachEmails,
} from "../queries/notifications";
import type { StampDisputeListItem } from "../queries/stamp-disputes-shared";

async function notifyMerchantStaffInApp(
  userIds: string[],
  input: {
    type: "dispute_filed";
    titleKey: string;
    bodyKey: string;
    payload: Record<string, unknown>;
  },
): Promise<void> {
  await Promise.all(
    userIds.map((userId) =>
      insertNotification({
        recipientType: "merchant_staff",
        recipientId: userId,
        type: input.type,
        titleKey: input.titleKey,
        bodyKey: input.bodyKey,
        payload: input.payload,
        channel: "in_app",
      }),
    ),
  );
}

export async function notifyDisputeFiled(
  dispute: Pick<
    StampDisputeListItem,
    | "id"
    | "merchantId"
    | "merchantName"
    | "customerName"
    | "amountClaimed"
    | "currencyCode"
  >,
): Promise<void> {
  const userIds = await getMerchantManagerUserIds(dispute.merchantId);
  const payload = {
    disputeId: dispute.id,
    businessName: dispute.merchantName,
    customerName: dispute.customerName,
    amount: dispute.amountClaimed,
    currencyCode: dispute.currencyCode,
  };

  await notifyMerchantStaffInApp(userIds, {
    type: "dispute_filed",
    titleKey: "notifications.disputeFiled.title",
    bodyKey: "notifications.disputeFiled.body",
    payload,
  });

  const ownerEmail = await getMerchantOwnerEmail(dispute.merchantId);
  if (ownerEmail) {
    void sendNotificationEmail({
      to: ownerEmail,
      type: "dispute_filed",
      payload: {
        businessName: dispute.merchantName,
        customerName: dispute.customerName,
        amount: dispute.amountClaimed,
        currencyCode: dispute.currencyCode,
      },
    });
  }
}

export async function notifyDisputeResolved(
  dispute: Pick<
    StampDisputeListItem,
    "id" | "customerId" | "customerCardId" | "merchantName" | "status"
  >,
): Promise<void> {
  if (dispute.status === "pending") return;
  if (!dispute.customerId) {
    console.error("[notifyDisputeResolved] missing customerId", dispute.id);
    return;
  }

  const payload = {
    disputeId: dispute.id,
    customerCardId: dispute.customerCardId,
    businessName: dispute.merchantName,
    status: dispute.status,
  };

  await insertNotification({
    recipientType: "customer",
    recipientId: dispute.customerId,
    type: "dispute_resolved",
    titleKey: "notifications.disputeResolved.title",
    bodyKey:
      dispute.status === "approved"
        ? "notifications.disputeResolved.bodyApproved"
        : "notifications.disputeResolved.bodyRejected",
    payload,
    channel: "in_app",
  });
}

export async function notifyRewardUnlocked(input: {
  customerId: string;
  businessName: string;
  cardName: string;
  customerCardId: string;
}): Promise<void> {
  await insertNotification({
    recipientType: "customer",
    recipientId: input.customerId,
    type: "reward_unlocked",
    titleKey: "notifications.rewardUnlocked.title",
    bodyKey: "notifications.rewardUnlocked.body",
    payload: {
      businessName: input.businessName,
      cardName: input.cardName,
      customerCardId: input.customerCardId,
    },
    channel: "in_app",
  });
}

export async function notifySmartPromo(input: {
  customerId: string;
  businessName: string;
  stampsRemaining: number;
  customerCardId: string;
}): Promise<void> {
  await insertNotification({
    recipientType: "customer",
    recipientId: input.customerId,
    type: "smart_promo",
    titleKey: "notifications.smartPromo.title",
    bodyKey: "notifications.smartPromo.body",
    payload: {
      businessName: input.businessName,
      stampsRemaining: input.stampsRemaining,
      customerCardId: input.customerCardId,
    },
    channel: "in_app",
  });
}

export async function notifyMerchantApprovedInApp(input: {
  ownerUserId: string;
  businessName: string;
}): Promise<void> {
  await insertNotification({
    recipientType: "merchant_staff",
    recipientId: input.ownerUserId,
    type: "merchant_approved",
    titleKey: "notifications.merchantApproved.title",
    bodyKey: "notifications.merchantApproved.body",
    payload: { businessName: input.businessName },
    channel: "in_app",
  });
}

export async function notifyDisputeSlaBreachEmails(): Promise<number> {
  return processDisputeSlaBreachEmails();
}

export async function runDisputeSlaBreachJob(): Promise<{
  inAppRows: number;
  emailsQueued: number;
}> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase.rpc(
    "process_dispute_sla_breach_notifications",
  );
  if (error) throw error;

  const emailsQueued = await notifyDisputeSlaBreachEmails();
  return { inAppRows: data ?? 0, emailsQueued };
}

export async function notifyAdminsDisputeSlaFromApp(): Promise<void> {
  await runDisputeSlaBreachJob();
}

export { getUserEmail, listAdminUserIds };
