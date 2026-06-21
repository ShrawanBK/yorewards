import { createServiceRoleClient } from "../service-role";
import type { CustomerStatus, MerchantStatus } from "../types";

export type PlatformStatsPeriod = "today" | "week" | "month";

export type PlatformMerchantCounts = {
  total: number;
  pending: number;
  active: number;
  suspended: number;
  rejected: number;
};

export type PlatformCustomerCounts = {
  total: number;
  active: number;
  suspended: number;
};

export type PlatformPeriodCounts = {
  allTime: number;
  today: number;
  week: number;
  month: number;
};

export type PlatformStats = {
  merchants: PlatformMerchantCounts;
  customers: PlatformCustomerCounts;
  stampsIssued: PlatformPeriodCounts;
  redemptions: PlatformPeriodCounts;
};

export type PlatformActivityItem = {
  id: string;
  action: string;
  targetType: string;
  targetId: string;
  notes: string | null;
  occurredAt: string;
};

function periodStart(period: PlatformStatsPeriod): string {
  const now = new Date();
  const start = new Date(now);

  if (period === "today") {
    start.setHours(0, 0, 0, 0);
  } else if (period === "week") {
    start.setDate(now.getDate() - 7);
  } else {
    start.setMonth(now.getMonth() - 1);
  }

  return start.toISOString();
}

async function countMerchants(status?: MerchantStatus): Promise<number> {
  const supabase = createServiceRoleClient();
  let query = supabase
    .from("merchants")
    .select("id", { count: "exact", head: true });

  if (status) query = query.eq("status", status);

  const { count, error } = await query;
  if (error) throw error;
  return count ?? 0;
}

async function countCustomers(status?: CustomerStatus): Promise<number> {
  const supabase = createServiceRoleClient();
  let query = supabase
    .from("customers")
    .select("id", { count: "exact", head: true })
    .is("deleted_at", null);

  if (status) query = query.eq("status", status);

  const { count, error } = await query;
  if (error) throw error;
  return count ?? 0;
}

async function countApprovedStamps(since?: string): Promise<number> {
  const supabase = createServiceRoleClient();
  let query = supabase
    .from("stamp_sessions")
    .select("id", { count: "exact", head: true })
    .eq("status", "approved");

  if (since) query = query.gte("created_at", since);

  const { count, error } = await query;
  if (error) throw error;
  return count ?? 0;
}

async function countRedemptions(since?: string): Promise<number> {
  const supabase = createServiceRoleClient();
  let query = supabase
    .from("redemptions")
    .select("id", { count: "exact", head: true })
    .eq("status", "redeemed");

  if (since) query = query.gte("redeemed_at", since);

  const { count, error } = await query;
  if (error) throw error;
  return count ?? 0;
}

/** Platform-wide stats — service role (admin app gates access via requireAdminSession). */
export async function getPlatformStats(): Promise<PlatformStats> {
  const [
    pending,
    active,
    suspended,
    rejected,
    customersTotal,
    customersActive,
    customersSuspended,
    stampsAllTime,
    stampsToday,
    stampsWeek,
    stampsMonth,
    redemptionsAllTime,
    redemptionsToday,
    redemptionsWeek,
    redemptionsMonth,
  ] = await Promise.all([
    countMerchants("pending"),
    countMerchants("active"),
    countMerchants("suspended"),
    countMerchants("rejected"),
    countCustomers(),
    countCustomers("active"),
    countCustomers("suspended"),
    countApprovedStamps(),
    countApprovedStamps(periodStart("today")),
    countApprovedStamps(periodStart("week")),
    countApprovedStamps(periodStart("month")),
    countRedemptions(),
    countRedemptions(periodStart("today")),
    countRedemptions(periodStart("week")),
    countRedemptions(periodStart("month")),
  ]);

  return {
    merchants: {
      total: pending + active + suspended + rejected,
      pending,
      active,
      suspended,
      rejected,
    },
    customers: {
      total: customersTotal,
      active: customersActive,
      suspended: customersSuspended,
    },
    stampsIssued: {
      allTime: stampsAllTime,
      today: stampsToday,
      week: stampsWeek,
      month: stampsMonth,
    },
    redemptions: {
      allTime: redemptionsAllTime,
      today: redemptionsToday,
      week: redemptionsWeek,
      month: redemptionsMonth,
    },
  };
}

export async function getPlatformRecentActivity(
  limit = 10,
): Promise<PlatformActivityItem[]> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("audit_log")
    .select("id, action, target_type, target_id, notes, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id,
    action: row.action,
    targetType: row.target_type,
    targetId: row.target_id,
    notes: row.notes,
    occurredAt: row.created_at,
  }));
}
