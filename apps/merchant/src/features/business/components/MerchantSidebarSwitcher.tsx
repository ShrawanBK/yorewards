"use client";

import { useCallback, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Building2, MapPin, Plus } from "lucide-react";
import { cn } from "@repo/ui/lib/utils";
import type { MerchantRow } from "@repo/supabase/queries/merchants";
import type { MerchantLocationRow } from "@repo/supabase/queries/locations";
import { switchActiveMerchantAction } from "@/features/business/api/businessActions";
import { switchActiveBranchAction } from "@/features/business/api/locationActions";

type MerchantSidebarSwitcherProps = {
  merchants: MerchantRow[];
  activeMerchantId: string;
  branches: MerchantLocationRow[];
  activeBranchId: string | null;
  className?: string;
};

const selectClassName =
  "h-9 w-full rounded-md border border-sidebar-border bg-background/80 px-2.5 text-sm text-foreground shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-60";

export function MerchantSidebarSwitcher({
  merchants,
  activeMerchantId,
  branches,
  activeBranchId,
  className,
}: MerchantSidebarSwitcherProps) {
  const t = useTranslations("nav");
  const tBranches = useTranslations("branches");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const showBranchSwitcher = branches.length > 1;

  const switchBusiness = useCallback(
    (merchantId: string) => {
      if (merchantId === activeMerchantId || isPending) return;
      startTransition(async () => {
        const result = await switchActiveMerchantAction(merchantId);
        if (!result?.error) router.refresh();
      });
    },
    [activeMerchantId, isPending, router],
  );

  const switchBranch = useCallback(
    (locationId: string) => {
      if (locationId === activeBranchId || isPending) return;
      startTransition(async () => {
        const result = await switchActiveBranchAction(activeMerchantId, locationId);
        if (!result?.error) router.refresh();
      });
    },
    [activeBranchId, activeMerchantId, isPending, router],
  );

  return (
    <div className={cn("space-y-2", className)}>
      <div className="space-y-1">
        <label
          htmlFor="sidebar-business-select"
          className="flex items-center gap-1.5 text-[0.6875rem] font-medium uppercase tracking-wide text-sidebar-foreground/60"
        >
          <Building2 className="size-3.5 shrink-0" aria-hidden />
          {t("switchBusiness")}
        </label>
        {merchants.length > 1 ? (
          <select
            id="sidebar-business-select"
            className={selectClassName}
            value={activeMerchantId}
            disabled={isPending}
            onChange={(e) => switchBusiness(e.target.value)}
          >
            {merchants.map((merchant) => (
              <option key={merchant.id} value={merchant.id}>
                {merchant.business_name}
              </option>
            ))}
          </select>
        ) : (
          <p className="truncate px-0.5 text-sm font-medium text-sidebar-foreground">
            {merchants[0]?.business_name}
          </p>
        )}
      </div>

      {showBranchSwitcher ? (
        <div className="space-y-1">
          <label
            htmlFor="sidebar-branch-select"
            className="flex items-center gap-1.5 text-[0.6875rem] font-medium uppercase tracking-wide text-sidebar-foreground/60"
          >
            <MapPin className="size-3.5 shrink-0" aria-hidden />
            {t("switchBranch")}
          </label>
          <select
            id="sidebar-branch-select"
            className={selectClassName}
            value={activeBranchId ?? ""}
            disabled={isPending || !activeBranchId}
            onChange={(e) => switchBranch(e.target.value)}
            aria-describedby="sidebar-branch-hint"
          >
            {branches.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.name}
                {branch.is_primary
                  ? ` (${tBranches("badges.primary")})`
                  : ""}
              </option>
            ))}
          </select>
          <p
            id="sidebar-branch-hint"
            className="px-0.5 text-[0.6875rem] leading-snug text-sidebar-foreground/55"
          >
            {t("allBranchesHint")}
          </p>
        </div>
      ) : null}

      <Link
        href="/merchant/add-business"
        className="flex items-center gap-1.5 px-0.5 text-xs font-medium text-sidebar-primary hover:underline"
      >
        <Plus className="size-3.5" aria-hidden />
        {t("addBusiness")}
      </Link>
    </div>
  );
}
