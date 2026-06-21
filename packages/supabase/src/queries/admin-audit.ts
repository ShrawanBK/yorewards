import { createServiceRoleClient } from "../service-role";
import type { AuditTargetType } from "../types";

export type AuditLogFilter = "all" | "merchant" | "customer" | "stamp";

export type AdminAuditLogEntry = {
  id: string;
  action: string;
  adminId: string;
  adminEmail: string | null;
  targetType: AuditTargetType;
  targetId: string;
  notes: string | null;
  occurredAt: string;
};

export type AuditLogPage = {
  entries: AdminAuditLogEntry[];
  hasMore: boolean;
};

const DEFAULT_LIMIT = 25;

function shortId(id: string): string {
  return id.slice(0, 8);
}

async function resolveAdminEmails(
  adminIds: string[],
): Promise<Map<string, string | null>> {
  const supabase = createServiceRoleClient();
  const unique = [...new Set(adminIds)];
  const map = new Map<string, string | null>();

  await Promise.all(
    unique.map(async (id) => {
      const { data, error } = await supabase.auth.admin.getUserById(id);
      if (error || !data.user?.email) {
        map.set(id, null);
        return;
      }
      map.set(id, data.user.email);
    }),
  );

  return map;
}

export async function getAuditLog(input: {
  limit?: number;
  offset?: number;
  filter?: AuditLogFilter;
}): Promise<AuditLogPage> {
  const limit = input.limit ?? DEFAULT_LIMIT;
  const offset = input.offset ?? 0;
  const filter = input.filter ?? "all";

  const supabase = createServiceRoleClient();
  let query = supabase
    .from("audit_log")
    .select(
      "id, action, admin_id, target_type, target_id, notes, created_at",
    )
    .order("created_at", { ascending: false })
    .range(offset, offset + limit);

  if (filter !== "all") {
    query = query.eq("target_type", filter);
  }

  const { data, error } = await query;
  if (error) throw error;

  const rows = data ?? [];
  const hasMore = rows.length > limit;
  const pageRows = hasMore ? rows.slice(0, limit) : rows;

  const adminEmails = await resolveAdminEmails(
    pageRows.map((row) => row.admin_id),
  );

  const entries: AdminAuditLogEntry[] = pageRows.map((row) => ({
    id: row.id,
    action: row.action,
    adminId: row.admin_id,
    adminEmail: adminEmails.get(row.admin_id) ?? null,
    targetType: row.target_type as AuditTargetType,
    targetId: row.target_id,
    notes: row.notes,
    occurredAt: row.created_at,
  }));

  return { entries, hasMore };
}

export function formatAuditAdminLabel(
  adminEmail: string | null,
  adminId: string,
): string {
  return adminEmail ?? shortId(adminId);
}
