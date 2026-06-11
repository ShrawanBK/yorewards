import { getMerchantSessionData } from "@/features/dashboard/api/getMerchantSessionData";
import { MerchantShell } from "@/widgets/MerchantShell";

export async function MerchantProtectedShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const { merchant } = await getMerchantSessionData();

  return (
    <MerchantShell businessName={merchant.business_name}>
      {children}
    </MerchantShell>
  );
}
