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

/** Warning toast for partial success (e.g. saved but email not sent). */
export function showActionWarning(message: string) {
  toast.warning(message);
}

/** Error toast when inline feedback is easy to miss (e.g. sidebar switchers). */
export function showActionError(message: string) {
  toast.error(message);
}
