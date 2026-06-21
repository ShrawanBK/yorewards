import { AdminAuditLogView, getAuditLogAction } from "@/features/audit";

export default async function AdminAuditPage() {
  const initialPage = await getAuditLogAction({ limit: 25, offset: 0, filter: "all" });
  return <AdminAuditLogView initialPage={initialPage} />;
}
