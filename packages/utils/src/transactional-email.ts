/**
 * Resend HTTP API helpers — shared by merchant-email and notification dispatch.
 */

export type ResendSendResult =
  | { sent: true }
  | { sent: false; reason: "missing_api_key" }
  | { sent: false; reason: "provider_error"; message: string };

export function getResendConfig() {
  const apiKey = process.env.RESEND_API_KEY;
  const from =
    process.env.RESEND_FROM_EMAIL ?? "YORewards <onboarding@yorewards.com.np>";
  return { apiKey, from };
}

export function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export async function sendResendEmail(input: {
  to: string;
  subject: string;
  html: string;
}): Promise<ResendSendResult> {
  const { apiKey, from } = getResendConfig();

  if (!apiKey) {
    console.info("[email] skipped — RESEND_API_KEY not set", { to: input.to });
    return { sent: false, reason: "missing_api_key" };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [input.to],
      subject: input.subject,
      html: input.html,
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

export type NotificationEmailType =
  | "dispute_filed"
  | "dispute_resolved"
  | "dispute_sla_breach"
  | "merchant_approved";

type EmailTemplateInput = {
  dispute_filed: {
    businessName: string;
    customerName?: string | null;
    amount?: number;
    currencyCode?: string;
  };
  dispute_resolved: {
    businessName: string;
    status: string;
  };
  dispute_sla_breach: {
    merchantName: string;
    disputeId: string;
  };
  merchant_approved: {
    businessName: string;
    appUrl?: string;
  };
};

function formatMoney(amount: number, currencyCode: string): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currencyCode,
    }).format(amount);
  } catch {
    return `${amount} ${currencyCode}`;
  }
}

function renderNotificationEmail(
  type: NotificationEmailType,
  payload: EmailTemplateInput[NotificationEmailType],
): { subject: string; html: string } {
  switch (type) {
    case "dispute_filed": {
      const p = payload as EmailTemplateInput["dispute_filed"];
      const amountLabel =
        p.amount != null && p.currencyCode
          ? formatMoney(p.amount, p.currencyCode)
          : null;
      return {
        subject: `New stamp dispute — ${p.businessName}`,
        html: `
          <p>A customer filed a missing-stamp dispute for <strong>${escapeHtml(p.businessName)}</strong>.</p>
          ${p.customerName ? `<p>Customer: ${escapeHtml(p.customerName)}</p>` : ""}
          ${amountLabel ? `<p>Claimed spend: ${escapeHtml(amountLabel)}</p>` : ""}
          <p>Review it in your merchant dashboard.</p>
          <p>— YORewards</p>
        `,
      };
    }
    case "dispute_resolved": {
      const p = payload as EmailTemplateInput["dispute_resolved"];
      return {
        subject: `Dispute update — ${p.businessName}`,
        html: `
          <p>Your stamp dispute with <strong>${escapeHtml(p.businessName)}</strong> was <strong>${escapeHtml(p.status)}</strong>.</p>
          <p>Open the YORewards app to see details.</p>
          <p>— YORewards</p>
        `,
      };
    }
    case "dispute_sla_breach": {
      const p = payload as EmailTemplateInput["dispute_sla_breach"];
      return {
        subject: `Dispute SLA breach — ${p.merchantName}`,
        html: `
          <p>A pending dispute for <strong>${escapeHtml(p.merchantName)}</strong> has passed the 48-hour merchant SLA.</p>
          <p>Dispute ID: ${escapeHtml(p.disputeId)}</p>
          <p>Review it in the admin disputes centre.</p>
          <p>— YORewards</p>
        `,
      };
    }
    case "merchant_approved": {
      const p = payload as EmailTemplateInput["merchant_approved"];
      const appUrl = p.appUrl ?? "http://localhost:3001";
      return {
        subject: `${p.businessName} is live on YORewards`,
        html: `
          <p>Your business <strong>${escapeHtml(p.businessName)}</strong> is approved and ready to accept loyalty stamps.</p>
          <p><a href="${appUrl}/merchant/dashboard">Open your dashboard</a> to print your QR code and start approving visits.</p>
          <p>— YORewards</p>
        `,
      };
    }
    default:
      return { subject: "YORewards notification", html: "<p>— YORewards</p>" };
  }
}

export async function sendNotificationEmail(input: {
  to: string;
  type: NotificationEmailType;
  payload: EmailTemplateInput[NotificationEmailType];
}): Promise<ResendSendResult> {
  const { subject, html } = renderNotificationEmail(input.type, input.payload);
  return sendResendEmail({ to: input.to, subject, html });
}
