"use server";

import {
  getCustomerById,
  getCustomerIdFromSession,
} from "@repo/supabase/queries/customers";
import { getOrCreateCustomerCard } from "@repo/supabase/queries/customer-wallet";
import {
  createPendingStampSession,
  findActivePendingSessionForCard,
} from "@repo/supabase/queries/stamps";
import { createServiceRoleClient } from "@repo/supabase/service-role";
import { fail, logActionFailure } from "@repo/utils/action-error";
import type { ActionResult } from "@/shared/types/action-result";
import type { LoyaltyQrPayload } from "@/features/scan/utils/parseLoyaltyQr";
import { parseLoyaltyQrParams } from "@/features/scan/utils/parseLoyaltyQr";

function isValidPayload(payload: LoyaltyQrPayload): boolean {
  return Boolean(parseLoyaltyQrParams(
    payload.merchantId,
    payload.loyaltyCardId,
    payload.locationId,
  ));
}

export async function submitStampScanAction(
  payload: LoyaltyQrPayload,
): Promise<
  ActionResult<{ sessionId: string } | { redirectTo: string }>
> {
  const customerId = await getCustomerIdFromSession();
  if (!customerId) return fail("UNAUTHORIZED");

  if (!isValidPayload(payload)) {
    return fail("SCAN_INVALID_QR");
  }

  try {
    const customer = await getCustomerById(customerId);
    if (!customer) return fail("CUSTOMER_NOT_FOUND");
    if (customer.status === "suspended") {
      const reason = customer.status_reason?.trim();
      if (reason) {
        return fail("CUSTOMER_SUSPENDED_REASON", { reason });
      }
      return fail("CUSTOMER_SUSPENDED");
    }

    const supabase = createServiceRoleClient();

    const { data: merchant, error: merchantError } = await supabase
      .from("merchants")
      .select("status")
      .eq("id", payload.merchantId)
      .maybeSingle();

    if (merchantError) throw merchantError;
    if (!merchant || merchant.status !== "active") {
      return fail("SCAN_MERCHANT_NOT_ACTIVE");
    }

    const { data: loyaltyCard, error: cardError } = await supabase
      .from("loyalty_cards")
      .select("id, merchant_id, is_active")
      .eq("id", payload.loyaltyCardId)
      .maybeSingle();

    if (cardError) throw cardError;
    if (
      !loyaltyCard ||
      loyaltyCard.merchant_id !== payload.merchantId ||
      !loyaltyCard.is_active
    ) {
      return fail("SCAN_LOYALTY_CARD_INACTIVE");
    }

    const { data: location, error: locationError } = await supabase
      .from("merchant_locations")
      .select("id, merchant_id, is_active")
      .eq("id", payload.locationId)
      .maybeSingle();

    if (locationError) throw locationError;
    if (
      !location ||
      location.merchant_id !== payload.merchantId ||
      !location.is_active
    ) {
      return fail("SCAN_LOCATION_INVALID");
    }

    const customerCardId = await getOrCreateCustomerCard(
      customerId,
      payload.loyaltyCardId,
      payload.merchantId,
    );

    const { data: customerCard, error: customerCardError } = await supabase
      .from("customer_cards")
      .select("id, reward_status")
      .eq("id", customerCardId)
      .single();

    if (customerCardError) throw customerCardError;

    if (
      customerCard.reward_status === "pending_otp" ||
      customerCard.reward_status === "unlocked"
    ) {
      return { redirectTo: `/reward/${customerCardId}` };
    }

    const existingSessionId =
      await findActivePendingSessionForCard(customerCardId);
    if (existingSessionId) {
      return { sessionId: existingSessionId };
    }

    const sessionId = await createPendingStampSession({
      merchantId: payload.merchantId,
      customerCardId,
      locationId: payload.locationId,
    });

    return { sessionId };
  } catch (err) {
    logActionFailure("submitStampScan", err);
    return fail("SCAN_SESSION_FAILED");
  }
}
