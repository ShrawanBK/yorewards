import { MerchantProtectedShell } from "@/widgets/MerchantProtectedShell";

export default async function MerchantProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MerchantProtectedShell>{children}</MerchantProtectedShell>;
}
