/** Solid hex colors for Recharts SVG fills — CSS variables do not work in SVG. */
export const CHART_COLORS = [
  "#7c3aed",
  "#0ea5e9",
  "#22c55e",
  "#f59e0b",
  "#f43f5e",
  "#14b8a6",
  "#a855f7",
  "#3b82f6",
] as const;

export const CHART_TOOLTIP_STYLE = {
  backgroundColor: "#1e293b",
  border: "1px solid #475569",
  borderRadius: "8px",
  color: "#f8fafc",
  fontSize: "12px",
} as const;
