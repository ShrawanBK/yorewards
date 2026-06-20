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
import type { ActionResult } from "@/shared/types/action-result";
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
): Promise<ActionResult & { merchant?: null }> {
  const merchants = await getMerchantsByUserId(userId);
  const merchant = merchants.find((m) => m.id === merchantId);
  if (!merchant) return { error: "Business not found" };
  if (merchant.status !== "active") {
    return {
      error: "Your business must be approved before using the stamp queue.",
    };
  }
  return { error: undefined };
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
  if (!user) return { error: "Unauthorized" };

  const denied = await assertActiveMerchantOwner(user.id, merchantId);
  if (denied.error) return denied;

  try {
    const items = await getPendingStampSessions(merchantId);
    return { items };
  } catch {
    return { error: "Could not load stamp queue." };
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
  if (!user) return { error: "Unauthorized" };

  const denied = await assertActiveMerchantOwner(user.id, merchantId);
  if (denied.error) return denied;

  try {
    const session = await createServiceRoleClient()
      .from("stamp_sessions")
      .select("id, merchant_id, status")
      .eq("id", sessionId)
      .maybeSingle();

    if (session.error) throw session.error;
    if (!session.data || session.data.merchant_id !== merchantId) {
      return { error: "Stamp request not found." };
    }

    await approveStampSession(sessionId);
    revalidateMerchantOpsPaths();
    return {};
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Could not approve stamp.";
    if (message.includes("expired")) {
      await expireStalePendingSessions(merchantId);
      return { error: "This stamp request has expired." };
    }
    if (message.includes("not pending")) {
      return { error: "This stamp request is no longer pending." };
    }
    return { error: "Could not approve stamp." };
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
  if (!user) return { error: "Unauthorized" };

  const denied = await assertActiveMerchantOwner(user.id, merchantId);
  if (denied.error) return denied;

  if (reason && reason.trim().length > 120) {
    return { error: "Rejection reason is too long (max 120 characters)." };
  }

  try {
    const session = await createServiceRoleClient()
      .from("stamp_sessions")
      .select("id, merchant_id")
      .eq("id", sessionId)
      .maybeSingle();

    if (session.error) throw session.error;
    if (!session.data || session.data.merchant_id !== merchantId) {
      return { error: "Stamp request not found." };
    }

    await rejectStampSession(sessionId, reason);
    revalidateMerchantOpsPaths();
    return {};
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Could not reject stamp.";
    if (message.includes("expired")) {
      return { error: "This stamp request has expired." };
    }
    return { error: "Could not reject stamp." };
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
): Promise<ActionResult & { code?: string | null; warning?: string }> {
  if (!isDevEnvironment) {
    return { error: "Demo data is only available in development." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const denied = await assertActiveMerchantOwner(user.id, merchantId);
  if (denied.error) return denied;

  const loyaltyCard = await getLoyaltyCardByMerchantId(merchantId);
  if (!loyaltyCard) {
    return { error: "Configure your loyalty card before loading demo data." };
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
  let redemptionWarning: string | undefined;

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
          redemptionWarning =
            "Stamp queue loaded, but no demo redemption code is available (DEMO01–DEMO99 all used).";
        }
      } catch {
        redemptionWarning =
          "Stamp queue loaded, but the demo redemption code could not be created.";
      }
    }
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Could not create demo data.";
    return { error: message };
  }

  revalidateMerchantOpsPaths();
  return {
    code: redemptionCode,
    warning: redemptionWarning,
  };
}
