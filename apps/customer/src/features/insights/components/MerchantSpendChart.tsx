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
import type { MerchantSpendBreakdown } from "@repo/supabase/queries/customer-insights";
import {
  CHART_COLORS,
  CHART_TOOLTIP_STYLE,
} from "@/shared/constants/chart-colors";

function formatAmount(amount: number, currency: string) {
  return `${currency} ${amount.toLocaleString()}`;
}

export function MerchantSpendChart({
  data,
  ariaLabel,
}: {
  data: MerchantSpendBreakdown[];
  ariaLabel: string;
}) {
  if (data.length === 0) return null;

  const chartData = data.map((row) => ({
    name: row.businessName,
    total: row.totalSpent,
    currency: row.currency,
  }));

  return (
    <div className="h-64 w-full" role="img" aria-label={ariaLabel}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 8, right: 8, left: 0, bottom: 48 }}
        >
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 11 }}
            interval={0}
            angle={-25}
            textAnchor="end"
            height={60}
          />
          <YAxis tick={{ fontSize: 11 }} width={48} />
          <Tooltip
            cursor={{ fill: "rgb(124 58 237 / 0.08)" }}
            contentStyle={CHART_TOOLTIP_STYLE}
            formatter={(value, _name, item) => [
              formatAmount(
                Number(value ?? 0),
                String(item?.payload?.currency ?? "NPR"),
              ),
              "",
            ]}
            labelFormatter={(label) => label}
          />
          <Bar dataKey="total" radius={[6, 6, 0, 0]} maxBarSize={56}>
            {chartData.map((row, index) => (
              <Cell
                key={row.name}
                fill={CHART_COLORS[index % CHART_COLORS.length]}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
