import { requireAdminSession } from "@/features/auth";
import { AdminProtectedShell } from "@/widgets/AdminShell";

export default async function AdminProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdminSession();
  return <AdminProtectedShell>{children}</AdminProtectedShell>;
}
