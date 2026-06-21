import { AdminShell } from "@/widgets/AdminShell/AdminShell";

export function AdminProtectedShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminShell>{children}</AdminShell>;
}
