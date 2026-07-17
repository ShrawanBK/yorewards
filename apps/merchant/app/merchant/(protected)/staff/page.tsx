import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { listMerchantStaff } from "@repo/supabase/queries/merchant-staff";
import { getMerchantRoleForUser } from "@repo/supabase/queries/merchant-staff";
import { StaffManagementView } from "@/features/staff";
import { getMerchantSessionData } from "@/features/dashboard/api/getMerchantSessionData";
import { PageHeader } from "@/shared/ui/PageHeader";

export default async function MerchantStaffPage() {
  const { user, merchant } = await getMerchantSessionData();
  const role = await getMerchantRoleForUser(user.id, merchant.id);
  if (role !== "owner") redirect("/merchant/dashboard");

  const t = await getTranslations("staff");
  const staff = await listMerchantStaff(merchant.id);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title={t("title")} description={t("subtitle")} />
      <StaffManagementView merchantId={merchant.id} staff={staff} />
    </div>
  );
}
