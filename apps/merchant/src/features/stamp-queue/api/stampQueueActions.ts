"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@repo/supabase/server";
import { getMerchantsByUserId } from "@repo/supabase/queries/merchants";
import { getLoyaltyCardByMerchantId } from "@repo/supabase/queries/loyalty-cards";
import { getLocationsByMerchantId } from "@repo/supabase/queries/locations";
import { createServiceRoleClient } from "@repo/supabase/service-role";
import {
  approveStampSession,
  createPendingStampSession,
  expireStalePendingSessions,
  getPendingStampSessions,
  rejectStampSession,
} from "@repo/supabase/queries/stamps";
import { createPendingRedemption } from "@repo/supabase/queries/redemptions";
import type { ActionError } from "@repo/utils/action-error";
import { fail, logActionFailure } from "@repo/utils/action-error";
import type { ActionFailure, ActionResult } from "@/shared/types/action-result";
import { isDevEnvironment } from "@/shared/utils/env";

const REVALIDATE_PATHS = [
  "/merchant/dashboard",
  "/merchant/analytics",
  "/merchant/redeem",
  "/merchant/customers",
] as const;

const SAM_DEMO_PHONE = "+9779800000101";
const ALEX_DEMO_PHONE = "+9779800000102";

function revalidateMerchantOpsPaths() {
  for (const path of REVALIDATE_PATHS) {
    revalidatePath(path);
  }
}

async function assertActiveMerchantOwner(
  userId: string,
  merchantId: string,
): Promise<ActionFailure | null> {
  const merchants = await getMerchantsByUserId(userId);
  const merchant = merchants.find((m) => m.id === merchantId);
  if (!merchant) return fail("BUSINESS_NOT_FOUND");
  if (merchant.status !== "active") {
    return fail("BUSINESS_NOT_ACTIVE");
  }
  return null;
}

export async function fetchPendingStampQueueAction(merchantId: string): Promise<
  ActionResult & {
    items?: Awaited<ReturnType<typeof getPendingStampSessions>>;
  }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return fail("UNAUTHORIZED");

  const denied = await assertActiveMerchantOwner(user.id, merchantId);
  if (denied) return denied;

  try {
    const items = await getPendingStampSessions(merchantId);
    return { items };
  } catch (err) {
    logActionFailure("fetchPendingStampQueue", err);
    return fail("STAMP_QUEUE_LOAD_FAILED");
  }
}

export async function approveStampAction(
  merchantId: string,
  sessionId: string,
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return fail("UNAUTHORIZED");

  const denied = await assertActiveMerchantOwner(user.id, merchantId);
  if (denied) return denied;

  try {
    const session = await createServiceRoleClient()
      .from("stamp_sessions")
      .select("id, merchant_id, status")
      .eq("id", sessionId)
      .maybeSingle();

    if (session.error) throw session.error;
    if (!session.data || session.data.merchant_id !== merchantId) {
      return fail("STAMP_NOT_FOUND");
    }

    await approveStampSession(sessionId);
    revalidateMerchantOpsPaths();
    return {};
  } catch (err) {
    logActionFailure("approveStamp", err);
    const message = err instanceof Error ? err.message : "";
    if (message.includes("expired")) {
      await expireStalePendingSessions(merchantId);
      return fail("STAMP_EXPIRED");
    }
    if (message.includes("not pending")) {
      return fail("STAMP_NOT_PENDING");
    }
    return fail("STAMP_APPROVE_FAILED");
  }
}

export async function rejectStampAction(
  merchantId: string,
  sessionId: string,
  reason?: string,
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return fail("UNAUTHORIZED");

  const denied = await assertActiveMerchantOwner(user.id, merchantId);
  if (denied) return denied;

  if (reason && reason.trim().length > 120) {
    return fail("STAMP_REJECT_REASON_TOO_LONG");
  }

  try {
    const session = await createServiceRoleClient()
      .from("stamp_sessions")
      .select("id, merchant_id")
      .eq("id", sessionId)
      .maybeSingle();

    if (session.error) throw session.error;
    if (!session.data || session.data.merchant_id !== merchantId) {
      return fail("STAMP_NOT_FOUND");
    }

    await rejectStampSession(sessionId, reason);
    revalidateMerchantOpsPaths();
    return {};
  } catch (err) {
    logActionFailure("rejectStamp", err);
    const message = err instanceof Error ? err.message : "";
    if (message.includes("expired")) {
      return fail("STAMP_EXPIRED");
    }
    return fail("STAMP_REJECT_FAILED");
  }
}

async function findOrCreateDemoRedemptionCode(
  merchantId: string,
  customerCardId: string,
  cycleNumber: number,
  locationId: string | null,
): Promise<string | null> {
  const admin = createServiceRoleClient();

  const { data: existingPending, error: pendingError } = await admin
    .from("redemptions")
    .select("redemption_code")
    .eq("merchant_id", merchantId)
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (pendingError) throw pendingError;
  if (existingPending?.redemption_code) {
    return existingPending.redemption_code;
  }

  for (let index = 1; index <= 99; index += 1) {
    const code = `DEMO${String(index).padStart(2, "0")}`;
    const { data: taken, error: takenError } = await admin
      .from("redemptions")
      .select("id")
      .eq("redemption_code", code)
      .maybeSingle();

    if (takenError) throw takenError;
    if (taken) continue;

    await createPendingRedemption({
      merchantId,
      customerCardId,
      redemptionCode: code,
      cycleNumber,
      locationId,
    });
    return code;
  }

  return null;
}

