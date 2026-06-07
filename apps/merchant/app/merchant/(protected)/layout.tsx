import { redirect } from "next/navigation";
import { createClient } from "@repo/supabase/server";
import { getMerchantByUserId } from "@repo/supabase/queries/merchants";

export default async function MerchantProtectedLayout({
  children,
}: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/merchant/login");

  const merchant = await getMerchantByUserId(user.id);
  if (!merchant) redirect("/merchant/login?tab=signup");

  return children;
}
