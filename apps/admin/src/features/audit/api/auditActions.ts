"use server";

import {
  getAuditLog,
  type AuditLogFilter,
  type AuditLogPage,
} from "@repo/supabase/queries/admin-audit";
import { requireAdminForAction } from "@/features/auth/utils/requireAdminAuth";
import { logActionFailure } from "@repo/utils/action-error";

const EMPTY_PAGE: AuditLogPage = { entries: [], hasMore: false };

export async function getAuditLogAction(input: {
  limit?: number;
  offset?: number;
  filter?: AuditLogFilter;
}): Promise<AuditLogPage> {
  const guard = await requireAdminForAction();
  if (!guard.ok) return EMPTY_PAGE;

  try {
    return await getAuditLog(input);
  } catch (err) {
    logActionFailure("getAuditLog", err);
    return EMPTY_PAGE;
  }
}
