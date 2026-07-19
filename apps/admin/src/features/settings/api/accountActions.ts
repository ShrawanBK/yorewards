"use server";

import { createClient } from "@repo/supabase/server";
import { fail, logActionFailure } from "@repo/utils/action-error";
import type { ActionResult } from "@repo/utils/action-error";

export async function changeAdminPasswordAction(
  formData: FormData,
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return fail("UNAUTHORIZED");

  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirmPassword") ?? "");
  if (password.length < 8) return fail("PASSWORD_UPDATE_FAILED");
  if (password !== confirm) return fail("PASSWORD_CONFIRM_MISMATCH");

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    logActionFailure("changeAdminPassword", error);
    return fail("PASSWORD_UPDATE_FAILED");
  }
  return {};
}

export async function changeAdminEmailAction(
  formData: FormData,
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return fail("UNAUTHORIZED");

  const email = String(formData.get("email") ?? "").trim();
  if (!email.includes("@")) return fail("EMAIL_INVALID");

  const { error } = await supabase.auth.updateUser({ email });
  if (error) {
    logActionFailure("changeAdminEmail", error);
    return fail("EMAIL_UPDATE_FAILED");
  }
  return {};
}
