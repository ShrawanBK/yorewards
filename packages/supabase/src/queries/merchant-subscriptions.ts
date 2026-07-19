import { createServiceRoleClient } from "../service-role";
import type { SubscriptionTier } from "../types";
import { TRIAL_DAYS } from "@repo/utils/plan-limits";

export type SubscriptionStatus =
  | "free"
  | "trialing"
  | "active"
  | "past_due"
  | "canceled";

export type MerchantSubscriptionRow = {
  id: string;
  merchant_id: string;
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  trial_ends_at: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  payment_provider: "esewa" | "khalti" | null;
  provider_customer_id: string | null;
  terms_accepted_at: string | null;
  created_at: string;
  updated_at: string;
};

export type MerchantInvoiceRow = {
  id: string;
  merchant_id: string;
  subscription_id: string | null;
  amount_npr: number;
  tier: SubscriptionTier;
  status: "pending" | "paid" | "failed" | "refunded";
  provider: "esewa" | "khalti" | null;
  provider_reference: string | null;
  invoice_period_start: string | null;
  invoice_period_end: string | null;
  created_at: string;
};

export async function ensureMerchantSubscription(
  merchantId: string,
  tier: SubscriptionTier = "free",
): Promise<void> {
  const supabase = createServiceRoleClient();
  const { error } = await supabase.from("merchant_subscriptions").upsert(
    {
      merchant_id: merchantId,
      tier,
      status: "free",
      updated_at: new Date().toISOString(),
    },
    { onConflict: "merchant_id", ignoreDuplicates: true },
  );
  if (error) throw error;
}

export async function getMerchantSubscription(
  merchantId: string,
): Promise<MerchantSubscriptionRow | null> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("merchant_subscriptions")
    .select("*")
    .eq("merchant_id", merchantId)
    .maybeSingle();

  if (error) throw error;
  return (data as MerchantSubscriptionRow | null) ?? null;
}

export async function listMerchantInvoices(
  merchantId: string,
  limit = 12,
): Promise<MerchantInvoiceRow[]> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("merchant_invoices")
    .select("*")
    .eq("merchant_id", merchantId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as MerchantInvoiceRow[];
}

export async function activateStarterTrial(input: {
  merchantId: string;
  provider: "esewa" | "khalti";
  providerReference: string;
  termsAcceptedAt: string;
}): Promise<MerchantSubscriptionRow> {
  const supabase = createServiceRoleClient();
  const now = new Date();
  const trialEnds = new Date(now);
  trialEnds.setDate(trialEnds.getDate() + TRIAL_DAYS);

  const periodEnd = trialEnds.toISOString();

  const { data: subscription, error: subError } = await supabase
    .from("merchant_subscriptions")
    .upsert(
      {
        merchant_id: input.merchantId,
        tier: "starter",
        status: "trialing",
        trial_ends_at: periodEnd,
        current_period_start: now.toISOString(),
        current_period_end: periodEnd,
        payment_provider: input.provider,
        provider_customer_id: input.providerReference,
        terms_accepted_at: input.termsAcceptedAt,
        updated_at: now.toISOString(),
      },
      { onConflict: "merchant_id" },
    )
    .select("*")
    .single();

  if (subError) throw subError;

  const { error: merchantError } = await supabase
    .from("merchants")
    .update({ subscription_tier: "starter" })
    .eq("id", input.merchantId);

  if (merchantError) throw merchantError;

  const { error: invoiceError } = await supabase.from("merchant_invoices").insert({
    merchant_id: input.merchantId,
    subscription_id: subscription.id,
    amount_npr: 0,
    tier: "starter",
    status: "paid",
    provider: input.provider,
    provider_reference: input.providerReference,
    invoice_period_start: now.toISOString(),
    invoice_period_end: periodEnd,
  });

  if (invoiceError) throw invoiceError;

  return subscription as MerchantSubscriptionRow;
}

export async function recordTermsAccepted(
  merchantId: string,
): Promise<void> {
  const supabase = createServiceRoleClient();
  const { error } = await supabase
    .from("merchant_subscriptions")
    .update({
      terms_accepted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("merchant_id", merchantId);

  if (error) throw error;
}

export async function adminSetMerchantTier(input: {
  merchantId: string;
  tier: SubscriptionTier;
}): Promise<MerchantSubscriptionRow> {
  const supabase = createServiceRoleClient();
  const now = new Date().toISOString();

  await ensureMerchantSubscription(input.merchantId, input.tier);

  const status =
    input.tier === "free" ? "free" : ("active" as SubscriptionStatus);

  const { data, error } = await supabase
    .from("merchant_subscriptions")
    .update({
      tier: input.tier,
      status,
      updated_at: now,
    })
    .eq("merchant_id", input.merchantId)
    .select("*")
    .single();

  if (error) throw error;

  const { error: merchantError } = await supabase
    .from("merchants")
    .update({ subscription_tier: input.tier })
    .eq("id", input.merchantId);

  if (merchantError) throw merchantError;

  return data as MerchantSubscriptionRow;
}

export async function adminExtendMerchantTrial(input: {
  merchantId: string;
  extraDays: number;
}): Promise<MerchantSubscriptionRow> {
  if (!Number.isFinite(input.extraDays) || input.extraDays < 1 || input.extraDays > 90) {
    throw new Error("TRIAL_EXTEND_DAYS_INVALID");
  }

  const supabase = createServiceRoleClient();
  const existing = await getMerchantSubscription(input.merchantId);
  if (!existing) {
    throw new Error("SUBSCRIPTION_NOT_FOUND");
  }

  const base = existing.trial_ends_at
    ? new Date(existing.trial_ends_at)
    : new Date();
  if (base.getTime() < Date.now()) {
    base.setTime(Date.now());
  }
  base.setDate(base.getDate() + input.extraDays);

  const trialEndsAt = base.toISOString();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("merchant_subscriptions")
    .update({
      status: "trialing",
      trial_ends_at: trialEndsAt,
      current_period_end: trialEndsAt,
      updated_at: now,
    })
    .eq("merchant_id", input.merchantId)
    .select("*")
    .single();

  if (error) throw error;
  return data as MerchantSubscriptionRow;
}
