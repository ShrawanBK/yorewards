import type { MerchantStatus } from "@repo/supabase/types";

/** Accessible status chips — light + dark contrast tested */
export const MERCHANT_STATUS_BADGE: Record<
  MerchantStatus,
  {
    variant: "default" | "secondary" | "destructive" | "outline";
    className?: string;
  }
> = {
  pending: {
    variant: "outline",
    className:
      "merchant-chip text-amber-950 border-amber-700/45 bg-amber-100 dark:border-amber-500/55 dark:bg-amber-950/45 dark:text-amber-100",
  },
  active: {
    variant: "default",
    className:
      "merchant-chip border-transparent bg-emerald-800 text-white dark:bg-emerald-600",
  },
  rejected: {
    variant: "destructive",
    className: "merchant-chip",
  },
  suspended: {
    variant: "outline",
    className: "merchant-chip border-border bg-muted text-foreground",
  },
};

export const MERCHANT_CHIP = {
  selected:
    "merchant-chip merchant-chip-selected border-primary/55 bg-primary/12 text-primary-dark dark:text-primary",
  primary:
    "merchant-chip merchant-chip-primary border-primary/55 bg-primary/12 text-primary-dark dark:text-primary",
  inactive: "merchant-chip merchant-chip-muted border-border bg-muted text-foreground",
} as const;
