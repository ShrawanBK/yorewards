import type { SpendingHistoryItem } from "@repo/supabase/queries/customer-insights";
import type { CurrencyCode } from "@repo/supabase/types";
import { CHART_COLORS } from "@/shared/constants/chart-colors";

export type ChartSeries = {
  key: string;
  label: string;
  color: string;
};

export type DailySpendingPoint = {
  dateKey: string;
  dateLabel: string;
  [seriesKey: string]: string | number;
};

function toLocalDateKey(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function buildDailySpendingSeries(
  items: SpendingHistoryItem[],
  year: number,
  month: number,
  merchantFilter?: string,
): {
  points: DailySpendingPoint[];
  series: ChartSeries[];
  currency: CurrencyCode;
} {
  const daysInMonth = new Date(year, month, 0).getDate();
  const merchantMeta = new Map<string, { label: string; color: string }>();

  if (merchantFilter) {
    const label =
      items.find((item) => item.merchantId === merchantFilter)?.businessName ??
      "Merchant";
    merchantMeta.set(merchantFilter, { label, color: CHART_COLORS[0] });
  } else {
    const uniqueMerchants = new Map<string, string>();
    for (const item of items) {
      if (!uniqueMerchants.has(item.merchantId)) {
        uniqueMerchants.set(item.merchantId, item.businessName);
      }
    }
    let colorIndex = 0;
    for (const [id, name] of uniqueMerchants) {
      merchantMeta.set(id, {
        label: name,
        color: CHART_COLORS[colorIndex % CHART_COLORS.length]!,
      });
      colorIndex += 1;
    }
  }

  const points: DailySpendingPoint[] = [];
  for (let day = 1; day <= daysInMonth; day++) {
    const dateKey = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const point: DailySpendingPoint = {
      dateKey,
      dateLabel: String(day),
    };
    for (const key of merchantMeta.keys()) {
      point[key] = 0;
    }
    points.push(point);
  }

  const pointByDate = new Map(points.map((point) => [point.dateKey, point]));

  for (const item of items) {
    const dateKey = toLocalDateKey(item.stampedAt);
    const point = pointByDate.get(dateKey);
    if (!point) continue;

    if (merchantFilter) {
      if (item.merchantId !== merchantFilter) continue;
      point[merchantFilter] =
        Number(point[merchantFilter] ?? 0) + item.amountSpent;
    } else if (merchantMeta.has(item.merchantId)) {
      point[item.merchantId] =
        Number(point[item.merchantId] ?? 0) + item.amountSpent;
    }
  }

  const currency = items[0]?.currency ?? "NPR";

  return {
    points,
    series: [...merchantMeta.entries()].map(([key, meta]) => ({
      key,
      label: meta.label,
      color: meta.color,
    })),
    currency,
  };
}
