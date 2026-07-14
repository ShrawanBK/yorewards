"use client";

import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { useFormatter, useTranslations } from "next-intl";
import { ExternalLink } from "lucide-react";
import { Badge } from "@repo/ui/badge";
import { Button } from "@repo/ui/button";
import { getDisputeSlaLevel } from "@repo/supabase/queries/stamp-disputes";
import {
  adminCardDisputesQueryKey,
  useAdminCardDisputes,
} from "@/features/disputes/api/cardDisputeQueries";
import { AdminDisputeResolvePanel } from "./AdminDisputeResolvePanel";

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

export function AdminCardDisputesPanel({
  customerCardId,
  currencyCode,
  onResolved,
}: {
  customerCardId: string;
  currencyCode: string;
  onResolved?: () => void;
}) {
  const t = useTranslations("disputes.cardPanel");
  const tDisputes = useTranslations("disputes");
  const format = useFormatter();
  const queryClient = useQueryClient();

  const { data: disputes = [], isFetching } = useAdminCardDisputes(customerCardId);

  async function handleResolved() {
    await queryClient.refetchQueries({
      queryKey: adminCardDisputesQueryKey(customerCardId),
    });
    onResolved?.();
  }

  if (disputes.length === 0 && !isFetching) {
    return null;
  }

  return (
    <section className="space-y-3 border-t border-border pt-4" aria-labelledby="card-disputes-heading">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 id="card-disputes-heading" className="text-sm font-medium">
          {t("title")}
        </h3>
        {isFetching ? (
          <p className="text-xs text-muted-foreground" aria-live="polite">
            {tDisputes("refreshing")}
          </p>
        ) : null}
      </div>

      <div className="space-y-4">
        {disputes.map((dispute) => {
          const sla = getDisputeSlaLevel(dispute.status, dispute.createdAt);
          const slaStyle = sla ? SLA_BADGE[sla] : null;

          return (
            <article
              key={dispute.id}
              className="space-y-4 rounded-lg border border-border bg-muted/20 p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium">
                    {format.dateTime(new Date(dispute.visitDate), { dateStyle: "medium" })}{" "}
                    ·{" "}
                    {format.number(dispute.amountClaimed, {
                      style: "currency",
                      currency: currencyCode || dispute.currencyCode,
                    })}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {tDisputes("filedAt", {
                      date: format.dateTime(new Date(dispute.createdAt), {
                        dateStyle: "medium",
                        timeStyle: "short",
                      }),
                    })}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">{tDisputes(`status.${dispute.status}`)}</Badge>
                  {sla && slaStyle ? (
                    <Badge variant={slaStyle.variant} className={slaStyle.className}>
                      {tDisputes(`responseDeadline.${sla}`)}
                    </Badge>
                  ) : null}
                </div>
              </div>

              <p className="text-sm">{dispute.description}</p>

              <Button variant="link" size="sm" className="h-auto p-0 text-foreground" asChild>
                <Link href={`/admin/disputes/${dispute.id}`}>
                  {tDisputes("viewDetailsCta")}
                  <ExternalLink className="ml-1 size-3.5" aria-hidden="true" />
                </Link>
              </Button>

              <AdminDisputeResolvePanel dispute={dispute} onResolved={handleResolved} />
            </article>
          );
        })}
      </div>
    </section>
  );
}
