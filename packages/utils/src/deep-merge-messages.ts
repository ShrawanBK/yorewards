/**
 * Deep-merge next-intl message overlays onto English (source of truth).
 * Leaf strings from the overlay win; nested objects are merged recursively.
 */
export function deepMergeMessages<T extends Record<string, unknown>>(
  base: T,
  overlay: Record<string, unknown> | null | undefined,
): T {
  if (!overlay || typeof overlay !== "object") {
    return { ...base };
  }

  const out: Record<string, unknown> = { ...base };

  for (const [key, value] of Object.entries(overlay)) {
    const baseVal = base[key];
    if (
      value !== null &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      baseVal !== null &&
      typeof baseVal === "object" &&
      !Array.isArray(baseVal)
    ) {
      out[key] = deepMergeMessages(
        baseVal as Record<string, unknown>,
        value as Record<string, unknown>,
      );
    } else if (value !== undefined) {
      out[key] = value;
    }
  }

  return out as T;
}
