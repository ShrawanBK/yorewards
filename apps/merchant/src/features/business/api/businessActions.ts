"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@repo/supabase/server";
import { createServiceRoleClient } from "@repo/supabase/service-role";
import { switchActiveMerchant } from "@repo/supabase/queries/merchants";
import { createDefaultLocationForMerchant } from "@repo/supabase/queries/locations";
import type { CountryCode } from "@repo/supabase/types";
import type { ActionResult } from "@/shared/types/action-result";
import { isValidMerchantPhone } from "@/features/business/utils/phoneSchema";

export async function addBusinessAction(
  formData: FormData,
): Promise<ActionResult | void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const email = String(formData.get("email") ?? user.email ?? "");
  const country = String(formData.get("country") ?? "NP") as CountryCode;
  const phone = String(formData.get("phone") ?? "").trim() || null;

  if (!isValidMerchantPhone(phone ?? undefined, country)) {
    return { error: "Invalid phone number for the selected country." };
  }

  const admin = createServiceRoleClient();

  const { data: merchant, error: merchantError } = await admin
    .from("merchants")
    .insert({
      user_id: user.id,
      business_name: String(formData.get("business_name") ?? ""),
      category: String(formData.get("category") ?? ""),
      country,
      email,
      phone,
      status: "pending",
    })
    .select("*")
    .single();

  if (merchantError) return { error: merchantError.message };

  await createDefaultLocationForMerchant(
    merchant.id,
    String(formData.get("business_name") ?? ""),
  );

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
  if (!user) return { error: "Unauthorized" };

  const merchant = await switchActiveMerchant(user.id, merchantId);
  if (!merchant) return { error: "Business not found" };

  revalidatePath("/merchant/dashboard");
  revalidatePath("/merchant/business");
  revalidatePath("/merchant/loyalty-card");
  return {};
}
