import { createServiceRoleClient } from "../service-role";
import { merchantCanUseSmartPromo } from "@repo/utils/plan-limits";

export async function evaluateSmartPromoAfterStampApproval(
  sessionId: string,
): Promise<void> {
  const supabase = createServiceRoleClient();

  const { data: session, error: sessionError } = await supabase
    .from("stamp_sessions")
    .select(
      "merchant_id, customer_card_id, customer_cards ( id, customer_id, current_stamps, loyalty_cards ( stamp_target ) )",
    )
    .eq("id", sessionId)
    .maybeSingle();

  if (sessionError || !session) return;

  const customerCard = session.customer_cards as {
    id: string;
    customer_id: string;
    current_stamps: number;
    loyalty_cards: { stamp_target: number } | null;
  } | null;

  if (!customerCard?.loyalty_cards) return;

  const { data: merchant, error: merchantError } = await supabase
    .from("merchants")
    .select(
      "subscription_tier, smart_promo_enabled, smart_promo_threshold",
    )
    .eq("id", session.merchant_id)
    .maybeSingle();

  if (merchantError || !merchant) return;
  if (!merchantCanUseSmartPromo(merchant.subscription_tier)) return;

  await maybeSendSmartPromoNotification({
    merchantId: session.merchant_id,
    customerId: customerCard.customer_id,
    customerCardId: customerCard.id,
    currentStamps: customerCard.current_stamps,
    stampTarget: customerCard.loyalty_cards.stamp_target,
    threshold: merchant.smart_promo_threshold,
    enabled: merchant.smart_promo_enabled,
  });
}

export async function maybeSendSmartPromoNotification(input: {
  merchantId: string;
  customerId: string;
  customerCardId: string;
  currentStamps: number;
  stampTarget: number;
  threshold: number;
  enabled: boolean;
}): Promise<{ sent: boolean; stampsRemaining?: number }> {
  if (!input.enabled) return { sent: false };

  const stampsRemaining = input.stampTarget - input.currentStamps;
  if (stampsRemaining < 1 || stampsRemaining > input.threshold) {
    return { sent: false };
  }

  const rewardCycleKey = `${input.stampTarget}-${Math.floor(input.currentStamps / input.stampTarget)}`;
  const supabase = createServiceRoleClient();

  const { error } = await supabase.from("smart_promo_notifications").insert({
    merchant_id: input.merchantId,
    customer_id: input.customerId,
    customer_card_id: input.customerCardId,
    reward_cycle_key: rewardCycleKey,
    stamps_remaining: stampsRemaining,
  });

  if (error) {
    if (error.code === "23505") return { sent: false };
    throw error;
  }

  // Day 6: log for future push/email integration
  console.info("[smart-promo]", {
    merchantId: input.merchantId,
    customerId: input.customerId,
    stampsRemaining,
  });

  return { sent: true, stampsRemaining };
}

export async function updateMerchantSmartPromoSettings(
  merchantId: string,
  enabled: boolean,
  threshold: number,
): Promise<void> {
  const supabase = createServiceRoleClient();
  const { error } = await supabase
    .from("merchants")
    .update({
      smart_promo_enabled: enabled,
      smart_promo_threshold: threshold,
    })
    .eq("id", merchantId);

  if (error) throw error;
}
