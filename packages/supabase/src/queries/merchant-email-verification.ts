import { createClient } from "../server";
import { createServiceRoleClient } from "../service-role";

/**
 * Promote owner merchants from `pending_verification` → `active` once the
 * Supabase auth email is confirmed. Idempotent; safe to call on dashboard load.
 */
export async function syncMerchantEmailVerification(
  userId: string,
): Promise<{ activated: number }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.id !== userId || !user.email_confirmed_at) {
    return { activated: 0 };
  }

  const admin = createServiceRoleClient();
  const now = new Date().toISOString();

  const { data, error } = await admin
    .from("merchants")
    .update({
      status: "active",
      approved_at: now,
      status_reason: null,
    })
    .eq("user_id", userId)
    .eq("status", "pending_verification")
    .select("id, business_name");

  if (error) throw error;

  return { activated: data?.length ?? 0 };
}

export async function isAuthEmailVerified(): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return Boolean(user?.email_confirmed_at);
}

/** Resend Supabase signup confirmation email for the current session user. */
export async function resendAuthEmailVerification(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    throw new Error("UNAUTHORIZED");
  }

  if (user.email_confirmed_at) {
    return;
  }

  const { error } = await supabase.auth.resend({
    type: "signup",
    email: user.email,
  });

  if (error) throw error;
}
