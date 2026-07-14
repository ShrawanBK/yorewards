"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useFormatter, useTranslations } from "next-intl";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { Badge } from "@repo/ui/badge";
import { Button } from "@repo/ui/button";
import type { AdminStampCardLookup } from "@repo/supabase/queries/admin-stamps";
import {
  getDisputeSlaLevel,
  type StampDisputeListItem,
} from "@repo/supabase/queries/stamp-disputes";
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

function StampHistoryTable({
  card,
  sessions,
}: {
  card: AdminStampCardLookup;
  sessions: AdminStampCardLookup["recentApprovedSessions"];
}) {
  const t = useTranslations("disputes.detail");
  const tStamps = useTranslations("stamps");
  const format = useFormatter();

  if (sessions.length === 0) {
    return <p className="text-sm text-muted-foreground">{t("noStampHistory")}</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[480px] text-sm">
        <thead>
          <tr className="border-b border-border text-left text-muted-foreground">
            <th className="pb-2 pr-4 font-medium">{t("stampDate")}</th>
            <th className="pb-2 pr-4 font-medium">{t("stampAmount")}</th>
            <th className="pb-2 pr-4 font-medium">{t("stampBranch")}</th>
            <th className="pb-2 font-medium">{t("stampSource")}</th>
          </tr>
        </thead>
        <tbody>
          {sessions.map((session) => (
            <tr key={session.id} className="border-b border-border/60">
              <td className="py-2 pr-4">
                {format.dateTime(new Date(session.createdAt), {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </td>
              <td className="py-2 pr-4">
                {session.amountSpent != null
                  ? format.number(session.amountSpent, {
                      style: "currency",
                      currency: card.currencyCode,
                    })
                  : "—"}
              </td>
              <td className="py-2 pr-4">{session.branchName ?? "—"}</td>
              <td className="py-2">
                {session.source === "admin_manual"
                  ? tStamps("sessions.sourceAdmin")
                  : session.source === "qr_scan"
                    ? tStamps("sessions.sourceQr")
                    : session.source}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function DisputeDetailView({
  dispute,
  cardContext,
}: {
  dispute: StampDisputeListItem;
  cardContext: AdminStampCardLookup | null;
}) {
  const t = useTranslations("disputes");
  const tDetail = useTranslations("disputes.detail");
  const format = useFormatter();
  const router = useRouter();

  const sla = getDisputeSlaLevel(dispute.status, dispute.createdAt);
  const slaStyle = sla ? SLA_BADGE[sla] : null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/disputes">
            <ArrowLeft className="mr-1 size-4" aria-hidden="true" />
            {tDetail("backToList")}
          </Link>
        </Button>
      </div>

      <article className="admin-card space-y-6 rounded-xl border p-6">
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold">
              {dispute.customerName ?? t("unknownCustomer")}
            </h2>
            <p className="text-sm text-muted-foreground">
              {dispute.merchantName} ·{" "}
              {format.dateTime(new Date(dispute.visitDate), { dateStyle: "medium" })} ·{" "}
              {format.number(dispute.amountClaimed, {
                style: "currency",
                currency: dispute.currencyCode,
              })}
            </p>
            <p className="text-xs text-muted-foreground">
              {t("filedAt", {
                date: format.dateTime(new Date(dispute.createdAt), {
                  dateStyle: "medium",
                  timeStyle: "short",
                }),
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
        </header>

        <section aria-labelledby="dispute-claim-heading">
          <h3 id="dispute-claim-heading" className="mb-2 text-sm font-medium">
            {tDetail("claimHeading")}
          </h3>
          <p className="text-sm">{dispute.description}</p>
        </section>

        {dispute.merchantResponse ? (
          <section aria-labelledby="dispute-response-heading">
            <h3 id="dispute-response-heading" className="mb-2 text-sm font-medium">
              {tDetail("responseHeading")}
            </h3>
            <p className="text-sm text-muted-foreground">{dispute.merchantResponse}</p>
          </section>
        ) : dispute.status === "pending" ? (
          <p className="text-sm text-muted-foreground">{tDetail("merchantPending")}</p>
        ) : null}

        {dispute.resolvedAt ? (
          <p className="text-xs text-muted-foreground">
            {tDetail("resolvedAt", {
              date: format.dateTime(new Date(dispute.resolvedAt), {
                dateStyle: "medium",
                timeStyle: "short",
              }),
            })}
          </p>
        ) : null}
      </article>

      {cardContext ? (
        <section
          className="admin-card space-y-4 rounded-xl border p-6"
          aria-labelledby="card-context-heading"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 id="card-context-heading" className="text-sm font-medium">
                {tDetail("cardContextHeading")}
              </h3>
              <p className="text-sm text-muted-foreground">
                {cardContext.cardName} ·{" "}
                {tDetail("stampProgress", {
                  current: cardContext.currentStamps,
                  target: cardContext.stampTarget,
                })}
              </p>
            </div>
            <Button variant="outline" size="sm" className="admin-btn-outline text-foreground" asChild>
              <Link href={`/admin/stamps?cardId=${cardContext.customerCardId}`}>
                {tDetail("openStampsWorkbench")}
                <ExternalLink className="ml-1 size-3.5" aria-hidden="true" />
              </Link>
            </Button>
          </div>

          <StampHistoryTable card={cardContext} sessions={cardContext.recentApprovedSessions} />
        </section>
      ) : null}

      {dispute.status === "pending" ? (
        <article className="admin-card rounded-xl border p-6">
          <AdminDisputeResolvePanel
            dispute={dispute}
            onResolved={() => router.push("/admin/disputes?filter=resolved")}
          />
        </article>
      ) : null}
    </div>
  );
}
