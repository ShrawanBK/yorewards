import { getAllCustomersAction, AdminCustomersView } from "@/features/customers";

export default async function AdminCustomersPage() {
  const customers = await getAllCustomersAction();
  return <AdminCustomersView customers={customers} />;
}
