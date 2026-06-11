"use server";

import { redirect } from "next/navigation";
import { createClient } from "@repo/supabase/server";
import { createServiceRoleClient } from "@repo/supabase/service-role";
import {
  clearActiveMerchantForUser,
  getMerchantsByUserId,
} from "@repo/supabase/queries/merchants";
import type { ActionResult } from "@/shared/types/action-result";

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  await clearActiveMerchantForUser();
  redirect("/merchant/login");
}

export async function signInMerchantAction(
  formData: FormData,
): Promise<ActionResult | void> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in failed" };

  const merchants = await getMerchantsByUserId(user.id);

  const redirectPath =
    merchants.length === 0 ? "/merchant/add-business" : "/merchant/dashboard";

  redirect(redirectPath);
}

export async function signUpMerchantAction(
  formData: FormData,
): Promise<ActionResult | void> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
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

  const supabase = await createClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (signInError) return { error: signInError.message };

  redirect("/merchant/add-business");
}
