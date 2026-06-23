"use server";

import { getCustomerIdFromSession } from "@repo/supabase/queries/customers";
import {
  getRewardClaimContext,
  sendRedemptionOtp,
  verifyRedemptionOtp,
  type RewardClaimContext,
} from "@repo/supabase/queries/reward-otp";
import { fail, logActionFailure, type ActionErrorCode } from "@repo/utils/action-error";
import type { ActionResult } from "@/shared/types/action-result";

function mapRewardOtpError(err: unknown): ActionErrorCode {
  if (err instanceof Error) {
    const code = err.message as ActionErrorCode;
    if (
      code === "CUSTOMER_CARD_NOT_FOUND" ||
      code === "CUSTOMER_PHONE_REQUIRED" ||
      code === "OTP_RATE_LIMITED" ||
      code === "OTP_INVALID" ||
      code === "OTP_EXPIRED" ||
      code === "REWARD_NOT_READY" ||
      code === "REDEMPTION_CREATE_FAILED"
    ) {
      return code;
    }
  }
  return "OTP_SEND_FAILED";
}

function mapVerifyError(err: unknown): ActionErrorCode {
  if (err instanceof Error) {
    const code = err.message as ActionErrorCode;
    if (
      code === "CUSTOMER_CARD_NOT_FOUND" ||
      code === "CUSTOMER_PHONE_REQUIRED" ||
      code === "OTP_INVALID" ||
      code === "OTP_EXPIRED" ||
      code === "REWARD_NOT_READY" ||
      code === "REDEMPTION_CREATE_FAILED"
    ) {
      return code;
    }
  }
  return "UNKNOWN";
}

export async function fetchRewardClaimContextAction(
  cardId: string,
): Promise<ActionResult<{ context: RewardClaimContext }>> {
  const customerId = await getCustomerIdFromSession();
  if (!customerId) return fail("UNAUTHORIZED");

  try {
    const context = await getRewardClaimContext(customerId, cardId);
    if (!context) return fail("CUSTOMER_CARD_NOT_FOUND");
    return { context };
  } catch (err) {
    logActionFailure("fetchRewardClaimContext", err);
    return fail("WALLET_LOAD_FAILED");
  }
}

export async function sendRedemptionOtpAction(
  cardId: string,
): Promise<ActionResult> {
  const customerId = await getCustomerIdFromSession();
  if (!customerId) return fail("UNAUTHORIZED");

  try {
    await sendRedemptionOtp(customerId, cardId);
    return {};
  } catch (err) {
    logActionFailure("sendRedemptionOtp", err);
    if (err instanceof Error && err.message.includes("not configured")) {
      return fail("OTP_SEND_FAILED");
    }
    return fail(mapRewardOtpError(err));
  }
}

export async function verifyRedemptionOtpAction(
  cardId: string,
  otp: string,
): Promise<ActionResult<{ redemptionCode: string }>> {
  const customerId = await getCustomerIdFromSession();
  if (!customerId) return fail("UNAUTHORIZED");

  try {
    const result = await verifyRedemptionOtp(customerId, cardId, otp);
    return result;
  } catch (err) {
    logActionFailure("verifyRedemptionOtp", err);
    return fail(mapVerifyError(err));
  }
}
