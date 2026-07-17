/**
 * Transactional email helpers — uses Resend HTTP API when RESEND_API_KEY is set.
 * No SDK dependency; safe no-op in local dev without credentials.
 */

import {
  escapeHtml,
  sendNotificationEmail,
  sendResendEmail,
} from "./transactional-email";

type MerchantApprovedEmailInput = {
  to: string;
  businessName: string;
};

export type StaffInviteEmailInput = {
  to: string;
  businessName: string;
  role: "cashier" | "manager";
  inviteUrl: string;
  displayName?: string | null;
};

export type StaffInviteEmailResult =
  | { sent: true }
  | { sent: false; reason: "missing_api_key" }
  | { sent: false; reason: "provider_error"; message: string };

export async function sendStaffInviteEmail(
  input: StaffInviteEmailInput,
): Promise<StaffInviteEmailResult> {
  const roleLabel = input.role === "manager" ? "Manager" : "Cashier";
  const greeting = input.displayName?.trim()
    ? `Hi ${escapeHtml(input.displayName.trim())},`
    : "Hi there,";

  const result = await sendResendEmail({
    to: input.to,
    subject: `Join ${input.businessName} on YORewards`,
    html: `
      <p>${greeting}</p>
      <p>You've been invited to join <strong>${escapeHtml(input.businessName)}</strong> as a <strong>${roleLabel}</strong> on YORewards.</p>
      <p><a href="${input.inviteUrl}">Accept invite and set up your account</a></p>
      <p>If the button doesn't work, copy this link into your browser:</p>
      <p><a href="${input.inviteUrl}">${escapeHtml(input.inviteUrl)}</a></p>
      <p>— YORewards</p>
    `,
  });

  if (result.sent) return { sent: true };
  if (result.reason === "missing_api_key") {
    console.info("[email:staff-invite] skipped — RESEND_API_KEY not set", {
      to: input.to,
      inviteUrl: input.inviteUrl,
    });
    return { sent: false, reason: "missing_api_key" };
  }
  return result;
}

export async function sendMerchantApprovedEmail(
  input: MerchantApprovedEmailInput,
): Promise<void> {
  const appUrl =
    process.env.NEXT_PUBLIC_MERCHANT_URL ?? "http://localhost:3001";

  const result = await sendNotificationEmail({
    to: input.to,
    type: "merchant_approved",
    payload: { businessName: input.businessName, appUrl },
  });

  if (!result.sent && result.reason === "provider_error") {
    throw new Error(result.message);
  }
}