async function getDemoCustomerCardId(
  merchantId: string,
  loyaltyCardId: string,
  phone: string,
): Promise<string | null> {
  const admin = createServiceRoleClient();
  const { data: customer, error: customerError } = await admin
    .from("customers")
    .select("id")
    .eq("phone", phone)
    .maybeSingle();

  if (customerError) throw customerError;
  if (!customer) return null;

  const { data: card, error: cardError } = await admin
    .from("customer_cards")
    .select("id")
    .eq("merchant_id", merchantId)
    .eq("loyalty_card_id", loyaltyCardId)
    .eq("customer_id", customer.id)
    .maybeSingle();

  if (cardError) throw cardError;
  return card?.id ?? null;
}

export async function seedDemoStampQueueAction(
  merchantId: string,
): Promise<ActionResult & { code?: string | null }> {
  if (!isDevEnvironment) {
    return fail("DEMO_DEV_ONLY");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return fail("UNAUTHORIZED");

  const denied = await assertActiveMerchantOwner(user.id, merchantId);
  if (denied) return denied;

  const loyaltyCard = await getLoyaltyCardByMerchantId(merchantId);
  if (!loyaltyCard) {
    return fail("DEMO_LOYALTY_CARD_REQUIRED");
  }

  const locations = await getLocationsByMerchantId(merchantId);
  const locationId =
    locations.find((l) => l.is_active && l.is_primary)?.id ??
    locations.find((l) => l.is_active)?.id ??
    null;

  const admin = createServiceRoleClient();
  const demoProfiles = [
    { name: "Sam Demo", phone: SAM_DEMO_PHONE, seedStamps: 0 },
    { name: "Alex Demo", phone: ALEX_DEMO_PHONE, seedStamps: 0 },
  ];

  let redemptionCode: string | null = null;
  let redemptionWarning: ActionError | undefined;

  try {
    for (const profile of demoProfiles) {
      let customerId: string;

      const existing = await admin
        .from("customers")
        .select("id")
        .eq("phone", profile.phone)
        .maybeSingle();

      if (existing.error) throw existing.error;

      if (existing.data) {
        customerId = existing.data.id;
      } else {
        const inserted = await admin
          .from("customers")
          .insert({
            phone: profile.phone,
            name: profile.name,
            country_code: "NP",
            status: "active",
          })
          .select("id")
          .single();
        if (inserted.error) throw inserted.error;
        customerId = inserted.data.id;
      }

      let customerCardId: string;
      const existingCard = await admin
        .from("customer_cards")
        .select("id")
        .eq("customer_id", customerId)
        .eq("loyalty_card_id", loyaltyCard.id)
        .maybeSingle();

      if (existingCard.error) throw existingCard.error;

      if (existingCard.data) {
        customerCardId = existingCard.data.id;
      } else {
        const insertedCard = await admin
          .from("customer_cards")
          .insert({
            customer_id: customerId,
            loyalty_card_id: loyaltyCard.id,
            merchant_id: merchantId,
            current_stamps: 0,
            reward_status: "collecting",
          })
          .select("id")
          .single();
        if (insertedCard.error) throw insertedCard.error;
        customerCardId = insertedCard.data.id;
      }

      await createPendingStampSession({
        merchantId,
        customerCardId,
        locationId,
      });
    }

    const samCardId = await getDemoCustomerCardId(
      merchantId,
      loyaltyCard.id,
      SAM_DEMO_PHONE,
    );

    if (samCardId) {
      const { data: samCard, error: samCardError } = await admin
        .from("customer_cards")
        .select("id, cycle_number")
        .eq("id", samCardId)
        .single();

      if (samCardError) throw samCardError;

      await admin
        .from("customer_cards")
        .update({
          current_stamps: loyaltyCard.stamp_target,
          reward_status: "pending_otp",
        })
        .eq("id", samCardId);

      try {
        redemptionCode = await findOrCreateDemoRedemptionCode(
          merchantId,
          samCard.id,
          samCard.cycle_number,
          locationId,
        );
        if (!redemptionCode) {
          redemptionWarning = fail("DEMO_NO_REDEMPTION_CODE").error;
        }
      } catch (err) {
        logActionFailure("seedDemoStampQueue.redemption", err);
        redemptionWarning = fail("DEMO_REDEMPTION_CREATE_FAILED").error;
      }
    }
  } catch (err) {
    logActionFailure("seedDemoStampQueue", err);
    return fail("DEMO_SEED_FAILED");
  }

  revalidateMerchantOpsPaths();
  return {
    code: redemptionCode,
    warning: redemptionWarning,
  };
}
