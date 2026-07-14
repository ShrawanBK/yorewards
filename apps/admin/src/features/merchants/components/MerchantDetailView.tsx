"use client";

import Link from "next/link";
import { useFormatter, useTranslations } from "next-intl";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@repo/ui/badge";
import { Button } from "@repo/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/card";
import type { AdminMerchantDetail } from "@repo/supabase/queries/admin-merchants";
import {
  MERCHANT_STATUS_BADGE,
  MerchantAdminActions,
} from "@/features/merchants/components/MerchantAdminActions";
import { MerchantSubscriptionPanel } from "@/features/merchants/components/MerchantSubscriptionPanel";

export function MerchantDetailView({ detail }: { detail: AdminMerchantDetail }) {
  const t = useTranslations("merchants");
  const tDetail = useTranslations("merchants.detail");
  const tAudit = useTranslations("audit.actions");
  const format = useFormatter();
  const { merchant, loyaltyCard, branchesCount, activeBranchesCount, subscription, recentAudit } =
    detail;
  const badge = MERCHANT_STATUS_BADGE[merchant.status];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button asChild variant="ghost" size="sm" className="-ml-2 gap-1">
          <Link href="/admin/merchants">
            <ArrowLeft className="size-4" aria-hidden />
            {tDetail("back")}
          </Link>
        </Button>
      </div>

      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            {merchant.business_name}
          </h1>
          <Badge variant="secondary">{merchant.country}</Badge>
          <Badge variant={badge.variant} className={badge.className}>
            {t(`status.${merchant.status}`)}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          {merchant.email} · {merchant.category}
          {merchant.phone ? ` · ${merchant.phone}` : ""}
        </p>
        <p className="text-xs text-muted-foreground">
          {t("registered", {
            date: format.dateTime(new Date(merchant.created_at), {
              dateStyle: "medium",
            }),
          })}
          {merchant.status === "active" && merchant.approved_at
            ? ` · ${t("approvedOn", {
                date: format.dateTime(new Date(merchant.approved_at), {
                  dateStyle: "medium",
                }),
              })}`
            : ""}
        </p>
        {merchant.status === "rejected" && merchant.rejection_reason ? (
          <p className="text-sm text-destructive">
            {t("rejectedReason", { reason: merchant.rejection_reason })}
          </p>
        ) : null}
        {merchant.status === "suspended" && merchant.status_reason ? (
          <p className="text-sm text-destructive">
            {t("suspendedReason", { reason: merchant.status_reason })}
          </p>
        ) : null}
      </header>

      <Card className="admin-card">
        <CardHeader>
          <CardTitle className="text-base">{tDetail("actionsTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          <MerchantAdminActions merchant={merchant} />
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <MerchantSubscriptionPanel
          merchantId={merchant.id}
          subscription={subscription}
          merchantTier={merchant.subscription_tier}
        />

        <Card className="admin-card">
          <CardHeader>
            <CardTitle className="text-base">{tDetail("branchesTitle")}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {tDetail("branchesSummary", {
              total: branchesCount,
              active: activeBranchesCount,
            })}
          </CardContent>
        </Card>

        <Card className="admin-card">
          <CardHeader>
            <CardTitle className="text-base">{tDetail("loyaltyCardTitle")}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            {loyaltyCard ? (
              <dl className="space-y-2">
                <div>
                  <dt className="text-muted-foreground">{tDetail("cardName")}</dt>
                  <dd className="font-medium">{loyaltyCard.card_name}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">{tDetail("stampTarget")}</dt>
                  <dd className="font-medium">{loyaltyCard.stamp_target}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">{tDetail("rewardType")}</dt>
                  <dd className="font-medium">
                    {tDetail(`rewardTypes.${loyaltyCard.reward_type}`)}
                  </dd>
                </div>
              </dl>
            ) : (
              <p className="text-muted-foreground">{tDetail("noLoyaltyCard")}</p>
            )}
          </CardContent>
        </Card>
      </div>

      <section className="space-y-3" aria-labelledby="merchant-audit-heading">
        <h2 id="merchant-audit-heading" className="text-lg font-semibold">
          {tDetail("auditTitle")}
        </h2>
        {recentAudit.length === 0 ? (
          <Card className="admin-card">
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              {tDetail("auditEmpty")}
            </CardContent>
          </Card>
        ) : (
          <Card className="admin-card divide-y divide-border">
            {recentAudit.map((entry) => {
              let label = entry.action;
              try {
                label = tAudit(entry.action);
              } catch {
                // fall back to raw action code
              }
              return (
                <div
                  key={entry.id}
                  className="flex flex-wrap items-start justify-between gap-2 px-4 py-3 text-sm"
                >
                  <div className="space-y-0.5">
                    <p className="font-medium">{label}</p>
                    {entry.notes ? (
                      <p className="text-muted-foreground">{entry.notes}</p>
                    ) : null}
                  </div>
                  <time
                    className="shrink-0 text-xs text-muted-foreground"
                    dateTime={entry.occurredAt}
                  >
                    {format.dateTime(new Date(entry.occurredAt), {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </time>
                </div>
              );
            })}
          </Card>
        )}
      </section>
    </div>
  );
}
