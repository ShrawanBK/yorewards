import { createClient } from "@repo/supabase/server";
import { getMerchantByUserId } from "@repo/supabase/queries/merchants";
import { redirect } from "next/navigation";
import { logoutAction } from "../../actions";
import { Button } from "@repo/ui/button";
import { MerchantStatusPanel } from "@/components/merchant-status-panel";

export default async function MerchantDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/merchant/login");

  const merchant = await getMerchantByUserId(user.id);
  if (!merchant) redirect("/merchant/login?tab=signup");

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Merchant portal</p>
        </div>
        <form action={logoutAction}>
          <Button type="submit" variant="outline">
            Log out
          </Button>
        </form>
      </div>

      <MerchantStatusPanel
        businessName={merchant.business_name}
        status={merchant.status}
        rejectionReason={merchant.rejection_reason}
      />

      {merchant.status === "active" && (
        <p className="text-sm text-muted-foreground">
          Stamp queue and QR tools arrive on Day 4.
        </p>
      )}
    </div>
  );
}
