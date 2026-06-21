"use server";

import { redirect } from "next/navigation";
import { createClient } from "@repo/supabase/server";
import {
  fail,
  logActionFailure,
  mapAuthErrorCode,
} from "@repo/utils/action-error";
import type { ActionResult } from "@/shared/types/action-result";
import { isAdminUser } from "@/features/auth/utils/requireAdminAuth";

export async function loginAction(
  formData: FormData,
): Promise<ActionResult | void> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    logActionFailure("adminLogin", error);
    return fail(mapAuthErrorCode(error.message));
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !isAdminUser(user)) {
    await supabase.auth.signOut();
    return fail("FORBIDDEN");
  }

  redirect("/admin/dashboard");
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
