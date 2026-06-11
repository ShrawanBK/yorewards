import { requireMerchantSession } from "@/features/auth";
import { MerchantProtectedShell } from "@/widgets/MerchantProtectedShell";

export default async function MerchantProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireMerchantSession();
  return <MerchantProtectedShell>{children}</MerchantProtectedShell>;
}
