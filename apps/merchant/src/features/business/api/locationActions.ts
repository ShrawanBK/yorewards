"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@repo/supabase/server";
import { getMerchantsByUserId } from "@repo/supabase/queries/merchants";
import {
  createMerchantLocation,
  deactivateMerchantLocation,
  setPrimaryLocation,
  updateMerchantLocation,
} from "@repo/supabase/queries/locations";
import type { ActionResult } from "@/shared/types/action-result";

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
): Promise<ActionResult | null> {
  const merchants = await getMerchantsByUserId(userId);
  if (!merchants.some((m) => m.id === merchantId)) {
    return { error: "Business not found" };
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
  if (!user) return { error: "Unauthorized" };

  const denied = await assertOwnsMerchant(user.id, merchantId);
  if (denied) return denied;

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Branch name is required" };

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
    return { error: e instanceof Error ? e.message : "Failed to add branch" };
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
  if (!user) return { error: "Unauthorized" };

  const denied = await assertOwnsMerchant(user.id, merchantId);
  if (denied) return denied;

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Branch name is required" };

  try {
    await updateMerchantLocation(locationId, merchantId, {
      name,
      address: String(formData.get("address") ?? "").trim() || null,
      city: String(formData.get("city") ?? "").trim() || null,
    });
    revalidateMerchantPaths();
    return {};
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Failed to update branch",
    };
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
  if (!user) return { error: "Unauthorized" };

  const denied = await assertOwnsMerchant(user.id, merchantId);
  if (denied) return denied;

  try {
    await setPrimaryLocation(locationId, merchantId);
    revalidateMerchantPaths();
    return {};
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Failed to set primary branch",
    };
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
  if (!user) return { error: "Unauthorized" };

  const denied = await assertOwnsMerchant(user.id, merchantId);
  if (denied) return denied;

  try {
    await deactivateMerchantLocation(locationId, merchantId);
    revalidateMerchantPaths();
    return {};
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Failed to deactivate branch",
    };
  }
}
