import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getMerchantRoleForUser } from "@repo/supabase/queries/merchant-staff";
import { getMerchantSessionData } from "@/features/dashboard/api/getMerchantSessionData";
import { MerchantSettingsView } from "@/features/settings";
import { PageHeader } from "@/shared/ui/PageHeader";

export default async function SettingsPage() {
  const t = await getTranslations("settings");
  const { user, merchants, merchant, branches, activeBranch } =
    await getMerchantSessionData();
  const role = await getMerchantRoleForUser(user.id, merchant.id);
  if (role === "cashier") redirect("/merchant/dashboard");

  return (
    <div className="space-y-8">
      <PageHeader title={t("title")} description={t("subtitle")} />
      <MerchantSettingsView
        email={user.email ?? t("account.emailUnknown")}
        merchant={merchant}
        merchantCount={merchants.length}
        activeBranch={activeBranch}
        branchCount={branches.length}
      />
    </div>
  );
}
