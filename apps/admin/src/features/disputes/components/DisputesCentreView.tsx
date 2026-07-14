"use client";

import { useState } from "react";
import Link from "next/link";
import { useFormatter, useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";
import { Badge } from "@repo/ui/badge";
import { Button } from "@repo/ui/button";
import {
  getDisputeSlaLevel,
  type StampDisputeFilter,
  type StampDisputeListItem,
} from "@repo/supabase/queries/stamp-disputes-shared";
import { useAdminDisputes } from "@/features/disputes/api/disputeQueries";

const FILTERS: StampDisputeFilter[] = ["pending", "resolved", "all"];

const SLA_BADGE = {
  on_track: { variant: "secondary" as const, className: "" },
  due: {
    variant: "secondary" as const,
    className: "border-amber-500/50 bg-amber-500/10 text-amber-900 dark:text-amber-100",
  },
  overdue: {
    variant: "destructive" as const,
    className: "",
  },
};

export function DisputesCentreView({
  initialFilter,
  initialDisputes,
}: {
  initialFilter: StampDisputeFilter;
  initialDisputes: StampDisputeListItem[];
}) {
  const t = useTranslations("disputes");
  const format = useFormatter();
  const [filter, setFilter] = useState<StampDisputeFilter>(initialFilter);

  const { data: disputes = [], isFetching } = useAdminDisputes(
    filter,
    filter === initialFilter ? initialDisputes : undefined,
  );

  const overdueCount = disputes.filter(
    (d) => d.status === "pending" && getDisputeSlaLevel(d.status, d.createdAt) === "overdue",
  ).length;

  return (
    <div className="space-y-6">
      {overdueCount > 0 ? (
        <div
          className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm"
          role="status"
        >
          {t("listOverdueAlert", { count: overdueCount })}
        </div>
      ) : null}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-2" role="tablist" aria-label={t("filterLabel")}>
          {FILTERS.map((value) => (
            <Button
              key={value}
              type="button"
              variant={filter === value ? "default" : "outline"}
              className={filter === value ? undefined : "text-foreground"}
              onClick={() => setFilter(value)}
              aria-pressed={filter === value}
            >
              {t(`filters.${value}`)}
            </Button>
          ))}
        </div>
        {isFetching ? (
          <p className="text-xs text-muted-foreground" aria-live="polite">
            {t("refreshing")}
          </p>
        ) : null}
      </div>

      {disputes.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("empty")}</p>
      ) : (
        <div className="space-y-4">
          {disputes.map((dispute) => {
            const sla = getDisputeSlaLevel(dispute.status, dispute.createdAt);
            const slaStyle = sla ? SLA_BADGE[sla] : null;

            return (
              <article
                key={dispute.id}
                className="admin-card space-y-3 rounded-xl border p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h2 className="font-semibold">
                      {dispute.customerName ?? t("unknownCustomer")}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {dispute.merchantName} ·{" "}
                      {format.dateTime(new Date(dispute.visitDate), {
                        dateStyle: "medium",
                      })}{" "}
                      ·{" "}
                      {format.number(dispute.amountClaimed, {
                        style: "currency",
                        currency: dispute.currencyCode,
                      })}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">{t(`status.${dispute.status}`)}</Badge>
                    {sla && slaStyle ? (
                      <Badge variant={slaStyle.variant} className={slaStyle.className}>
                        {t(`responseDeadline.${sla}`)}
                      </Badge>
                    ) : null}
                  </div>
                </div>

                <p className="line-clamp-2 text-sm">{dispute.description}</p>

                <p className="text-xs text-muted-foreground">
                  {t("filedAt", {
                    date: format.dateTime(new Date(dispute.createdAt), {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }),
                  })}
                </p>

                <div className="border-t border-border pt-3">
                  <Button variant="outline" className="admin-btn-outline text-foreground" asChild>
                    <Link href={`/admin/disputes/${dispute.id}`}>
                      {dispute.status === "pending" ? t("viewAndResolveCta") : t("viewDetailsCta")}
                      <ArrowRight className="ml-1 size-4" aria-hidden="true" />
                    </Link>
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
