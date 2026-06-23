import { createServiceRoleClient } from "../service-role";
import { sendRedemptionOtpSms } from "../sms/send-redemption-otp";
import { getCustomerById } from "./customers";
import {
  createPendingRedemption,
  getPendingRedemptionForCustomerCard,
} from "./redemptions";
import {
  generateRedemptionCode,
  generateSixDigitOTP,
  hashOtp,
  OTP_EXPIRY_MS,
  OTP_SEND_RATE_LIMIT,
  verifyOtpHash,
} from "@repo/utils/otp";
import { maskPhone } from "@repo/utils/phone";

type CustomerCardRewardRow = {
  id: string;
  customer_id: string;
  merchant_id: string;
  reward_status: string;
  cycle_number: number;
};

async function getOwnedCustomerCard(
  customerId: string,
  customerCardId: string,
): Promise<CustomerCardRewardRow | null> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("customer_cards")
    .select("id, customer_id, merchant_id, reward_status, cycle_number")
    .eq("id", customerCardId)
    .eq("customer_id", customerId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

async function countRecentOtpSends(phone: string): Promise<number> {
  const supabase = createServiceRoleClient();
  const since = new Date(
    Date.now() - OTP_SEND_RATE_LIMIT.windowMs,
  ).toISOString();

  const { count, error } = await supabase
    .from("otp_tokens")
    .select("id", { count: "exact", head: true })
    .eq("phone", phone)
    .eq("purpose", "redemption")
    .gte("created_at", since);

  if (error) throw error;
  return count ?? 0;
}

async function clearRedemptionOtpsForPhone(phone: string): Promise<void> {
  const supabase = createServiceRoleClient();
  const { error } = await supabase
    .from("otp_tokens")
    .delete()
    .eq("phone", phone)
    .eq("purpose", "redemption");

  if (error) throw error;
}

async function findValidOtpToken(phone: string) {
  const supabase = createServiceRoleClient();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("otp_tokens")
    .select("id, otp_hash, expires_at")
    .eq("phone", phone)
    .eq("purpose", "redemption")
    .gt("expires_at", now)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
}

async function createUniqueRedemptionCode(): Promise<string> {
  const supabase = createServiceRoleClient();

  for (let attempt = 0; attempt < 12; attempt += 1) {
    const code = generateRedemptionCode();
    const { data, error } = await supabase
      .from("redemptions")
      .select("id")
      .eq("redemption_code", code)
      .maybeSingle();

    if (error) throw error;
    if (!data) return code;
  }

  throw new Error("Could not generate a unique redemption code");
}

export type RewardClaimContext = {
  cardId: string;
  rewardStatus: "pending_otp" | "unlocked" | "collecting";
  phone: string;
  maskedPhone: string;
  redemptionCode: string | null;
  businessName: string;
  cardName: string;
};

export async function getRewardClaimContext(
  customerId: string,
  customerCardId: string,
): Promise<RewardClaimContext | null> {
  const card = await getOwnedCustomerCard(customerId, customerCardId);
  if (!card) return null;

  const customer = await getCustomerById(customerId);
  if (!customer?.phone) return null;

  const supabase = createServiceRoleClient();
  const { data: details, error } = await supabase
    .from("customer_cards")
    .select(
      `
      reward_status,
      merchants ( business_name ),
      loyalty_cards ( card_name )
    `,
    )
    .eq("id", customerCardId)
    .maybeSingle();

  if (error) throw error;

  let redemptionCode: string | null = null;
  if (card.reward_status === "unlocked") {
    const pending = await getPendingRedemptionForCustomerCard(customerCardId);
    redemptionCode = pending?.redemptionCode ?? null;
  }

  const merchant = details?.merchants as { business_name: string } | null;
  const loyaltyCard = details?.loyalty_cards as { card_name: string } | null;

  return {
    cardId: customerCardId,
    rewardStatus: card.reward_status as RewardClaimContext["rewardStatus"],
    phone: customer.phone,
    maskedPhone: maskPhone(customer.phone),
    redemptionCode,
    businessName: merchant?.business_name ?? "Business",
    cardName: loyaltyCard?.card_name ?? "Loyalty card",
  };
}

export async function sendRedemptionOtp(
  customerId: string,
  customerCardId: string,
): Promise<void> {
  const card = await getOwnedCustomerCard(customerId, customerCardId);
  if (!card) {
    throw new Error("CUSTOMER_CARD_NOT_FOUND");
  }

  if (card.reward_status === "unlocked") {
    throw new Error("REWARD_NOT_READY");
  }

  if (card.reward_status !== "pending_otp") {
    throw new Error("REWARD_NOT_READY");
  }

  const customer = await getCustomerById(customerId);
  if (!customer?.phone) {
    throw new Error("CUSTOMER_PHONE_REQUIRED");
  }

  const recentSends = await countRecentOtpSends(customer.phone);
  if (recentSends >= OTP_SEND_RATE_LIMIT.maxSends) {
    throw new Error("OTP_RATE_LIMITED");
  }

  const otp = generateSixDigitOTP();
  const otpHash = await hashOtp(otp);
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS).toISOString();

  await clearRedemptionOtpsForPhone(customer.phone);

  const supabase = createServiceRoleClient();
  const { error: insertError } = await supabase.from("otp_tokens").insert({
    phone: customer.phone,
    otp_hash: otpHash,
    purpose: "redemption",
    expires_at: expiresAt,
  });

  if (insertError) throw insertError;

  try {
    await sendRedemptionOtpSms(customer.phone, customer.country_code, otp);
  } catch (err) {
    await supabase
      .from("otp_tokens")
      .delete()
      .eq("phone", customer.phone)
      .eq("purpose", "redemption")
      .eq("otp_hash", otpHash);
    throw err;
  }
}

