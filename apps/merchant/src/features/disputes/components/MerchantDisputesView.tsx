"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { CheckCircle2, Inbox, Scale } from "lucide-react";
import type { StampDisputeListItem } from "@repo/supabase/queries/stamp-disputes-shared";
import {
  merchantDisputesQueryKey,
  merchantPendingDisputeCountQueryKey,
  useMerchantDisputes,
} from "@/features/disputes/api/disputeQueries";
import { MerchantDisputeCard } from "./MerchantDisputeCard";

export function MerchantDisputesView({
  merchantId,
  initialDisputes,
}: {
  merchantId: string;
  initialDisputes: StampDisputeListItem[];
}) {
  const t = useTranslations("disputes");
  const queryClient = useQueryClient();
  const { data: disputes = initialDisputes } = useMerchantDisputes(
    merchantId,
    initialDisputes,
  );

  const pending = disputes.filter((d) => d.status === "pending");
  const approved = disputes.filter((d) => d.status === "approved");
  const rejected = disputes.filter((d) => d.status === "rejected");
  const resolved = [...approved, ...rejected];

  async function handleResolved() {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: merchantDisputesQueryKey(merchantId),
      }),
      queryClient.invalidateQueries({
        queryKey: merchantPendingDisputeCountQueryKey(merchantId),
      }),
    ]);
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <div className="merchant-glass-card rounded-xl border border-amber-500/25 px-3 py-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="merchant-stat-label text-[10px] tracking-wide">
                {t("summary.open")}
              </p>
              <p className="text-xl font-semibold tabular-nums tracking-tight sm:text-2xl">
                {pending.length}
              </p>
            </div>
            <div className="hidden size-8 items-center justify-center rounded-lg bg-amber-500/15 text-amber-200 sm:flex">
              <Inbox className="size-4" aria-hidden />
            </div>
          </div>
        </div>
        <div className="merchant-glass-card rounded-xl border border-emerald-500/25 px-3 py-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="merchant-stat-label text-[10px] tracking-wide">
                {t("summary.approved")}
              </p>
              <p className="text-xl font-semibold tabular-nums tracking-tight sm:text-2xl">
                {approved.length}
              </p>
            </div>
            <div className="hidden size-8 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-300 sm:flex">
              <CheckCircle2 className="size-4" aria-hidden />
            </div>
          </div>
        </div>
        <div className="merchant-glass-card rounded-xl border border-destructive/25 px-3 py-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="merchant-stat-label text-[10px] tracking-wide">
                {t("summary.rejected")}
              </p>
              <p className="text-xl font-semibold tabular-nums tracking-tight sm:text-2xl">
                {rejected.length}
              </p>
            </div>
            <div className="hidden size-8 items-center justify-center rounded-lg bg-destructive/15 text-destructive sm:flex">
              <Scale className="size-4" aria-hidden />
            </div>
          </div>
        </div>
      </div>

      <section className="space-y-3" aria-labelledby="pending-disputes-heading">
        <h2 id="pending-disputes-heading" className="text-base font-semibold">
          {t("pendingTitle", { count: pending.length })}
        </h2>
        {pending.length === 0 ? (
          <div className="merchant-glass-card flex flex-col items-center gap-2 rounded-xl border border-dashed border-border px-4 py-8 text-center">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <Inbox className="size-5" aria-hidden />
            </div>
            <div className="space-y-0.5">
              <p className="text-sm font-medium">{t("pendingEmptyTitle")}</p>
              <p className="merchant-body-muted max-w-sm text-xs">
                {t("pendingEmpty")}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
            {pending.map((dispute) => (
              <MerchantDisputeCard
                key={dispute.id}
                dispute={dispute}
                merchantId={merchantId}
                onResolved={handleResolved}
              />
            ))}
          </div>
        )}
      </section>

      {resolved.length > 0 ? (
        <section
          className="space-y-3"
          aria-labelledby="resolved-disputes-heading"
        >
          <h2 id="resolved-disputes-heading" className="text-base font-semibold">
            {t("resolvedTitle")}
          </h2>
          <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
            {resolved.map((dispute) => (
              <MerchantDisputeCard
                key={dispute.id}
                dispute={dispute}
                merchantId={merchantId}
                onResolved={handleResolved}
              />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
