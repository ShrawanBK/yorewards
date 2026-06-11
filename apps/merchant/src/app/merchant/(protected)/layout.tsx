import { requireMerchantSession } from "@/features/auth";

export default async function MerchantProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireMerchantSession();
  return children;
}
