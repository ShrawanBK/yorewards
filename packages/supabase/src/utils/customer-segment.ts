export type CustomerSegment =
  | "vip"
  | "regular"
  | "at_risk"
  | "new"
  | "lapsed";

const MS_PER_DAY = 86_400_000;

export type CustomerSpendStats = {
  totalSpend: number;
  visitCount: number;
  firstVisitAt: string | null;
  lastVisitAt: string | null;
  visitsLast30Days: number;
};

export function aggregateCustomerSpend(
  rows: { amount_spent: number; stamped_at: string }[],
): CustomerSpendStats {
  if (rows.length === 0) {
    return {
      totalSpend: 0,
      visitCount: 0,
      firstVisitAt: null,
      lastVisitAt: null,
      visitsLast30Days: 0,
    };
  }

  const sorted = [...rows].sort(
    (a, b) =>
      new Date(a.stamped_at).getTime() - new Date(b.stamped_at).getTime(),
  );
  const thirtyDaysAgo = Date.now() - 30 * MS_PER_DAY;
  const visitsLast30Days = rows.filter(
    (r) => new Date(r.stamped_at).getTime() >= thirtyDaysAgo,
  ).length;

  return {
    totalSpend: rows.reduce((sum, r) => sum + Number(r.amount_spent), 0),
    visitCount: rows.length,
    firstVisitAt: sorted[0]?.stamped_at ?? null,
    lastVisitAt: sorted[sorted.length - 1]?.stamped_at ?? null,
    visitsLast30Days,
  };
}

export function computeVipCustomerIds(
  spendByCustomer: Map<string, number>,
): Set<string> {
  const entries = [...spendByCustomer.entries()]
    .filter(([, spend]) => spend > 0)
    .sort((a, b) => b[1] - a[1]);

  if (entries.length === 0) return new Set();

  const vipCount = Math.max(1, Math.ceil(entries.length * 0.1));
  return new Set(entries.slice(0, vipCount).map(([id]) => id));
}

export function computeCustomerSegment(
  stats: CustomerSpendStats,
  isVip: boolean,
): CustomerSegment {
  const now = Date.now();
  const daysSinceLast = stats.lastVisitAt
    ? (now - new Date(stats.lastVisitAt).getTime()) / MS_PER_DAY
    : null;
  const daysSinceFirst = stats.firstVisitAt
    ? (now - new Date(stats.firstVisitAt).getTime()) / MS_PER_DAY
    : null;

  if (daysSinceLast !== null && daysSinceLast >= 60) return "lapsed";
  if (daysSinceLast !== null && daysSinceLast >= 30) return "at_risk";
  if (daysSinceFirst !== null && daysSinceFirst <= 7) return "new";
  if (isVip) return "vip";
  if (stats.visitsLast30Days >= 3) return "regular";
  return "regular";
}
