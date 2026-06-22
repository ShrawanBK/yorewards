import { redirect } from "next/navigation";
import { getCustomerIdFromSession } from "@repo/supabase/queries/customers";

export async function CustomerProtectedShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const customerId = await getCustomerIdFromSession();
  if (!customerId) redirect("/login");
  return children;
}
