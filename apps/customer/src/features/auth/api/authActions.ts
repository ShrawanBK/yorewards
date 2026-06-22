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
import { createServiceRoleClient } from "@repo/supabase/service-role";
import { fail, logActionFailure } from "@repo/utils/action-error";
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

export async function customerLoginAction(
  formData: FormData,
): Promise<
  ActionResult<{ isNew: true; phone: string } | { loggedIn: true }>
> {
  const parsed = parsePhoneFromForm(formData);
  if (!parsed.ok) {
    return fail(
      parsed.reason === "missing"
        ? "CUSTOMER_PHONE_REQUIRED"
        : "INVALID_PHONE",
    );
  }

  const phone = parsed.phone;

  try {
    const customer = await findCustomerByPhone(phone);

    if (!customer) {
      return { isNew: true, phone };
    }

    if (customer.status === "suspended") {
      return fail("CUSTOMER_SUSPENDED");
    }

    const admin = createServiceRoleClient();
    await admin
      .from("customers")
      .update({ last_active_at: new Date().toISOString() })
      .eq("id", customer.id);

    await establishCustomerSession(customer.id);
    return { loggedIn: true };
  } catch (err) {
    logActionFailure("customerLogin", err);
    return fail("CUSTOMER_LOGIN_FAILED");
  }
}

export async function customerOnboardingAction(
  formData: FormData,
): Promise<ActionResult<{ completed: true }>> {
  const parsed = parsePhoneFromForm(formData);
  const name = String(formData.get("name") ?? "").trim();

  if (!parsed.ok) {
    return fail(
      parsed.reason === "missing"
        ? "CUSTOMER_PHONE_REQUIRED"
        : "INVALID_PHONE",
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
      return { completed: true };
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
      logActionFailure("customerOnboarding.insert", error);
      if (error.code === "23505") return fail("CUSTOMER_ALREADY_EXISTS");
      return fail("CUSTOMER_ONBOARDING_FAILED");
    }

    await establishCustomerSession(customer.id);
    return { completed: true };
  } catch (err) {
    logActionFailure("customerOnboarding", err);
    return fail("CUSTOMER_ONBOARDING_FAILED");
  }
}

export async function customerLogoutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
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
