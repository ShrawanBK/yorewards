import { getMerchantsByUserId } from "@repo/supabase/queries/merchants";
import {
  getMerchantRoleForUser,
  roleMeetsMinimum,
} from "@repo/supabase/queries/merchant-staff";
import type { MerchantStaffRole } from "@repo/supabase/types";
import type { MerchantRow } from "@repo/supabase/queries/merchants";
import { fail, type ActionFailure } from "@repo/utils/action-error";

export type { MerchantStaffRole };

export async function assertMerchantAccess(
  userId: string,
  merchantId: string,
  minimumRole: MerchantStaffRole = "cashier",
): Promise<
  | { merchant: MerchantRow; role: MerchantStaffRole }
  | ActionFailure
> {
  const merchants = await getMerchantsByUserId(userId);
  const merchant = merchants.find((row) => row.id === merchantId);
  if (!merchant) return fail("BUSINESS_NOT_FOUND");
  if (merchant.status !== "active") return fail("BUSINESS_NOT_ACTIVE");

  const role = await getMerchantRoleForUser(userId, merchantId);
  if (!role || !roleMeetsMinimum(role, minimumRole)) {
    return fail("FORBIDDEN");
  }

  return { merchant, role };
}