export async function verifyRedemptionOtp(
  customerId: string,
  customerCardId: string,
  otp: string,
): Promise<{ redemptionCode: string }> {
  const normalizedOtp = otp.replace(/\D/g, "");
  if (normalizedOtp.length !== 6) {
    throw new Error("OTP_INVALID");
  }

  const card = await getOwnedCustomerCard(customerId, customerCardId);
  if (!card) {
    throw new Error("CUSTOMER_CARD_NOT_FOUND");
  }

  if (card.reward_status === "unlocked") {
    const existing = await getPendingRedemptionForCustomerCard(customerCardId);
    if (existing?.redemptionCode) {
      return { redemptionCode: existing.redemptionCode };
    }
    throw new Error("REWARD_NOT_READY");
  }

  if (card.reward_status !== "pending_otp") {
    throw new Error("REWARD_NOT_READY");
  }

  const customer = await getCustomerById(customerId);
  if (!customer?.phone) {
    throw new Error("CUSTOMER_PHONE_REQUIRED");
  }

  const token = await findValidOtpToken(customer.phone);
  if (!token) {
    throw new Error("OTP_EXPIRED");
  }

  const valid = await verifyOtpHash(normalizedOtp, token.otp_hash);
  if (!valid) {
    throw new Error("OTP_INVALID");
  }

  const redemptionCode = await createUniqueRedemptionCode();
  const supabase = createServiceRoleClient();

  const { error: unlockError } = await supabase
    .from("customer_cards")
    .update({ reward_status: "unlocked" })
    .eq("id", customerCardId)
    .eq("customer_id", customerId)
    .eq("reward_status", "pending_otp");

  if (unlockError) throw unlockError;

  try {
    await createPendingRedemption({
      merchantId: card.merchant_id,
      customerCardId,
      redemptionCode,
      cycleNumber: card.cycle_number,
    });
  } catch {
    await supabase
      .from("customer_cards")
      .update({ reward_status: "pending_otp" })
      .eq("id", customerCardId)
      .eq("customer_id", customerId);
    throw new Error("REDEMPTION_CREATE_FAILED");
  }

  await supabase.from("otp_tokens").delete().eq("id", token.id);

  return { redemptionCode };
}
