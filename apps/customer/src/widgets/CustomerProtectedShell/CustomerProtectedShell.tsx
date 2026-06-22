import { redirect } from "next/navigation";
import { getCustomerIdFromSession } from "@repo/supabase/queries/customers";
import { CustomerShell } from "@/widgets/CustomerShell";

export async function CustomerProtectedShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const customerId = await getCustomerIdFromSession();
  if (!customerId) redirect("/login");
  return <CustomerShell>{children}</CustomerShell>;
}
