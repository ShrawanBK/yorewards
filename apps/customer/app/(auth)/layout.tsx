import { redirect } from "next/navigation";
import { getCustomerIdFromSession } from "@repo/supabase/queries/customers";

export default async function AuthRouteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const customerId = await getCustomerIdFromSession();
  if (customerId) redirect("/wallet");
  return children;
}
