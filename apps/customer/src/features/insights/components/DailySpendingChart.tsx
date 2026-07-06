"use client";

import { useMemo } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { SpendingHistoryItem } from "@repo/supabase/queries/customer-insights";
import { buildDailySpendingSeries } from "@/features/insights/utils/daily-spending";
import { CHART_TOOLTIP_STYLE } from "@/shared/constants/chart-colors";

function formatAmount(amount: number, currency: string) {
  return `${currency} ${amount.toLocaleString()}`;
}

export function DailySpendingChart({
  items,
  year,
  month,
  merchantFilter,
  ariaLabel,
}: {
  items: SpendingHistoryItem[];
  year: number;
  month: number;
  merchantFilter?: string;
  ariaLabel: string;
}) {
  const { points, series, currency } = useMemo(
    () => buildDailySpendingSeries(items, year, month, merchantFilter || undefined),
    [items, year, month, merchantFilter],
  );

  const hasSpend = useMemo(
    () =>
      points.some((point) =>
        series.some((s) => Number(point[s.key] ?? 0) > 0),
      ),
    [points, series],
  );

  if (!hasSpend) return null;

  return (
    <div className="h-64 w-full" role="img" aria-label={ariaLabel}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={points} margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis
            dataKey="dateLabel"
            tick={{ fontSize: 11 }}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 11 }}
            width={48}
            tickFormatter={(value) =>
              value >= 1000 ? `${Math.round(value / 1000)}k` : String(value)
            }
          />
          <Tooltip
            contentStyle={CHART_TOOLTIP_STYLE}
            formatter={(value, name) => {
              const label =
                series.find((s) => s.key === name)?.label ?? String(name);
              return [formatAmount(Number(value ?? 0), currency), label];
            }}
            labelFormatter={(_label, payload) => {
              const row = payload?.[0]?.payload as { dateKey?: string } | undefined;
              if (!row?.dateKey) return "";
              const d = new Date(row.dateKey);
              return d.toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
              });
            }}
          />
          {series.length > 1 ? (
            <Legend
              wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }}
              formatter={(value) =>
                series.find((s) => s.key === value)?.label ?? value
              }
            />
          ) : null}
          {series.map((s) => (
            <Line
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.key}
              stroke={s.color}
              strokeWidth={2.5}
              dot={{ r: 3, fill: s.color, strokeWidth: 0 }}
              activeDot={{ r: 5, strokeWidth: 0 }}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
