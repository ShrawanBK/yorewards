/**
 * Transactional email helpers — uses Resend HTTP API when RESEND_API_KEY is set.
 * No SDK dependency; safe no-op in local dev without credentials.
 */

type MerchantApprovedEmailInput = {
  to: string;
  businessName: string;
};

export async function sendMerchantApprovedEmail(
  input: MerchantApprovedEmailInput,
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from =
    process.env.RESEND_FROM_EMAIL ?? "YORewards <onboarding@yorewards.com.np>";

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
