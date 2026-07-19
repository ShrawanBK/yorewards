"use client";

import Link from "next/link";
import { useFormatter, useTranslations } from "next-intl";
import { ArrowUpRight, Clock3 } from "lucide-react";
import { Badge } from "@repo/ui/badge";
import { Button } from "@repo/ui/button";
import type { StampDisputeListItem } from "@repo/supabase/queries/stamp-disputes-shared";
import { getDisputeSlaLevel } from "@repo/supabase/queries/stamp-disputes-shared";
import { MERCHANT_STATUS_BADGE } from "@/shared/constants/status-badges";
import { MerchantDisputeResolvePanel } from "./MerchantDisputeResolvePanel";

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

const ACCENT_BY_STATUS = {
  pending: "border-l-amber-500/80",
  approved: "border-l-emerald-500/80",
  rejected: "border-l-destructive/70",
} as const;

function customerInitials(name: string | null, fallback: string): string {
  const source = (name ?? fallback).trim();
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
}

export function MerchantDisputeCard({
  dispute,
  merchantId,
  onResolved,
  showDetailLink = true,
}: {
  dispute: StampDisputeListItem;
  merchantId: string;
  onResolved?: () => void;
  showDetailLink?: boolean;
}) {
  const t = useTranslations("disputes");
  const format = useFormatter();
  const badge = STATUS_BADGE[dispute.status];
  const deadlineLevel = getDisputeSlaLevel(dispute.status, dispute.createdAt);
  const deadlineStyle = deadlineLevel ? DEADLINE_BADGE[deadlineLevel] : null;
  const customerLabel = dispute.customerName ?? t("unknownCustomer");
  const initials = customerInitials(dispute.customerName, t("unknownCustomer"));

  return (
    <article
      className={`merchant-glass-card overflow-hidden rounded-xl border border-border border-l-[3px] ${ACCENT_BY_STATUS[dispute.status]}`}
      aria-labelledby={`dispute-${dispute.id}-title`}
    >
      <div className="space-y-3 p-3 sm:p-3.5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2.5">
            <div
              className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-xs font-semibold text-primary"
              aria-hidden
            >
              {initials}
            </div>
            <div className="min-w-0">
              <h3
                id={`dispute-${dispute.id}-title`}
                className="truncate text-sm font-semibold tracking-tight"
              >
                {customerLabel}
              </h3>
              <p className="merchant-body-muted truncate text-xs">
                {format.number(dispute.amountClaimed, {
                  style: "currency",
                  currency: dispute.currencyCode,
                })}
                {" · "}
                {format.dateTime(new Date(dispute.visitDate), {
                  dateStyle: "medium",
                })}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">
            <Badge variant={badge.variant} className={`${badge.className} text-[10px]`}>
              {t(`status.${dispute.status}`)}
            </Badge>
            {deadlineLevel && deadlineStyle && dispute.status === "pending" ? (
              <Badge
                variant={deadlineStyle.variant}
                className={`${deadlineStyle.className} text-[10px]`}
              >
                {t(`responseDeadline.${deadlineLevel}`)}
              </Badge>
            ) : null}
          </div>
        </div>

        <p className="line-clamp-2 text-sm leading-snug text-foreground">
          {dispute.description}
        </p>

        {dispute.merchantResponse ? (
          <p className="line-clamp-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-2.5 py-1.5 text-xs leading-snug">
            <span className="font-medium">{t("responseLabel")}: </span>
            {dispute.merchantResponse}
          </p>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="merchant-body-muted flex items-center gap-1 text-[11px]">
            <Clock3 className="size-3 shrink-0" aria-hidden />
            {t("filedAt", {
              date: format.dateTime(new Date(dispute.createdAt), {
                dateStyle: "medium",
                timeStyle: "short",
              }),
            })}
          </p>
          {showDetailLink ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 gap-1 px-2.5 text-xs text-foreground"
              asChild
            >
              <Link href={`/merchant/disputes/${dispute.id}`}>
                {t("openDetail")}
                <ArrowUpRight className="size-3" aria-hidden />
              </Link>
            </Button>
          ) : null}
        </div>
      </div>

      {dispute.status === "pending" ? (
        <div className="border-t border-border/70 bg-background/30 px-3 py-3 sm:px-3.5">
          <MerchantDisputeResolvePanel
            dispute={dispute}
            merchantId={merchantId}
            onResolved={onResolved}
          />
        </div>
      ) : null}
    </article>
  );
}
