"use client";

import type { ReactNode } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { Badge } from "@repo/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/card";
import { cn } from "@repo/ui/lib/utils";
import type { MerchantRow } from "@repo/supabase/queries/merchants";
import type { MerchantStatus } from "@repo/supabase/types";

const STATUS_BADGE: Record<
  MerchantStatus,
  {
    variant: "default" | "secondary" | "outline" | "destructive";
    className?: string;
  }
> = {
  pending: { variant: "secondary" },
  active: { variant: "default", className: "bg-brand-green text-white" },
  suspended: { variant: "outline" },
  rejected: { variant: "destructive" },
};

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:justify-between sm:gap-4">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium sm:text-right">{value}</dd>
    </div>
  );
}

export function MerchantBusinessDetailCard({
  merchant,
}: {
  merchant: MerchantRow;
}) {
  const t = useTranslations("business");
  const tDash = useTranslations("dashboard");
  const format = useFormatter();
  const badge = STATUS_BADGE[merchant.status];
  const dateStyle = { dateStyle: "medium" as const };
  const registered = format.dateTime(new Date(merchant.created_at), dateStyle);
  const approved = merchant.approved_at
    ? format.dateTime(new Date(merchant.approved_at), dateStyle)
    : null;

  return (
    <Card className="border-brand-purple/20 bg-gradient-to-br from-brand-surface/80 to-background">
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
        <CardTitle className="text-lg">{t("details.title")}</CardTitle>
        <Badge
          variant={badge.variant}
          className={cn("shrink-0 capitalize", badge.className)}
        >
          {t(`status.${merchant.status}`)}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <dl className="space-y-3">
          <DetailRow
            label={t("fields.businessName")}
            value={merchant.business_name}
          />
          <DetailRow label={t("fields.category")} value={merchant.category} />
          <DetailRow
            label={t("fields.country")}
            value={t(`countries.${merchant.country}`)}
          />
          <DetailRow label={t("details.email")} value={merchant.email} />
          <DetailRow
            label={t("fields.phoneOptional")}
            value={merchant.phone ?? t("details.phoneNotProvided")}
          />
          <DetailRow label={t("details.registered")} value={registered} />
          {approved ? (
            <DetailRow label={t("details.approved")} value={approved} />
          ) : null}
          <DetailRow
            label={t("details.brandColor")}
            value={
              <span className="inline-flex items-center gap-2">
                <span
                  className="size-4 rounded border"
                  style={{ backgroundColor: merchant.primary_color }}
                  aria-hidden
                />
                {merchant.primary_color}
              </span>
            }
          />
        </dl>

        <p className="rounded-lg border bg-background/80 p-3 text-sm text-muted-foreground">
          {tDash(`status.${merchant.status}.description`)}
        </p>

        {merchant.status === "rejected" && merchant.rejection_reason ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm">
            <p className="font-medium text-destructive">
              {tDash("rejectionReason")}
            </p>
            <p className="mt-1 text-muted-foreground">
              {merchant.rejection_reason}
            </p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
