import { sendSms } from "./send-sms";

const REDEMPTION_SMS_TEMPLATE = (otp: string) =>
  `Your YORewards code: ${otp}. Valid 5 minutes.`;

/** Send redemption OTP SMS — NP via Sparrow, FI via Twilio. Dev logs when unconfigured. */
export async function sendRedemptionOtpSms(
  phone: string,
  countryCode: string,
  otp: string,
): Promise<void> {
  await sendSms({
    phone,
    countryCode,
    text: REDEMPTION_SMS_TEMPLATE(otp),
    purpose: "redemption-otp",
  });
}
