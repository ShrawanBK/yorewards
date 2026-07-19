import twilio from "twilio";

const SPARROW_SMS_API_URL = "https://api.sparrowsms.com/v2/sms/";

export type SendSmsInput = {
  phone: string;
  /** Routes NP → Sparrow, FI → Twilio (Twilio fallback when Sparrow unset). */
  countryCode: string;
  text: string;
  /** Log label when falling back to console in development. */
  purpose?: string;
};

export type SmsProvider = "sparrow" | "twilio" | "dev_log";

function isDevEnvironment(): boolean {
  return process.env.NODE_ENV === "development";
}

function hasSparrowConfig(): boolean {
  return Boolean(process.env.SPARROW_SMS_TOKEN?.trim());
}

function hasTwilioConfig(): boolean {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID?.trim() &&
      process.env.TWILIO_AUTH_TOKEN?.trim() &&
      process.env.TWILIO_PHONE_NUMBER?.trim(),
  );
}

async function sendViaSparrow(phone: string, text: string): Promise<void> {
  const token = process.env.SPARROW_SMS_TOKEN?.trim();
  if (!token) throw new Error("Sparrow SMS is not configured");

  const from = process.env.SPARROW_SMS_FROM?.trim() || "YORewards";
  const response = await fetch(SPARROW_SMS_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      token,
      from,
      to: phone,
      text,
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Sparrow SMS failed (${response.status}): ${body}`);
  }
}

async function sendViaTwilio(phone: string, text: string): Promise<void> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();
  const from = process.env.TWILIO_PHONE_NUMBER?.trim();
  if (!accountSid || !authToken || !from) {
    throw new Error("Twilio is not configured");
  }

  const client = twilio(accountSid, authToken);
  await client.messages.create({
    to: phone,
    from,
    body: text,
  });
}

/**
 * Resolve SMS provider.
 * NP → Sparrow (Twilio fallback when Sparrow unset).
 * FI → Twilio (GatewayAPI can slot in later behind the same interface).
 */
function resolveProvider(countryCode: string): SmsProvider {
  if (countryCode === "FI") {
    if (hasTwilioConfig()) return "twilio";
    return "dev_log";
  }

  if (hasSparrowConfig()) return "sparrow";
  // Soft-launch / single-provider setups: Twilio can cover NP when Sparrow unset.
  if (hasTwilioConfig()) return "twilio";
  return "dev_log";
}

/**
 * Send an SMS via the country-routed provider.
 * NP → Sparrow (Twilio fallback) · FI → Twilio (GatewayAPI seam).
 * Unconfigured + development → console log (never throws).
 */
export async function sendSms(input: SendSmsInput): Promise<SmsProvider> {
  const { phone, countryCode, text, purpose = "sms" } = input;
  const provider = resolveProvider(countryCode);

  if (provider === "dev_log") {
    if (isDevEnvironment()) {
      console.info(`[dev:${purpose}] ${phone}: ${text}`);
      return "dev_log";
    }
    if (countryCode === "FI") {
      throw new Error("Twilio is not configured");
    }
    throw new Error("Sparrow SMS is not configured");
  }

  if (provider === "sparrow") {
    await sendViaSparrow(phone, text);
    return "sparrow";
  }

  await sendViaTwilio(phone, text);
  return "twilio";
}
