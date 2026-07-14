"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useFormatter, useTranslations } from "next-intl";
import { Badge } from "@repo/ui/badge";
import type { StampDisputeListItem } from "@repo/supabase/queries/stamp-disputes";
import { getDisputeSlaLevel } from "@repo/supabase/queries/stamp-disputes";
import {
  merchantDisputesQueryKey,
  useMerchantDisputes,
} from "@/features/disputes/api/disputeQueries";
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

export function MerchantDisputesView({
  merchantId,
  initialDisputes,
}: {
  merchantId: string;
  initialDisputes: StampDisputeListItem[];
}) {
  const t = useTranslations("disputes");
  const format = useFormatter();
  const queryClient = useQueryClient();
  const { data: disputes = initialDisputes, isFetching } = useMerchantDisputes(
    merchantId,
    initialDisputes,
  );

  const pending = disputes.filter((d) => d.status === "pending");
  const resolved = disputes.filter((d) => d.status !== "pending");

  async function handleResolved() {
    await queryClient.invalidateQueries({
      queryKey: merchantDisputesQueryKey(merchantId),
    });
  }

  function DisputeCard({ dispute }: { dispute: StampDisputeListItem }) {
    const badge = STATUS_BADGE[dispute.status];
    const deadlineLevel = getDisputeSlaLevel(dispute.status, dispute.createdAt);
    const deadlineStyle = deadlineLevel ? DEADLINE_BADGE[deadlineLevel] : null;

    return (
      <article
        className="merchant-glass-card space-y-3 rounded-xl border border-border p-4"
        aria-labelledby={`dispute-${dispute.id}-title`}
      >
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h3 id={`dispute-${dispute.id}-title`} className="font-semibold">
              {dispute.customerName ?? t("unknownCustomer")}
            </h3>
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
              <Badge variant={deadlineStyle.variant} className={deadlineStyle.className}>
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
          onResolved={handleResolved}
        />
      </article>
    );
  }

  return (
    <div className="space-y-8">
      {isFetching ? (
        <p className="merchant-body-muted text-xs" aria-live="polite">
          {t("refreshing")}
        </p>
      ) : null}

      <section className="space-y-3" aria-labelledby="pending-disputes-heading">
        <h2 id="pending-disputes-heading" className="text-lg font-semibold">
          {t("pendingTitle", { count: pending.length })}
        </h2>
        {pending.length === 0 ? (
          <p className="merchant-body-muted text-sm">{t("pendingEmpty")}</p>
        ) : (
          <div className="space-y-4">
            {pending.map((dispute) => (
              <DisputeCard key={dispute.id} dispute={dispute} />
            ))}
          </div>
        )}
      </section>

      {resolved.length > 0 ? (
        <section className="space-y-3" aria-labelledby="resolved-disputes-heading">
          <h2 id="resolved-disputes-heading" className="text-lg font-semibold">
            {t("resolvedTitle")}
          </h2>
          <div className="space-y-4">
            {resolved.map((dispute) => (
              <DisputeCard key={dispute.id} dispute={dispute} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
