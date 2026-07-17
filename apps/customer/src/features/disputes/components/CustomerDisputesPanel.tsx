"use client";

import { useFormatter, useTranslations } from "next-intl";
import { Badge } from "@repo/ui/badge";
import type { CustomerStampDisputeItem } from "@repo/supabase/queries/stamp-disputes-shared";

const STATUS_VARIANT = {
  pending: "secondary" as const,
  approved: "default" as const,
  rejected: "destructive" as const,
};

export function CustomerDisputeCard({
  dispute,
  showMerchant = false,
}: {
  dispute: CustomerStampDisputeItem;
  showMerchant?: boolean;
}) {
  const t = useTranslations("dispute");
  const format = useFormatter();

  return (
    <article className="space-y-2 rounded-xl border border-border/60 bg-card p-3 text-sm sm:p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1 space-y-0.5">
          {showMerchant ? (
            <p className="truncate font-medium text-foreground">
              {dispute.merchantName}
            </p>
          ) : null}
          <p
            className={
              showMerchant
                ? "break-words text-muted-foreground"
                : "break-words font-medium"
            }
          >
            {format.dateTime(new Date(dispute.visitDate), { dateStyle: "medium" })}{" "}
            ·{" "}
            {format.number(dispute.amountClaimed, {
              style: "currency",
              currency: dispute.currencyCode,
            })}
          </p>
        </div>
        <Badge
          variant={STATUS_VARIANT[dispute.status]}
          className="shrink-0"
        >
          {t(`status.${dispute.status}`)}
        </Badge>
      </div>
      <p className="break-words text-muted-foreground">{dispute.description}</p>
      {dispute.merchantResponse ? (
        <p>
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
    <section
      className="space-y-3 rounded-xl border border-border/60 p-4"
      aria-labelledby="customer-disputes-heading"
    >
      <h2 id="customer-disputes-heading" className="text-base font-semibold">
        {t("historyTitle")}
      </h2>
      <ul className="space-y-3">
        {disputes.map((dispute) => (
          <li key={dispute.id}>
            <CustomerDisputeCard dispute={dispute} />
          </li>
        ))}
      </ul>
    </section>
  );
}
