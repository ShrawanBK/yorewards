import {
  getMerchantsByUserId,
} from "@repo/supabase/queries/merchants";
import {
  hasPendingStaffInvite,
  linkPendingStaffInvites,
} from "@repo/supabase/queries/merchant-staff";

export async function resolvePostAuthRedirect(
  userId: string,
  email: string,
): Promise<string> {
  const normalizedEmail = email.trim().toLowerCase();

  try {
    await linkPendingStaffInvites(userId, normalizedEmail);
  } catch {
    // Non-fatal — user can retry from accept-invite page.
  }

  const merchants = await getMerchantsByUserId(userId);
  if (merchants.length > 0) {
    return "/merchant/dashboard";
  }

  if (await hasPendingStaffInvite(normalizedEmail)) {
    return `/merchant/accept-invite?email=${encodeURIComponent(normalizedEmail)}`;
  }

  return "/merchant/add-business";
}
