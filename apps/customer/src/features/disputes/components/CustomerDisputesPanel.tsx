"use client";

import { useFormatter, useTranslations } from "next-intl";
import {
  CheckCircle2,
  Clock3,
  Store,
  XCircle,
} from "lucide-react";
import { Badge } from "@repo/ui/badge";
import type { CustomerStampDisputeItem } from "@repo/supabase/queries/stamp-disputes-shared";

const STATUS_STYLE = {
  pending: {
    variant: "secondary" as const,
    card: "border-amber-500/30 bg-gradient-to-br from-amber-500/6 via-card to-card",
    accent: "bg-amber-500",
    iconWrap: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
    Icon: Clock3,
  },
  approved: {
    variant: "default" as const,
    card: "border-emerald-500/30 bg-gradient-to-br from-emerald-500/6 via-card to-card",
    accent: "bg-emerald-500",
    iconWrap: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
    Icon: CheckCircle2,
  },
  rejected: {
    variant: "destructive" as const,
    card: "border-destructive/30 bg-gradient-to-br from-destructive/6 via-card to-card",
    accent: "bg-destructive",
    iconWrap: "bg-destructive/15 text-destructive",
    Icon: XCircle,
  },
};

function merchantInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
}

export function CustomerDisputeCard({
  dispute,
  showMerchant = false,
}: {
  dispute: CustomerStampDisputeItem;
  showMerchant?: boolean;
}) {
  const t = useTranslations("dispute");
  const format = useFormatter();
  const style = STATUS_STYLE[dispute.status];
  const StatusIcon = style.Icon;

  return (
    <article
      className={`relative overflow-hidden rounded-xl border ${style.card}`}
      aria-labelledby={`customer-dispute-${dispute.id}-title`}
    >
      <div className={`absolute inset-y-0 left-0 w-0.5 ${style.accent}`} aria-hidden />

      <div className="space-y-2.5 p-3 pl-3.5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2.5">
            <div
              className={`flex size-8 shrink-0 items-center justify-center rounded-lg text-[10px] font-semibold ${style.iconWrap}`}
              aria-hidden
            >
              {showMerchant ? (
                merchantInitials(dispute.merchantName)
              ) : (
                <StatusIcon className="size-4" />
              )}
            </div>
            <div className="min-w-0">
              <h3
                id={`customer-dispute-${dispute.id}-title`}
                className="truncate text-sm font-semibold tracking-tight"
              >
                {showMerchant
                  ? dispute.merchantName
                  : format.dateTime(new Date(dispute.visitDate), {
                      dateStyle: "medium",
                    })}
              </h3>
              <p className="truncate text-xs text-muted-foreground">
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
          <Badge variant={style.variant} className="shrink-0 text-[10px]">
            {t(`status.${dispute.status}`)}
          </Badge>
        </div>

        <p className="line-clamp-2 text-sm leading-snug text-foreground">
          {dispute.description}
        </p>

        {dispute.merchantResponse ? (
          <p className="line-clamp-2 rounded-lg bg-muted/50 px-2.5 py-1.5 text-xs leading-snug">
            <span className="font-medium">{t("resolutionLabel")}: </span>
            {dispute.merchantResponse}
          </p>
        ) : dispute.status === "pending" ? (
          <p className="flex items-center gap-1.5 text-[11px] text-amber-800 dark:text-amber-200">
            <Clock3 className="size-3 shrink-0" aria-hidden />
            {t("pendingHint")}
          </p>
        ) : null}

        <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
          {showMerchant ? (
            <Store className="size-3 shrink-0" aria-hidden />
          ) : null}
          {t("filedAt", {
            date: format.dateTime(new Date(dispute.createdAt), {
              dateStyle: "medium",
              timeStyle: "short",
            }),
          })}
        </p>
      </div>
    </article>
  );
}

export function CustomerDisputesPanel({
  disputes,
}: {
  disputes: CustomerStampDisputeItem[];
}) {
  const t = useTranslations("dispute");

  if (disputes.length === 0) {
    return null;
  }

  return (
    <section className="space-y-2.5" aria-labelledby="customer-disputes-heading">
      <h2 id="customer-disputes-heading" className="text-sm font-semibold">
        {t("historyTitle")}
      </h2>
      <ul className="space-y-2.5">
        {disputes.map((dispute) => (
          <li key={dispute.id}>
            <CustomerDisputeCard dispute={dispute} />
          </li>
        ))}
      </ul>
    </section>
  );
}
