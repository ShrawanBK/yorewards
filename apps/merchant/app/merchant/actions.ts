"use server";

import { redirect } from "next/navigation";
import { createClient } from "@repo/supabase/server";
import { createServiceRoleClient } from "@repo/supabase/service-role";
import { getMerchantByUserId } from "@repo/supabase/queries/merchants";
import type { CountryCode } from "@repo/supabase/types";
import { revalidatePath } from "next/cache";

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/merchant/login");
}

export async function signInMerchantAction(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in failed" };

  const merchant = await getMerchantByUserId(user.id);
  if (!merchant) return { error: "No merchant account for this email." };

  redirect("/merchant/dashboard");
}

export async function signUpMerchantAction(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const country = String(formData.get("country") ?? "NP") as CountryCode;
  const admin = createServiceRoleClient();

  const { data: authData, error: authError } =
    await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

  if (authError) {
    if (authError.message.toLowerCase().includes("already")) {
      return {
        error: "An account with this email already exists. Sign in instead.",
      };
    }
    return { error: authError.message };
  }

  if (!authData.user) return { error: "Sign up failed" };

  const { error: merchantError } = await admin.from("merchants").insert({
    user_id: authData.user.id,
    business_name: String(formData.get("business_name") ?? ""),
    category: String(formData.get("category") ?? ""),
    country,
    email,
    phone: String(formData.get("phone") ?? "") || null,
    status: "pending",
  });

  if (merchantError) {
    await admin.auth.admin.deleteUser(authData.user.id);
    return { error: merchantError.message };
  }

  const supabase = await createClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (signInError) return { error: signInError.message };

  revalidatePath("/merchant/dashboard");
  redirect("/merchant/dashboard");
}
