"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { WeeklySpendPoint } from "@repo/supabase/queries/merchant-spend-analytics";
import { formatLocalDateKey } from "@repo/supabase/utils/local-date";
import {
  CHART_COLORS,
  CHART_TOOLTIP_STYLE,
} from "@/shared/constants/chart-colors";

function formatShortDate(dateKey: string): string {
  return formatLocalDateKey(dateKey, { weekday: "short" });
}

export function SpendWeekChart({
  data,
  currency,
  ariaLabel,
}: {
  data: WeeklySpendPoint[];
  currency: string;
  ariaLabel: string;
}) {
  const chartData = data.map((row) => ({
    ...row,
    label: formatShortDate(row.date),
  }));

  return (
    <div className="h-56 w-full" role="img" aria-label={ariaLabel}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 12, right: 12, left: 0, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: "#94a3b8", fontSize: 11 }}
            axisLine={{ stroke: "#475569" }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "#94a3b8", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={52}
            tickFormatter={(value) =>
              value >= 1000 ? `${Math.round(value / 1000)}k` : String(value)
            }
          />
          <Tooltip
            cursor={{ fill: "rgb(124 58 237 / 0.12)" }}
            contentStyle={CHART_TOOLTIP_STYLE}
            formatter={(value) => [
              `${currency} ${Number(value ?? 0).toLocaleString()}`,
              "",
            ]}
            labelFormatter={(_label, payload) => {
              const row = payload?.[0]?.payload as WeeklySpendPoint | undefined;
              return row?.date ? formatLocalDateKey(row.date) : "";
            }}
          />
          <Bar dataKey="total" radius={[6, 6, 0, 0]} maxBarSize={48}>
            {chartData.map((row, index) => (
              <Cell
                key={row.date}
                fill={
                  row.total > 0
                    ? CHART_COLORS[index % CHART_COLORS.length]
                    : "#475569"
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
