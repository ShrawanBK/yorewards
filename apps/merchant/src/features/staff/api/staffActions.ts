"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@repo/supabase/server";
import { assertMerchantStaffLimit } from "@repo/supabase/queries/merchant-limits";
import {
  getStaffMemberByUserId,
  inviteMerchantStaff,
  listMerchantStaff,
  removeStaffMember,
  resendMerchantStaffInvite,
  updateStaffPin,
} from "@repo/supabase/queries/merchant-staff";
import type { MerchantStaffRole } from "@repo/supabase/types";
import {
  hashStaffPin,
  isValidStaffPin,
  verifyStaffPin,
} from "@repo/utils/staff-pin";
import { fail, logActionFailure } from "@repo/utils/action-error";
import {
  setActingStaffUserIdCookie,
  clearActingStaffUserIdCookie,
} from "@repo/supabase/acting-staff";
import type { ActionResult } from "@/shared/types/action-result";
import { assertMerchantAccess } from "@/shared/utils/merchant-access";

export async function fetchMerchantStaffAction(
  merchantId: string,
): Promise<ActionResult<{ staff: Awaited<ReturnType<typeof listMerchantStaff>> }>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return fail("UNAUTHORIZED");

  const access = await assertMerchantAccess(user.id, merchantId, "owner");
  if ("error" in access) return access;

  try {
    const staff = await listMerchantStaff(merchantId);
    return { staff };
  } catch (err) {
    logActionFailure("fetchMerchantStaff", err);
    return fail("UNKNOWN");
  }
}

export async function inviteStaffAction(
  merchantId: string,
  formData: FormData,
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return fail("UNAUTHORIZED");

  const access = await assertMerchantAccess(user.id, merchantId, "owner");
  if ("error" in access) return access;

  const email = String(formData.get("email") ?? "").trim();
  const role = String(formData.get("role") ?? "cashier") as MerchantStaffRole;
  const displayName = String(formData.get("displayName") ?? "").trim();

  if (!email) return fail("EMAIL_INVALID");
  if (role !== "cashier" && role !== "manager") return fail("FORBIDDEN");

  const limit = await assertMerchantStaffLimit(merchantId);
  if (!limit.ok) {
    return fail("PLAN_LIMIT_STAFF", { limit: limit.limit });
  }

  try {
    const { emailSent } = await inviteMerchantStaff({
      merchantId,
      email,
      role,
      displayName: displayName || null,
    });
    revalidatePath("/merchant/staff");
    if (!emailSent) {
      return { warning: { code: "STAFF_INVITE_EMAIL_DEFERRED" } };
    }
    return {};
  } catch (err) {
    logActionFailure("inviteStaff", err);
    return fail("STAFF_INVITE_FAILED");
  }
}

export async function resendStaffInviteAction(
  merchantId: string,
  staffId: string,
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return fail("UNAUTHORIZED");

  const access = await assertMerchantAccess(user.id, merchantId, "owner");
  if ("error" in access) return access;

  try {
    const { emailSent } = await resendMerchantStaffInvite({ merchantId, staffId });
    revalidatePath("/merchant/staff");
    if (!emailSent) {
      return { warning: { code: "STAFF_INVITE_EMAIL_DEFERRED" } };
    }
    return {};
  } catch (err) {
    logActionFailure("resendStaffInvite", err);
    return fail("STAFF_INVITE_FAILED");
  }
}

export async function removeStaffAction(
  merchantId: string,
  staffId: string,
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return fail("UNAUTHORIZED");

  const access = await assertMerchantAccess(user.id, merchantId, "owner");
  if ("error" in access) return access;

  try {
    await removeStaffMember(staffId);
    revalidatePath("/merchant/staff");
    return {};
  } catch (err) {
    logActionFailure("removeStaff", err);
    return fail("STAFF_REMOVE_FAILED");
  }
}

export async function setStaffPinAction(
  staffId: string,
  pin: string,
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return fail("UNAUTHORIZED");

  if (!isValidStaffPin(pin)) return fail("STAFF_PIN_INVALID");

  try {
    const pinHash = await hashStaffPin(pin);
    await updateStaffPin(staffId, user.id, pinHash);
    return {};
  } catch (err) {
    logActionFailure("setStaffPin", err);
    return fail("UNKNOWN");
  }
}

export async function switchStaffByPinAction(
  merchantId: string,
  staffUserId: string,
  pin: string,
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return fail("UNAUTHORIZED");

  const access = await assertMerchantAccess(user.id, merchantId, "cashier");
  if ("error" in access) return access;

  const staff = await getStaffMemberByUserId(merchantId, staffUserId);
  if (!staff) return fail("STAFF_NOT_FOUND");

  const valid = await verifyStaffPin(pin, staff.pin_hash);
  if (!valid) return fail("STAFF_PIN_INVALID");

  await setActingStaffUserIdCookie(staffUserId);
  revalidatePath("/merchant/dashboard");
  return {};
}

export async function clearActingStaffAction(): Promise<ActionResult> {
  await clearActingStaffUserIdCookie();
  revalidatePath("/merchant/dashboard");
  return {};
}
