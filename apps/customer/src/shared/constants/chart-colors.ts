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
  backgroundColor: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: "8px",
  color: "#0f172a",
  fontSize: "12px",
  boxShadow: "0 4px 12px rgb(15 23 42 / 0.08)",
} as const;
