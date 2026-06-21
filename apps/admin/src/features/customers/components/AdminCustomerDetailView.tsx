"use client";

import Link from "next/link";
import { useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@repo/ui/badge";
import { Button } from "@repo/ui/button";
import { Card, CardContent } from "@repo/ui/card";
import type { AdminCustomerDetail } from "@repo/supabase/queries/admin-customers";
import type { CustomerStatus } from "@repo/supabase/types";
import {
  reactivateCustomerAction,
  suspendCustomerAction,
} from "@/features/customers/api/customerActions";
import { AdminReasonConfirmDialog } from "@/shared/components/AdminReasonConfirmDialog";
import { resolveActionError } from "@/shared/utils/resolve-action-error";
import { showActionError, showActionSuccess } from "@/shared/utils/action-feedback";

const STATUS_BADGE: Record<
  CustomerStatus,
  { variant: "default" | "secondary" | "outline" | "destructive"; className?: string }
> = {
  active: { variant: "default", className: "bg-brand-green text-white" },
  suspended: { variant: "destructive" },
};

export function AdminCustomerDetailView({ detail }: { detail: AdminCustomerDetail }) {
  const t = useTranslations("customers");
  const tDetail = useTranslations("customers.detail");
  const format = useFormatter();
  const { customer, cards } = detail;
  const badge = STATUS_BADGE[customer.status];
  const displayName = customer.name?.trim() || t("unnamed");
  const [confirmAction, setConfirmAction] = useState<"suspend" | "reactivate" | null>(
    null,
  );

  return (
    <div className="flex flex-col gap-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2 w-fit gap-1">
        <Link href="/admin/customers">
          <ArrowLeft className="size-4" aria-hidden />
          {tDetail("back")}
        </Link>
      </Button>

      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">{displayName}</h1>
          <Badge variant="secondary">{customer.country_code}</Badge>
          <Badge variant={badge.variant} className={badge.className}>
            {t(`status.${customer.status}`)}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">{customer.phone}</p>
        <p className="text-xs text-muted-foreground">
          {tDetail("joined", {
            date: format.dateTime(new Date(customer.created_at), {
              dateStyle: "medium",
            }),
          })}
          {" · "}
          {tDetail("lastActive", {
            date: format.dateTime(new Date(customer.last_active_at), {
              dateStyle: "medium",
            }),
          })}
        </p>
        {customer.status === "suspended" && customer.status_reason ? (
          <p className="text-sm text-destructive">
            {tDetail("suspendedReason", { reason: customer.status_reason })}
          </p>
        ) : null}
      </header>

      <div className="flex flex-wrap gap-2">
        {customer.status === "active" ? (
          <Button
            type="button"
            className="admin-btn-destructive"
            onClick={() => setConfirmAction("suspend")}
          >
            {t("actions.suspend")}
          </Button>
        ) : (
          <Button
            type="button"
            className="admin-btn-success"
            onClick={() => setConfirmAction("reactivate")}
          >
            {t("actions.reactivate")}
          </Button>
        )}
      </div>

      <section className="space-y-3" aria-labelledby="customer-cards-heading">
        <h2 id="customer-cards-heading" className="text-lg font-semibold">
          {tDetail("cardsTitle")}
        </h2>
        {cards.length === 0 ? (
          <Card className="admin-card">
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              {tDetail("cardsEmpty")}
            </CardContent>
          </Card>
        ) : (
          <Card className="admin-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead className="border-b border-border bg-muted/40">
                  <tr>
                    <th className="px-4 py-3 font-medium">{tDetail("merchant")}</th>
                    <th className="px-4 py-3 font-medium">{tDetail("card")}</th>
                    <th className="px-4 py-3 font-medium">{tDetail("progress")}</th>
                    <th className="px-4 py-3 font-medium">{tDetail("rewardStatus")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {cards.map((card) => (
                    <tr key={card.id}>
                      <td className="px-4 py-3 font-medium">{card.merchantName}</td>
                      <td className="px-4 py-3">{card.cardName}</td>
                      <td className="px-4 py-3 tabular-nums">
                        {tDetail("stamps", {
                          current: card.currentStamps,
                          target: card.stampTarget,
                        })}
                      </td>
                      <td className="px-4 py-3">
                        {t(`rewardStatus.${card.rewardStatus}`)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </section>

      {confirmAction ? (
        <CustomerDetailConfirmDialog
          displayName={displayName}
          customerId={customer.id}
          action={confirmAction}
          onClose={() => setConfirmAction(null)}
        />
      ) : null}
    </div>
  );
}

function CustomerDetailConfirmDialog({
  displayName,
  customerId,
  action,
  onClose,
}: {
  displayName: string;
  customerId: string;
  action: "suspend" | "reactivate";
  onClose: () => void;
}) {
  const t = useTranslations("customers");
  const tErrors = useTranslations("errors.actions");
  const isSuspend = action === "suspend";

  return (
    <AdminReasonConfirmDialog
      title={
        isSuspend ? t("confirm.suspendTitle") : t("confirm.reactivateTitle")
      }
      description={
        isSuspend
          ? t("confirm.suspendDescription", { name: displayName })
          : t("confirm.reactivateDescription", { name: displayName })
      }
      reasonLabel={
        isSuspend
          ? t("confirm.suspendReasonLabel")
          : t("confirm.reactivateReasonLabel")
      }
      reasonPlaceholder={
        isSuspend
          ? t("confirm.suspendReasonPlaceholder")
          : t("confirm.reactivateReasonPlaceholder")
      }
      reasonRequiredMessage={t("confirm.reasonRequired")}
      cancelLabel={t("confirm.cancel")}
      confirmLabel={isSuspend ? t("actions.suspend") : t("actions.reactivate")}
      confirmClassName={
        isSuspend ? "admin-btn-destructive" : "admin-btn-success"
      }
      onClose={onClose}
      onConfirm={(reason) =>
        isSuspend
          ? suspendCustomerAction(customerId, reason)
          : reactivateCustomerAction(customerId, reason)
      }
      onSuccess={() =>
        showActionSuccess(
          t,
          isSuspend ? "success.suspended" : "success.reactivated",
          { name: displayName },
        )
      }
      onError={(error) => showActionError(resolveActionError(tErrors, error))}
    />
  );
}
