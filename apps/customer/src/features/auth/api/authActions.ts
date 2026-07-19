"use server";

import { redirect } from "next/navigation";
import { detectCountry } from "@repo/utils/phone";
import { createClient } from "@repo/supabase/server";
import {
  findCustomerByPhone,
  establishCustomerSession,
  getCustomerById,
  getCustomerIdFromSession,
} from "@repo/supabase/queries/customers";
import {
  sendSignupOtp,
  verifySignupOtp,
} from "@repo/supabase/queries/signup-otp";
import { createServiceRoleClient } from "@repo/supabase/service-role";
import {
  fail,
  logActionFailure,
  type ActionErrorCode,
} from "@repo/utils/action-error";
import type { ActionResult } from "@/shared/types/action-result";
import type { CustomerProfile } from "@/features/auth/types/auth.types";
import { parseCustomerPhoneForm } from "@/features/auth/utils/phoneSchema";

function parsePhoneFromForm(formData: FormData) {
  const country = String(formData.get("country") ?? "");
  const phoneLocal = String(formData.get("phoneLocal") ?? "");
  const legacyPhone = String(formData.get("phone") ?? "").trim();

  if (phoneLocal || country) {
    return parseCustomerPhoneForm(country, phoneLocal);
  }

  if (legacyPhone) {
    const parsed = parseCustomerPhoneForm(
      detectCountry(legacyPhone),
      legacyPhone.replace(/^\+\d+/, ""),
    );
    if (parsed.ok) return parsed;
    return { ok: false as const, reason: "invalid" as const };
  }

  return { ok: false as const, reason: "missing" as const };
}

function mapSignupOtpError(err: unknown): ActionErrorCode {
  if (err instanceof Error) {
    const code = err.message as ActionErrorCode;
    if (
      code === "CUSTOMER_ALREADY_EXISTS" ||
      code === "OTP_RATE_LIMITED" ||
      code === "OTP_INVALID" ||
      code === "OTP_EXPIRED"
    ) {
      return code;
    }
    if (err.message.includes("not configured")) {
      return "OTP_SEND_FAILED";
    }
  }
  return "OTP_SEND_FAILED";
}

