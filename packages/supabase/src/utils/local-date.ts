/** Calendar date in the server/runtime local timezone (YYYY-MM-DD). */
export function toLocalDateKey(value: Date | string): string {
  const d = typeof value === "string" ? new Date(value) : value;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function formatLocalDateKey(
  dateKey: string,
  options: Intl.DateTimeFormatOptions = {
    weekday: "short",
    month: "short",
    day: "numeric",
  },
): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  if (!y || !m || !d) return dateKey;
  return new Date(y, m - 1, d).toLocaleDateString(undefined, options);
}
