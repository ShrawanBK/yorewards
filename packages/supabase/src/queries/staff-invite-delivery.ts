import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { sendStaffInviteEmail } from "@repo/utils/merchant-email";
import { createServiceRoleClient } from "../service-role";
import { isUserAlreadyExistsAuthError } from "./auth-admin";

type DeliverStaffInviteInput = {
  email: string;
  inviteUrl: string;
  businessName: string;
  role: "cashier" | "manager";
  displayName?: string | null;
};

/**
 * Sends a staff invite email. Primary path: Supabase Auth (same as before Day 6).
 * Falls back to Resend when configured, then to a server log with the accept URL.
 */
export async function deliverStaffInviteEmail(
  input: DeliverStaffInviteInput,
): Promise<{ emailSent: boolean }> {
  const normalizedEmail = input.email.trim().toLowerCase();
  const admin = createServiceRoleClient();

  const { error: inviteError } = await admin.auth.admin.inviteUserByEmail(
    normalizedEmail,
    { redirectTo: input.inviteUrl },
  );

  if (!inviteError) {
    return { emailSent: true };
  }

  if (isUserAlreadyExistsAuthError(inviteError)) {
    const otpSent = await sendSupabaseMagicLinkEmail(
      normalizedEmail,
      input.inviteUrl,
    );
    if (otpSent) {
      return { emailSent: true };
    }
  } else {
    console.error("[email:staff-invite] Supabase invite failed", inviteError);
  }

  const resendResult = await sendStaffInviteEmail({
    to: normalizedEmail,
    businessName: input.businessName,
    role: input.role,
    displayName: input.displayName,
    inviteUrl: input.inviteUrl,
  });

  if (resendResult.sent) {
    return { emailSent: true };
  }

  if (resendResult.reason === "provider_error") {
    throw new Error(resendResult.message);
  }

  console.info("[email:staff-invite] not sent — share accept link manually", {
    to: normalizedEmail,
    inviteUrl: input.inviteUrl,
  });
  return { emailSent: false };
}

async function sendSupabaseMagicLinkEmail(
  email: string,
  redirectTo: string,
): Promise<boolean> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return false;

  const anon = createSupabaseClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { error } = await anon.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: redirectTo },
  });

  if (error) {
    console.error("[email:staff-invite] Supabase magic link failed", error);
    return false;
  }

  return true;
}
