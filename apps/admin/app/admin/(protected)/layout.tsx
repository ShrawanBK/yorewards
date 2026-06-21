import { requireAdminSession } from "@/features/auth";

export default async function AdminProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdminSession();
  return children;
}
