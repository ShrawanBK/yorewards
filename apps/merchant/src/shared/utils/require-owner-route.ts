import { redirect } from "next/navigation";
import { createClient } from "@repo/supabase/server";
import { getMerchantRoleForUser } from "@repo/supabase/queries/merchant-staff";
import type { MerchantRow } from "@repo/supabase/queries/merchants";

/** Redirects non-owners away from owner-only merchant routes. */
export async function requireOwnerForMerchantRoute(
  merchant: MerchantRow,
): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/merchant/login");

  const role = await getMerchantRoleForUser(user.id, merchant.id);
  if (role !== "owner") {
    redirect("/merchant/dashboard");
  }
}
