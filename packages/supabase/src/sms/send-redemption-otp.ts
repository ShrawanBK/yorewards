import twilio from "twilio";

const SPARROW_SMS_API_URL = "https://api.sparrowsms.com/v2/sms/";

const REDEMPTION_SMS_TEMPLATE = (otp: string) =>
  `Your YORewards code: ${otp}. Valid 5 minutes.`;

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

/** Send redemption OTP SMS — NP via Sparrow, FI via Twilio. Dev logs when unconfigured. */
export async function sendRedemptionOtpSms(
  phone: string,
  countryCode: string,
  otp: string,
): Promise<void> {
  const text = REDEMPTION_SMS_TEMPLATE(otp);

  if (countryCode === "FI") {
    if (hasTwilioConfig()) {
      await sendViaTwilio(phone, text);
      return;
    }
    if (isDevEnvironment()) {
      console.info(`[dev:redemption-otp] ${phone}: ${otp}`);
      return;
    }
    throw new Error("Twilio is not configured");
  }

  if (hasSparrowConfig()) {
    await sendViaSparrow(phone, text);
    return;
  }

  if (isDevEnvironment()) {
    console.info(`[dev:redemption-otp] ${phone}: ${otp}`);
    return;
  }

  throw new Error("Sparrow SMS is not configured");
}
