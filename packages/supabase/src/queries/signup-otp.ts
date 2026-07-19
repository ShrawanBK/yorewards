import { createServiceRoleClient } from "../service-role";
import { sendSms } from "../sms/send-sms";
import { findCustomerByPhone } from "./customers";
import {
  generateSixDigitOTP,
  hashOtp,
  OTP_EXPIRY_MS,
  OTP_SEND_RATE_LIMIT,
  verifyOtpHash,
} from "@repo/utils/otp";
import { detectCountry, maskPhone } from "@repo/utils/phone";

const SIGNUP_SMS_TEMPLATE = (otp: string) =>
  `Your YORewards signup code: ${otp}. Valid 5 minutes.`;

async function countRecentSignupOtpSends(phone: string): Promise<number> {
  const supabase = createServiceRoleClient();
  const since = new Date(
    Date.now() - OTP_SEND_RATE_LIMIT.windowMs,
  ).toISOString();

  const { count, error } = await supabase
    .from("otp_tokens")
    .select("id", { count: "exact", head: true })
    .eq("phone", phone)
    .eq("purpose", "signup")
    .gte("created_at", since);

  if (error) throw error;
  return count ?? 0;
}

async function clearSignupOtpsForPhone(phone: string): Promise<void> {
  const supabase = createServiceRoleClient();
  const { error } = await supabase
    .from("otp_tokens")
    .delete()
    .eq("phone", phone)
    .eq("purpose", "signup");

  if (error) throw error;
}

async function findValidSignupOtp(phone: string) {
  const supabase = createServiceRoleClient();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("otp_tokens")
    .select("id, otp_hash, expires_at")
    .eq("phone", phone)
    .eq("purpose", "signup")
    .gt("expires_at", now)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export type SignupOtpSendResult = {
  maskedPhone: string;
  expiresInMs: number;
};

export async function sendSignupOtp(phone: string): Promise<SignupOtpSendResult> {
  const existing = await findCustomerByPhone(phone);
  if (existing) {
    throw new Error("CUSTOMER_ALREADY_EXISTS");
  }

  const recentSends = await countRecentSignupOtpSends(phone);
  if (recentSends >= OTP_SEND_RATE_LIMIT.maxSends) {
    throw new Error("OTP_RATE_LIMITED");
  }

  const otp = generateSixDigitOTP();
  const otpHash = await hashOtp(otp);
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS).toISOString();
  const countryCode = detectCountry(phone);

  await clearSignupOtpsForPhone(phone);

  const supabase = createServiceRoleClient();
  const { error: insertError } = await supabase.from("otp_tokens").insert({
    phone,
    otp_hash: otpHash,
    purpose: "signup",
    expires_at: expiresAt,
  });

  if (insertError) throw insertError;

  try {
    await sendSms({
      phone,
      countryCode,
      text: SIGNUP_SMS_TEMPLATE(otp),
      purpose: "signup-otp",
    });
  } catch (err) {
    await supabase
      .from("otp_tokens")
      .delete()
      .eq("phone", phone)
      .eq("purpose", "signup")
      .eq("otp_hash", otpHash);
    throw err;
  }

  return {
    maskedPhone: maskPhone(phone),
    expiresInMs: OTP_EXPIRY_MS,
  };
}

/** Confirms the signup OTP. Caller creates the customer after success. */
export async function verifySignupOtp(
  phone: string,
  otp: string,
): Promise<void> {
  const normalizedOtp = otp.replace(/\D/g, "");
  if (normalizedOtp.length !== 6) {
    throw new Error("OTP_INVALID");
  }

  const existing = await findCustomerByPhone(phone);
  if (existing) {
    throw new Error("CUSTOMER_ALREADY_EXISTS");
  }

  const token = await findValidSignupOtp(phone);
  if (!token) {
    throw new Error("OTP_EXPIRED");
  }

  const valid = await verifyOtpHash(normalizedOtp, token.otp_hash);
  if (!valid) {
    throw new Error("OTP_INVALID");
  }

  await clearSignupOtpsForPhone(phone);
}
