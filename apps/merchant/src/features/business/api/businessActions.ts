"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@repo/supabase/server";
import { createServiceRoleClient } from "@repo/supabase/service-role";
import { switchActiveMerchant } from "@repo/supabase/queries/merchants";
import { createOwnerStaffRow } from "@repo/supabase/queries/merchant-staff";
import { ensureMerchantSubscription } from "@repo/supabase/queries/merchant-subscriptions";
import { createDefaultLocationForMerchant } from "@repo/supabase/queries/locations";
import type { CountryCode } from "@repo/supabase/types";
import { fail, logActionFailure } from "@repo/utils/action-error";
import { sendMerchantApprovedEmail } from "@repo/utils/merchant-email";
import type { ActionResult } from "@/shared/types/action-result";
import { isValidMerchantPhone } from "@/features/business/utils/phoneSchema";
import {
  meetsCredibleOnboardingCriteria,
} from "@/features/business/utils/credibleOnboarding";
import { assertMerchantAccess } from "@/shared/utils/merchant-access";

export async function addBusinessAction(
  formData: FormData,
): Promise<ActionResult | void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return fail("UNAUTHORIZED");

  const email = String(formData.get("email") ?? user.email ?? "");
  const country = String(formData.get("country") ?? "NP") as CountryCode;
  const phone = String(formData.get("phone") ?? "").trim() || null;
  const registrationNumber = String(
    formData.get("registration_number") ?? "",
  ).trim();
  const websiteUrl = String(formData.get("website_url") ?? "").trim();
  const businessAddress = String(formData.get("business_address") ?? "").trim();

  if (!isValidMerchantPhone(phone ?? undefined, country)) {
    return fail("INVALID_PHONE");
  }

  const credible = meetsCredibleOnboardingCriteria({
    registrationNumber,
    websiteUrl,
    businessAddress,
    phone,
  });

  if (!credible) {
    return fail("ONBOARDING_FIELDS_REQUIRED");
  }

  const admin = createServiceRoleClient();
  const now = new Date().toISOString();

  const { data: merchant, error: merchantError } = await admin
    .from("merchants")
    .insert({
      user_id: user.id,
      business_name: String(formData.get("business_name") ?? ""),
      category: String(formData.get("category") ?? ""),
      country,
      email,
      phone,
      registration_number: registrationNumber,
      website_url: websiteUrl,
      business_address: businessAddress,
      status: "active",
      approved_at: now,
      subscription_tier: "free",
      verification_status: "unverified",
    })
    .select("*")
    .single();

  if (merchantError) {
    logActionFailure("addBusiness", merchantError);
    return fail("UNKNOWN");
  }

  await createDefaultLocationForMerchant(
    merchant.id,
    String(formData.get("business_name") ?? ""),
  );

  if (businessAddress) {
    const { data: locations } = await admin
      .from("merchant_locations")
      .select("id")
      .eq("merchant_id", merchant.id)
      .eq("is_primary", true)
      .limit(1);

    const primaryId = locations?.[0]?.id;
    if (primaryId) {
      await admin
        .from("merchant_locations")
        .update({ address: businessAddress })
        .eq("id", primaryId);
    }
  }

  try {
    await createOwnerStaffRow({
      merchantId: merchant.id,
      userId: user.id,
      email,
      displayName: merchant.business_name,
    });
  } catch (err) {
    logActionFailure("createOwnerStaffRow", err);
  }

  try {
    await ensureMerchantSubscription(merchant.id, "free");
  } catch (err) {
    logActionFailure("ensureMerchantSubscription", err);
  }

  try {
    await sendMerchantApprovedEmail({
      to: email,
      businessName: merchant.business_name,
    });
  } catch (err) {
    logActionFailure("sendMerchantApprovedEmail", err);
  }

  await switchActiveMerchant(user.id, merchant.id);

  revalidatePath("/merchant/dashboard");
  revalidatePath("/merchant/business");
  redirect("/merchant/dashboard");
}

export async function switchActiveMerchantAction(
  merchantId: string,
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return fail("UNAUTHORIZED");

  const merchant = await switchActiveMerchant(user.id, merchantId);
  if (!merchant) return fail("BUSINESS_NOT_FOUND");

  revalidatePath("/merchant/dashboard");
  revalidatePath("/merchant/business");
  revalidatePath("/merchant/loyalty-card");
  return {};
}

export async function updateBusinessProfileAction(
  merchantId: string,
  formData: FormData,
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return fail("UNAUTHORIZED");

  const access = await assertMerchantAccess(user.id, merchantId, "owner");
  if ("error" in access) return access;

  const country = String(formData.get("country") ?? access.merchant.country) as CountryCode;
  const phone = String(formData.get("phone") ?? "").trim() || null;
  const registrationNumber = String(
    formData.get("registration_number") ?? "",
  ).trim();
  const websiteUrl = String(formData.get("website_url") ?? "").trim();
  const businessAddress = String(formData.get("business_address") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  const businessName = String(formData.get("business_name") ?? "").trim();

  if (businessName.length < 2) return fail("ONBOARDING_FIELDS_REQUIRED");
  if (category.length < 2) return fail("ONBOARDING_FIELDS_REQUIRED");
  if (!isValidMerchantPhone(phone ?? undefined, country)) {
    return fail("INVALID_PHONE");
  }

  if (
    !meetsCredibleOnboardingCriteria({
      registrationNumber,
      websiteUrl,
      businessAddress,
      phone,
    })
  ) {
    return fail("ONBOARDING_FIELDS_REQUIRED");
  }

  const admin = createServiceRoleClient();

  const { error: updateError } = await admin
    .from("merchants")
    .update({
      business_name: businessName,
      category,
      country,
      phone,
      registration_number: registrationNumber,
      website_url: websiteUrl,
      business_address: businessAddress,
    })
    .eq("id", merchantId);

  if (updateError) {
    logActionFailure("updateBusinessProfile", updateError);
    return fail("MERCHANT_UPDATE_FAILED");
  }

  const { data: primaryLocation } = await admin
    .from("merchant_locations")
    .select("id")
    .eq("merchant_id", merchantId)
    .eq("is_primary", true)
    .maybeSingle();

  if (primaryLocation?.id) {
    await admin
      .from("merchant_locations")
      .update({ address: businessAddress })
      .eq("id", primaryLocation.id);
  }

  revalidatePath("/merchant/dashboard");
  revalidatePath("/merchant/business");
  return {};
}
