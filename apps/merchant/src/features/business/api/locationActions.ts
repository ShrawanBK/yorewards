"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@repo/supabase/server";
import { getMerchantsByUserId } from "@repo/supabase/queries/merchants";
import {
  createMerchantLocation,
  deactivateMerchantLocation,
  setPrimaryLocation,
  switchActiveLocation,
  updateMerchantLocation,
} from "@repo/supabase/queries/locations";
import { fail, logActionFailure } from "@repo/utils/action-error";
import type { ActionFailure, ActionResult } from "@/shared/types/action-result";

const REVALIDATE_PATHS = [
  "/merchant/business",
  "/merchant/dashboard",
  "/merchant/loyalty-card",
] as const;

function revalidateMerchantPaths() {
  for (const path of REVALIDATE_PATHS) {
    revalidatePath(path);
  }
}

async function assertOwnsMerchant(
  userId: string,
  merchantId: string,
): Promise<ActionFailure | null> {
  const merchants = await getMerchantsByUserId(userId);
  if (!merchants.some((m) => m.id === merchantId)) {
    return fail("BUSINESS_NOT_FOUND");
  }
  return null;
}

export async function addBranchAction(
  merchantId: string,
  formData: FormData,
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return fail("UNAUTHORIZED");

  const denied = await assertOwnsMerchant(user.id, merchantId);
  if (denied) return denied;

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return fail("BRANCH_NAME_REQUIRED");

  try {
    await createMerchantLocation({
      merchant_id: merchantId,
      name,
      address: String(formData.get("address") ?? "").trim() || null,
      city: String(formData.get("city") ?? "").trim() || null,
      is_primary: false,
      is_active: true,
    });
    revalidateMerchantPaths();
    return {};
  } catch (e) {
    logActionFailure("addBranch", e);
    return fail("ADD_BRANCH_FAILED");
  }
}

export async function updateBranchAction(
  merchantId: string,
  locationId: string,
  formData: FormData,
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return fail("UNAUTHORIZED");

  const denied = await assertOwnsMerchant(user.id, merchantId);
  if (denied) return denied;

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return fail("BRANCH_NAME_REQUIRED");

  try {
    await updateMerchantLocation(locationId, merchantId, {
      name,
      address: String(formData.get("address") ?? "").trim() || null,
      city: String(formData.get("city") ?? "").trim() || null,
    });
    revalidateMerchantPaths();
    return {};
  } catch (e) {
    logActionFailure("updateBranch", e);
    return fail("UPDATE_BRANCH_FAILED");
  }
}

export async function setPrimaryBranchAction(
  merchantId: string,
  locationId: string,
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return fail("UNAUTHORIZED");

  const denied = await assertOwnsMerchant(user.id, merchantId);
  if (denied) return denied;

  try {
    await setPrimaryLocation(locationId, merchantId);
    revalidateMerchantPaths();
    return {};
  } catch (e) {
    logActionFailure("setPrimaryBranch", e);
    return fail("SET_PRIMARY_BRANCH_FAILED");
  }
}

export async function deactivateBranchAction(
  merchantId: string,
  locationId: string,
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return fail("UNAUTHORIZED");

  const denied = await assertOwnsMerchant(user.id, merchantId);
  if (denied) return denied;

  try {
    await deactivateMerchantLocation(locationId, merchantId);
    revalidateMerchantPaths();
    return {};
  } catch (e) {
    logActionFailure("deactivateBranch", e);
    return fail("DEACTIVATE_BRANCH_FAILED");
  }
}

export async function switchActiveBranchAction(
  merchantId: string,
  locationId: string,
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return fail("UNAUTHORIZED");

  const denied = await assertOwnsMerchant(user.id, merchantId);
  if (denied) return denied;

  const location = await switchActiveLocation(merchantId, locationId);
  if (!location) return fail("BRANCH_NOT_FOUND");

  revalidateMerchantPaths();
  revalidatePath("/merchant/dashboard");
  revalidatePath("/merchant/customers");
  return {};
}
