import { toast } from "@repo/ui/sonner";

type TranslateFn = (
  key: string,
  values?: Record<string, string | number>,
) => string;

/** Translated success toast after a server action completes without error. */
export function showActionSuccess(
  t: TranslateFn,
  messageKey: string,
  values?: Record<string, string | number>,
) {
  toast.success(t(messageKey, values));
}
