"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@repo/supabase/server";
import {
  activateStarterTrial,
  getMerchantSubscription,
  listMerchantInvoices,
  recordTermsAccepted,
} from "@repo/supabase/queries/merchant-subscriptions";
import { fail, logActionFailure } from "@repo/utils/action-error";
import { PLAN_PRICES_NPR } from "@repo/utils/plan-limits";
import type { ActionResult } from "@/shared/types/action-result";
import { assertMerchantAccess } from "@/shared/utils/merchant-access";

export async function fetchBillingDataAction(merchantId: string): Promise<
  ActionResult<{
    subscription: Awaited<ReturnType<typeof getMerchantSubscription>>;
    invoices: Awaited<ReturnType<typeof listMerchantInvoices>>;
    starterPriceNpr: number;
  }>
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return fail("UNAUTHORIZED");

  const access = await assertMerchantAccess(user.id, merchantId, "owner");
  if ("error" in access) return access;

  try {
    const [subscription, invoices] = await Promise.all([
      getMerchantSubscription(merchantId),
      listMerchantInvoices(merchantId),
    ]);
    return {
      subscription,
      invoices,
      starterPriceNpr: PLAN_PRICES_NPR.starter,
    };
  } catch (err) {
    logActionFailure("fetchBillingData", err);
    return fail("UNKNOWN");
  }
}

export async function acceptBillingTermsAction(
  merchantId: string,
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return fail("UNAUTHORIZED");

  const access = await assertMerchantAccess(user.id, merchantId, "owner");
  if ("error" in access) return access;

  try {
    await recordTermsAccepted(merchantId);
    revalidatePath("/merchant/billing");
    return {};
  } catch (err) {
    logActionFailure("acceptBillingTerms", err);
    return fail("UNKNOWN");
  }
}

export async function startEsewaCheckoutAction(
  merchantId: string,
  termsAccepted: boolean,
): Promise<ActionResult<{ checkoutUrl: string }>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return fail("UNAUTHORIZED");

  const access = await assertMerchantAccess(user.id, merchantId, "owner");
  if ("error" in access) return access;

  if (!termsAccepted) return fail("BILLING_TERMS_REQUIRED");

  try {
    const subscription = await getMerchantSubscription(merchantId);
    if (
      subscription?.status === "trialing" ||
      subscription?.status === "active"
    ) {
      return fail("BILLING_TRIAL_ALREADY_USED");
    }

    await recordTermsAccepted(merchantId);

    const merchantUrl =
      process.env.NEXT_PUBLIC_MERCHANT_URL ?? "http://localhost:3001";
    const reference = `yr-${merchantId.slice(0, 8)}-${Date.now()}`;
    const checkoutUrl = `${merchantUrl}/api/billing/esewa/checkout?merchantId=${encodeURIComponent(merchantId)}&ref=${encodeURIComponent(reference)}`;

    return { checkoutUrl };
  } catch (err) {
    logActionFailure("startEsewaCheckout", err);
    return fail("BILLING_CHECKOUT_FAILED");
  }
}

export async function completeEsewaSandboxCheckout(input: {
  merchantId: string;
  providerReference: string;
}): Promise<ActionResult> {
  try {
    const subscription = await getMerchantSubscription(input.merchantId);
    const termsAcceptedAt =
      subscription?.terms_accepted_at ?? new Date().toISOString();

    await activateStarterTrial({
      merchantId: input.merchantId,
      provider: "esewa",
      providerReference: input.providerReference,
      termsAcceptedAt,
    });

    revalidatePath("/merchant/billing");
    revalidatePath("/merchant/customers");
    return {};
  } catch (err) {
    logActionFailure("completeEsewaSandboxCheckout", err);
    return fail("BILLING_CHECKOUT_FAILED");
  }
}
