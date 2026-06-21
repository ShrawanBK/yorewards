import {
  getPlatformRecentActivity,
  getPlatformStats,
} from "@repo/supabase/queries/platform";
import type {
  PlatformActivityItem,
  PlatformStats,
} from "@repo/supabase/queries/platform";

export type PlatformDashboardData = {
  stats: PlatformStats;
  activity: PlatformActivityItem[];
};

export async function getPlatformDashboardData(): Promise<PlatformDashboardData> {
  const [stats, activity] = await Promise.all([
    getPlatformStats(),
    getPlatformRecentActivity(10),
  ]);

  return { stats, activity };
}
