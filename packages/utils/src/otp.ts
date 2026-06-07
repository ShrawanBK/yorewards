import { randomInt } from "node:crypto";

/** Six-digit OTP for reward redemption (Day 5 — Sparrow / Twilio). */

export function generateSixDigitOTP(): string {
  return String(randomInt(100000, 999999));
}
