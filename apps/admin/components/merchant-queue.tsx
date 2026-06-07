"use client";

import { useMemo, useState, useTransition } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { Button } from "@repo/ui/button";
import { Badge } from "@repo/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/card";
import { Input } from "@repo/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@repo/ui/tabs";
import { toast } from "@repo/ui/sonner";
import {
  approveMerchantAction,
  rejectMerchantAction,
  suspendMerchantAction,
  type MerchantActionResult,
} from "@/app/admin/actions";
import type { Database, MerchantStatus } from "@repo/supabase/types";

type Merchant = Database["public"]["Tables"]["merchants"]["Row"];

type FilterValue = "all" | MerchantStatus;

const STATUS_ORDER: MerchantStatus[] = [
  "pending",
  "active",
  "suspended",
  "rejected",
];

const FILTERS: FilterValue[] = ["all", ...STATUS_ORDER];

const STATUS_BADGE: Record<
  MerchantStatus,
  { variant: "default" | "secondary" | "outline" | "destructive"; className?: string }
> = {
  pending: { variant: "secondary" },
  active: { variant: "default", className: "bg-brand-green text-white" },
  suspended: { variant: "outline" },
  rejected: { variant: "destructive" },
};

export function MerchantQueue({ merchants }: { merchants: Merchant[] }) {
  const t = useTranslations("merchants");
  const [filter, setFilter] = useState<FilterValue>("all");

  const counts = useMemo(() => {
    const base: Record<FilterValue, number> = {
      all: merchants.length,
      pending: 0,
      active: 0,
      suspended: 0,
      rejected: 0,
    };
    for (const merchant of merchants) base[merchant.status] += 1;
    return base;
  }, [merchants]);

  const filtered = useMemo(() => {
    const rows =
      filter === "all"
        ? merchants
        : merchants.filter((merchant) => merchant.status === filter);
    if (filter !== "all") return rows;
    return [...rows].sort(
      (a, b) =>
        STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status),
    );
  }, [merchants, filter]);

  return (
    <div className="space-y-4">
      <Tabs value={filter} onValueChange={(value) => setFilter(value as FilterValue)}>
        <TabsList className="flex-wrap">
          {FILTERS.map((value) => (
            <TabsTrigger key={value} value={value}>
              {t(`filters.${value}`)} ({counts[value]})
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {filtered.length === 0 ? (
        <Card className="items-center py-12 text-center">
          <CardContent className="space-y-1">
            <p className="font-medium">{t("empty.title")}</p>
            <p className="text-sm text-muted-foreground">
              {t("empty.description")}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filtered.map((merchant) => (
            <MerchantCard key={merchant.id} merchant={merchant} />
          ))}
        </div>
      )}
    </div>
  );
}

function MerchantCard({ merchant }: { merchant: Merchant }) {
  const t = useTranslations("merchants");
  const format = useFormatter();
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState(false);
  const [isPending, startTransition] = useTransition();

  const name = merchant.business_name;
  const badge = STATUS_BADGE[merchant.status];

  function runAction(
    action: () => Promise<MerchantActionResult>,
    successMessage: string,
  ) {
    startTransition(async () => {
      const result = await action();
      if (result?.error) {
        toast.error(t("toast.error"));
        return;
      }
      toast.success(successMessage);
    });
  }

  function handleReject() {
    const trimmed = reason.trim();
    if (!trimmed) {
      setReasonError(true);
      return;
    }
    setReasonError(false);
    runAction(
      () => rejectMerchantAction(merchant.id, trimmed),
      t("toast.rejected", { name }),
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2">
          {name}
          <Badge variant="secondary">{merchant.country}</Badge>
          <Badge variant={badge.variant} className={badge.className}>
            {t(`status.${merchant.status}`)}
          </Badge>
        </CardTitle>
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
          <p className="text-xs text-destructive">
            {t("rejectedReason", { reason: merchant.rejection_reason })}
          </p>
        ) : null}
      </CardHeader>
      <CardContent>
        {merchant.status === "pending" ? (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
            <div className="flex-1 space-y-1">
              <Input
                aria-label={t("reject.label", { name })}
                aria-invalid={reasonError}
                placeholder={t("reject.placeholder")}
                value={reason}
                disabled={isPending}
                onChange={(event) => {
                  setReason(event.target.value);
                  if (reasonError) setReasonError(false);
                }}
              />
              {reasonError ? (
                <p className="text-xs text-destructive">
                  {t("reject.required")}
                </p>
              ) : null}
            </div>
            <div className="flex gap-2">
              <Button
                variant="destructive"
                disabled={isPending}
                onClick={handleReject}
              >
                {t("actions.reject")}
              </Button>
              <Button
                className="bg-brand-green hover:bg-brand-green/90"
                disabled={isPending}
                onClick={() =>
                  runAction(
                    () => approveMerchantAction(merchant.id),
                    t("toast.approved", { name }),
                  )
                }
              >
                {t("actions.approve")}
              </Button>
            </div>
          </div>
        ) : merchant.status === "active" ? (
          <Button
            variant="destructive"
            disabled={isPending}
            onClick={() =>
              runAction(
                () => suspendMerchantAction(merchant.id),
                t("toast.suspended", { name }),
              )
            }
          >
            {t("actions.suspend")}
          </Button>
        ) : (
          <Button
            className="bg-brand-green hover:bg-brand-green/90"
            disabled={isPending}
            onClick={() =>
              runAction(
                () => approveMerchantAction(merchant.id),
                t("toast.reactivated", { name }),
              )
            }
          >
            {t("actions.reactivate")}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
