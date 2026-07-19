"use server";

import { redirect } from "next/navigation";
import { createClient } from "@repo/supabase/server";
import {
  createOrCompleteInviteAuthUser,
  isUserAlreadyExistsAuthError,
} from "@repo/supabase/queries/auth-admin";
import {
  clearActiveMerchantForUser,
} from "@repo/supabase/queries/merchants";
import { clearActiveLocationForMerchant } from "@repo/supabase/queries/locations";
import {
  getPendingStaffInvitesForEmail,
  hasPendingStaffInvite,
} from "@repo/supabase/queries/merchant-staff";
import { resendAuthEmailVerification } from "@repo/supabase/queries/merchant-email-verification";
import {
  fail,
  logActionFailure,
  mapAuthErrorCode,
} from "@repo/utils/action-error";
import type { ActionResult } from "@/shared/types/action-result";
import { resolvePostAuthRedirect } from "@/features/auth/api/resolvePostAuthRedirect";

async function signInAndRedirect(
  email: string,
  password: string,
): Promise<ActionResult | void> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    logActionFailure("signInAndRedirect", error);
    const lower = error.message.toLowerCase();
    if (
      lower.includes("email not confirmed") ||
      lower.includes("email_not_confirmed") ||
      lower.includes("confirm your email")
    ) {
      redirect(
        `/merchant/verify-email?email=${encodeURIComponent(email)}`,
      );
    }
    return fail(mapAuthErrorCode(error.message));
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return fail("SIGN_IN_FAILED");

  if (!user.email_confirmed_at) {
    redirect(
      `/merchant/verify-email?email=${encodeURIComponent(email)}`,
    );
  }

  const redirectPath = await resolvePostAuthRedirect(
    user.id,
    user.email ?? email,
  );
  redirect(redirectPath);
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut({ scope: "local" });
  await clearActiveMerchantForUser();
  await clearActiveLocationForMerchant();
  redirect("/merchant/login");
}

export async function signInMerchantAction(
  formData: FormData,
): Promise<ActionResult | void> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  return signInAndRedirect(email, password);
}

export async function signUpMerchantAction(
  formData: FormData,
): Promise<ActionResult | void> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const inviteMode = formData.get("invite_mode") === "true";

  if (inviteMode && !(await hasPendingStaffInvite(email))) {
    return fail("STAFF_INVITE_NOT_FOUND");
  }

  let userId: string;

  if (inviteMode) {
    const supabase = await createClient();
    const { data: existingSignIn, error: existingSignInError } =
      await supabase.auth.signInWithPassword({ email, password });

    if (!existingSignInError && existingSignIn.user) {
      const redirectPath = await resolvePostAuthRedirect(
        existingSignIn.user.id,
        email,
      );
      redirect(redirectPath);
    }

    try {
      const result = await createOrCompleteInviteAuthUser({ email, password });
      userId = result.userId;
    } catch (err) {
      logActionFailure("signUpMerchant.inviteAuth", err);
      const message = err instanceof Error ? err.message : "";
      return fail(mapAuthErrorCode(message));
    }
  } else {
    const supabaseForSignUp = await createClient();
    const merchantAppUrl =
      process.env.NEXT_PUBLIC_MERCHANT_URL ?? "http://localhost:3001";
    const { data: authData, error: authError } =
      await supabaseForSignUp.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${merchantAppUrl}/merchant/login`,
        },
      });

    if (authError) {
      logActionFailure("signUpMerchant.signUp", authError);
      if (isUserAlreadyExistsAuthError(authError)) {
        return fail("SIGN_UP_FAILED");
      }
      return fail(mapAuthErrorCode(authError.message));
    }

    if (!authData.user) return fail("SIGN_UP_FAILED");
    userId = authData.user.id;

    // Confirmations enabled → no session until email verified.
    if (!authData.session || !authData.user.email_confirmed_at) {
      redirect(
        `/merchant/verify-email?email=${encodeURIComponent(email)}`,
      );
    }
  }

  const supabase = await createClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (signInError) {
    logActionFailure("signUpMerchant.signIn", signInError);
    const lower = signInError.message.toLowerCase();
    if (
      !inviteMode &&
      (lower.includes("email not confirmed") ||
        lower.includes("email_not_confirmed") ||
        lower.includes("confirm"))
    ) {
      redirect(
        `/merchant/verify-email?email=${encodeURIComponent(email)}`,
      );
    }
    if (inviteMode) {
      return fail("SIGN_UP_FAILED");
    }
    return fail(mapAuthErrorCode(signInError.message));
  }

  const redirectPath = await resolvePostAuthRedirect(userId, email);
  redirect(redirectPath);
}

export async function acceptStaffInviteSignInAction(
  formData: FormData,
): Promise<ActionResult | void> {
  const invitedEmail = String(formData.get("invited_email") ?? "")
    .trim()
    .toLowerCase();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  if (invitedEmail && email !== invitedEmail) {
    return fail("STAFF_INVITE_EMAIL_MISMATCH");
  }

  return signInMerchantAction(formData);
}

export async function acceptStaffInviteSignUpAction(
  formData: FormData,
): Promise<ActionResult | void> {
  const invitedEmail = String(formData.get("invited_email") ?? "")
    .trim()
    .toLowerCase();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  if (!invitedEmail || !(await hasPendingStaffInvite(invitedEmail))) {
    return fail("STAFF_INVITE_NOT_FOUND");
  }

  if (email !== invitedEmail) {
    return fail("STAFF_INVITE_EMAIL_MISMATCH");
  }

  formData.set("invite_mode", "true");
  return signUpMerchantAction(formData);
}

export async function fetchPendingInviteSummaryAction(
  email: string,
): Promise<
  ActionResult<{
    invites: Array<{
      role: string;
      displayName: string | null;
    }>;
  }>
> {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return fail("EMAIL_INVALID");

  try {
    const invites = await getPendingStaffInvitesForEmail(normalized);
    if (invites.length === 0) return fail("STAFF_INVITE_NOT_FOUND");

    return {
      invites: invites.map((invite) => ({
        role: invite.role,
        displayName: invite.display_name,
      })),
    };
  } catch (err) {
    logActionFailure("fetchPendingInviteSummary", err);
    return fail("UNKNOWN");
  }
}

export async function getPostAuthRedirectForSession(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return null;

  return resolvePostAuthRedirect(user.id, user.email);
}

/** Resend signup confirmation email (logged-in or email from verify page). */
export async function resendMerchantEmailVerificationAction(
  emailFromQuery?: string,
): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user?.email) {
      await resendAuthEmailVerification();
      return {};
    }

    const email = emailFromQuery?.trim().toLowerCase();
    if (!email) return fail("EMAIL_INVALID");

    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
    });
    if (error) {
      logActionFailure("resendMerchantEmailVerification", error);
      return fail("EMAIL_VERIFICATION_RESEND_FAILED");
    }
    return {};
  } catch (err) {
    logActionFailure("resendMerchantEmailVerification", err);
    return fail("EMAIL_VERIFICATION_RESEND_FAILED");
  }
}