/** Form action for `useActionState` — also works as a native POST without JS. */
export async function customerLoginAction(
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult | null> {
  const parsed = parsePhoneFromForm(formData);
  if (!parsed.ok) {
    return fail(
      parsed.reason === "missing" ? "CUSTOMER_PHONE_REQUIRED" : "INVALID_PHONE",
    );
  }

  const phone = parsed.phone;

  let customer;
  try {
    customer = await findCustomerByPhone(phone);
  } catch (err) {
    logActionFailure("customerLogin.lookup", err);
    return fail("CUSTOMER_LOGIN_FAILED");
  }

  if (!customer) {
    redirect(`/onboarding?phone=${encodeURIComponent(phone)}`);
  }

  if (customer.status === "suspended") {
    return fail("CUSTOMER_SUSPENDED");
  }

  try {
    const admin = createServiceRoleClient();
    await admin
      .from("customers")
      .update({ last_active_at: new Date().toISOString() })
      .eq("id", customer.id);

    await establishCustomerSession(customer.id);
  } catch (err) {
    logActionFailure("customerLogin", err);
    return fail("CUSTOMER_LOGIN_FAILED");
  }

  redirect("/wallet");
}

/**
 * Step 1 of onboarding: validate name + phone, send signup SMS OTP.
 * Does not create the customer yet.
 */
export async function sendSignupOtpAction(
  formData: FormData,
): Promise<
  ActionResult<{ step: "otp"; phone: string; name: string; maskedPhone: string }>
> {
  const parsed = parsePhoneFromForm(formData);
  const name = String(formData.get("name") ?? "").trim();

  if (!parsed.ok) {
    return fail(
      parsed.reason === "missing" ? "CUSTOMER_PHONE_REQUIRED" : "INVALID_PHONE",
    );
  }
  if (name.length < 2) return fail("CUSTOMER_NAME_REQUIRED");

  const phone = parsed.phone;

  try {
    const existing = await findCustomerByPhone(phone);
    if (existing) {
      if (existing.status === "suspended") {
        return fail("CUSTOMER_SUSPENDED");
      }
      await establishCustomerSession(existing.id);
      redirect("/wallet");
    }

    const result = await sendSignupOtp(phone);
    return {
      step: "otp",
      phone,
      name,
      maskedPhone: result.maskedPhone,
    };
  } catch (err) {
    logActionFailure("sendSignupOtp", err);
    return fail(mapSignupOtpError(err));
  }
}

/** Resend signup OTP for the pending phone (rate-limited). */
export async function resendSignupOtpAction(
  phone: string,
): Promise<ActionResult<{ maskedPhone: string }>> {
  const normalized = phone.trim();
  if (!normalized) return fail("CUSTOMER_PHONE_REQUIRED");

  try {
    const result = await sendSignupOtp(normalized);
    return { maskedPhone: result.maskedPhone };
  } catch (err) {
    logActionFailure("resendSignupOtp", err);
    return fail(mapSignupOtpError(err));
  }
}

/**
 * Step 2 of onboarding: verify OTP, create customer, establish session.
 */
export async function verifySignupOtpAction(
  formData: FormData,
): Promise<ActionResult | null> {
  const parsed = parsePhoneFromForm(formData);
  const name = String(formData.get("name") ?? "").trim();
  const otp = String(formData.get("otp") ?? "").trim();

  if (!parsed.ok) {
    return fail(
      parsed.reason === "missing" ? "CUSTOMER_PHONE_REQUIRED" : "INVALID_PHONE",
    );
  }
  if (name.length < 2) return fail("CUSTOMER_NAME_REQUIRED");
  if (!otp) return fail("OTP_INVALID");

  const phone = parsed.phone;

  try {
    await verifySignupOtp(phone, otp);

    const existing = await findCustomerByPhone(phone);
    if (existing) {
      if (existing.status === "suspended") {
        return fail("CUSTOMER_SUSPENDED");
      }
      await establishCustomerSession(existing.id);
      redirect("/wallet");
    }

    const admin = createServiceRoleClient();
    const { data: customer, error } = await admin
      .from("customers")
      .insert({
        phone,
        name,
        country_code: detectCountry(phone),
      })
      .select()
      .single();

    if (error) {
      logActionFailure("verifySignupOtp.insert", error);
      if (error.code === "23505") return fail("CUSTOMER_ALREADY_EXISTS");
      return fail("CUSTOMER_ONBOARDING_FAILED");
    }

    await establishCustomerSession(customer.id);
  } catch (err) {
    logActionFailure("verifySignupOtp", err);
    if (err instanceof Error) {
      const code = err.message as ActionErrorCode;
      if (
        code === "OTP_INVALID" ||
        code === "OTP_EXPIRED" ||
        code === "CUSTOMER_ALREADY_EXISTS"
      ) {
        return fail(code);
      }
    }
    return fail("CUSTOMER_ONBOARDING_FAILED");
  }

  redirect("/wallet");
}

/** @deprecated Prefer sendSignupOtpAction + verifySignupOtpAction. */
export async function customerOnboardingAction(
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult | null> {
  return sendSignupOtpAction(formData);
}

export async function customerLogoutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut({ scope: "local" });
  redirect("/login");
}

export async function getCustomerSessionAction(): Promise<
  ActionResult<{ customer: CustomerProfile | null }>
> {
  try {
    const customerId = await getCustomerIdFromSession();
    if (!customerId) return { customer: null };

    const customer = await getCustomerById(customerId);
    if (!customer) return { customer: null };

    return {
      customer: {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
      },
    };
  } catch (err) {
    logActionFailure("getCustomerSession", err);
    return { customer: null };
  }
}
