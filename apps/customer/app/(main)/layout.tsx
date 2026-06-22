import { CustomerProtectedShell } from "@/widgets/CustomerProtectedShell";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <CustomerProtectedShell>{children}</CustomerProtectedShell>;
}
