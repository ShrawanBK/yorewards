"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useFormatter, useTranslations } from "next-intl";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@repo/ui/badge";
import { Button } from "@repo/ui/button";
import type { StampDisputeListItem } from "@repo/supabase/queries/stamp-disputes-shared";
import { getDisputeSlaLevel } from "@repo/supabase/queries/stamp-disputes-shared";
import { MerchantDisputeResolvePanel } from "@/features/disputes/components/MerchantDisputeResolvePanel";
import { MERCHANT_STATUS_BADGE } from "@/shared/constants/status-badges";
import { showActionSuccess } from "@/shared/utils/action-feedback";

/** Survives React Strict Mode remounts so the switch toast only fires once. */
const shownBusinessSwitchToasts = new Set<string>();

const STATUS_BADGE = {
  pending: MERCHANT_STATUS_BADGE.pending,
  approved: MERCHANT_STATUS_BADGE.active,
  rejected: MERCHANT_STATUS_BADGE.rejected,
} as const;

const DEADLINE_BADGE = {
  on_track: MERCHANT_STATUS_BADGE.pending,
  due: {
    variant: "secondary" as const,
    className:
      "border-amber-500/50 bg-amber-500/10 text-amber-900 dark:text-amber-100",
  },
  overdue: MERCHANT_STATUS_BADGE.rejected,
};

export function MerchantDisputeDetailView({
  dispute,
  merchantId,
  switchedBusinessName = null,
}: {
  dispute: StampDisputeListItem;
  merchantId: string;
  switchedBusinessName?: string | null;
}) {
  const t = useTranslations("disputes");
  const tNav = useTranslations("nav");
  const format = useFormatter();
  const router = useRouter();
  const pathname = usePathname();
  const badge = STATUS_BADGE[dispute.status];
  const deadlineLevel = getDisputeSlaLevel(dispute.status, dispute.createdAt);
  const deadlineStyle = deadlineLevel ? DEADLINE_BADGE[deadlineLevel] : null;

  useEffect(() => {
    if (!switchedBusinessName) return;

    const toastKey = `${dispute.id}:${switchedBusinessName}`;
    if (!shownBusinessSwitchToasts.has(toastKey)) {
      shownBusinessSwitchToasts.add(toastKey);
      showActionSuccess(tNav, "success.businessSwitched", {
        business: switchedBusinessName,
      });
    }

    router.replace(pathname);
  }, [dispute.id, pathname, router, switchedBusinessName, tNav]);

  return (
    <div className="space-y-6">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-2 text-foreground"
        asChild
      >
        <Link href="/merchant/disputes">
          <ArrowLeft className="size-4" aria-hidden />
          {t("detail.backToList")}
        </Link>
      </Button>

      <article
        className="merchant-glass-card space-y-4 rounded-xl border border-border p-5"
        aria-labelledby={`dispute-detail-${dispute.id}-title`}
      >
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h2
              id={`dispute-detail-${dispute.id}-title`}
              className="text-lg font-semibold"
            >
              {dispute.customerName ?? t("unknownCustomer")}
            </h2>
            <p className="merchant-body-muted text-sm">
              {t("visitSummary", {
                date: format.dateTime(new Date(dispute.visitDate), {
                  dateStyle: "medium",
                }),
                amount: format.number(dispute.amountClaimed, {
                  style: "currency",
                  currency: dispute.currencyCode,
                }),
              })}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant={badge.variant} className={badge.className}>
              {t(`status.${dispute.status}`)}
            </Badge>
            {deadlineLevel && deadlineStyle && dispute.status === "pending" ? (
              <Badge
                variant={deadlineStyle.variant}
                className={deadlineStyle.className}
              >
                {t(`responseDeadline.${deadlineLevel}`)}
              </Badge>
            ) : null}
          </div>
        </div>

        <p className="text-sm">{dispute.description}</p>

        {dispute.merchantResponse ? (
          <p className="merchant-body-muted text-sm">
            {t("responseLabel")}: {dispute.merchantResponse}
          </p>
        ) : null}

        <p className="merchant-body-muted text-xs">
          {t("filedAt", {
            date: format.dateTime(new Date(dispute.createdAt), {
              dateStyle: "medium",
              timeStyle: "short",
            }),
          })}
        </p>

        <MerchantDisputeResolvePanel
          dispute={dispute}
          merchantId={merchantId}
        />
      </article>
    </div>
  );
}
