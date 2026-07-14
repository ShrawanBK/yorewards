"use client";

import { useFormatter, useTranslations } from "next-intl";
import { Badge } from "@repo/ui/badge";
import type { CustomerStampDisputeItem } from "@repo/supabase/queries/stamp-disputes";

const STATUS_VARIANT = {
  pending: "secondary" as const,
  approved: "default" as const,
  rejected: "destructive" as const,
};

export function CustomerDisputesPanel({
  disputes,
}: {
  disputes: CustomerStampDisputeItem[];
}) {
  const t = useTranslations("dispute");
  const format = useFormatter();

  if (disputes.length === 0) {
    return null;
  }

  return (
    <section
      className="space-y-3 rounded-xl border border-border/60 p-4"
      aria-labelledby="customer-disputes-heading"
    >
      <h2 id="customer-disputes-heading" className="text-base font-semibold">
        {t("historyTitle")}
      </h2>
      <ul className="space-y-3">
        {disputes.map((dispute) => (
          <li
            key={dispute.id}
            className="space-y-2 rounded-lg border border-border/60 bg-muted/30 p-3 text-sm"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <p className="font-medium">
                {format.dateTime(new Date(dispute.visitDate), { dateStyle: "medium" })}{" "}
                ·{" "}
                {format.number(dispute.amountClaimed, {
                  style: "currency",
                  currency: dispute.currencyCode,
                })}
              </p>
              <Badge variant={STATUS_VARIANT[dispute.status]}>
                {t(`status.${dispute.status}`)}
              </Badge>
            </div>
            <p className="text-muted-foreground">{dispute.description}</p>
            {dispute.merchantResponse ? (
              <p className="text-sm">
                <span className="font-medium">{t("resolutionLabel")}: </span>
                {dispute.merchantResponse}
              </p>
            ) : dispute.status === "pending" ? (
              <p className="text-xs text-muted-foreground">{t("pendingHint")}</p>
            ) : null}
            <p className="text-xs text-muted-foreground">
              {t("filedAt", {
                date: format.dateTime(new Date(dispute.createdAt), {
                  dateStyle: "medium",
                  timeStyle: "short",
                }),
              })}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
