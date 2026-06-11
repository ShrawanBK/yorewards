import { createClient } from "@repo/supabase/server";
import {
  getMerchantByUserId,
  getMerchantsByUserId,
} from "@repo/supabase/queries/merchants";
import { redirect } from "next/navigation";
import { logoutAction } from "../../actions";
import { Button } from "@repo/ui/button";
import { MerchantStatusPanel } from "@/components/merchant-status-panel";
import { MerchantBusinessSwitcher } from "@/components/merchant-business-switcher";

export default async function MerchantDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/merchant/login");
  }

  const merchants = await getMerchantsByUserId(user.id);
  if (merchants.length === 0) {
    redirect("/merchant/login?tab=signup");
  }

  const merchant = await getMerchantByUserId(user.id);
  if (!merchant) {
    redirect("/merchant/login?tab=signup");
  }

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

      <MerchantBusinessSwitcher
        merchants={merchants}
        activeMerchantId={merchant.id}
      />

      <MerchantStatusPanel
        businessName={merchant.business_name}
        status={merchant.status}
        rejectionReason={merchant.rejection_reason}
      />

      {merchant.status === "active" && (
        <p className="text-sm text-muted-foreground">
          Loyalty card setup arrives on Day 3. Stamp queue on Day 4.
        </p>
      )}
    </div>
  );
}
