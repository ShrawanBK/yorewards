import { getActingStaffUserIdFromCookie } from "@repo/supabase/acting-staff";
import { getStaffMemberByUserId } from "@repo/supabase/queries/merchant-staff";

export async function resolveApprovedByUserId(
  merchantId: string,
  fallbackUserId: string,
): Promise<string> {
  const actingStaffId = await getActingStaffUserIdFromCookie();
  if (!actingStaffId) return fallbackUserId;

  const staff = await getStaffMemberByUserId(merchantId, actingStaffId);
  return staff?.user_id ?? fallbackUserId;
}
