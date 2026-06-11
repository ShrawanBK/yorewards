import { requireMerchantAuth } from "@/features/auth";

export default async function MerchantProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireMerchantAuth();
  return children;
}
