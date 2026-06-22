import type { ActionError } from "@repo/utils/action-error";

type TranslateFn = (
  key: string,
  values?: Record<string, string | number>,
) => string;

export function resolveActionError(
  t: TranslateFn,
  error: ActionError | undefined | null,
): string {
  if (!error?.code) return t("UNKNOWN");
  try {
    return t(error.code, error.params);
  } catch {
    return t("UNKNOWN");
  }
}
