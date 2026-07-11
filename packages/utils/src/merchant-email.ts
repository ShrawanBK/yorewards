/**
 * Transactional email helpers — uses Resend HTTP API when RESEND_API_KEY is set.
 * No SDK dependency; safe no-op in local dev without credentials.
 */

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

function getResendConfig() {
  const apiKey = process.env.RESEND_API_KEY;
  const from =
    process.env.RESEND_FROM_EMAIL ?? "YORewards <onboarding@yorewards.com.np>";
  return { apiKey, from };
}

export async function sendStaffInviteEmail(
  input: StaffInviteEmailInput,
): Promise<StaffInviteEmailResult> {
  const { apiKey, from } = getResendConfig();

  if (!apiKey) {
    console.info("[email:staff-invite] skipped — RESEND_API_KEY not set", {
      to: input.to,
      inviteUrl: input.inviteUrl,
    });
    return { sent: false, reason: "missing_api_key" };
  }

  const roleLabel = input.role === "manager" ? "Manager" : "Cashier";
  const greeting = input.displayName?.trim()
    ? `Hi ${escapeHtml(input.displayName.trim())},`
    : "Hi there,";

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [input.to],
      subject: `Join ${input.businessName} on YORewards`,
      html: `
        <p>${greeting}</p>
        <p>You've been invited to join <strong>${escapeHtml(input.businessName)}</strong> as a <strong>${roleLabel}</strong> on YORewards.</p>
        <p><a href="${input.inviteUrl}">Accept invite and set up your account</a></p>
        <p>If the button doesn't work, copy this link into your browser:</p>
        <p><a href="${input.inviteUrl}">${escapeHtml(input.inviteUrl)}</a></p>
        <p>— YORewards</p>
      `,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    return {
      sent: false,
      reason: "provider_error",
      message: `Resend failed (${response.status}): ${body}`,
    };
  }

  return { sent: true };
}

export async function sendMerchantApprovedEmail(
  input: MerchantApprovedEmailInput,
): Promise<void> {
  const { apiKey, from } = getResendConfig();

  if (!apiKey) {
    console.info("[email:merchant-approved] skipped — RESEND_API_KEY not set", {
      to: input.to,
      businessName: input.businessName,
    });
    return;
  }

  const appUrl =
    process.env.NEXT_PUBLIC_MERCHANT_URL ?? "http://localhost:3001";

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [input.to],
      subject: `${input.businessName} is live on YORewards`,
      html: `
        <p>Your business <strong>${escapeHtml(input.businessName)}</strong> is approved and ready to accept loyalty stamps.</p>
        <p><a href="${appUrl}/merchant/dashboard">Open your dashboard</a> to print your QR code and start approving visits.</p>
        <p>— YORewards</p>
      `,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Resend failed (${response.status}): ${body}`);
  }
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
