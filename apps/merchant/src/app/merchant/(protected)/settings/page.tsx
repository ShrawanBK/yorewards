import { getTranslations } from "next-intl/server";
import { getMerchantSessionData } from "@/features/dashboard/api/getMerchantSessionData";
import { MerchantSettingsView } from "@/features/settings";
import { PageHeader } from "@/shared/ui/PageHeader";

export default async function SettingsPage() {
  const t = await getTranslations("settings");
  const { user, merchants, merchant, branches, activeBranch } =
    await getMerchantSessionData();

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
