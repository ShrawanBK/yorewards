"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@repo/supabase/server";
import { createServiceRoleClient } from "@repo/supabase/service-role";
import { switchActiveMerchant } from "@repo/supabase/queries/merchants";
import { createOwnerStaffRow } from "@repo/supabase/queries/merchant-staff";
import { createDefaultLocationForMerchant } from "@repo/supabase/queries/locations";
import type { CountryCode } from "@repo/supabase/types";
import { fail, logActionFailure } from "@repo/utils/action-error";
import { sendMerchantApprovedEmail } from "@repo/utils/merchant-email";
import type { ActionResult } from "@/shared/types/action-result";
import { isValidMerchantPhone } from "@/features/business/utils/phoneSchema";

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

  if (!isValidMerchantPhone(phone ?? undefined, country)) {
    return fail("INVALID_PHONE");
  }

  const admin = createServiceRoleClient();
  const isFreeTier = true;

  const { data: merchant, error: merchantError } = await admin
    .from("merchants")
    .insert({
      user_id: user.id,
      business_name: String(formData.get("business_name") ?? ""),
      category: String(formData.get("category") ?? ""),
      country,
      email,
      phone,
      status: isFreeTier ? "active" : "pending",
      approved_at: isFreeTier ? new Date().toISOString() : null,
      subscription_tier: "free",
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

  if (isFreeTier) {
    try {
      await sendMerchantApprovedEmail({
        to: email,
        businessName: merchant.business_name,
      });
    } catch (err) {
      logActionFailure("sendMerchantApprovedEmail", err);
    }
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
