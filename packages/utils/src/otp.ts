import { randomInt } from "node:crypto";
import bcrypt from "bcryptjs";

const REDEMPTION_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** Six-digit OTP for reward redemption (Sparrow / Twilio). */
export function generateSixDigitOTP(): string {
  return String(randomInt(100000, 999999));
}

/** Six-character alphanumeric redemption code (merchant lookup expects length 6). */
export function generateRedemptionCode(): string {
  let code = "";
  for (let i = 0; i < 6; i += 1) {
    code += REDEMPTION_CODE_CHARS[randomInt(0, REDEMPTION_CODE_CHARS.length)]!;
  }
  return code;
}

const OTP_BCRYPT_ROUNDS = 10;

export async function hashOtp(otp: string): Promise<string> {
  return bcrypt.hash(otp, OTP_BCRYPT_ROUNDS);
}

export async function verifyOtpHash(
  otp: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(otp, hash);
}

export const OTP_EXPIRY_MS = 5 * 60 * 1000;

export const OTP_SEND_RATE_LIMIT = {
  windowMs: 15 * 60 * 1000,
  maxSends: 3,
} as const;
